"""
Router: /api/relatorios
Relatório gerencial — consumo de materiais (tbl_massadas)
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import date, datetime, time, timedelta
import psycopg2
import psycopg2.extras
from decimal import Decimal
from .settings import settings
from pathlib import Path
import csv
import io
import json
import os
import re
import subprocess
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

router = APIRouter()

SUPABASE_MAPA_URL = "https://fbvvdyirhtgvycullsqy.supabase.co"
SUPABASE_MAPA_KEY = os.environ.get("USINAS_REPORTING_SUPABASE_KEY", "")
FECHAMENTO_FUNCIONARIOS_SHEET_ID = "18OwJ1bUK1xvr1WG-epDChi5na7FD2MMdsEgeJgBTpRA"
GOOGLE_SHEETS_SCOPES = ("https://www.googleapis.com/auth/spreadsheets.readonly",)
GOOGLE_CREDS_PATHS = (
    os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE"),
    os.getenv("GOOGLE_CREDENTIALS_PATH"),
    os.getenv("GOOGLE_CREDS_PATH"),
    "/root/credencial/sheetsautomacao-477114-9b74d04e460f.json",
)
PESO_ADICIONAL_POSTE = 0.05
VOLUME_PADRAO_POSTE_M3 = 0.430
PESO_PADRAO_POSTE_KG = 980


def _conn():
    return psycopg2.connect(settings.POSTGRES_URL, options="-c search_path=usinas_reporting,public -c default_transaction_read_only=on")


def _dec(v):
    """Converte Decimal/None para float."""
    if v is None:
        return 0.0
    return float(v)


def _silo_map_key(col: str) -> str:
    if col == "real_silo1":
        return "silo1"
    if col == "real_silo2":
        return "silo2"
    if col == "real_silo3":
        return "silo3"
    if col == "real_silo4":
        return "silo4"
    return col


def _prog_map_key(map_key: str) -> str:
    if map_key == "agua":
        return "prog_agua"
    return f"prog_{map_key}"


def _qtd_relatorio(raw_value: float, categoria: str, unidade: str) -> float:
    """Quantidade exibida/calculada no relatório: kg para sólidos, L para água/aditivos."""
    cat = (categoria or "").lower()
    un = (unidade or "").lower()
    value = float(raw_value or 0)
    if cat in ("areia", "brita", "cimento", "adicao") and un == "ton":
        # tbl_massadas já vem em kg para agregados/silos; fator 0.001 é só para estoque em ton.
        return value
    return value


def _custo_unitario_relatorio(valor_unitario, categoria: str, unidade: str, qtd_entrada) -> float:
    """
    Normaliza custo para a unidade do relatório.

    Entradas de sólidos são persistidas de forma canônica em ton. Como o
    relatório trabalha em kg, o valor unitário por ton é dividido por 1000.
    """
    unit = float(valor_unitario or 0)
    cat = (categoria or "").lower()
    un = (unidade or "").lower()
    if cat in ("areia", "brita", "cimento", "adicao") and un == "ton":
        return unit / 1000.0
    return unit


def _unidade_carta(campo: str, categoria: str, unidade: str) -> str:
    """Unidade operacional exibida na carta de traço."""
    cat = (categoria or "").lower()
    if campo == "agua" or cat == "agua":
        return "L"
    if cat in ("cimento", "adicao", "areia", "brita", "aditivo"):
        return "kg"
    return unidade or "kg"


def _serialize_value(v):
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (date, datetime, time)):
        return v.isoformat()
    return v


def _serialize_row(row):
    return {k: _serialize_value(v) for k, v in dict(row).items()}


def _float_round(value, casas=2):
    return round(float(value or 0), casas)


def _parse_float_br(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = text.replace(".", "").replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def _normalize_upper(text):
    return str(text or "").strip().upper()


def _codigo_from_forma(forma):
    normalized = _normalize_upper(forma).replace(" ", "")
    if not normalized:
        return ""
    special_prefixes = (
        ("300-VR", "300-VR"),
        ("300-VL", "300-VL"),
        ("SB-E1", "SB-E1"),
        ("SBE-", "SB-E1"),
        ("100-", "100"),
        ("100", "100"),
        ("200-", "200"),
        ("200", "200"),
        ("A-TOTEM", "TOTEM"),
        ("TMIE", "TOTEM"),
        ("C-F1", "CEMIG-5X150"),
        ("R-G", "CEMIG-1VL"),
        ("DTBM", "DTBM"),
        ("DTB", "DTB"),
        ("DTD", "DTD"),
        ("SC", "SC"),
    )
    for prefix, codigo in special_prefixes:
        if normalized.startswith(prefix):
            return codigo
    return normalized.split("-")[0]


def _date_token_matches(raw, data_ref: date) -> bool:
    text = str(raw or "").strip()
    if not text:
        return False
    candidates = {
        data_ref.isoformat(),
        data_ref.strftime("%d/%m"),
        data_ref.strftime("%d/%m/%Y"),
        data_ref.strftime("%d/%m/%y"),
        f"{data_ref.day}/{data_ref.month}",
        f"{data_ref.day}/{data_ref.month:02d}",
        f"{data_ref.day:02d}/{data_ref.month}",
        f"{data_ref.day}/{data_ref.month}/{data_ref.year}",
        f"{data_ref.day}/{data_ref.month}/{str(data_ref.year)[-2:]}",
    }
    if text in candidates:
        return True
    numeric = _parse_float_br(text)
    if numeric and numeric > 20000:
        base = date(1899, 12, 30)
        try:
            return base + timedelta(days=int(numeric)) == data_ref
        except Exception:
            return False
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date() == data_ref
        except ValueError:
            pass
    return False


def _excel_col(index_zero_based: int) -> str:
    index = index_zero_based + 1
    out = ""
    while index:
        index, rem = divmod(index - 1, 26)
        out = chr(65 + rem) + out
    return out


def _google_sheet_csv_url(gid: Optional[str] = None, sheet: Optional[str] = None) -> str:
    if gid:
        return (
            f"https://docs.google.com/spreadsheets/d/{FECHAMENTO_FUNCIONARIOS_SHEET_ID}"
            f"/export?format=csv&gid={gid}"
        )
    query = urllib.parse.urlencode({"tqx": "out:csv", "sheet": sheet or ""})
    return f"https://docs.google.com/spreadsheets/d/{FECHAMENTO_FUNCIONARIOS_SHEET_ID}/gviz/tq?{query}"


def _fetch_csv_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.read().decode("utf-8-sig")


def _google_creds_path():
    for candidate in GOOGLE_CREDS_PATHS:
        if candidate and Path(candidate).exists():
            return str(Path(candidate))
    return None


def _google_access_token():
    creds_path = _google_creds_path()
    if not creds_path:
        raise RuntimeError("credencial_google_nao_encontrada")
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request
    except ImportError as exc:
        raise RuntimeError(f"biblioteca_google_indisponivel: {exc}") from exc

    credentials = service_account.Credentials.from_service_account_file(
        creds_path,
        scopes=GOOGLE_SHEETS_SCOPES,
    )
    credentials.refresh(Request())
    if not credentials.token:
        raise RuntimeError("token_google_vazio")
    return credentials.token


def _fetch_google_sheet_values(range_a1: str):
    token = _google_access_token()
    encoded_range = urllib.parse.quote(range_a1, safe="")
    query = urllib.parse.urlencode({
        "valueRenderOption": "FORMATTED_VALUE",
        "dateTimeRenderOption": "FORMATTED_STRING",
    })
    url = (
        f"https://sheets.googleapis.com/v4/spreadsheets/{FECHAMENTO_FUNCIONARIOS_SHEET_ID}"
        f"/values/{encoded_range}?{query}"
    )
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "ConcreTrack-ERP/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")[:240]
        raise RuntimeError(f"HTTP {exc.code}: {body}") from exc
    return payload.get("values") or []


def _supabase_select(table: str, params: dict, page_size: int = 1000, max_pages: int = 10):
    rows = []
    for page in range(max_pages):
        query = dict(params)
        query["limit"] = page_size
        query["offset"] = page * page_size
        url = f"{SUPABASE_MAPA_URL}/rest/v1/{table}?{urllib.parse.urlencode(query)}"
        req = urllib.request.Request(
            url,
            headers={
                "apikey": SUPABASE_MAPA_KEY,
                "Authorization": f"Bearer {SUPABASE_MAPA_KEY}",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            page_rows = json.loads(response.read().decode("utf-8"))
        if not isinstance(page_rows, list):
            break
        rows.extend(page_rows)
        if len(page_rows) < page_size:
            break
    return rows


def _dedupe_producao_mapa(rows):
    grouped = {}
    for row in rows or []:
        key = (
            row.get("data_fabricacao"),
            row.get("setor"),
            _normalize_upper(row.get("forma") or row.get("forma_numero")),
        )
        grouped.setdefault(key, []).append(row)
    out = []
    for group in grouped.values():
        selected = None
        for row in group:
            if row.get("status") == "LIBERADO":
                selected = row
                break
        if not selected:
            for row in group:
                if _normalize_upper(row.get("tipo_concreto")) != "INSPECIONADO":
                    selected = row
                    break
        out.append(selected or group[0])
    return out


def _produto_tem_peso(row):
    peso = row.get("peso_poste_kg")
    volume = row.get("volume_catalogo_m3")
    return (peso is not None and volume is not None
            and float(peso) > 0 and float(volume) > 0)


def _volume_poste_m3(row):
    """Use product volume or 0.430 m3 (980 kg), then add 5%."""
    volume = (float(row["volume_catalogo_m3"]) if _produto_tem_peso(row)
              else VOLUME_PADRAO_POSTE_M3)
    return volume * (1 + PESO_ADICIONAL_POSTE)


def _tipo_poste(row):
    codigo = _normalize_upper(row.get("codigo_poste"))
    modelo = str(row.get("modelo") or "").strip()
    descricao = str(row.get("descricao_poste") or "").strip()
    if not codigo:
        codigo = _codigo_from_forma(row.get("forma") or row.get("forma_numero"))
    if codigo and modelo and modelo.upper() not in codigo:
        return f"{codigo} - {modelo}"
    if codigo:
        return codigo
    return modelo or descricao or "SEM TIPO"


def _unificado_get(resource: str, data_ref: date):
    key = os.getenv("MAPA_USINA_INTEGRATION_KEY", "").strip()
    if not key:
        raise RuntimeError("Chave de integracao do Mapa Unificado nao configurada")
    url = (
        "https://concrefer.concretrack.com.br/unificado/mapa/api/"
        f"integrations/usina/{resource}?data={data_ref.isoformat()}"
    )
    req = urllib.request.Request(url, headers={"X-Usina-Integration-Key": key})
    with urllib.request.urlopen(req, timeout=12) as response:
        return json.load(response)


def _fetch_producao_unificado(data_ref: date):
    fonte = {"fonte": "mapa_unificado.producao", "status": "ok"}
    try:
        payload = _unificado_get("formas", data_ref)
        if payload.get("data_filtro") != data_ref.isoformat() or not isinstance(payload.get("rows"), list):
            raise ValueError("Resposta invalida do Mapa Unificado")
        rows = [row for row in payload["rows"]
                if _normalize_upper(row.get("status")) in {"LIBERADO", "INSPECIONADO"}]
        rows = _dedupe_producao_mapa(rows)
        fonte["linhas"] = len(rows)
        if not rows:
            fonte["status"] = "sem_dados"
        return rows, fonte
    except Exception as exc:
        return [], {"fonte": "mapa_unificado.producao", "status": "indisponivel", "erro": str(exc)}


def _fetch_postes_mapa(rows, fonte_mapa):
    grouped = {}
    for row in rows:
        tipo = _tipo_poste(row)
        item = grouped.setdefault(tipo, {
            "tipo": tipo, "qtd": 0, "m3": 0.0, "m3_identificado": 0.0, "postes_sem_peso": 0,
            "codigo_poste": _normalize_upper(row.get("codigo_poste")),
            "modelo": row.get("modelo") or "",
        })
        item["qtd"] += 1
        volume = _volume_poste_m3(row)
        item["m3"] += volume
        if _produto_tem_peso(row):
            item["m3_identificado"] += volume
        else:
            item["postes_sem_peso"] += 1
    postes = sorted(
        [{"tipo": item["tipo"], "qtd": item["qtd"],
          "m3": round(item["m3"], 2),
          "m3_identificado": round(item["m3_identificado"], 2),
          "postes_sem_peso": item["postes_sem_peso"],
          "codigo_poste": item["codigo_poste"], "modelo": item["modelo"]}
         for item in grouped.values()],
        key=lambda item: (-item["qtd"], item["tipo"]),
    )
    return postes, {**fonte_mapa, "volume_por_tipo": "peso_produto_mais_5_porcento_padrao_0_430_m3",
                    "postes_sem_peso": sum(item["postes_sem_peso"] for item in postes)}


def _fetch_resumo_setores_mapa(rows, fonte_mapa):
    grouped = {}
    for row in rows:
        setor = str(row.get("setor") or "Sem setor").strip() or "Sem setor"
        item = grouped.setdefault(setor, {
            "setor": setor, "postes": 0, "m3": 0.0, "m3_identificado": 0.0,
            "postes_sem_peso": 0,
        })
        item["postes"] += 1
        volume = _volume_poste_m3(row)
        item["m3"] += volume
        if _produto_tem_peso(row):
            item["m3_identificado"] += volume
        else:
            item["postes_sem_peso"] += 1
    if rows:
        for numero in range(1, 5):
            nome = f"Setor {numero}"
            grouped.setdefault(nome, {
                "setor": nome, "postes": 0, "m3": 0.0, "m3_identificado": 0.0,
                "postes_sem_peso": 0,
            })
    def sort_key(item):
        match = re.search(r"\d+", item["setor"])
        return (int(match.group(0)) if match else 999, item["setor"])
    setores = sorted(
        [{"setor": item["setor"], "postes": item["postes"],
          "m3": round(item["m3"], 2),
          "m3_identificado": round(item["m3_identificado"], 2),
          "postes_sem_peso": item["postes_sem_peso"]}
         for item in grouped.values()],
        key=sort_key,
    )
    return setores, {**fonte_mapa, "volume_por_setor": "peso_produto_mais_5_porcento_padrao_0_430_m3",
                     "postes_sem_peso": sum(item["postes_sem_peso"] for item in setores)}


def _fetch_postes_fallback_erp(data_ref: date):
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT COALESCE(NULLIF(TRIM(produto), ''), NULLIF(TRIM(formula), ''), 'SEM TIPO') AS tipo,
               COUNT(*)::int AS qtd,
               COALESCE(SUM(qtd), 0) AS m3
        FROM tbl_massadas
        WHERE data = %s AND qtd IS NOT NULL AND qtd > 0
        GROUP BY 1
        ORDER BY 2 DESC, 1
    """, (data_ref,))
    rows = [_serialize_row(row) for row in cur.fetchall()]
    cur.close()
    conn.close()
    return [{"tipo": row["tipo"], "qtd": int(row["qtd"] or 0), "m3": round(float(row["m3"] or 0), 2), "codigo_poste": "", "modelo": ""} for row in rows]


