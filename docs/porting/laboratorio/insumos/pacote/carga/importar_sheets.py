#!/usr/bin/env python3
"""
Carga Google Sheets (Carta Traço) → PostgreSQL, com reconciliação de MCC.

Entrada: a planilha baixada como .xlsx (abas "cadastro" e "custos")
         ou as duas abas como .csv.
Saída:   relatório em ./relatorio-carga/ (markdown + CSVs).

Por padrão roda em ENSAIO (faz tudo e desfaz no final). Use --aplicar para gravar.

Exemplos:
  python importar_sheets.py --xlsx cartaTraco.xlsx --dsn "$DATABASE_URL"
  python importar_sheets.py --cadastro cadastro.csv --custos custos.csv --mapa mapa_materiais.csv --aplicar
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import os
import re
import sys
import unicodedata
from collections import defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path

import psycopg

AQUI = Path(__file__).resolve().parent
SQL_CARGA = AQUI / "carta_traco_normalizar.sql"

# ----------------------------------------------------------------- leitura
COLS_CADASTRO = {
    "id": "legado_id", "nome": "nome", "revisao": "revisao", "unidade": "unidade",
    "status": "status", "vigencia": "vigencia", "cadastro": "cadastro", "datacadastro": "cadastro",
    "fornecedor": "fornecedor", "produto": "produto", "material": "produto",
    "quantidade": "quantidade", "unmedida": "un_medida", "me": "massa_especifica",
    "massaespecifica": "massa_especifica", "obs": "observacao", "observacao": "observacao",
    "tipofrete": "tipo_frete",
}
COLS_CUSTOS = {
    "id": "legado_id", "data": "data", "unidade": "unidade", "fornecedor": "fornecedor",
    "material": "material", "produto": "material", "unmedida": "un_medida", "valor": "valor",
    "icms": "icms_pct", "frete": "frete", "valorliquido": "valor_liquido",
    "produtofornecedor": "produto_fornecedor", "tipofrete": "tipo_frete",
}
UN_MEDIDA = {
    "kg": "kg", "quilo": "kg", "kilo": "kg",
    "ton": "t", "t": "t", "tonelada": "t", "tn": "t",
    "litro": "L", "l": "L", "lt": "L", "litros": "L",
    "m3": "m3", "m³": "m3", "metrocubico": "m3",
    "saco": "saco", "sc": "saco", "sacos": "saco",
}


def chave(txt: str) -> str:
    t = unicodedata.normalize("NFKD", str(txt or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", t)


def num(v) -> Decimal | None:
    if v is None:
        return None
    if isinstance(v, (int, float, Decimal)):
        return Decimal(str(v))
    s = str(v).strip().replace("R$", "").replace("%", "").replace(" ", "")
    if not s or s in {"-", "—"}:
        return None
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return Decimal(s)
    except InvalidOperation:
        raise ValueError(f"número inválido: {v!r}")


def data(v) -> dt.date | None:
    if v is None or v == "":
        return None
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    s = str(v).strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y", "%d/%m/%Y %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S"):
        try:
            return dt.datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    if re.fullmatch(r"\d{5}(\.\d+)?", s):  # serial do Excel/Sheets
        return dt.date(1899, 12, 30) + dt.timedelta(days=int(float(s)))
    raise ValueError(f"data inválida: {v!r}")


def txt(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def un_medida(v) -> str | None:
    return UN_MEDIDA.get(chave(v).replace("3", "3")) if v not in (None, "") else None


def ler_linhas(caminho: Path, aba: str | None) -> list[dict]:
    if caminho.suffix.lower() in (".xlsx", ".xlsm"):
        import openpyxl
        wb = openpyxl.load_workbook(caminho, data_only=True, read_only=True)
        nomes = {chave(n): n for n in wb.sheetnames}
        if chave(aba) not in nomes:
            raise SystemExit(f"Aba '{aba}' não encontrada em {caminho.name}. Abas: {wb.sheetnames}")
        it = wb[nomes[chave(aba)]].iter_rows(values_only=True)
        cab = [c for c in next(it)]
        return [dict(zip(cab, r)) for r in it]
    with open(caminho, newline="", encoding="utf-8-sig") as f:
        amostra = f.read(4096)
        f.seek(0)
        dialeto = csv.Sniffer().sniff(amostra, delimiters=",;\t")
        return list(csv.DictReader(f, dialect=dialeto))


def mapear(linhas: list[dict], cols: dict[str, str], nome_aba: str):
    if not linhas:
        return []
    mapa = {}
    for orig in linhas[0].keys():
        k = chave(orig)
        if k in cols:
            mapa[orig] = cols[k]
    faltando = {"nome", "produto", "quantidade"} if nome_aba == "cadastro" else {"material", "valor", "unidade"}
    if not faltando <= set(mapa.values()):
        raise SystemExit(f"Aba {nome_aba}: colunas obrigatórias ausentes {faltando - set(mapa.values())}. "
                         f"Cabeçalho lido: {list(linhas[0].keys())}")
    saida = []
    for i, l in enumerate(linhas, start=2):  # linha 1 = cabeçalho
        r = {dest: l.get(orig) for orig, dest in mapa.items()}
        if all(v in (None, "") for v in r.values()):
            continue
        r["linha"] = i
        saida.append(r)
    return saida


# ----------------------------------------------------------------- staging
def preparar(cadastro_raw, custos_raw):
    erros, cad, cus = [], [], []
    for r in cadastro_raw:
        try:
            un = txt(r.get("un_medida"))
            cad.append((r["linha"], txt(r.get("legado_id")), txt(r.get("nome")),
                        int(num(r.get("revisao")) or 0), txt(r.get("unidade")), txt(r.get("status")),
                        data(r.get("vigencia")), data(r.get("cadastro")), txt(r.get("fornecedor")),
                        txt(r.get("produto")), num(r.get("quantidade")), un,
                        num(r.get("massa_especifica")), txt(r.get("observacao")), txt(r.get("tipo_frete"))))
        except ValueError as e:
            erros.append(("cadastro", r["linha"], str(e)))
    for r in custos_raw:
        try:
            um = un_medida(r.get("un_medida"))
            if um is None:
                erros.append(("custos", r["linha"], f"unidade de medida desconhecida: {r.get('un_medida')!r} (linha ignorada)"))
            cus.append((r["linha"], txt(r.get("legado_id")), data(r.get("data")), txt(r.get("unidade")),
                        txt(r.get("fornecedor")), txt(r.get("material")), um, num(r.get("valor")),
                        num(r.get("icms_pct")), num(r.get("frete")), num(r.get("valor_liquido")),
                        txt(r.get("produto_fornecedor")), txt(r.get("tipo_frete"))))
        except ValueError as e:
            erros.append(("custos", r["linha"], str(e)))
    return cad, cus, erros


# ----------------------------------------------------------------- MCC do legado (front)
def legado_custo_kg(valor_liq: Decimal, un: str | None, me: Decimal) -> Decimal:
    """Regra do index.html (L1244-1254), reproduzida para conferência."""
    if un == "t":
        return valor_liq / 1000
    if un == "L":
        return valor_liq * me          # legado multiplica pela M.E.
    if un == "m3":
        return valor_liq / (me * 1000) if me else Decimal(0)
    if un == "saco":
        return valor_liq / 50
    return valor_liq


def mcc_legado(cad, cus):
    """Agrupa cartas e calcula o MCC como o front fazia (casamento exato por nome)."""
    custos_por_un = defaultdict(list)
    for c in sorted(cus, key=lambda c: (c[2] or dt.date.min, c[0]), reverse=True):  # mais recente primeiro
        custos_por_un[(c[3] or "")].append(c)
    cartas = defaultdict(list)
    for r in cad:
        cartas[(r[2], r[4], r[3])].append(r)  # nome, unidade, revisão
    out = {}
    for (nome, unidade, rev), itens in cartas.items():
        total, sem = Decimal(0), 0
        for it in itens:
            prod, forn, qtd, me = (it[9] or ""), (it[8] or "-"), (it[10] or Decimal(0)), (it[12] or Decimal(0))
            achado = next((c for c in custos_por_un[unidade or ""]
                           if (c[5] or "").lower() == prod.lower() and (forn == "-" or c[4] == forn)), None)
            if not achado:
                sem += 1
                continue
            vl = achado[10] if achado[10] is not None else Decimal(0)
            total += qtd * legado_custo_kg(vl, achado[6], me)
        out[(chave(nome), chave(unidade), rev)] = (nome, unidade, rev, round(total, 2), sem)
    return out


# ----------------------------------------------------------------- relatório
def relatorio(con, cad, cus, erros, legado, pasta: Path, aplicado: bool):
    pasta.mkdir(parents=True, exist_ok=True)
    q = con.execute
    cont = {t.split(".")[1]: q(f"SELECT count(*) FROM {t}").fetchone()[0]
            for t in ("insumos.unidade", "insumos.material", "insumos.fornecedor", "carta_traco.carta", "carta_traco.carta_item", "insumos.custo")}
    ativas = q("SELECT count(*) FROM carta_traco.carta WHERE status='Ativa'").fetchone()[0]

    novo = {}
    for cid, nome, un, rev, mcc, sem in q("""
        SELECT c.id, c.nome, u.nome, c.revisao, coalesce(m.mcc,0), coalesce(m.itens_sem_custo,0)
          FROM carta_traco.carta c JOIN insumos.unidade u ON u.id=c.unidade_id
          LEFT JOIN carta_traco.mcc_cartas(current_date, 'tabela') m ON m.carta_id=c.id"""):
        novo[(chave(nome), chave(un), rev)] = (cid, mcc, sem)

    linhas, iguais, dif = [], 0, 0
    for k, (nome, un, rev, mcc_l, sem_l) in sorted(legado.items(), key=lambda x: (x[1][1] or "", x[1][0] or "", x[1][2])):
        cid, mcc_n, sem_n = novo.get(k, (None, None, None))
        d = None if mcc_n is None else round(Decimal(mcc_n) - mcc_l, 2)
        ok = d is not None and abs(d) <= Decimal("0.01")
        iguais += ok
        dif += not ok
        linhas.append([nome, un, rev, cid, mcc_l, mcc_n, d, sem_l, sem_n, "ok" if ok else "DIFERENTE"])
    with open(pasta / "reconciliacao_mcc.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["carta", "unidade", "revisao", "id_novo", "mcc_legado_front", "mcc_postgres", "diferenca",
                    "sem_custo_legado", "sem_custo_postgres", "situacao"])
        w.writerows(linhas)

    pend = []
    for r in q("""SELECT m.nome FROM insumos.material m
                  WHERE NOT EXISTS (SELECT 1 FROM carta_traco.carta_item i WHERE i.material_id=m.id)
                    AND EXISTS (SELECT 1 FROM insumos.custo c WHERE c.material_id=m.id) ORDER BY 1"""):
        pend.append(("custo de material que nenhuma carta usa (nome digitado diferente? mapear em mapa_materiais.csv)", r[0], ""))
    for r in q("""SELECT nome, revisao, count(*) FROM carta_traco_stg.cadastro
                  GROUP BY lower(nome), nome, revisao, lower(unidade), unidade
                  HAVING count(DISTINCT legado_id) > 1"""):
        pend.append(("carta+unidade+revisão gravada mais de uma vez (ficou a última)", r[0], f"rev {r[1]}"))
    for r in q("""SELECT s.nome, s.unidade, count(*) FILTER (WHERE lower(s.status)='ativa')
                  FROM (SELECT DISTINCT nome, unidade, revisao, status FROM carta_traco_stg.cadastro) s
                  GROUP BY s.nome, s.unidade HAVING count(*) FILTER (WHERE lower(s.status)='ativa') > 1"""):
        pend.append(("mais de uma revisão ativa no Sheets (só a maior ficou ativa)", r[0], r[1]))
    for r in q("""SELECT DISTINCT nome, un_medida FROM carta_traco_stg.cadastro
                  WHERE un_medida IS NOT NULL AND lower(un_medida) NOT IN ('kg','kg/m³','kg/m3')"""):
        pend.append(("quantidade da carta não está em kg (gravada como kg)", r[0], r[1]))
    for r in q("""SELECT DISTINCT produto FROM carta_traco_stg.cadastro WHERE coalesce(massa_especifica,0)=0"""):
        pend.append(("item sem M.E. no Sheets (usado o padrão do catálogo)", r[0], ""))
    for r in q("""SELECT m.nome, count(*) FROM insumos.custo c JOIN insumos.material m ON m.id=c.material_id
                  WHERE c.legado_valor_liquido IS NOT NULL AND abs(c.valor_liquido - c.legado_valor_liquido) > 0.01
                  GROUP BY m.nome"""):
        pend.append(("valor líquido do Sheets difere de valor×(1−ICMS)+frete", r[0], f"{r[1]} registro(s)"))
    for r in q("""SELECT DISTINCT m.nome FROM insumos.custo c JOIN insumos.material m ON m.id=c.material_id
                  WHERE c.un_medida='L'"""):
        pend.append(("custo em litro: legado multiplica pela M.E., banco divide (confirmar regra)", r[0], ""))
    for r in q("""SELECT DISTINCT m.nome FROM insumos.custo c JOIN insumos.material m ON m.id=c.material_id
                  WHERE c.un_medida='m3' AND m.massa_unitaria IS NULL"""):
        pend.append(("custo em m³ convertido pela massa específica (cadastrar massa unitária?)", r[0], ""))
    for e in erros:
        pend.append((f"linha não lida na aba {e[0]} (linha {e[1]})", e[2], ""))
    with open(pasta / "pendencias.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["tipo", "item", "detalhe"])
        w.writerows(pend)

    md = [f"# Carga Carta Traço — {dt.datetime.now():%d/%m/%Y %H:%M}",
          "", f"Modo: **{'APLICADO' if aplicado else 'ENSAIO (nada gravado)'}**", "",
          "| Origem | Linhas |", "|---|---|",
          f"| cadastro (Sheets) | {len(cad)} |", f"| custos (Sheets) | {len(cus)} |", "",
          "| Destino | Registros |", "|---|---|"]
    md += [f"| {k} | {v} |" for k, v in cont.items()]
    md += [f"| cartas ativas | {ativas} |", "",
           f"**Reconciliação de MCC:** {iguais} cartas iguais ao legado, {dif} diferentes "
           "(ver reconciliacao_mcc.csv).", "",
           f"**Pendências:** {len(pend)} (ver pendencias.csv)."]
    tipos = defaultdict(int)
    for p in pend:
        tipos[p[0]] += 1
    md += [f"- {n} × {t}" for t, n in sorted(tipos.items(), key=lambda x: -x[1])]
    (pasta / "relatorio_carga.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    return iguais, dif, len(pend)


# ----------------------------------------------------------------- main
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--xlsx", type=Path)
    ap.add_argument("--cadastro", type=Path)
    ap.add_argument("--custos", type=Path)
    ap.add_argument("--mapa", type=Path, help="CSV alias;material[;grupo]")
    ap.add_argument("--dsn", default=os.environ.get("DATABASE_URL"))
    ap.add_argument("--relatorio", type=Path, default=Path("relatorio-carga"))
    ap.add_argument("--aplicar", action="store_true", help="grava (sem isso, faz e desfaz)")
    a = ap.parse_args(argv)
    if not a.dsn:
        ap.error("informe --dsn ou DATABASE_URL")
    if a.xlsx:
        cad_raw, cus_raw = ler_linhas(a.xlsx, "cadastro"), ler_linhas(a.xlsx, "custos")
    elif a.cadastro and a.custos:
        cad_raw, cus_raw = ler_linhas(a.cadastro, None), ler_linhas(a.custos, None)
    else:
        ap.error("use --xlsx OU --cadastro e --custos")

    cad, cus, erros = preparar(mapear(cad_raw, COLS_CADASTRO, "cadastro"), mapear(cus_raw, COLS_CUSTOS, "custos"))
    aliases = []
    if a.mapa and a.mapa.exists():
        for r in ler_linhas(a.mapa, None):
            k = {chave(x): v for x, v in r.items()}
            if txt(k.get("alias")) and txt(k.get("material")):
                aliases.append((k["alias"].strip(), k["material"].strip(), txt(k.get("grupo"))))

    with psycopg.connect(a.dsn) as con:
        with con.transaction(force_rollback=not a.aplicar):
            con.execute("SET LOCAL lock_timeout = '10s'")
            con.execute("SELECT pg_advisory_xact_lock(hashtext('carta_traco_carga'))")
            con.execute("TRUNCATE carta_traco_stg.cadastro, carta_traco_stg.custos, carta_traco_stg.alias")
            with con.cursor() as cur:
                with cur.copy("COPY carta_traco_stg.cadastro FROM STDIN") as cp:
                    for r in cad:
                        cp.write_row(r)
                with cur.copy("COPY carta_traco_stg.custos FROM STDIN") as cp:
                    for r in cus:
                        cp.write_row(r)
                with cur.copy("COPY carta_traco_stg.alias FROM STDIN") as cp:
                    for r in aliases:
                        cp.write_row(r)
            con.execute(SQL_CARGA.read_text(encoding="utf-8"))
            iguais, dif, npend = relatorio(con, cad, cus, erros, mcc_legado(cad, cus), a.relatorio, a.aplicar)

    print(f"{'APLICADO' if a.aplicar else 'ENSAIO'}: {len(cad)} linhas de cadastro, {len(cus)} de custos. "
          f"MCC igual em {iguais} cartas, diferente em {dif}. {npend} pendências. Relatório em {a.relatorio}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
