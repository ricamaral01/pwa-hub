"""
Servico de leitura da producao realizada via Supabase.
Mantem o contrato historico usado pela tela de producao.
"""
import time
import re
import unicodedata
from collections import defaultdict
from datetime import date
from typing import List, Dict, Optional, Tuple

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings

CACHE_TTL = 300  # 5 minutos

_cache_rows: Dict[Tuple[Optional[str], Optional[str], Optional[str]], List[dict]] = {}
_cache_ts: float = 0
_cache_circular_programacao: Dict[Tuple[Optional[str], Optional[str]], List[dict]] = {}
_cache_circular_programacao_ts: float = 0


def _fetch_supabase_rows(
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    setor_nome: Optional[str] = None,
) -> List[dict]:
    global _cache_rows, _cache_ts
    now = time.time()
    cache_key = (data_inicio, data_fim, setor_nome)
    if cache_key in _cache_rows and now - _cache_ts < CACHE_TTL:
        return _cache_rows[cache_key]

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise RuntimeError("SUPABASE_URL e SUPABASE_ANON_KEY devem estar configurados")

    base_url = settings.SUPABASE_URL.rstrip("/")
    table = settings.SUPABASE_PRODUCAO_TABLE.strip() or "producao"
    url = f"{base_url}/rest/v1/{table}"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
    }
    params = {
        "select": "data_fabricacao,setor,forma,modelo,status",
        "status": "eq.LIBERADO",
        "order": "data_fabricacao.asc,setor.asc,modelo.asc,forma.asc",
    }
    if data_inicio:
        params["data_fabricacao"] = f"gte.{data_inicio}"
    if data_fim:
        params["data_fabricacao"] = f"lte.{data_fim}"
    if data_inicio and data_fim:
        params["data_fabricacao"] = [f"gte.{data_inicio}", f"lte.{data_fim}"]
    if setor_nome:
        params["setor"] = f"eq.{setor_nome}"

    rows: List[dict] = []
    limit = 1000
    offset = 0
    with httpx.Client(timeout=20) as client:
        while True:
            page_params = dict(params)
            page_params["limit"] = str(limit)
            page_params["offset"] = str(offset)
            resp = client.get(url, headers=headers, params=page_params)
            resp.raise_for_status()
            page = resp.json()
            if not isinstance(page, list):
                raise RuntimeError("Resposta inesperada do Supabase")
            rows.extend(page)
            if len(page) < limit:
                break
            offset += limit

    _cache_rows = {cache_key: rows}
    _cache_ts = now
    return rows


def _fetch_programacao_circular_rows(
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
) -> List[dict]:
    global _cache_circular_programacao, _cache_circular_programacao_ts
    now = time.time()
    cache_key = (data_inicio, data_fim)
    if cache_key in _cache_circular_programacao and now - _cache_circular_programacao_ts < CACHE_TTL:
        return _cache_circular_programacao[cache_key]

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return []

    url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/producao_diaria"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
    }
    params = {
        "select": "data_producao,forma,tipo_poste,quantidade,setor",
        "setor": "eq.3",
        "order": "data_producao.asc,forma.asc",
    }
    if data_inicio:
        params["data_producao"] = f"gte.{data_inicio}"
    if data_fim:
        params["data_producao"] = f"lte.{data_fim}"
    if data_inicio and data_fim:
        params["data_producao"] = [f"gte.{data_inicio}", f"lte.{data_fim}"]

    rows: List[dict] = []
    try:
        with httpx.Client(timeout=20) as client:
            resp = client.get(url, headers=headers, params=params)
            if resp.status_code == 404:
                return []
            resp.raise_for_status()
            page = resp.json()
            rows = page if isinstance(page, list) else []
    except httpx.HTTPStatusError as exc:
        body = exc.response.text
        if exc.response.status_code == 404 or "PGRST205" in body:
            rows = []
        else:
            raise

    _cache_circular_programacao = {cache_key: rows}
    _cache_circular_programacao_ts = now
    return rows


