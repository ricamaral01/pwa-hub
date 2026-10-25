"""Carta Traço no Laboratório: carga do Sheets, MCC, revisões, tabela de preços e fontes de custo."""
from decimal import Decimal

import psycopg

from conftest import DSN

FCK25 = [("Cimento CP V-ARI", 380, 3.10), ("Areia fina", 320, 2.63), ("Areia média", 472, 2.62),
         ("Brita 0", 300, 2.72), ("Brita 1", 750, 2.75), ("Água", 190, 1.0),
         ("Aditivo 1 (PC)", 3.04, 1.08), ("Aditivo 2 (RT)", 1.9, 1.10)]


def test_conversao_unidades(banco):
    with psycopg.connect(DSN) as con:
        f = lambda *a: con.execute("SELECT insumos.custo_por_kg(%s::numeric,%s::text,%s::numeric,%s::numeric,50)", a).fetchone()[0]
        assert f(900, "t", 1, None) == Decimal("0.9")
        assert f(50, "saco", 1, None) == 1
        assert round(f(10.8, "L", 1.08, None), 4) == 10          # R$/L ÷ kg/L
        assert round(f(263, "m3", 2.63, None), 4) == Decimal("0.1")
        assert round(f(145, "m3", 2.63, 1.45), 4) == Decimal("0.1")  # usa massa unitária quando houver


def test_carga_resolveu_defeitos_do_legado(banco):
    with psycopg.connect(DSN) as con:
        ativas = con.execute("""SELECT nome, revisao FROM carta_traco.carta WHERE status='Ativa' ORDER BY nome""").fetchall()
        assert ("FCK 30", 2) in ativas and ("FCK 30", 1) not in ativas          # A1
        assert con.execute("SELECT count(*) FROM carta_traco.carta WHERE nome='FCK 20'").fetchone()[0] == 1  # gravada 2x
        assert con.execute("""SELECT count(*) FROM carta_traco.carta_item i JOIN carta_traco.carta c ON c.id=i.carta_id
                              WHERE c.nome='FCK 20'""").fetchone()[0] == 3
    rel = (banco["pasta"] / "rel" / "pendencias.csv").read_text(encoding="utf-8")
    assert "Areia media" in rel and "litro" in rel


def test_mcc_e_indicadores_iguais_ao_mockup(cliente, ids):
    mats, uns = ids["mat"], ids["un"]
    body = {"unidade_id": uns["Campinas"],
            "itens": [{"material_id": mats[n], "qtd_kg": q, "massa_especifica": me} for n, q, me in FCK25]}
    r = cliente.post("/api/laboratorio/carta-traco/cartas/calcular", json=body).json()
    assert Decimal(str(r["mcc"])) == Decimal("408.93")
    assert r["itens_sem_custo"] == ["Aditivo 2 (RT)"]
    assert Decimal(str(r["indicadores"]["rel_ac"])) == Decimal("0.500")
    assert Decimal(str(r["indicadores"]["fechamento_l"])) == Decimal("-2.0")
    assert r["fechamento_ok"] is True


def test_salvar_revisao_inativa_anterior(cliente, ids):
    mats, uns = ids["mat"], ids["un"]
    cartas = cliente.get("/api/laboratorio/carta-traco/cartas", params={"busca": "Brita 1"}).json()
    assert [c["revisao"] for c in cartas] == [3]
    body = {"nome": "FCK 25  ·  Brita 1", "unidade_id": uns["Campinas"], "vigencia": "2026-10-26",
            "itens": [{"material_id": mats[n], "qtd_kg": q, "massa_especifica": me} for n, q, me in FCK25]}
    r = cliente.post("/api/laboratorio/carta-traco/cartas", json=body)
    assert r.status_code == 201, r.text
    assert r.json()["revisao"] == 4
    det = cliente.get(f"/api/laboratorio/carta-traco/cartas/{r.json()['id']}").json()
    assert [(x["revisao"], x["status"]) for x in det["revisoes"]] == [(4, "Ativa"), (3, "Inativa"), (2, "Inativa")]
    assert len(det["itens"]) == 8


def test_carta_com_material_repetido_e_recusada(cliente, ids):
    mats, uns = ids["mat"], ids["un"]
    item = {"material_id": mats["Brita 1"], "qtd_kg": 100}
    r = cliente.post("/api/laboratorio/carta-traco/cartas", json={"nome": "X", "unidade_id": uns["Campinas"],
                     "vigencia": "2026-10-25", "itens": [item, item]})
    assert r.status_code == 422