def _fetch_volume_erp(data_ref: date):
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT COUNT(*)::int AS massadas,
               COALESCE(SUM(qtd), 0) AS m3,
               MIN(hora) AS primeira,
               MAX(hora) AS ultima
        FROM tbl_massadas
        WHERE data = %s AND qtd IS NOT NULL AND qtd > 0
    """, (data_ref,))
    row = _serialize_row(cur.fetchone() or {})
    cur.close()
    conn.close()
    return {
        "massadas": int(row.get("massadas") or 0),
        "m3": round(float(row.get("m3") or 0), 2),
        "primeira": row.get("primeira"),
        "ultima": row.get("ultima"),
        "fonte": "erp.tbl_massadas",
    }


def _fetch_ocorrencias_erp(data_ref: date):
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    ocorrencias = []
    cur.execute("""
        SELECT data, hora_apontamento, tipo, descricao, acao_tomada, criado_em
        FROM tbl_nao_conformidades_apontadas
        WHERE data = %s OR criado_em::date = %s
        ORDER BY COALESCE(criado_em, data + hora_apontamento)
    """, (data_ref, data_ref))
    for row in cur.fetchall():
        item = _serialize_row(row)
        texto = " - ".join([x for x in [item.get("tipo"), item.get("descricao"), item.get("acao_tomada")] if x])
        if texto:
            registrado_em = item.get("criado_em") or f"{data_ref.isoformat()}T{item.get('hora_apontamento') or '00:00:00'}"
            ocorrencias.append({
                "data": item.get("data") or data_ref.isoformat(),
                "hora": item.get("hora_apontamento"),
                "registrado_em": registrado_em,
                "tipo": "Nao conformidade",
                "descricao": texto,
            })
    cur.execute("""
        SELECT data, hora_apontamento, minutos, motivo, m3_perdido, criado_em
        FROM tbl_paradas_apontadas
        WHERE data = %s OR criado_em::date = %s
        ORDER BY COALESCE(criado_em, data + hora_apontamento)
    """, (data_ref, data_ref))
    for row in cur.fetchall():
        item = _serialize_row(row)
        detalhe = item.get("motivo") or "Parada apontada"
        minutos = float(item.get("minutos") or 0)
        if minutos:
            detalhe = f"{detalhe} ({minutos:g} min)"
        registrado_em = item.get("criado_em") or f"{data_ref.isoformat()}T{item.get('hora_apontamento') or '00:00:00'}"
        ocorrencias.append({
            "data": item.get("data") or data_ref.isoformat(),
            "hora": item.get("hora_apontamento"),
            "registrado_em": registrado_em,
            "tipo": "Parada",
            "descricao": detalhe,
        })
    cur.close()
    conn.close()
    ocorrencias.sort(key=lambda item: item.get("registrado_em") or "")
    return ocorrencias


def _fetch_funcionarios(data_ref: date):
    """MOD for the shared sectors 1+2, sector 3, and sector 4."""
    try:
        payload = _unificado_get("mao-de-obra", data_ref)
        if payload.get("data_filtro") != data_ref.isoformat():
            raise ValueError("Resposta invalida do PCP Unificado")
        setores = payload.get("setores") or []
        if {str(row.get("grupo_setor")) for row in setores} != {"12", "3", "4"}:
            raise ValueError("Grupos MOD incompletos no PCP Unificado")
        lancamentos = sum(int(row.get("lancamentos") or 0) for row in setores)
        setores_lancados = sum(1 for row in setores if int(row.get("lancamentos") or 0) > 0)
        quantidade = sum(int(row.get("quantidade") or 0) for row in setores) if lancamentos else None
        status = "sem_lancamento" if not lancamentos else "ok" if setores_lancados == 3 else "parcial"
        return {
            "quantidade": quantidade,
            "setores": setores,
            "lancamentos": lancamentos,
            "setores_lancados": setores_lancados,
            "fonte": "pcp_unificado.maodeobra.MOD_grupos_12_3_4",
            "status": status,
        }
    except Exception as exc:
        return {"quantidade": None, "setores": [],
                "fonte": "pcp_unificado.maodeobra.MOD_grupos_12_3_4",
                "status": "indisponivel", "erro": str(exc)}


def _fetch_estoque_armacoes_mapa(data_ref: date):
    try:
        rows = _supabase_select("programacao_pcp", {
            "select": "data_fabricacao,setor,forma,modelo,codigo_poste,descricao_poste,codigo_produto,quantidade,data_hora",
            "data_fabricacao": f"eq.{data_ref.isoformat()}",
        })
    except Exception as exc:
        return [], {"fonte": "mapa_concretagem_supabase.programacao_pcp", "status": "indisponivel", "erro": str(exc)}

    if not rows:
        return [], {"fonte": "mapa_concretagem_supabase.programacao_pcp", "status": "sem_dados", "linhas": 0}

    grouped = {}
    for row in rows:
        tipo = _tipo_poste(row)
        item = grouped.setdefault(tipo, {"tipo": tipo, "quantidade": 0})
        item["quantidade"] += int(row.get("quantidade") or 1)
    armacoes = sorted(grouped.values(), key=lambda item: (-item["quantidade"], item["tipo"]))
    return armacoes, {"fonte": "mapa_concretagem_supabase.programacao_pcp", "status": "ok", "linhas": len(rows)}


def _fetch_armacoes_google(data_ref: date):
    url = _google_sheet_csv_url(sheet="Armações")
    try:
        content = _fetch_csv_text(url)
    except urllib.error.HTTPError as exc:
        return [], {
            "fonte": "google_sheets:Armações",
            "status": "indisponivel",
            "erro": f"HTTP {exc.code}",
            "linha_datas": 9,
            "coluna_inicial": "E",
        }
    except Exception as exc:
        return [], {
            "fonte": "google_sheets:Armações",
            "status": "indisponivel",
            "erro": str(exc),
            "linha_datas": 9,
            "coluna_inicial": "E",
        }

    rows = list(csv.reader(io.StringIO(content)))
    if len(rows) < 10:
        return [], {"fonte": "google_sheets:Armações", "status": "sem_linha_9"}

    target_col = None
    for idx, raw_date in enumerate(rows[8][4:], start=4):
        if _date_token_matches(raw_date, data_ref):
            target_col = idx
            break
    if target_col is None:
        return [], {
            "fonte": "google_sheets:Armações",
            "status": "data_nao_encontrada",
            "linha_datas": 9,
            "coluna_inicial": "E",
        }

    itens = []
    for row in rows[9:]:
        if target_col >= len(row):
            continue
        quantidade = _parse_float_br(row[target_col])
        if quantidade is None or quantidade <= 0:
            continue
        tipo = ""
        for cell in row[:4]:
            text = str(cell or "").strip()
            if text and not text.upper().startswith(("TOTAL", "HOMENS", "POSTES/HOMEM", "META")):
                tipo = text
                break
        if not tipo:
            continue
        itens.append({"tipo": tipo, "quantidade": int(round(quantidade))})

    return itens, {
        "fonte": "google_sheets:Armações",
        "status": "ok",
        "linhas": len(itens),
        "linha_datas": 9,
        "coluna": _excel_col(target_col),
    }


def _parse_armacoes_sheet_rows(rows, data_ref: date, fonte: dict):
    fonte = dict(fonte)
    fonte.update({"linha_datas": 9, "coluna_inicial": "E"})
    if len(rows) < 10:
        fonte["status"] = "sem_linha_9"
        return [], fonte

    target_col = None
    for idx, raw_date in enumerate(rows[8][4:], start=4):
        if _date_token_matches(raw_date, data_ref):
            target_col = idx
            break
    if target_col is None:
        fonte["status"] = "data_nao_encontrada"
        return [], fonte

    itens = []
    for row in rows[9:]:
        if target_col >= len(row):
            continue
        quantidade = _parse_float_br(row[target_col])
        if quantidade is None or quantidade <= 0:
            continue
        tipo = ""
        for cell in row[:4]:
            text = str(cell or "").strip()
            if text and not text.upper().startswith(("TOTAL", "HOMENS", "POSTES/HOMEM", "META")):
                tipo = text
                break
        if not tipo:
            continue
        itens.append({"tipo": tipo, "quantidade": int(round(quantidade))})

    fonte.update({"status": "ok", "linhas": len(itens), "coluna": _excel_col(target_col)})
    return itens, fonte


def _fetch_armacoes_google_auth(data_ref: date):
    auth_error = None
    try:
        rows = _fetch_google_sheet_values("'Armações'!A1:ZZ300")
        return _parse_armacoes_sheet_rows(rows, data_ref, {
            "fonte": "google_sheets:Armacoes",
            "auth": "service_account",
        })
    except Exception as exc:
        auth_error = str(exc)

    url = _google_sheet_csv_url(sheet="Armações")
    try:
        content = _fetch_csv_text(url)
    except urllib.error.HTTPError as exc:
        return [], {
            "fonte": "google_sheets:Armacoes",
            "status": "indisponivel",
            "erro": auth_error or f"HTTP {exc.code}",
            "fallback_publico": f"HTTP {exc.code}",
            "linha_datas": 9,
            "coluna_inicial": "E",
        }
    except Exception as exc:
        return [], {
            "fonte": "google_sheets:Armacoes",
            "status": "indisponivel",
            "erro": auth_error or str(exc),
            "fallback_publico": str(exc),
            "linha_datas": 9,
            "coluna_inicial": "E",
        }

    rows = list(csv.reader(io.StringIO(content)))
    itens, fonte = _parse_armacoes_sheet_rows(rows, data_ref, {
        "fonte": "google_sheets:Armacoes",
        "auth": "public_csv",
    })
    if auth_error:
        fonte["auth_error"] = auth_error
    return itens, fonte


def _fetch_armacoes(data_ref: date):
    itens, fonte = _fetch_armacoes_google_auth(data_ref)
    if itens:
        return itens, fonte
    fallback_itens, fallback_fonte = _fetch_estoque_armacoes_mapa(data_ref)
    fonte["fallback"] = fallback_fonte
    return fallback_itens, fonte


def _avg(values):
    valid = [float(v) for v in values if v is not None and float(v) > 0]
    if not valid:
        return 0.0
    return sum(valid) / len(valid)


MESES = [
    (1, "Jan", "Janeiro"), (2, "Fev", "Fevereiro"), (3, "Mar", "Março"),
    (4, "Abr", "Abril"), (5, "Mai", "Maio"), (6, "Jun", "Junho"),
    (7, "Jul", "Julho"), (8, "Ago", "Agosto"), (9, "Set", "Setembro"),
    (10, "Out", "Outubro"), (11, "Nov", "Novembro"), (12, "Dez", "Dezembro"),
]

MONTHLY_REFERENCE_VOLUMES = {
    (2025, 7): 1389.40,
    (2025, 8): 1421.60,
    (2025, 9): 1363.90,
    (2025, 10): 1193.40,
    (2025, 11): 1247.20,
    (2025, 12): 672.40,
    (2026, 1): 870.80,
    (2026, 2): 1186.10,
    (2026, 3): 1399.90,
    (2026, 4): 1121.80,
    (2026, 5): 1210.85,
    (2026, 6): 1345.05,
    (2026, 7): 1352.55,
}

# Ajustes informados pela operacao que nao foram identificados como "Obra"
# na origem. O fechamento mantem esses volumes separados para auditoria e os
# soma ao volume total do mes de competencia indicado pela gerencia.
FECHAMENTO_OBRA_AJUSTES = {
    (2026, 8): [
        {"data": None, "descricao": "Produto registrado em nome alternativo", "massadas": 5, "volume": 4.50},
        {"data": None, "descricao": "Concreto para obra informado", "massadas": 9, "volume": 8.10},
        {"data": "2026-08-27", "descricao": "Concreto para obra", "massadas": 7, "volume": 6.30},
        {"data": "2026-08-28", "descricao": "Concreto para obra", "massadas": 4, "volume": 3.60},
        {"data": "2026-09-02", "descricao": "Concreto para obra atribuido ao fechamento de agosto", "massadas": 3, "volume": 2.70},
    ],
}

# Volumes ja presentes na origem, mas consumidos internamente em obra. Eles sao
# reclassificados para o card "Concreto Obra" e retirados dos totais gerenciais.
FECHAMENTO_OBRA_EXCLUSOES = {
    (2026, 9): [
        {
            "data": None,
            "descricao": "Concreto usado para obra (excluido do volume total)",
            "massadas": 0,
            "volume": 23.00,
        },
    ],
}


def _mes_info(mes: int):
    for num, abrev, nome in MESES:
        if num == mes:
            return abrev, nome
    return "", ""


def _ano_suf(ano: int) -> str:
    return str(ano)[-2:]


def _month_bounds(ano: int, mes: int):
    inicio = date(ano, mes, 1)
    fim = date(ano + 1, 1, 1) if mes == 12 else date(ano, mes + 1, 1)
    return inicio, fim


def _prev_month(ano: int, mes: int):
    return (ano - 1, 12) if mes == 1 else (ano, mes - 1)


def _fetch_massadas(inicio: date, fim: date):
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT data, hora, qtd, formula
        FROM tbl_massadas
        WHERE data >= %s AND data < %s
          AND qtd IS NOT NULL AND qtd > 0
        ORDER BY data, hora
    """, (inicio, fim))
    rows = [_serialize_row(row) for row in cur.fetchall()]
    cur.close()
    conn.close()
    return rows