# Fallback legado para S1/S2 caso nao haja mapeamento por forma fisica.
# Use codigos/nome de produto em vez de IDs, pois IDs variam entre cargas.
MODELO_PRODUTO_LEGADO: Dict[tuple, str] = {
    # Setor 1
    ("setor 1", "1 cx vl"):             "4764",
    ("setor 1", "1 cx vr"):             "4031",
    ("setor 1", "1 cx vr - 600"):       "939",
    ("setor 1", "2 cxs vl"):            "4765",
    ("setor 1", "2 cxs vr"):            "4032",
    ("setor 1", "3 cxs vr"):            "946",
    ("setor 1", "4 cxs vr"):            "948",
    ("setor 1", "ec. 1 cx vr"):         "931",
    ("setor 1", "ec. 2 cxs vr"):        "932",
    ("setor 1", "ec. 3 cxs"):           "933",
    ("setor 1", "sub. 100 amp."):       "949",
    ("setor 1", "sub. 100-amp"):        "949",
    ("setor 1", "sub. 100-amp-e"):      "4848",
    ("setor 1", "sub. 200-amp c/ tc"):  "5017",
    # Setor 2
    ("setor 2", "1 cx vl"):             "935",
    ("setor 2", "1 cx vr"):             "938",
    ("setor 2", "2 cxs vl"):            "942",
    ("setor 2", "2 cxs vr"):            "943",
    ("setor 2", "600-vl"):              "937",
    ("setor 2", "600-vr"):              "940",
    ("setor 2", "7,5x300 c/ lente"):    "934",
    ("setor 2", "pl cpfl"):             "934",
    ("setor 2", "ple elektro"):         "15351",
}

def _norm_text(value: Optional[str]) -> str:
    s = (value or "").replace('×', 'X').strip().lower()
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", s)


# O apontamento varia espaços e pontuação: "Ec. 1CX VR" e "Ec. 1 CX VR".
MODELO_PRODUTO_LEGADO_NORMALIZADO = {
    (setor, _norm_text(modelo)): codigo
    for (setor, modelo), codigo in MODELO_PRODUTO_LEGADO.items()
}


def _resolve_produto(
    setor_id: Optional[int],
    candidatos: List[str],
    produtos_por_setor: Dict[int, List[object]],
) -> Optional[object]:
    if not setor_id:
        return None

    norm_cands = [_norm_text(c) for c in candidatos if c]
    if not norm_cands:
        return None

    produtos = produtos_por_setor.get(setor_id, [])

    for c in norm_cands:
        for p in produtos:
            p_nome = _norm_text(getattr(p, "nome", ""))
            p_cod = _norm_text(getattr(p, "codigo", ""))
            if c == p_nome or c == p_cod:
                return p

    for p in produtos:
        p_nome = _norm_text(getattr(p, "nome", ""))
        for c in norm_cands:
            if not c:
                continue
            if c in p_nome or p_nome in c:
                return p
    return None