def test_custo_novo_liquido_calculado_e_impacto(cliente, ids):
    mats, uns, forn = ids["mat"], ids["un"], ids["forn"]
    novo = {"unidade_id": uns["Campinas"], "fornecedor_id": forn["Aditivos SA"], "material_id": mats["Aditivo 2 (RT)"],
            "un_medida": "kg", "valor": "9.40", "icms_pct": "12", "frete": "0.18", "tipo_frete": "CIF"}
    imp = cliente.post("/api/laboratorio/carta-traco/custos/impacto", json=novo).json()
    assert imp and all(Decimal(str(x["delta"])) == Decimal("16.06") for x in imp)
    assert not any(c["material"] == "Aditivo 2 (RT)" for c in
                   cliente.get("/api/laboratorio/carta-traco/custos", params={"unidade_id": uns["Campinas"]}).json())
    r = cliente.post("/api/laboratorio/carta-traco/custos", json=novo)
    assert r.status_code == 201
    vig = [c for c in cliente.get("/api/laboratorio/carta-traco/custos", params={"unidade_id": uns["Campinas"]}).json()
           if c["material"] == "Aditivo 2 (RT)"]
    assert Decimal(str(vig[0]["valor_liquido"])) == Decimal("8.4520")


def test_custo_invalido(cliente, ids):
    mats, uns, forn = ids["mat"], ids["un"], ids["forn"]
    r = cliente.post("/api/laboratorio/carta-traco/custos", json={"unidade_id": uns["Campinas"], "fornecedor_id": 1,
                     "material_id": mats["Brita 1"], "un_medida": "t", "valor": "10", "icms_pct": "150"})
    assert r.status_code == 422


def test_resumo_e_auditoria(cliente):
    res = cliente.get("/api/laboratorio/carta-traco/resumo").json()
    assert {r["nome"] for r in res} >= {"FCK 30", "FCK 20"}
    with psycopg.connect(DSN) as con:
        assert con.execute("SELECT count(*) FROM insumos.auditoria WHERE usuario='ricardo'").fetchone()[0] > 0


def test_fonte_de_custo_do_estoque(cliente, ids):
    """MCC pode usar o custo real das NFs do estoque; sem entrada, cai na tabela de preços."""
    mats, uns = ids["mat"], ids["un"]
    itens = [{"material_id": mats[n], "qtd_kg": q, "massa_especifica": me} for n, q, me in FCK25]
    url = "/api/laboratorio/carta-traco/cartas/calcular"
    so_entrada = cliente.post(url, json={"unidade_id": uns["Campinas"], "itens": itens, "fonte": "ultima_entrada",
                                         "data": "2026-10-25"}).json()
    por = {i["material"]: i for i in so_entrada["itens"]}
    assert Decimal(str(por["Cimento CP V-ARI"]["custo_m3"])) == Decimal("204.6528")   # 538,56/t da NF de 01/10
    assert por["Cimento CP V-ARI"]["origem_custo"] == "ultima_entrada"
    assert por["Brita 1"]["sem_custo"] is True                                          # sem entrada no estoque
    misto = cliente.post(url, json={"unidade_id": uns["Campinas"], "itens": itens, "fonte": "entrada_senao_tabela",
                                    "data": "2026-10-25"}).json()
    origens = {i["material"]: i["origem_custo"] for i in misto["itens"]}
    assert origens["Brita 1"] == "tabela" and origens["Areia média"] == "ultima_entrada"
    custo = {i["material"]: Decimal(str(i["custo_m3"])) for i in misto["itens"]}
    assert custo["Areia média"] == Decimal("43.9904")                                    # 93,20/t da NF
    assert custo["Brita 1"] == Decimal("60.0000")                                        # tabela de preços
    assert Decimal(str(misto["mcc"])) == round(sum(custo.values()), 2)


def test_formula_unica_de_custo_liquido(sql, banco):
    # tabela de preços e entrada de NF usam a mesma regra (frete com ICMS próprio)
    assert sql("SELECT insumos.custo_liquido_unit(100, 12, 10, 12)")[0][0] == Decimal("96.8000")
    assert banco["sincronizacao"]["entradas com custo diferente do ERP"] == 0