def _parada_categoria(motivo: str) -> str:
    texto = _parada_texto_normalizado(motivo)
    if "areia" in texto or "comporta" in texto:
        return "Agregados"
    if "cimento" in texto or "silo" in texto or "balanca" in texto:
        return "Cimento / silo"
    if "pressao" in texto or "pneumat" in texto:
        return "Rede pneumática"
    if "agua" in texto:
        return "Água"
    if "material" in texto or "abastecimento" in texto:
        return "Abastecimento"
    if "aditivo" in texto:
        return "Aditivo"
    if "traco" in texto:
        return "Processo / traço"
    if "sensor" in texto:
        return "Sensor / automação"
    if "luz" in texto or "sinal" in texto:
        return "Sinalização"
    return "Outros"


def _parada_texto_normalizado(motivo: str) -> str:
    texto = " ".join(str(motivo or "").strip().split()).lower()
    texto = "".join(
        caractere for caractere in unicodedata.normalize("NFKD", texto)
        if not unicodedata.combining(caractere)
    )
    return re.sub(r"^\d{1,2}:\d{2}\s*[-–—:]?\s*", "", texto).strip(" .;:-")


def _parada_problema(motivo: str) -> str:
    """Consolida descrições equivalentes sem descartar o relato original."""
    texto = _parada_texto_normalizado(motivo)
    if "areia" in texto and any(termo in texto for termo in ("umid", "comporta", "caixa", "passagem")):
        return "Areia úmida / dificuldade na comporta"
    if "disjuntor" in texto and ("cimento" in texto or "silo" in texto):
        return "Disjuntor do silo de cimento"
    if "balanca" in texto and "cimento" in texto:
        return "Balança / descarga do cimento"
    if ("cimento" in texto or "silo" in texto) and any(
        termo in texto for termo in ("desc", "trav", "valvula", "alavanca", "nao", "troca")
    ):
        return "Falha na descarga do cimento"
    if "aditivo" in texto:
        return "Lentidão na alimentação de aditivo"
    if "pressao" in texto or "pneumat" in texto:
        return "Baixa pressão na rede pneumática"
    if "agua" in texto:
        return "Falta de água"
    if "abastecimento" in texto or "fim de material" in texto or "falta de material" in texto:
        return "Abastecimento / falta de material"
    if "traco" in texto:
        return "Ajuste no traço"
    if "sensor" in texto:
        return "Interferência no sensor"
    if "luz" in texto or "massada pronta" in texto:
        return "Falha na sinalização da massada"
    return " ".join(str(motivo or "Problema não especificado").strip().split()) or "Problema não especificado"