def get_producao_sheets(
    db: Session,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    setor_id: Optional[int] = None,
) -> List[dict]:
    """
    Le a tabela Supabase de producao, filtra status=LIBERADO,
    cruza formas com produtos do BD e consolida por data+setor+produto.
    """
    from app.models.produto import Produto
    from app.models.producao import Programacao, ProgramacaoAlex
    from app.models.setor import Setor
    from app.models.mapeamento_forma import MapeamentoForma
    from app.models.mapeamento_forma_poste import MapeamentoFormaPoste

    # Carrega produtos por id e por setor
    produtos = db.query(Produto).all()
    produtos_map: Dict[int, Produto] = {p.id: p for p in produtos}
    produtos_por_setor: Dict[int, List[Produto]] = defaultdict(list)
    for p in produtos:
        if p.setor_id:
            produtos_por_setor[p.setor_id].append(p)

    # Carrega setores indexados por nome_lower
    setores_map: Dict[str, Setor] = {
        s.nome.lower(): s for s in db.query(Setor).all()
    }
    setor_nome_filtro = None
    if setor_id is not None:
        setor_filtro = db.query(Setor).filter(Setor.id == setor_id).first()
        if not setor_filtro:
            return []
        setor_nome_filtro = setor_filtro.nome

    # Mapeamento forma -> tipo/poste/volume (S1/S2).
    # Para producao realizada, le tambem registros inativos: eles representam
    # codigos fisicos antigos que nao devem contar como formas disponiveis,
    # mas ainda aparecem nos apontamentos historicos/operacionais.
    mapa_formas: Dict[tuple, MapeamentoForma] = {}
    for m in db.query(MapeamentoForma).all():
        mapa_formas[(m.setor_id, _norm_text(m.codigo_forma))] = m

    # Mapeamento forma+poste (S3/S4)
    mapa_forma_poste: Dict[tuple, MapeamentoFormaPoste] = {}
    for m in db.query(MapeamentoFormaPoste).filter(MapeamentoFormaPoste.ativo == True).all():
        key = (m.setor_id, _norm_text(m.codigo_forma), _norm_text(m.poste_circular))
        mapa_forma_poste[key] = m

    rows = _fetch_supabase_rows(data_inicio, data_fim, setor_nome_filtro)
    programacao_por_forma_especial: Dict[tuple, str] = {}
    alocacao_por_forma_especial: Dict[tuple, str] = {}
    setores_alocacao = {3, 4} if setor_id is None else ({setor_id} & {3, 4})
    if 3 in setores_alocacao:
        for prog_s3 in _fetch_programacao_circular_rows(data_inicio, data_fim):
            data_prog = (prog_s3.get("data_producao") or "")[:10]
            forma_prog = (prog_s3.get("forma") or "").strip()
            tipo_prog = (prog_s3.get("tipo_poste") or "").strip()
            if data_prog and forma_prog and tipo_prog:
                programacao_por_forma_especial[(3, data_prog, _norm_text(forma_prog))] = tipo_prog

    if setores_alocacao:
        q_prog_especial = db.query(Programacao).filter(
            Programacao.setor_id.in_(list(setores_alocacao)),
            Programacao.codigo_forma.isnot(None),
            Programacao.codigo_forma != "",
        )
        if data_inicio:
            q_prog_especial = q_prog_especial.filter(Programacao.data >= date.fromisoformat(data_inicio))
        if data_fim:
            q_prog_especial = q_prog_especial.filter(Programacao.data <= date.fromisoformat(data_fim))

        programacoes_especiais = q_prog_especial.order_by(Programacao.data, Programacao.setor_id, Programacao.id).all()
        for prog in programacoes_especiais:
            produto = produtos_map.get(prog.produto_id)
            if prog.setor_id and prog.data and prog.codigo_forma and produto:
                key = (int(prog.setor_id), prog.data.isoformat(), _norm_text(prog.codigo_forma))
                programacao_por_forma_especial.setdefault(key, produto.nome)

        formas_por_setor_poste: Dict[tuple, set] = defaultdict(set)
        for mfp in mapa_forma_poste.values():
            sid_mfp = int(mfp.setor_id or 0)
            if sid_mfp in setores_alocacao and mfp.ativo:
                formas_por_setor_poste[(sid_mfp, _norm_text(mfp.poste_circular))].add(mfp.codigo_forma)

        programacao_por_setor_data: Dict[tuple, dict] = defaultdict(lambda: {
            "ordem": [],
            "quantidades": defaultdict(int),
        })
        for prog in programacoes_especiais:
            produto = produtos_map.get(prog.produto_id)
            if not prog.data or not produto or not prog.setor_id:
                continue
            data_key = prog.data.isoformat()
            poste_key = _norm_text(produto.nome)
            grupo = programacao_por_setor_data[(int(prog.setor_id), data_key)]
            if poste_key not in grupo["quantidades"]:
                grupo["ordem"].append(poste_key)
            grupo["quantidades"][poste_key] += int(prog.quantidade_programada or 0)

        q_alex = db.query(ProgramacaoAlex).filter(
            ProgramacaoAlex.setor_id.in_(list(setores_alocacao)),
            ProgramacaoAlex.producao_diaria > 0,
        )
        if data_inicio:
            q_alex = q_alex.filter(ProgramacaoAlex.data >= date.fromisoformat(data_inicio))
        if data_fim:
            q_alex = q_alex.filter(ProgramacaoAlex.data <= date.fromisoformat(data_fim))

        for prog in q_alex.order_by(ProgramacaoAlex.data, ProgramacaoAlex.setor_id, ProgramacaoAlex.id).all():
            produto = produtos_map.get(prog.produto_id)
            if not prog.data or not produto or not prog.setor_id:
                continue
            data_key = prog.data.isoformat()
            poste_key = _norm_text(produto.nome)
            grupo = programacao_por_setor_data[(int(prog.setor_id), data_key)]
            if poste_key not in grupo["quantidades"]:
                grupo["ordem"].append(poste_key)
            grupo["quantidades"][poste_key] += int(prog.producao_diaria or 0)

        for (sid_alloc, data_key), grupo in programacao_por_setor_data.items():
            formas_usadas = set()
            for poste_key in grupo["ordem"]:
                alocados = 0
                for forma in sorted(formas_por_setor_poste.get((sid_alloc, poste_key), [])):
                    if alocados >= int(grupo["quantidades"][poste_key] or 0):
                        break
                    forma_key = _norm_text(forma)
                    if forma_key in formas_usadas:
                        continue
                    formas_usadas.add(forma_key)
                    produto = _resolve_produto(sid_alloc, [poste_key], produtos_por_setor)
                    if produto:
                        alocacao_por_forma_especial.setdefault((sid_alloc, data_key, forma_key), produto.nome)
                    alocados += 1

    # Agrupa por data+setor+modelo+forma para preservar regra por forma.
    grupos: Dict[tuple, int] = defaultdict(int)
    for row in rows:
        if (row.get("status") or "").strip().upper() != "LIBERADO":
            continue
        data = (row.get("data_fabricacao") or "")[:10]
        if not data:
            continue
        if data_inicio and data < data_inicio:
            continue
        if data_fim and data > data_fim:
            continue
        setor_nome = (row.get("setor") or "").strip()
        # Filtro por setor_id se solicitado
        if setor_id is not None:
            s = setores_map.get(setor_nome.lower())
            if not s or s.id != setor_id:
                continue
        modelo = (row.get("modelo") or "").strip()
        codigo_forma = (row.get("forma") or "").strip()
        setor_row = setores_map.get(setor_nome.lower())
        if setor_row and setor_row.id in (3, 4) and _norm_text(modelo) in {"", "sc", "dt"}:
            modelo = programacao_por_forma_especial.get(
                (setor_row.id, data, _norm_text(codigo_forma)),
                alocacao_por_forma_especial.get((setor_row.id, data, _norm_text(codigo_forma)), modelo),
            )
        grupos[(data, setor_nome, modelo, codigo_forma)] += 1

    consolidados: Dict[tuple, dict] = {}
    for (data, setor_nome, modelo, codigo_forma), qtd in sorted(grupos.items()):
        setor = setores_map.get(setor_nome.lower())
        sid = setor.id if setor else None

        mapeado = False
        volume_unit = None
        ref_tipo = None
        ref_poste = None

        # 1) Tabela mapeamento_formas (S1/S2)
        if sid:
            mf = mapa_formas.get((sid, _norm_text(codigo_forma)))
            if mf:
                mapeado = True
                ref_tipo = mf.tipo_forma
                ref_poste = mf.poste
                volume_unit = float(mf.volume_m3) if mf.volume_m3 is not None else None

        # 2) Tabela mapeamento_forma_postes (S3/S4)
        if sid and not mapeado:
            mfp = mapa_forma_poste.get((sid, _norm_text(codigo_forma), _norm_text(modelo)))
            if mfp:
                mapeado = True
                ref_poste = mfp.poste_circular
                volume_unit = float(mfp.volume_m3) if mfp.volume_m3 is not None else None

        # 3) Resolve produto por nomes da referencia
        produto = _resolve_produto(
            sid,
            [ref_poste or "", ref_tipo or "", modelo],
            produtos_por_setor,
        )

        # 4) Fallback legado (S1/S2) por modelo da planilha
        if not produto:
            map_key = (setor_nome.lower(), modelo.lower())
            produto_ref = MODELO_PRODUTO_LEGADO.get(map_key) or MODELO_PRODUTO_LEGADO_NORMALIZADO.get(
                (setor_nome.lower(), _norm_text(modelo))
            )
            produto = _resolve_produto(sid, [produto_ref or "", modelo], produtos_por_setor)

        if volume_unit is None and produto and produto.volume is not None:
            volume_unit = float(produto.volume)

        volume = round((volume_unit or 0.0) * qtd, 3)
        produto_nome = produto.nome if produto else (ref_poste or ref_tipo or modelo)
        produto_codigo = produto.codigo if produto else None
        produto_key = produto.id if produto else _norm_text(produto_nome)
        key = (data, sid, setor_nome, produto_key)

        if key not in consolidados:
            consolidados[key] = {
                "data": data,
                "setor_id": sid,
                "setor_nome": setor_nome,
                "modelo_sheet": modelo,
                "codigo_forma": "",
                "produto_id": produto.id if produto else None,
                "produto_nome": produto_nome,
                "produto_codigo": produto_codigo,
                "quantidade_programada": 0,
                "volume_m3_programado": 0.0,
                "quantidade": 0,
                "volume_m3": 0.0,
                "mapeado": True,
                "volume_unitario_m3": round(volume_unit, 3) if volume_unit is not None else None,
            }

        item = consolidados[key]
        item["quantidade"] += qtd
        item["volume_m3"] = round(item["volume_m3"] + volume, 3)
        item["mapeado"] = item["mapeado"] and (mapeado or (produto is not None))
        if item["modelo_sheet"] != modelo:
            item["modelo_sheet"] = ""
        if item["volume_unitario_m3"] != (round(volume_unit, 3) if volume_unit is not None else None):
            item["volume_unitario_m3"] = None

    data_inicio_dt = date.fromisoformat(data_inicio) if data_inicio else None
    data_fim_dt = date.fromisoformat(data_fim) if data_fim else None
    q_prog = db.query(Programacao)
    if data_inicio_dt:
        q_prog = q_prog.filter(Programacao.data >= data_inicio_dt)
    if data_fim_dt:
        q_prog = q_prog.filter(Programacao.data <= data_fim_dt)
    if setor_id is not None:
        q_prog = q_prog.filter(Programacao.setor_id == setor_id)

    setores_por_id = {s.id: s for s in setores_map.values()}
    for prog in q_prog.all():
        produto = produtos_map.get(prog.produto_id)
        setor = setores_por_id.get(prog.setor_id)
        data = prog.data.isoformat()
        sid = prog.setor_id
        setor_nome = setor.nome if setor else ""
        produto_nome = produto.nome if produto else "Sem produto"
        produto_codigo = produto.codigo if produto else None
        produto_key = produto.id if produto else f"programado-{prog.produto_id or 'sem-produto'}"
        key = (data, sid, setor_nome, produto_key)

        if key not in consolidados:
            consolidados[key] = {
                "data": data,
                "setor_id": sid,
                "setor_nome": setor_nome,
                "modelo_sheet": "",
                "codigo_forma": "",
                "produto_id": produto.id if produto else prog.produto_id,
                "produto_nome": produto_nome,
                "produto_codigo": produto_codigo,
                "quantidade_programada": 0,
                "volume_m3_programado": 0.0,
                "quantidade": 0,
                "volume_m3": 0.0,
                "mapeado": produto is not None,
                "volume_unitario_m3": float(produto.volume) if produto and produto.volume is not None else None,
            }

        item = consolidados[key]
        item["quantidade_programada"] += prog.quantidade_programada or 0
        item["volume_m3_programado"] = round(
            item["volume_m3_programado"] + float(prog.volume_m3_programado or 0),
            3,
        )

    return sorted(
        consolidados.values(),
        key=lambda r: (
            r["data"],
            r["setor_nome"],
            _norm_text(r.get("produto_codigo") or ""),
            _norm_text(r.get("produto_nome") or ""),
        ),
    )


