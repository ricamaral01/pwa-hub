from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.produto import Produto
from app.models.producao import MaoDeObra
from app.models.setor import Setor
from app.schemas.dashboard import (
    AndamentoItem,
    DashboardResponse,
    GrupoKPI,
    PosteKPI,
    SetorKPI,
    VolumeTotalResponse,
)
from app.services import sheets_service


GRUPOS = {
    "12": {"nome": "Setores 1 e 2", "setores": [1, 2]},
    "34": {"nome": "Setores 3 e 4", "setores": [3, 4]},
}


def _dec(value) -> Decimal:
    return Decimal(str(value or 0))


def _eficiencia(realizado, programado) -> float:
    programado = float(programado or 0)
    if programado <= 0:
        return 0.0
    return round((float(realizado or 0) / programado) * 100, 2)


def _div(numerador, denominador) -> float:
    denominador = int(denominador or 0)
    if denominador <= 0:
        return 0.0
    return round(float(numerador or 0) / denominador, 3)


def _grupo_por_setor(setor_id: Optional[int]) -> Optional[str]:
    if setor_id in (1, 2):
        return "12"
    if setor_id in (3, 4):
        return "34"
    return None


def _periodo(data_inicio: Optional[date], data_fim: Optional[date]):
    hoje = date.today()
    return data_inicio or hoje, data_fim or hoje


def _mdo_por_grupo(db: Session, data_inicio: date, data_fim: date):
    rows = db.query(MaoDeObra).filter(
        MaoDeObra.data >= data_inicio,
        MaoDeObra.data <= data_fim,
    ).all()

    por_grupo = defaultdict(int)
    total = 0
    for row in rows:
        qtd = int(row.quantidade_pessoas or 0)
        total += qtd
        grupo = None
        atividade = getattr(row, "atividade", None)
        if atividade and getattr(atividade, "grupo_setor", None) in GRUPOS:
            grupo = atividade.grupo_setor
        if not grupo:
            grupo = _grupo_por_setor(row.setor_id)
        if grupo:
            por_grupo[grupo] += qtd

    return por_grupo, total