def _fetch_paradas_periodo(inicio: date, fim: date):
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT id, data, hora_apontamento, turno, hora_inicio, hora_fim,
               minutos, motivo, m3_perdido, criado_em
        FROM tbl_paradas_apontadas
        WHERE data >= %s AND data < %s
        ORDER BY data, hora_apontamento, criado_em
    """, (inicio, fim))
    rows = [_serialize_row(row) for row in cur.fetchall()]
    cur.close()
    conn.close()

    por_causa = {}
    por_problema = {}
    for row in rows:
        categoria = _parada_categoria(row.get("motivo"))
        item = por_causa.setdefault(categoria, {"causa": categoria, "ocorrencias": 0, "minutos": 0.0})
        item["ocorrencias"] += 1
        item["minutos"] += float(row.get("minutos") or 0)

        problema = _parada_problema(row.get("motivo"))
        detalhe = por_problema.setdefault(problema, {
            "problema": problema,
            "categoria": categoria,
            "ocorrencias": 0,
            "minutos": 0.0,
            "m3_perdido": 0.0,
            "dias": set(),
            "descricoes": {},
        })
        detalhe["ocorrencias"] += 1
        detalhe["minutos"] += float(row.get("minutos") or 0)
        detalhe["m3_perdido"] += float(row.get("m3_perdido") or 0)
        if row.get("data"):
            detalhe["dias"].add(row["data"])
        descricao = " ".join(str(row.get("motivo") or "Problema não especificado").strip().split())
        detalhe["descricoes"][descricao] = detalhe["descricoes"].get(descricao, 0) + 1

    minutos_total = sum(float(row.get("minutos") or 0) for row in rows)
    m3_perdido = sum(float(row.get("m3_perdido") or 0) for row in rows)
    causas = sorted(por_causa.values(), key=lambda item: (-item["minutos"], -item["ocorrencias"], item["causa"]))
    for item in causas:
        item["minutos"] = round(item["minutos"], 2)

    problemas = []
    for item in por_problema.values():
        descricoes = sorted(item.pop("descricoes").items(), key=lambda entry: (-entry[1], entry[0].casefold()))
        dias = item.pop("dias")
        item["minutos"] = round(item["minutos"], 2)
        item["m3_perdido"] = round(item["m3_perdido"], 2)
        item["dias_afetados"] = len(dias)
        item["media_minutos"] = round(item["minutos"] / item["ocorrencias"], 2)
        item["percentual_ocorrencias"] = round(item["ocorrencias"] / len(rows) * 100, 1) if rows else 0.0
        item["percentual_tempo"] = round(item["minutos"] / minutos_total * 100, 1) if minutos_total else 0.0
        item["descricoes"] = [{"texto": texto, "ocorrencias": quantidade} for texto, quantidade in descricoes]
        problemas.append(item)
    problemas.sort(key=lambda item: (-item["ocorrencias"], -item["minutos"], item["problema"].casefold()))

    maior_impacto = max(problemas, key=lambda item: item["minutos"], default=None)
    top_tres = problemas[:3]
    resumo_gerencial = {
        "problemas_distintos": len(problemas),
        "problemas_recorrentes": sum(1 for item in problemas if item["ocorrencias"] > 1),
        "mais_frequente": problemas[0] if problemas else None,
        "maior_impacto": maior_impacto,
        "top_3_ocorrencias": sum(item["ocorrencias"] for item in top_tres),
        "top_3_percentual": round(sum(item["ocorrencias"] for item in top_tres) / len(rows) * 100, 1) if rows else 0.0,
    }

    return {
        "quantidade": len(rows),
        "dias_com_parada": len({row.get("data") for row in rows if row.get("data")}),
        "minutos_total": round(minutos_total, 2),
        "horas_total": round(minutos_total / 60, 2),
        "media_minutos": round(minutos_total / len(rows), 2) if rows else 0.0,
        "m3_perdido": round(m3_perdido, 2),
        "por_causa": causas,
        "por_problema": problemas,
        "resumo_gerencial": resumo_gerencial,
        "registros": rows,
    }


def _sum_volume(rows):
    return sum(float(row.get("qtd") or 0) for row in rows)


def _days(rows):
    return sorted({row["data"] for row in rows if row.get("data")})


def _median(values):
    ordered = sorted(float(v) for v in values)
    n = len(ordered)
    if not n:
        return 0.0
    mid = n // 2
    if n % 2:
        return ordered[mid]
    return (ordered[mid - 1] + ordered[mid]) / 2


def _time_minutes(value):
    if not value:
        return None
    text = str(value).split(".")[0]
    try:
        parts = [int(part) for part in text.split(":")]
        return parts[0] * 60 + parts[1] + (parts[2] / 60 if len(parts) > 2 else 0)
    except Exception:
        return None


def _cycle_median(rows):
    by_day = {}
    for row in rows:
        day = row.get("data")
        minutes = _time_minutes(row.get("hora"))
        if day and minutes is not None:
            by_day.setdefault(day, []).append(minutes)
    diffs = []
    for minutes in by_day.values():
        ordered = sorted(minutes)
        for previous, current in zip(ordered, ordered[1:]):
            diff = current - previous
            if 0 < diff <= 30:
                diffs.append(diff)
    return _median(diffs)


def _monthly_metric_rows(rows, min_days=1):
    months = {}
    for row in rows:
        d = date.fromisoformat(row["data"]) if isinstance(row.get("data"), str) else row.get("data")
        if d:
            months.setdefault((d.year, d.month), []).append(row)
    values = []
    for month_rows in months.values():
        metric = _metrics(month_rows)
        if metric["dias"] >= min_days:
            values.append(metric)
    return values


def _metrics(rows, mensal_media=False, min_days=1):
    if mensal_media:
        values = _monthly_metric_rows(rows, min_days=min_days)
        if not values:
            return {
                "horas": 0.0,
                "media_diaria": 0.0,
                "produtividade": 0.0,
                "ciclo": 0.0,
                "dias": 0,
                "volume": 0.0,
            }
        return {
            "horas": round(_avg([item["horas"] for item in values]), 2),
            "media_diaria": round(_avg([item["media_diaria"] for item in values]), 2),
            "produtividade": round(_avg([item["produtividade"] for item in values]), 2),
            "ciclo": round(_avg([item["ciclo"] for item in values]), 2),
            "dias": round(_avg([item["dias"] for item in values]), 2),
            "volume": round(_avg([item["volume"] for item in values]), 2),
        }

    dias = len(_days(rows))
    horas = dias * 8.8
    total = _sum_volume(rows)
    media = total / dias if dias else 0.0
    produtividade = total / horas if horas else 0.0
    ciclo = _cycle_median(rows)
    return {
        "horas": round(horas, 2),
        "media_diaria": round(media, 2),
        "produtividade": round(produtividade, 2),
        "ciclo": round(ciclo, 2),
        "dias": dias,
        "volume": round(total, 2),
    }


def _variation(curr, prev):
    return round(((curr / prev - 1) * 100), 1) if prev else 0.0


def _indicator(name, unit, left, right, lower_is_better=False):
    change = _variation(right, left)
    better = change <= 0 if lower_is_better else change >= 0
    return {
        "name": name,
        "unit": unit,
        "left": round(left, 2),
        "right": round(right, 2),
        "change": change,
        "arrow": "↑" if change >= 0 else "↓",
        "better": better,
    }


@router.get("/relatorios/fechamento")
def fechamento(
    ano: int = Query(2026, description="Ano de analise"),
    mes: int = Query(8, ge=1, le=12, description="Mes de analise"),
):
    """Relatorio gerencial de fechamento da usina Campinas."""
    inicio_ref, fim_ref = _month_bounds(ano, mes)
    inicio_13 = date(ano - 1, mes, 1)
    rows_13 = _fetch_massadas(inicio_13, fim_ref)
    rows_ref = [row for row in rows_13 if row.get("data") >= inicio_ref.isoformat() and row.get("data") < fim_ref.isoformat()]
    paradas = _fetch_paradas_periodo(inicio_ref, fim_ref)
    obra_ajustes = FECHAMENTO_OBRA_AJUSTES.get((ano, mes), [])
    obra_ajuste_volume = sum(float(item["volume"]) for item in obra_ajustes)
    obra_ajuste_massadas = sum(int(item["massadas"]) for item in obra_ajustes)
    obra_exclusoes = FECHAMENTO_OBRA_EXCLUSOES.get((ano, mes), [])
    obra_exclusao_volume = sum(float(item["volume"]) for item in obra_exclusoes)
    obra_exclusao_massadas = sum(int(item["massadas"]) for item in obra_exclusoes)

    monthly = []
    cursor = inicio_13
    for _ in range(13):
        next_month = date(cursor.year + 1, 1, 1) if cursor.month == 12 else date(cursor.year, cursor.month + 1, 1)
        rows_month = [row for row in rows_13 if row.get("data") >= cursor.isoformat() and row.get("data") < next_month.isoformat()]
        abrev, _nome = _mes_info(cursor.month)
        days_month = len(_days(rows_month))
        volume = _sum_volume(rows_month)
        source = "banco"
        if days_month < 10 and (cursor.year, cursor.month) in MONTHLY_REFERENCE_VOLUMES:
            volume = MONTHLY_REFERENCE_VOLUMES[(cursor.year, cursor.month)]
            source = "referencia_imagem"
        if (cursor.year, cursor.month) == (ano, mes) and obra_ajuste_volume:
            volume += obra_ajuste_volume
            source = f"{source}+ajuste_obra"
        if (cursor.year, cursor.month) == (ano, mes) and obra_exclusao_volume:
            volume = max(0.0, volume - obra_exclusao_volume)
            source = f"{source}-obra_excluida"
        monthly.append({
            "label": f"{abrev}/{_ano_suf(cursor.year)}",
            "volume": round(volume, 2),
            "source": source,
        })
        cursor = next_month

    daily_map = {}
    for row in rows_ref:
        d = date.fromisoformat(row["data"]) if isinstance(row.get("data"), str) else row.get("data")
        # O gr?fico di?rio mostra apenas dias ?teis com produ??o efetiva.
        if d and d.weekday() < 5:
            daily_map[d.day] = daily_map.get(d.day, 0.0) + float(row.get("qtd") or 0)
    daily = [
        {"dia": day, "volume": round(volume, 2)}
        for day, volume in sorted(daily_map.items())
        if volume > 0
    ]

    special = 0.0
    obra = 0.0
    normal = 0.0
    for row in rows_ref:
        formula = str(row.get("formula") or "").strip().lower()
        volume = float(row.get("qtd") or 0)
        if formula.startswith("7.1"):
            special += volume
        elif formula.startswith("7.2"):
            obra += volume
        else:
            normal += volume
    # O volume excluido ja veio somado como concreto normal na origem. Move-o
    # para "Obra", preservando a composicao bruta, mas nao o total gerencial.
    normal = max(0.0, normal - obra_exclusao_volume)
    obra += obra_ajuste_volume + obra_exclusao_volume
    mix_total = special + obra + normal
    total_ref = max(0.0, mix_total - obra_exclusao_volume)

    prev_year, prev_mes = _prev_month(ano, mes)
    prev_inicio, prev_fim = _month_bounds(prev_year, prev_mes)
    rows_prev = _fetch_massadas(prev_inicio, prev_fim)
    annual_inicio, annual_fim = _month_bounds(ano - 1, mes)
    rows_annual = _fetch_massadas(annual_inicio, annual_fim)
    global_rows = _fetch_massadas(date(ano - 1, 1, 1), inicio_ref)

    atual_m = _metrics(rows_ref)
    if obra_ajuste_volume or obra_exclusao_volume:
        atual_m["volume"] = round(
            max(0.0, atual_m["volume"] + obra_ajuste_volume - obra_exclusao_volume),
            2,
        )
        atual_m["media_diaria"] = round(atual_m["volume"] / atual_m["dias"], 2) if atual_m["dias"] else 0.0
        atual_m["produtividade"] = round(atual_m["volume"] / atual_m["horas"], 2) if atual_m["horas"] else 0.0
    anterior_m = _metrics(rows_prev)
    annual_m = _metrics(rows_annual)
    if annual_m["dias"] < 10 and (ano - 1, mes) in MONTHLY_REFERENCE_VOLUMES:
        annual_m["volume"] = round(MONTHLY_REFERENCE_VOLUMES[(ano - 1, mes)], 2)
    global_m = _metrics(global_rows, mensal_media=True, min_days=10)
    abrev_ref, nome_ref = _mes_info(mes)
    abrev_prev, nome_prev = _mes_info(prev_mes)

    global_title = f"MEDIA GLOBAL ({ano - 1} + JAN-{abrev_prev.upper()}/{_ano_suf(ano)})"
    current_title = f"{nome_ref.upper()} {ano}"
    previous_title = f"{nome_prev.upper()} {prev_year}"
    indicators_global = [
        _indicator("Horas Trabalhadas", "h", global_m["horas"], atual_m["horas"]),
        _indicator("Vol. Medio Diario", "m³", global_m["media_diaria"], atual_m["media_diaria"]),
        _indicator("Produtividade Media", "m³/h", global_m["produtividade"], atual_m["produtividade"]),
        _indicator("Mediana do Ciclo", "min", global_m["ciclo"], atual_m["ciclo"], True),
    ]
    indicators_previous = [
        _indicator("Horas Trabalhadas", "h", anterior_m["horas"], atual_m["horas"]),
        _indicator("Vol. Medio Diario", "m³", anterior_m["media_diaria"], atual_m["media_diaria"]),
        _indicator("Produtividade Media", "m³/h", anterior_m["produtividade"], atual_m["produtividade"]),
        _indicator("Mediana do Ciclo", "min", anterior_m["ciclo"], atual_m["ciclo"], True),
    ]
    return {
        "nome": "Fechamento",
        "unidade": "Campinas",
        "ano": ano,
        "mes": mes,
        "mes_nome": nome_ref,
        "monthly": monthly,
        "daily": daily,
        "averages": {
            "monthly": round(_avg([item["volume"] for item in monthly]), 2),
            "daily": atual_m["media_diaria"],
        },
        "volume_total": round(total_ref, 2),
        "paradas": paradas,
        "mix": {
            "normal": {"volume": round(normal, 2), "percent": round((normal / mix_total * 100) if mix_total else 0, 1)},
            "especial": {"volume": round(special, 2), "percent": round((special / mix_total * 100) if mix_total else 0, 1)},
            "obra": {
                "volume": round(obra, 2),
                "percent": round((obra / mix_total * 100) if mix_total else 0, 1),
                "massadas_ajuste": obra_ajuste_massadas + obra_exclusao_massadas,
                "volume_ajuste": round(obra_ajuste_volume + obra_exclusao_volume, 2),
                "volume_excluido": round(obra_exclusao_volume, 2),
                "ajustes": obra_ajustes + obra_exclusoes,
            },
        },
        "comparisons": {
            "month": {
                "left_label": f"{abrev_prev}/{_ano_suf(prev_year)}",
                "right_label": f"{abrev_ref}/{_ano_suf(ano)}",
                "left_volume": anterior_m["volume"],
                "right_volume": atual_m["volume"],
                "variation": _variation(atual_m["volume"], anterior_m["volume"]),
            },
            "annual": {
                "left_label": f"{abrev_ref}/{_ano_suf(ano - 1)}",
                "right_label": f"{abrev_ref}/{_ano_suf(ano)}",
                "left_volume": annual_m["volume"],
                "right_volume": atual_m["volume"],
                "variation": _variation(atual_m["volume"], annual_m["volume"]),
            },
            "days": {
                "left_label": f"{abrev_prev}",
                "right_label": f"{abrev_ref}",
                "left_days": anterior_m["dias"],
                "right_days": atual_m["dias"],
                "difference": atual_m["dias"] - anterior_m["dias"],
            },
        },
        "indicator_panels": {
            "global": {"left_title": global_title, "right_title": current_title, "rows": indicators_global},
            "previous": {"left_title": previous_title, "right_title": current_title, "rows": indicators_previous},
        },
        "source": "analise_mensal_MARCELO_FECHAMENTO.py",
        "atualizado_em": datetime.now().isoformat(),
    }


@router.get("/relatorios/fechamento-diario")
def fechamento_diario(
    data: Optional[str] = Query(None, description="Data do fechamento YYYY-MM-DD"),
):
    """Fechamento diario consolidado para compartilhamento gerencial."""
    try:
        data_ref = datetime.strptime(data, "%Y-%m-%d").date() if data else date.today()
    except ValueError:
        raise HTTPException(status_code=422, detail="Data invalida. Use YYYY-MM-DD")

    volume_erp = _fetch_volume_erp(data_ref)
    mapa_rows, fonte_mapa = _fetch_producao_unificado(data_ref)
    postes, fonte_postes = _fetch_postes_mapa(mapa_rows, fonte_mapa)
    resumo_setores, fonte_setores = _fetch_resumo_setores_mapa(mapa_rows, fonte_mapa)
    total_postes = sum(int(item["qtd"]) for item in postes) if mapa_rows else None
    postes_sem_peso = sum(item["postes_sem_peso"] for item in postes)
    total_m3_postes = (round(sum(_volume_poste_m3(row) for row in mapa_rows), 2)
                       if mapa_rows else None)
    total_m3 = volume_erp["m3"]
    funcionarios = _fetch_funcionarios(data_ref)
    qtd_funcionarios = funcionarios.get("quantidade")
    mao_de_obra_completa = funcionarios.get("status") == "ok"

    armacoes, fonte_armacoes = _fetch_armacoes(data_ref)
    armacoes_disponiveis = (
        fonte_armacoes.get("status") == "ok"
        or (fonte_armacoes.get("fallback") or {}).get("status") == "ok"
    )
    ocorrencias = _fetch_ocorrencias_erp(data_ref)

    controle = {
        "quantidade_funcionarios": qtd_funcionarios,
        "quantidade_ocorrencias": len(ocorrencias),
        "indice_m3_por_funcionario": round(total_m3 / qtd_funcionarios, 2) if qtd_funcionarios and mao_de_obra_completa else None,
        "total_postes_produzidos": total_postes,
        "postes_por_funcionario": round(total_postes / qtd_funcionarios, 2) if qtd_funcionarios and mao_de_obra_completa and total_postes is not None else None,
        "total_m3_concreto_produzido": round(total_m3, 2),
        "m3_estimado_postes": total_m3_postes,
        "postes_sem_peso": postes_sem_peso,
        "postes_peso_padrao": postes_sem_peso,
        "volume_padrao_m3": VOLUME_PADRAO_POSTE_M3,
        "peso_padrao_kg": PESO_PADRAO_POSTE_KG,
        "acrescimo_peso": PESO_ADICIONAL_POSTE,
        "m3_postes_identificados": round(
            sum(_volume_poste_m3(row) for row in mapa_rows
                if _produto_tem_peso(row)), 2),
        "massadas": volume_erp["massadas"],
    }

    return {
        "nome": "Fechamento Diario",
        "unidade": "Campinas",
        "data": data_ref.isoformat(),
        "titulo": f"PRODUCAO {data_ref.strftime('%d/%m/%y')}",
        "postes": postes,
        "resumo_setores": resumo_setores,
        "controle_estatistico": controle,
        "ocorrencias": ocorrencias,
        "estoque_armacoes": {
            "itens": armacoes,
            "total": sum(int(item.get("quantidade") or 0) for item in armacoes)
                     if armacoes_disponiveis else None,
        },
        "fontes": {
            "postes": fonte_postes,
            "volume": volume_erp,
            "setores": fonte_setores,
            "funcionarios": funcionarios,
            "ocorrencias": {"fonte": "erp.tbl_paradas_apontadas/tbl_nao_conformidades_apontadas", "status": "ok"},
            "armacoes": fonte_armacoes,
        },
        "atualizado_em": datetime.now().isoformat(),
    }


TRACO_CAMPOS = (
    "cimento1", "cimento2", "adicao_2",
    "agregado1", "agregado2", "agregado3", "agregado4", "agregado5",
    "aditivo1", "aditivo2", "agua",
)

TRACO_CORES = {
    "cimento1": "#1e3a5f",
    "cimento2": "#315980",
    "adicao_2": "#0f766e",
    "agregado1": "#f97316",
    "agregado2": "#38bdf8",
    "agregado3": "#10b981",
    "agregado4": "#ef4444",
    "agregado5": "#64748b",
    "aditivo1": "#f59e0b",
    "aditivo2": "#d97706",
    "agua": "#8b5cf6",
}


def _grupo_material_traco(campo: str, categoria: Optional[str]) -> str:
    """Grupo canônico usado pelos KPIs do slide de custo da carta."""
    cat = _normalize_upper(categoria)
    if campo == "agua" or "AGUA" in cat or "ÁGUA" in cat:
        return "agua"
    if campo.startswith("agregado") or cat in {"AREIA", "BRITA", "AGREGADO"}:
        return "agregado"
    if campo.startswith("aditivo") or "ADITIVO" in cat:
        return "aditivo"
    return "aglomerante"


def _traco_usage_condition() -> str:
    return """
        (
            lower(trim(m.formula)) = lower(trim(r.nome_traco))
            OR lower(trim(m.formula)) = lower(trim(r.nome))
            OR lower(trim(m.formula)) LIKE lower(trim(r.nome_traco)) || ' %%'
            OR lower(trim(m.formula)) LIKE lower(trim(r.nome_traco)) || '\\_%%' ESCAPE '\\'
            OR lower(trim(m.formula)) LIKE lower(trim(r.nome)) || ' %%'
            OR lower(trim(m.formula)) LIKE lower(trim(r.nome)) || '\\_%%' ESCAPE '\\'
        )
    """


@router.get("/relatorios/cartas-traco")
def cartas_traco(
    data_ini: Optional[str] = Query(None, description="Data início YYYY-MM-DD"),
    data_fim: Optional[str] = Query(None, description="Data fim YYYY-MM-DD"),
    q: Optional[str] = Query(None, description="Busca por nome do traço"),
    ativas: bool = Query(True, description="Mostrar somente cartas ativas"),
):
    """Consulta cartas de traço com custo calculado pelos materiais cadastrados."""
    if not data_ini:
        today = date.today()
        data_ini = today.replace(day=1).isoformat()
    if not data_fim:
        data_fim = date.today().isoformat()

    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT c.coluna, c.label, c.material_id, c.ativo, c.ordem,
               m.nome AS material_nome, m.codigo AS material_codigo,
               m.categoria AS material_categoria, m.unidade AS material_unidade,
               COALESCE(aj.valor_unitario, ult.valor_unitario_liquido, ult_cat.valor_unitario_liquido, 0) AS valor_unitario,
               COALESCE(ult.quantidade, ult_cat.quantidade, 0) AS qtd_entrada,
               COALESCE(ult.data, ult_cat.data) AS ultima_compra_data,
               COALESCE(aj.vigencia, ult.data, ult_cat.data) AS custo_vigencia,
               COALESCE(ult.material_id, ult_cat.material_id) AS custo_material_id,
               COALESCE(ult.material_nome, ult_cat.material_nome) AS custo_material_nome,
               COALESCE(ult.fornecedor, ult_cat.fornecedor) AS fornecedor_aplicado,
               COALESCE(forn.fornecedores, ARRAY[]::text[]) AS fornecedores,
               (ult.material_id IS NULL AND ult_cat.material_id IS NOT NULL) AS custo_por_categoria
        FROM tbl_config_traco_campo c
        LEFT JOIN tbl_est_materiais m ON m.id = c.material_id
        LEFT JOIN LATERAL (
            SELECT valor_unitario, vigencia FROM tbl_est_custos_ajustes a
            WHERE a.material_id = c.material_id AND a.vigencia <= CURRENT_DATE
            ORDER BY a.vigencia DESC, a.created_at DESC LIMIT 1
        ) aj ON true
        LEFT JOIN LATERAL (
            SELECT mv.material_id, em.nome AS material_nome,
                   mv.valor_unitario_liquido, mv.quantidade, mv.data, mv.fornecedor
            FROM tbl_est_movimentos mv
            JOIN tbl_est_materiais em ON em.id = mv.material_id
            WHERE mv.material_id = c.material_id
              AND mv.tipo = 'entrada'
              AND mv.valor_unitario_liquido IS NOT NULL
              AND mv.valor_unitario_liquido > 0
            ORDER BY mv.data DESC, mv.created_at DESC
            LIMIT 1
        ) ult ON true
        LEFT JOIN LATERAL (
            SELECT mv.material_id, em.nome AS material_nome,
                   mv.valor_unitario_liquido, mv.quantidade, mv.data, mv.fornecedor
            FROM tbl_est_movimentos mv
            JOIN tbl_est_materiais em ON em.id = mv.material_id
            WHERE c.material_id IS NOT NULL
              AND ult.material_id IS NULL
              AND em.categoria = m.categoria
              AND mv.tipo = 'entrada'
              AND mv.valor_unitario_liquido IS NOT NULL
              AND mv.valor_unitario_liquido > 0
            ORDER BY mv.data DESC, mv.created_at DESC
            LIMIT 1
        ) ult_cat ON true
        LEFT JOIN LATERAL (
            SELECT ARRAY_AGG(DISTINCT trim(mv.fornecedor) ORDER BY trim(mv.fornecedor)) AS fornecedores
            FROM tbl_est_movimentos mv
            WHERE mv.material_id = COALESCE(ult.material_id, ult_cat.material_id, c.material_id)
              AND mv.tipo = 'entrada'
              AND NULLIF(trim(COALESCE(mv.fornecedor, '')), '') IS NOT NULL
        ) forn ON true
        WHERE c.coluna = ANY(%s)
        ORDER BY c.ordem, c.coluna
    """, (list(TRACO_CAMPOS),))
    configs = {}
    for row in cur.fetchall():
        unit = _custo_unitario_relatorio(
            row["valor_unitario"],
            row["material_categoria"],
            row["material_unidade"],
            row["qtd_entrada"],
        )
        unidade_carta = _unidade_carta(
            row["coluna"],
            row["material_categoria"],
            row["material_unidade"],
        )
        configs[row["coluna"]] = {
            "coluna": row["coluna"],
            "label": row["label"] or row["coluna"],
            "material_id": row["material_id"],
            "material_nome": row["material_nome"],
            "material_codigo": row["material_codigo"],
            "material_categoria": row["material_categoria"],
            "material_unidade": row["material_unidade"],
            "material_unidade_carta": unidade_carta,
            "valor_unitario": round(unit, 6),
            "ultima_compra_data": _serialize_value(row["ultima_compra_data"]),
            "custo_vigencia": _serialize_value(row["custo_vigencia"]),
            "custo_material_id": row["custo_material_id"],
            "custo_material_nome": row["custo_material_nome"],
            "fornecedor_aplicado": row["fornecedor_aplicado"],
            "fornecedores": list(row["fornecedores"] or []),
            "custo_por_categoria": bool(row["custo_por_categoria"]),
            "ativo": row["ativo"],
        }

    where = ["1=1"]
    params = []
    if ativas:
        where.append("COALESCE(r.ativa, true) = true")
    if q:
        where.append("(r.nome_traco ILIKE %s OR r.nome ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])
    where_sql = " AND ".join(where)
    usage_condition = _traco_usage_condition()

    cur.execute(f"""
        SELECT r.*,
               COUNT(*) OVER (PARTITION BY r.revisao_grupo)::int AS revisao_total,
               (r.revisao_numero = MAX(r.revisao_numero) OVER (PARTITION BY r.revisao_grupo)) AS ultima_revisao,
               COALESCE(uso.usos_periodo, 0)::int AS usos_periodo,
               COALESCE(uso.volume_periodo, 0) AS volume_periodo,
               uso.ultimo_uso,
               qrcp.r24h_media, qrcp.r3_media, qrcp.r7_media, qrcp.r28_media
        FROM tbl_receitas r
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS usos_periodo,
                   COALESCE(SUM(m.qtd), 0) AS volume_periodo,
                   MAX(m.data) AS ultimo_uso
            FROM tbl_massadas m
            WHERE m.data >= %s
              AND m.data <= %s
              AND {usage_condition}
        ) uso ON true
        LEFT JOIN LATERAL (
            SELECT
                AVG(resistencia_mpa) FILTER (WHERE idade = 1)  AS r24h_media,
                AVG(resistencia_mpa) FILTER (WHERE idade = 3)  AS r3_media,
                AVG(resistencia_mpa) FILTER (WHERE idade = 7)  AS r7_media,
                AVG(resistencia_mpa) FILTER (WHERE idade = 28) AS r28_media
            FROM tbl_qrcp q
            WHERE q.resistencia_mpa IS NOT NULL
              AND (
                lower(trim(q.traco)) = lower(trim(r.nome_traco))
                OR lower(trim(q.traco)) = lower(trim(r.nome))
              )
        ) qrcp ON true
        WHERE {where_sql}
        ORDER BY r.nome_traco ASC, r.revisao_numero DESC
    """, [data_ini, data_fim] + params)

    cartas = []
    totais = {
        "cartas": 0,
        "usos_periodo": 0,
        "volume_periodo": 0.0,
        "custo_total": 0.0,
        "sem_mapeamento": 0,
        "sem_custo": 0,
    }
    for row in cur.fetchall():
        item = _serialize_row(row)
        materiais = []
        custo_total = 0.0
        sem_mapeamento = False
        sem_custo = False
        for campo in TRACO_CAMPOS:
            quantidade = float(item.get(campo) or 0)
            if quantidade == 0:
                continue
            cfg = configs.get(campo, {"label": campo})
            custo_unit = float(cfg.get("valor_unitario") or 0)
            custo = quantidade * custo_unit
            custo_total += custo
            if not cfg.get("material_id"):
                sem_mapeamento = True
            if cfg.get("material_id") and custo_unit <= 0:
                sem_custo = True
            materiais.append({
                "campo": campo,
                "label": cfg.get("label") or campo,
                "quantidade": round(quantidade, 4),
                "material_id": cfg.get("material_id"),
                "material_nome": cfg.get("material_nome"),
                "material_codigo": cfg.get("material_codigo"),
                "material_categoria": cfg.get("material_categoria"),
                "material_unidade": cfg.get("material_unidade"),
                "material_unidade_carta": cfg.get("material_unidade_carta") or _unidade_carta(campo, None, None),
                "custo_unitario": round(custo_unit, 6),
                "custo_total": round(custo, 2),
                "ultima_compra_data": cfg.get("ultima_compra_data"),
                "custo_vigencia": cfg.get("custo_vigencia"),
                "custo_material_id": cfg.get("custo_material_id"),
                "custo_material_nome": cfg.get("custo_material_nome"),
                "fornecedor_aplicado": cfg.get("fornecedor_aplicado"),
                "grupo": _grupo_material_traco(campo, cfg.get("material_categoria")),
                "cor": TRACO_CORES.get(campo, "#64748b"),
                "fornecedores": cfg.get("fornecedores") or [],
                "custo_por_categoria": cfg.get("custo_por_categoria"),
            })
        item["materiais"] = materiais
        vigencias = [m.get("custo_vigencia") for m in materiais if m.get("custo_vigencia")]
        item["data_vigencia_precos"] = max(vigencias) if vigencias else None
        item["custo_total"] = round(custo_total, 2)
        item["sem_mapeamento"] = sem_mapeamento
        item["sem_custo"] = sem_custo
        item["resistencias"] = {
            "r24h": item.get("r24h"),
            "r3": item.get("r3"),
            "r7": item.get("r7"),
            "r28": item.get("r28"),
            "ensaios": {
                "r24h": round(float(item["r24h_media"]), 2) if item.get("r24h_media") is not None else None,
                "r3": round(float(item["r3_media"]), 2) if item.get("r3_media") is not None else None,
                "r7": round(float(item["r7_media"]), 2) if item.get("r7_media") is not None else None,
                "r28": round(float(item["r28_media"]), 2) if item.get("r28_media") is not None else None,
            },
        }
        totais["cartas"] += 1
        totais["usos_periodo"] += int(item.get("usos_periodo") or 0)
        totais["volume_periodo"] += float(item.get("volume_periodo") or 0)
        totais["custo_total"] += custo_total
        if sem_mapeamento:
            totais["sem_mapeamento"] += 1
        if sem_custo:
            totais["sem_custo"] += 1
        cartas.append(item)

    cur.close()
    conn.close()

    totais["volume_periodo"] = round(totais["volume_periodo"], 3)
    totais["custo_total"] = round(totais["custo_total"], 2)
    return {
        "filtros": {
            "data_ini": data_ini,
            "data_fim": data_fim,
            "q": q,
            "ativas": ativas,
        },
        "resumo": totais,
        "mapeamentos": list(configs.values()),
        "cartas": cartas,
    }


# ── GET /api/relatorios/consumo ─────────────────────────
@router.get("/relatorios/consumo")
def consumo_materiais(
    data_ini: Optional[str] = Query(None, description="Data início YYYY-MM-DD"),
    data_fim: Optional[str] = Query(None, description="Data fim YYYY-MM-DD"),
    produto: Optional[str] = Query(None, description="Filtro por produto"),
    formula: Optional[str] = Query(None, description="Filtro por fórmula"),
):
    """
    Retorna consumo agregado de materiais por período.
    Categorias: Agregados (1-7), Cimentos/Silos (1-4), Água, Aditivos (1-3).
    """
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Defaults: hoje
    if not data_ini:
        data_ini = date.today().isoformat()
    if not data_fim:
        data_fim = data_ini

    # Filtros
    where = "WHERE data >= %s AND data <= %s"
    params = [data_ini, data_fim]

    if produto:
        where += " AND produto = %s"
        params.append(produto)
    if formula:
        where += " AND formula = %s"
        params.append(formula)

    # ── Totais por categoria ──
    cur.execute(f"""
        SELECT
            COUNT(*)                          AS massadas,
            COALESCE(SUM(qtd), 0)             AS volume_total,

            -- Agregados (kg)
            COALESCE(SUM(real_agregado1), 0)  AS agregado1,
            COALESCE(SUM(real_agregado2), 0)  AS agregado2,
            COALESCE(SUM(real_agregado3), 0)  AS agregado3,
            COALESCE(SUM(real_agregado4), 0)  AS agregado4,
            COALESCE(SUM(real_agregado5), 0)  AS agregado5,
            COALESCE(SUM(real_agregado6), 0)  AS agregado6,
            COALESCE(SUM(real_agregado7), 0)  AS agregado7,

            -- Programado agregados (kg)
            COALESCE(SUM(prog_agregado1), 0)  AS prog_agregado1,
            COALESCE(SUM(prog_agregado2), 0)  AS prog_agregado2,
            COALESCE(SUM(prog_agregado3), 0)  AS prog_agregado3,
            COALESCE(SUM(prog_agregado4), 0)  AS prog_agregado4,
            COALESCE(SUM(prog_agregado5), 0)  AS prog_agregado5,
            COALESCE(SUM(prog_agregado6), 0)  AS prog_agregado6,
            COALESCE(SUM(prog_agregado7), 0)  AS prog_agregado7,

            -- Cimento / silos (kg)
            COALESCE(SUM(real_silo1), 0)      AS silo1,
            COALESCE(SUM(real_silo2), 0)      AS silo2,
            COALESCE(SUM(real_silo3), 0)      AS silo3,
            COALESCE(SUM(real_silo4), 0)      AS silo4,

            COALESCE(SUM(prog_silo1), 0)      AS prog_silo1,
            COALESCE(SUM(prog_silo2), 0)      AS prog_silo2,
            COALESCE(SUM(prog_silo3), 0)      AS prog_silo3,
            COALESCE(SUM(prog_silo4), 0)      AS prog_silo4,

            -- Água (litros)
            COALESCE(SUM(real_agua1), 0)      AS agua,
            COALESCE(SUM(prog_agua1), 0)      AS prog_agua,

            -- Aditivos (kg)
            COALESCE(SUM(real_aditivo1), 0)   AS aditivo1,
            COALESCE(SUM(real_aditivo2), 0)   AS aditivo2,
            COALESCE(SUM(real_aditivo3), 0)   AS aditivo3,

            COALESCE(SUM(prog_aditivo1), 0)   AS prog_aditivo1,
            COALESCE(SUM(prog_aditivo2), 0)   AS prog_aditivo2,
            COALESCE(SUM(prog_aditivo3), 0)   AS prog_aditivo3
        FROM tbl_massadas
        {where}
    """, params)
    totals = cur.fetchone()
    totals_dict = dict(totals) if totals else {}

    # ── Mapeamento de Custos ──
    cur.execute("""
        SELECT c.coluna, c.fator_conversao, c.material_id, m.nome, m.categoria, m.unidade,
               COALESCE(ult.valor_unitario_liquido, 0) AS valor_unitario,
               COALESCE(ult.quantidade, 0) AS qtd_entrada
        FROM tbl_est_config_massada c
        JOIN tbl_est_materiais m ON m.id = c.material_id
        LEFT JOIN LATERAL (
                   SELECT mv.valor_unitario_liquido, mv.quantidade
                   FROM tbl_est_movimentos mv
                   WHERE mv.material_id = c.material_id 
                     AND mv.tipo = 'entrada' 
                     AND mv.valor_unitario_liquido IS NOT NULL 
                     AND mv.valor_unitario_liquido > 0
                   ORDER BY mv.data DESC, mv.created_at DESC 
                   LIMIT 1
        ) ult ON true
        WHERE c.ativo = true AND c.material_id IS NOT NULL
    """)
    mappings = {}
    for r in cur.fetchall():
        fator = 1.0
        mappings[r["coluna"]] = {
            "fator": fator,
            "custo_unitario": _custo_unitario_relatorio(
                r["valor_unitario"],
                r["categoria"],
                r["unidade"],
                r["qtd_entrada"],
            ),
            "material_id": r["material_id"],
            "nome": r["nome"],
            "categoria": r["categoria"],
            "unidade": r["unidade"],
        }

    custo_total = 0.0
    custo_programado_total = 0.0
    custos_detalhados = {}
    for col, cfg in mappings.items():
        map_key = col
        if col.startswith("real_silo"): map_key = _silo_map_key(col)
        elif col.startswith("real_agregado"): map_key = col.replace("real_agregado", "agregado")
        elif col == "real_agua1": map_key = "agua"
        elif col.startswith("real_aditivo"): map_key = col.replace("real_aditivo", "aditivo")
        
        qtd_raw = float(totals_dict.get(map_key) or 0)
        qtd_prog_raw = float(totals_dict.get(_prog_map_key(map_key)) or 0)
        qtd_convertida = _qtd_relatorio(qtd_raw, cfg["categoria"], cfg["unidade"]) * cfg["fator"]
        qtd_prog_convertida = _qtd_relatorio(qtd_prog_raw, cfg["categoria"], cfg["unidade"]) * cfg["fator"]
        custo_item = qtd_convertida * cfg["custo_unitario"]
        custo_prog_item = qtd_prog_convertida * cfg["custo_unitario"]
        custo_total += custo_item
        custo_programado_total += custo_prog_item
        custos_detalhados[map_key] = {
            "custo_unitario": cfg["custo_unitario"],
            "custo_programado": custo_prog_item,
            "custo_total": custo_item,
            "custo_diferenca": custo_item - custo_prog_item,
        }

    # ── Detalhamento por dia ──
    cur.execute(f"""
        SELECT
            data,
            COUNT(*)                          AS massadas,
            COALESCE(SUM(qtd), 0)             AS volume,
            COALESCE(SUM(real_agregado1), 0)  AS agregado1,
            COALESCE(SUM(real_agregado2), 0)  AS agregado2,
            COALESCE(SUM(real_agregado3), 0)  AS agregado3,
            COALESCE(SUM(real_agregado4), 0)  AS agregado4,
            COALESCE(SUM(real_agregado5), 0)  AS agregado5,
            COALESCE(SUM(real_agregado6), 0)  AS agregado6,
            COALESCE(SUM(real_agregado7), 0)  AS agregado7,
            COALESCE(SUM(prog_agregado1), 0)  AS prog_agregado1,
            COALESCE(SUM(prog_agregado2), 0)  AS prog_agregado2,
            COALESCE(SUM(prog_agregado3), 0)  AS prog_agregado3,
            COALESCE(SUM(prog_agregado4), 0)  AS prog_agregado4,
            COALESCE(SUM(prog_agregado5), 0)  AS prog_agregado5,
            COALESCE(SUM(prog_agregado6), 0)  AS prog_agregado6,
            COALESCE(SUM(prog_agregado7), 0)  AS prog_agregado7,
            COALESCE(SUM(real_silo1), 0)      AS silo1,
            COALESCE(SUM(real_silo2), 0)      AS silo2,
            COALESCE(SUM(real_silo3), 0)      AS silo3,
            COALESCE(SUM(real_silo4), 0)      AS silo4,
            COALESCE(SUM(prog_silo1), 0)      AS prog_silo1,
            COALESCE(SUM(prog_silo2), 0)      AS prog_silo2,
            COALESCE(SUM(prog_silo3), 0)      AS prog_silo3,
            COALESCE(SUM(prog_silo4), 0)      AS prog_silo4,
            COALESCE(SUM(real_agua1), 0)      AS agua,
            COALESCE(SUM(prog_agua1), 0)      AS prog_agua,
            COALESCE(SUM(real_aditivo1), 0)   AS aditivo1,
            COALESCE(SUM(real_aditivo2), 0)   AS aditivo2,
            COALESCE(SUM(real_aditivo3), 0)   AS aditivo3,
            COALESCE(SUM(prog_aditivo1), 0)   AS prog_aditivo1,
            COALESCE(SUM(prog_aditivo2), 0)   AS prog_aditivo2,
            COALESCE(SUM(prog_aditivo3), 0)   AS prog_aditivo3
        FROM tbl_massadas
        {where}
        GROUP BY data
        ORDER BY data
    """, params)
    daily = cur.fetchall()
    daily_list = [dict(r) for r in daily]
    for r in daily_list:
        c_dia = 0.0
        c_prog_dia = 0.0
        for col, cfg in mappings.items():
            map_key = col
            if col.startswith("real_silo"): map_key = _silo_map_key(col)
            elif col.startswith("real_agregado"): map_key = col.replace("real_agregado", "agregado")
            elif col == "real_agua1": map_key = "agua"
            elif col.startswith("real_aditivo"): map_key = col.replace("real_aditivo", "aditivo")
            
            qtd_raw = float(r.get(map_key) or 0)
            qtd_prog_raw = float(r.get(_prog_map_key(map_key)) or 0)
            c_dia += (_qtd_relatorio(qtd_raw, cfg["categoria"], cfg["unidade"]) * cfg["fator"]) * cfg["custo_unitario"]
            c_prog_dia += (_qtd_relatorio(qtd_prog_raw, cfg["categoria"], cfg["unidade"]) * cfg["fator"]) * cfg["custo_unitario"]
        r["custo_programado"] = round(c_prog_dia, 2)
        r["custo_total"] = round(c_dia, 2)
        r["custo_diferenca"] = round(c_dia - c_prog_dia, 2)

    # ── Detalhamento por produto ──
    cur.execute(f"""
        SELECT
            produto,
            COUNT(*)                          AS massadas,
            COALESCE(SUM(qtd), 0)             AS volume,
            COALESCE(SUM(real_agregado1), 0)  AS agregado1,
            COALESCE(SUM(real_agregado2), 0)  AS agregado2,
            COALESCE(SUM(real_agregado3), 0)  AS agregado3,
            COALESCE(SUM(real_agregado4), 0)  AS agregado4,
            COALESCE(SUM(real_agregado5), 0)  AS agregado5,
            COALESCE(SUM(real_agregado6), 0)  AS agregado6,
            COALESCE(SUM(real_agregado7), 0)  AS agregado7,
            COALESCE(SUM(prog_agregado1), 0)  AS prog_agregado1,
            COALESCE(SUM(prog_agregado2), 0)  AS prog_agregado2,
            COALESCE(SUM(prog_agregado3), 0)  AS prog_agregado3,
            COALESCE(SUM(prog_agregado4), 0)  AS prog_agregado4,
            COALESCE(SUM(prog_agregado5), 0)  AS prog_agregado5,
            COALESCE(SUM(prog_agregado6), 0)  AS prog_agregado6,
            COALESCE(SUM(prog_agregado7), 0)  AS prog_agregado7,
            COALESCE(SUM(real_silo1), 0)      AS silo1,
            COALESCE(SUM(real_silo2), 0)      AS silo2,
            COALESCE(SUM(real_silo3), 0)      AS silo3,
            COALESCE(SUM(real_silo4), 0)      AS silo4,
            COALESCE(SUM(prog_silo1), 0)      AS prog_silo1,
            COALESCE(SUM(prog_silo2), 0)      AS prog_silo2,
            COALESCE(SUM(prog_silo3), 0)      AS prog_silo3,
            COALESCE(SUM(prog_silo4), 0)      AS prog_silo4,
            COALESCE(SUM(real_agua1), 0)      AS agua,
            COALESCE(SUM(prog_agua1), 0)      AS prog_agua,
            COALESCE(SUM(real_aditivo1), 0)   AS aditivo1,
            COALESCE(SUM(real_aditivo2), 0)   AS aditivo2,
            COALESCE(SUM(real_aditivo3), 0)   AS aditivo3,
            COALESCE(SUM(prog_aditivo1), 0)   AS prog_aditivo1,
            COALESCE(SUM(prog_aditivo2), 0)   AS prog_aditivo2,
            COALESCE(SUM(prog_aditivo3), 0)   AS prog_aditivo3
        FROM tbl_massadas
        {where}
        GROUP BY produto
        ORDER BY produto
    """, params)
    by_product = cur.fetchall()
    by_product_list = [dict(r) for r in by_product]
    for r in by_product_list:
        c_prod = 0.0
        c_prog_prod = 0.0
        for col, cfg in mappings.items():
            map_key = col
            if col.startswith("real_silo"): map_key = _silo_map_key(col)
            elif col.startswith("real_agregado"): map_key = col.replace("real_agregado", "agregado")
            elif col == "real_agua1": map_key = "agua"
            elif col.startswith("real_aditivo"): map_key = col.replace("real_aditivo", "aditivo")
            
            qtd_raw = float(r.get(map_key) or 0)
            qtd_prog_raw = float(r.get(_prog_map_key(map_key)) or 0)
            c_prod += (_qtd_relatorio(qtd_raw, cfg["categoria"], cfg["unidade"]) * cfg["fator"]) * cfg["custo_unitario"]
            c_prog_prod += (_qtd_relatorio(qtd_prog_raw, cfg["categoria"], cfg["unidade"]) * cfg["fator"]) * cfg["custo_unitario"]
        r["custo_programado"] = round(c_prog_prod, 2)
        r["custo_total"] = round(c_prod, 2)
        r["custo_diferenca"] = round(c_prod - c_prog_prod, 2)

    # ── Filtros disponíveis ──
    cur.execute("SELECT DISTINCT produto FROM tbl_massadas WHERE produto IS NOT NULL ORDER BY produto")
    produtos = [r["produto"] for r in cur.fetchall()]

    cur.execute("SELECT DISTINCT formula FROM tbl_massadas WHERE formula IS NOT NULL ORDER BY formula")
    formulas = [r["formula"] for r in cur.fetchall()]

    cur.close()
    conn.close()

    # Serializar
    def _serialize(row):
        d = {}
        for k, v in row.items():
            if isinstance(v, Decimal):
                d[k] = float(v)
            elif isinstance(v, (date, datetime)):
                d[k] = v.isoformat()
            else:
                d[k] = v
        return d

    totals_serialized = _serialize(totals_dict)
    totals_serialized["custo_programado"] = round(custo_programado_total, 2)
    totals_serialized["custo_total"] = round(custo_total, 2)
    totals_serialized["custo_diferenca"] = round(custo_total - custo_programado_total, 2)
    totals_serialized["custos_detalhados"] = custos_detalhados

    return {
        "filtros": {
            "data_ini": data_ini,
            "data_fim": data_fim,
            "produto": produto,
            "formula": formula,
            "produtos_disponiveis": produtos,
            "formulas_disponiveis": formulas,
        },
        "resumo": totals_serialized,
        "por_dia": [_serialize(r) for r in daily_list],
        "por_produto": [_serialize(r) for r in by_product_list],
    }


# ── GET /api/relatorios/producao-periodo ─────────────────
@router.get("/relatorios/producao-periodo")
def producao_periodo(
    data_ini: str = Query(..., description="Data início YYYY-MM-DD"),
    data_fim: str = Query(..., description="Data fim YYYY-MM-DD"),
    produto: Optional[str] = Query(None, description="Filtro por produto"),
):
    """
    Retorna todas as massadas individuais de um período para o dashboard
    de Produção por Período (análise de ciclos, gaps, produtividade).
    """
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    where = "WHERE data >= %s AND data <= %s"
    params: list = [data_ini, data_fim]
    if produto:
        where += " AND produto = %s"
        params.append(produto)

    cur.execute(f"""
        SELECT
            id, data, hora, hora_inicio, hora_final, hora_descarga,
            qtd, produto, formula, misturador, numero_serie, temperatura
        FROM tbl_massadas
        {where}
        ORDER BY data, hora
    """, params)
    rows = cur.fetchall()

    cur.execute(
        "SELECT DISTINCT produto FROM tbl_massadas WHERE produto IS NOT NULL ORDER BY produto"
    )
    produtos = [r["produto"] for r in cur.fetchall()]

    cur.close()
    conn.close()

    def _s(row):
        d = {}
        for k, v in row.items():
            if isinstance(v, Decimal):
                d[k] = float(v)
            elif isinstance(v, (date, datetime)):
                d[k] = v.isoformat()
            elif hasattr(v, "total_seconds"):  # timedelta → TIME column
                total = int(v.total_seconds())
                h, m, s = total // 3600, (total % 3600) // 60, total % 60
                d[k] = f"{h:02d}:{m:02d}:{s:02d}"
            else:
                d[k] = v
        return d

    return {
        "filtros": {
            "data_ini": data_ini,
            "data_fim": data_fim,
            "produto": produto,
            "produtos_disponiveis": produtos,
        },
        "massadas": [_s(r) for r in rows],
    }