def get_formas_circulares_s3(
    db: Session,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
) -> List[dict]:
    from app.models.produto import Produto
    from app.models.producao import Programacao

    realizados = _fetch_supabase_rows(data_inicio, data_fim, "Setor 3")
    data_inicio_dt = date.fromisoformat(data_inicio) if data_inicio else None
    data_fim_dt = date.fromisoformat(data_fim) if data_fim else None

    por_forma: Dict[tuple, dict] = {}

    q_prog = db.query(Programacao, Produto).join(
        Produto,
        Produto.id == Programacao.produto_id,
    ).filter(
        Programacao.setor_id == 3,
        Programacao.codigo_forma.isnot(None),
        Programacao.codigo_forma != "",
    )
    if data_inicio_dt:
        q_prog = q_prog.filter(Programacao.data >= data_inicio_dt)
    if data_fim_dt:
        q_prog = q_prog.filter(Programacao.data <= data_fim_dt)

    for prog, produto in q_prog.order_by(Programacao.data, Programacao.codigo_forma).all():
        data = prog.data.isoformat()
        forma = (prog.codigo_forma or "").strip().upper()
        if not forma:
            continue
        key = (data, forma)
        item = por_forma.setdefault(key, {
            "data": data,
            "forma": forma,
            "tipo_programado": produto.nome if produto else None,
            "programado": 0,
            "tipo_realizado": None,
            "realizado": 0,
            "status_realizado": None,
        })
        item["tipo_programado"] = produto.nome if produto else item.get("tipo_programado")
        item["programado"] = int(item.get("programado") or 0) + int(prog.quantidade_programada or 0)

    for row in realizados:
        if (row.get("status") or "").strip().upper() != "LIBERADO":
            continue
        data = (row.get("data_fabricacao") or "")[:10]
        forma = (row.get("forma") or "").strip()
        if not data or not forma:
            continue
        key = (data, forma.upper())
        item = por_forma.setdefault(
            key,
            {
                "data": data,
                "forma": forma.upper(),
                "tipo_programado": None,
                "programado": 0,
                "tipo_realizado": None,
                "realizado": 0,
                "status_realizado": None,
            },
        )
        item["tipo_realizado"] = (row.get("modelo") or "").strip()
        item["realizado"] += 1
        item["status_realizado"] = (row.get("status") or "").strip()

    for item in por_forma.values():
        programado = item["programado"] > 0
        realizado = item["realizado"] > 0
        mesmo_tipo = _norm_text(item.get("tipo_programado")) == _norm_text(item.get("tipo_realizado"))
        if programado and realizado and (not item.get("tipo_programado") or mesmo_tipo):
            item["situacao"] = "ok"
            item["situacao_label"] = "Enchida"
        elif programado and realizado:
            item["situacao"] = "divergente"
            item["situacao_label"] = "Divergente"
        elif programado:
            item["situacao"] = "pendente"
            item["situacao_label"] = "Pendente"
        else:
            item["situacao"] = "extra"
            item["situacao_label"] = "Sem programação"

    def forma_sort_key(forma: str):
        return [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", forma or "")]

    return sorted(por_forma.values(), key=lambda r: (r["data"], forma_sort_key(r["forma"])))