def get_dashboard(
    db: Session,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
) -> DashboardResponse:
    data_inicio, data_fim = _periodo(data_inicio, data_fim)
    di = data_inicio.isoformat()
    df = data_fim.isoformat()

    rows = sheets_service.get_producao_sheets(db, di, df, None)
    produtos = {p.id: p for p in db.query(Produto).all()}
    setores = db.query(Setor).filter(Setor.ativo == True).order_by(Setor.id).all()

    por_setor = {
        s.id: {
            "setor_id": s.id,
            "setor_nome": s.nome,
            "qtd_programada": 0,
            "qtd_realizada": 0,
            "vol_programado_m3": Decimal("0"),
            "vol_realizado_m3": Decimal("0"),
            "peso_programado_kg": Decimal("0"),
            "peso_realizado_kg": Decimal("0"),
        }
        for s in setores
    }
    por_poste = {}
    andamento = []

    total_prog_m3 = Decimal("0")
    total_real_m3 = Decimal("0")
    total_prog_kg = Decimal("0")
    total_real_kg = Decimal("0")

    for row in rows:
        sid = row.get("setor_id")
        produto = produtos.get(row.get("produto_id"))
        peso_unit = _dec(produto.peso if produto else 0)
        qtd_prog = int(row.get("quantidade_programada") or 0)
        qtd_real = int(row.get("quantidade") or 0)
        vol_prog = _dec(row.get("volume_m3_programado"))
        vol_real = _dec(row.get("volume_m3"))
        peso_prog = peso_unit * qtd_prog
        peso_real = peso_unit * qtd_real

        total_prog_m3 += vol_prog
        total_real_m3 += vol_real
        total_prog_kg += peso_prog
        total_real_kg += peso_real

        if sid not in por_setor:
            por_setor[sid] = {
                "setor_id": sid or 0,
                "setor_nome": row.get("setor_nome") or "Sem setor",
                "qtd_programada": 0,
                "qtd_realizada": 0,
                "vol_programado_m3": Decimal("0"),
                "vol_realizado_m3": Decimal("0"),
                "peso_programado_kg": Decimal("0"),
                "peso_realizado_kg": Decimal("0"),
            }
        setor = por_setor[sid]
        setor["qtd_programada"] += qtd_prog
        setor["qtd_realizada"] += qtd_real
        setor["vol_programado_m3"] += vol_prog
        setor["vol_realizado_m3"] += vol_real
        setor["peso_programado_kg"] += peso_prog
        setor["peso_realizado_kg"] += peso_real

        poste_key = row.get("produto_id") or row.get("produto_nome") or "Sem produto"
        poste = por_poste.setdefault(poste_key, {
            "tipo_poste": row.get("produto_nome") or "Sem produto",
            "qtd_programada": 0,
            "qtd_realizada": 0,
            "vol_programado_m3": Decimal("0"),
            "vol_realizado_m3": Decimal("0"),
            "peso_programado_kg": Decimal("0"),
            "peso_realizado_kg": Decimal("0"),
        })
        poste["qtd_programada"] += qtd_prog
        poste["qtd_realizada"] += qtd_real
        poste["vol_programado_m3"] += vol_prog
        poste["vol_realizado_m3"] += vol_real
        poste["peso_programado_kg"] += peso_prog
        poste["peso_realizado_kg"] += peso_real

        if qtd_prog > 0 or qtd_real > 0:
            andamento.append(AndamentoItem(
                data=row.get("data") or "",
                setor_id=sid,
                setor_nome=row.get("setor_nome") or "Sem setor",
                produto_nome=row.get("produto_nome") or "Sem produto",
                produto_codigo=row.get("produto_codigo"),
                qtd_programada=qtd_prog,
                qtd_realizada=qtd_real,
                faltam=max(qtd_prog - qtd_real, 0),
                vol_programado_m3=vol_prog,
                vol_realizado_m3=vol_real,
                eficiencia_pct=_eficiencia(qtd_real, qtd_prog),
            ))

    mdo_grupo, total_pessoas = _mdo_por_grupo(db, data_inicio, data_fim)
    mdo_hoje = db.query(func.coalesce(func.sum(MaoDeObra.quantidade_pessoas), 0)).filter(
        MaoDeObra.data == date.today()
    ).scalar()

    setores_out = []
    for item in sorted(por_setor.values(), key=lambda s: s["setor_id"] or 99):
        setores_out.append(SetorKPI(
            **item,
            eficiencia_pct=_eficiencia(item["vol_realizado_m3"], item["vol_programado_m3"]),
        ))

    grupos_out = []
    for gid, cfg in GRUPOS.items():
        soma = {
            "qtd_programada": 0,
            "qtd_realizada": 0,
            "vol_programado_m3": Decimal("0"),
            "vol_realizado_m3": Decimal("0"),
            "peso_programado_kg": Decimal("0"),
            "peso_realizado_kg": Decimal("0"),
        }
        for sid in cfg["setores"]:
            setor = por_setor.get(sid)
            if not setor:
                continue
            for key in soma:
                soma[key] += setor[key]
        pessoas = int(mdo_grupo.get(gid, 0))
        grupos_out.append(GrupoKPI(
            grupo_id=gid,
            grupo_nome=cfg["nome"],
            setores=cfg["setores"],
            pessoas=pessoas,
            eficiencia_pct=_eficiencia(soma["vol_realizado_m3"], soma["vol_programado_m3"]),
            m3_por_homem=_div(soma["vol_realizado_m3"], pessoas),
            peso_por_homem=_div(soma["peso_realizado_kg"], pessoas),
            **soma,
        ))

    postes_out = []
    for item in sorted(por_poste.values(), key=lambda p: p["tipo_poste"]):
        postes_out.append(PosteKPI(
            **item,
            eficiencia_pct=_eficiencia(item["vol_realizado_m3"], item["vol_programado_m3"]),
        ))

    andamento.sort(key=lambda r: (r.data, r.setor_nome, r.produto_nome), reverse=True)

    return DashboardResponse(
        total_programado_m3=total_prog_m3,
        total_realizado_m3=total_real_m3,
        total_programado_kg=total_prog_kg,
        total_realizado_kg=total_real_kg,
        eficiencia_geral_pct=_eficiencia(total_real_m3, total_prog_m3),
        total_pessoas_hoje=int(mdo_hoje or 0),
        total_pessoas=int(total_pessoas),
        m3_por_homem=_div(total_real_m3, total_pessoas),
        peso_por_homem=_div(total_real_kg, total_pessoas),
        por_grupo=grupos_out,
        por_setor=setores_out,
        por_poste=postes_out,
        producao_andamento=andamento[:80],
    )


def get_volume_total(
    db: Session,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
) -> VolumeTotalResponse:
    data_inicio, data_fim = _periodo(data_inicio, data_fim)
    data = get_dashboard(db, data_inicio, data_fim)
    return VolumeTotalResponse(
        volume_programado_m3=data.total_programado_m3,
        volume_realizado_m3=data.total_realizado_m3,
        data_inicio=str(data_inicio),
        data_fim=str(data_fim),
    )
