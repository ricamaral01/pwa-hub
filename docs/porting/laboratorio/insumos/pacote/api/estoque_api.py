"""
Laboratório · Estoque de insumos — substitui /concretrack/api/estoque/* do ERP antigo.

Montagem no serviço do Laboratório (server/app.py):
    from .estoque_api import router as estoque_router
    app.include_router(estoque_router)
    # no startup: nf_leitura.retomar_pendentes(app.state.postes_session)

Rotas do ERP → rotas novas (prefixo /api/laboratorio/estoque):
    GET  /estoque/materiais                 → GET  /materiais
    GET  /estoque/saldo                     → GET  /saldo
    GET  /estoque/silos/nivel               → GET  /silos/nivel
    GET  /estoque/movimentos                → GET  /movimentos
    POST /estoque/movimentos (entrada)      → POST /entradas
    POST /estoque/movimentos/rateados       → POST /entradas (com "rateio")
    PATCH/DELETE /estoque/movimentos/{id}   → PUT /entradas/{id} · PUT /entradas/grupo/{grupo} · POST /movimentos/{id}/anular
    POST /estoque/movimentos (acerto)       → POST /contagens  ou  POST /acertos
    GET/PUT /estoque/config-massada         → GET /posicoes · PUT /posicoes/{id}  (com vigência)
    POST /estoque/sync-consumo-producao     → POST /consumo/gerar   (só depois do corte do gerador)
    GET  /estoque/consumo-producao          → GET  /consumo/calculado
    GET  /estoque/consumo-agregados/analise → GET  /consumo/diario · GET /previsao/cimento
    GET  /estoque/relatorio                 → GET  /relatorio
    /estoque/nota-fiscal/*                  → /nota-fiscal/leituras/*
"""
from __future__ import annotations

import datetime as dt
import uuid
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.orm import Session

from . import nf_leitura
from .deps import current_user, db, fabrica_sessao, papel
from .estoque_calculos import Parcela, SiloNivel, dias_uteis, dividir_valor, plano_ressuprimento, validar_rateio

router = APIRouter(prefix="/api/laboratorio/estoque", tags=["estoque"])
LEITURA = Depends(current_user)
LANCAR = papel("tecnico", "engenheiro", "admin")     # entradas, contagens (ajustar à permissão por tela do Laboratório)
CONFIGURAR = papel("engenheiro", "admin")            # mapeamento de posições, anulações, geração de consumo


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ----------------------------------------------------------------- utilidades
def _rows(s: Session, sql: str, **p) -> list[dict]:
    return [dict(r._mapping) for r in s.execute(text(sql), p)]


def _cfg(s: Session, chave: str) -> str:
    return s.execute(text("SELECT valor FROM insumos.config WHERE chave = :k"), {"k": chave}).scalar_one()


def _exige_escrita_liberada(s: Session) -> None:
    if _cfg(s, "estoque_fonte_oficial") != "vps_nova":
        raise HTTPException(409, "Modo paralelo: o estoque oficial ainda é o ERP antigo. Lance por lá.")


def _gravar(s: Session, user, fn):
    try:
        s.execute(text("SELECT set_config('app.usuario', :u, true)"), {"u": user.username})
        r = fn(s)
        s.commit()
        return r
    except HTTPException:
        s.rollback()
        raise
    except IntegrityError as e:
        s.rollback()
        raise HTTPException(409, str(e.orig).split("\n")[0]) from e
    except DBAPIError as e:
        s.rollback()
        raise HTTPException(422, str(e.orig).split("\n")[0]) from e


# ----------------------------------------------------------------- consultas
@router.get("/materiais", dependencies=[LEITURA])
def materiais(apenas_ativos: bool = True, s: Session = Depends(db)):
    return _rows(s, """SELECT id, codigo, nome, grupo, un_estoque, usa_silo, ativo
                         FROM insumos.material WHERE (NOT :a OR ativo) ORDER BY ordem, nome""", a=apenas_ativos)


@router.get("/saldo", dependencies=[LEITURA])
def saldo(data: dt.date | None = None, unidade_id: int | None = None, s: Session = Depends(db)):
    return _rows(s, """
        SELECT s.unidade_id, s.material_id, m.codigo, m.nome AS material, m.grupo, m.un_estoque,
               round(sum(s.saldo_contabil), 4) AS saldo_contabil, round(sum(s.saldo_fisico), 4) AS saldo_disponivel,
               max(s.base_data) AS ultima_contagem,
               json_agg(json_build_object('silo_id', s.silo_id, 'contabil', s.saldo_contabil, 'fisico', s.saldo_fisico))
                 FILTER (WHERE s.silo_id IS NOT NULL) AS silos
          FROM estoque.saldo_em(COALESCE(CAST(:d AS date), current_date)) s
          JOIN insumos.material m ON m.id = s.material_id
         WHERE CAST(:u AS int) IS NULL OR s.unidade_id = :u
         GROUP BY s.unidade_id, s.material_id, m.codigo, m.nome, m.grupo, m.un_estoque, m.ordem
         ORDER BY m.ordem, m.nome""", d=data, u=unidade_id)


@router.get("/silos/nivel", dependencies=[LEITURA])
def silos_nivel(unidade_id: int | None = None, s: Session = Depends(db)):
    return _rows(s, """SELECT * FROM estoque.nivel_silo WHERE CAST(:u AS int) IS NULL OR unidade_id = :u
                        ORDER BY unidade_id, numero""", u=unidade_id)


@router.get("/movimentos", dependencies=[LEITURA])
def movimentos(tipo: Literal["entrada", "consumo", "acerto", "contagem"] | None = None,
               material_id: int | None = None, de: dt.date | None = None, ate: dt.date | None = None,
               incluir_anulados: bool = False, limit: int = Query(200, le=2000), offset: int = 0,
               s: Session = Depends(db)):
    return _rows(s, """
        SELECT mv.*, m.nome AS material, m.un_estoque, si.nome AS silo, f.nome AS fornecedor,
               nf.numero AS nf_numero, nf.chave_acesso
          FROM estoque.movimento mv
          JOIN insumos.material m ON m.id = mv.material_id
          LEFT JOIN estoque.silo si ON si.id = mv.silo_id
          LEFT JOIN insumos.fornecedor f ON f.id = mv.fornecedor_id
          LEFT JOIN estoque.nota_fiscal nf ON nf.id = mv.nota_fiscal_id
         WHERE (CAST(:t AS text) IS NULL OR mv.tipo = :t)
           AND (CAST(:m AS int) IS NULL OR mv.material_id = :m)
           AND (CAST(:de AS date) IS NULL OR mv.data >= :de)
           AND (CAST(:ate AS date) IS NULL OR mv.data <= :ate)
           AND (:anul OR NOT mv.anulado)
         ORDER BY mv.data DESC, mv.id DESC LIMIT :lim OFFSET :off""",
                 t=tipo, m=material_id, de=de, ate=ate, anul=incluir_anulados, lim=limit, off=offset)


@router.get("/relatorio", dependencies=[LEITURA])
def relatorio(de: dt.date, ate: dt.date, unidade_id: int | None = None, s: Session = Depends(db)):
    """Entradas, consumos e acertos por material no período (aba 'Movimentos do Estoque')."""
    return _rows(s, """
        SELECT m.id AS material_id, m.nome AS material, m.un_estoque,
               coalesce(sum(mv.quantidade) FILTER (WHERE mv.tipo = 'entrada'), 0) AS entradas,
               coalesce(sum(mv.quantidade) FILTER (WHERE mv.tipo = 'consumo'), 0) AS consumos,
               coalesce(sum(mv.quantidade) FILTER (WHERE mv.tipo = 'acerto'), 0) AS acertos,
               count(*) FILTER (WHERE mv.tipo = 'contagem') AS contagens,
               round(sum(mv.custo_unit_liquido * mv.quantidade) FILTER (WHERE mv.tipo = 'entrada'), 2) AS valor_entradas
          FROM estoque.movimento mv JOIN insumos.material m ON m.id = mv.material_id
         WHERE NOT mv.anulado AND mv.data BETWEEN :de AND :ate
           AND (CAST(:u AS int) IS NULL OR mv.unidade_id = :u)
         GROUP BY m.id, m.nome, m.un_estoque, m.ordem ORDER BY m.ordem, m.nome""", de=de, ate=ate, u=unidade_id)


# ----------------------------------------------------------------- entradas
class RateioIn(Strict):
    silo_id: int
    quantidade: Decimal = Field(gt=0)


class NotaIn(Strict):
    chave_acesso: str | None = Field(default=None, pattern=r"^\d{44}$")
    numero: str | None = Field(default=None, max_length=20)
    serie: str | None = Field(default=None, max_length=5)
    emitente_cnpj: str | None = Field(default=None, pattern=r"^\d{14}$")
    data_emissao: dt.date | None = None
    valor_total: Decimal | None = None


class EntradaIn(Strict):
    unidade_id: int
    material_id: int
    data: dt.date
    quantidade: Decimal = Field(gt=0)
    silo_id: int | None = None
    rateio: list[RateioIn] | None = None
    fornecedor_id: int | None = None
    referencia: str | None = Field(default=None, max_length=120)
    valor_nota: Decimal | None = Field(default=None, ge=0)
    icms_pct: Decimal = Field(default=Decimal(0), ge=0, le=100)
    frete_unit: Decimal = Field(default=Decimal(0), ge=0)
    icms_frete_pct: Decimal = Field(default=Decimal(0), ge=0, le=100)
    observacao: str | None = Field(default=None, max_length=1000)
    nota: NotaIn | None = None
    leitura_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _regras(self):
        if self.data > dt.date.today() + dt.timedelta(days=1):
            raise ValueError("Data de entrada no futuro.")
        if self.rateio is not None:
            if self.silo_id is not None:
                raise ValueError("Informe silo OU rateio, não os dois.")
            erros = validar_rateio(self.quantidade, [Parcela(r.silo_id, r.quantidade) for r in self.rateio])
            if erros:
                raise ValueError(" ".join(erros))
        return self


def _registrar_entrada(s: Session, e: EntradaIn, por: str, grupo: uuid.UUID | None = None) -> dict:
    nf_id = None
    if e.nota and (e.nota.chave_acesso or e.nota.numero):
        nf_id = s.execute(text("""
            INSERT INTO estoque.nota_fiscal (unidade_id, chave_acesso, numero, serie, emitente_cnpj, fornecedor_id,
                                             data_emissao, valor_total, leitura_id, anexo_caminho, criado_por)
            VALUES (:u, :chave, :num, :serie, :cnpj, :forn, :emi, :vt, :lid,
                    (SELECT anexo_caminho FROM estoque.nf_leitura WHERE id = :lid), :por)
            RETURNING id"""), {"u": e.unidade_id, "chave": e.nota.chave_acesso, "num": e.nota.numero,
                               "serie": e.nota.serie, "cnpj": e.nota.emitente_cnpj, "forn": e.fornecedor_id,
                               "emi": e.nota.data_emissao, "vt": e.nota.valor_total,
                               "lid": str(e.leitura_id) if e.leitura_id else None, "por": por}).scalar_one()
    parcelas = [Parcela(r.silo_id, r.quantidade) for r in e.rateio] if e.rateio else [Parcela(e.silo_id, e.quantidade)]
    valores = (dividir_valor(e.valor_nota, parcelas) if (e.valor_nota is not None and e.rateio)
               else [e.valor_nota] * len(parcelas))
    grupo = grupo or (uuid.uuid4() if e.rateio else None)
    ids = []
    for p, v in zip(parcelas, valores):
        ids.append(s.execute(text("""
            INSERT INTO estoque.movimento (unidade_id, material_id, tipo, data, quantidade, silo_id, origem, grupo_id,
                                           nota_fiscal_id, fornecedor_id, referencia, valor_nota, icms_pct, frete_unit,
                                           icms_frete_pct, observacao, criado_por)
            VALUES (:u, :m, 'entrada', :d, :q, :silo, :origem, :g, :nf, :forn, :ref, :v, :icms, :frete, :icmsf, :obs, :por)
            RETURNING id"""), {"u": e.unidade_id, "m": e.material_id, "d": e.data, "q": p.quantidade, "silo": p.silo_id,
                               "origem": "nf_ia" if e.leitura_id else "manual", "g": str(grupo) if grupo else None,
                               "nf": nf_id, "forn": e.fornecedor_id, "ref": e.referencia, "v": v, "icms": e.icms_pct,
                               "frete": e.frete_unit, "icmsf": e.icms_frete_pct, "obs": e.observacao, "por": por}).scalar_one())
    if e.leitura_id:
        n = s.execute(text("""UPDATE estoque.nf_leitura SET status = 'confirmada'
                               WHERE id = :id AND status = 'concluida'"""), {"id": str(e.leitura_id)}).rowcount
        if not n:
            raise HTTPException(409, "A leitura da NF não está concluída ou já foi usada.")
    custo = s.execute(text("SELECT custo_unit_liquido FROM estoque.movimento WHERE id = :id"), {"id": ids[0]}).scalar_one()
    return {"ids": ids, "grupo_id": str(grupo) if grupo else None, "nota_fiscal_id": nf_id, "custo_unit_liquido": custo}


@router.post("/entradas", status_code=201)
def criar_entrada(body: EntradaIn, s: Session = Depends(db), user=Depends(LANCAR)):
    _exige_escrita_liberada(s)
    return _gravar(s, user, lambda s: _registrar_entrada(s, body, user.username))


def _anular(s: Session, where: str, params: dict, por: str, motivo: str) -> int:
    return s.execute(text(f"""UPDATE estoque.movimento SET anulado = true, anulado_por = :por, anulado_em = now(),
                                     motivo_anulacao = :mot WHERE NOT anulado AND {where}"""),
                     params | {"por": por, "mot": motivo}).rowcount


@router.put("/entradas/grupo/{grupo_id}")
def substituir_rateio(grupo_id: uuid.UUID, body: EntradaIn, s: Session = Depends(db), user=Depends(LANCAR)):
    """Corrige uma entrada rateada numa transação só (o ERP exigia excluir e lançar de novo)."""
    _exige_escrita_liberada(s)

    def _fn(s):
        nf = s.execute(text("""SELECT DISTINCT nota_fiscal_id FROM estoque.movimento
                                WHERE grupo_id = :g AND NOT anulado"""), {"g": str(grupo_id)}).scalars().all()
        if not _anular(s, "grupo_id = :g AND tipo = 'entrada'", {"g": str(grupo_id)}, user.username, "Rateio substituído"):
            raise HTTPException(404, "Grupo não encontrado.")
        s.execute(text("DELETE FROM estoque.nota_fiscal WHERE id = ANY(:ids) AND NOT EXISTS "
                       "(SELECT 1 FROM estoque.movimento m WHERE m.nota_fiscal_id = nota_fiscal.id AND NOT m.anulado)"),
                  {"ids": [i for i in nf if i]})
        return _registrar_entrada(s, body.model_copy(update={"leitura_id": None}), user.username)
    return _gravar(s, user, _fn)


class AnularIn(Strict):
    motivo: str = Field(min_length=5, max_length=300)


@router.post("/movimentos/{mov_id}/anular")
def anular(mov_id: int, body: AnularIn, s: Session = Depends(db), user=Depends(CONFIGURAR)):
    """Substitui o DELETE do ERP: o lançamento sai do saldo mas fica no histórico com quem e por quê."""
    _exige_escrita_liberada(s)

    def _fn(s):
        g = s.execute(text("SELECT grupo_id, origem FROM estoque.movimento WHERE id = :id"), {"id": mov_id}).first()
        if g is None:
            raise HTTPException(404, "Movimento não encontrado.")
        if g.origem == "producao_massadas":
            raise HTTPException(409, "Baixa automática: corrija o mapeamento e reprocesse o período.")
        n = (_anular(s, "grupo_id = :g", {"g": str(g.grupo_id)}, user.username, body.motivo) if g.grupo_id
             else _anular(s, "id = :id", {"id": mov_id}, user.username, body.motivo))
        return {"anulados": n}
    return _gravar(s, user, _fn)


# ----------------------------------------------------------------- contagem e acerto
class ContagemIn(Strict):
    unidade_id: int
    material_id: int
    silo_id: int | None = None
    data: dt.date
    quantidade_contada: Decimal = Field(ge=0)
    observacao: str | None = Field(default=None, max_length=500)


@router.post("/contagens", status_code=201)
def contagem(body: ContagemIn, s: Session = Depends(db), user=Depends(LANCAR)):
    """Contagem física: vira a nova base do livro (fim do dia contado). Devolve a diferença para o saldo anterior."""
    _exige_escrita_liberada(s)

    def _fn(s):
        antes = s.execute(text("""
            SELECT coalesce(sum(saldo_contabil), 0) FROM estoque.saldo_em(:d)
             WHERE unidade_id = :u AND (CASE WHEN CAST(:silo AS int) IS NULL THEN material_id = :m AND silo_id IS NULL
                                             ELSE silo_id = :silo END)"""),
            {"d": body.data, "u": body.unidade_id, "m": body.material_id, "silo": body.silo_id}).scalar_one()
        mid = s.execute(text("""
            INSERT INTO estoque.movimento (unidade_id, material_id, tipo, data, quantidade, silo_id, observacao, criado_por)
            VALUES (:u, :m, 'contagem', :d, :q, :silo, :obs, :por) RETURNING id"""),
            {"u": body.unidade_id, "m": body.material_id, "d": body.data, "q": body.quantidade_contada,
             "silo": body.silo_id, "obs": body.observacao, "por": user.username}).scalar_one()
        return {"id": mid, "saldo_antes": antes, "contado": body.quantidade_contada,
                "diferenca": body.quantidade_contada - Decimal(antes)}
    return _gravar(s, user, _fn)


class AcertoIn(Strict):
    unidade_id: int
    material_id: int
    silo_id: int | None = None
    data: dt.date
    diferenca: Decimal
    observacao: str = Field(min_length=3, max_length=500)


@router.post("/acertos", status_code=201)
def acerto(body: AcertoIn, s: Session = Depends(db), user=Depends(LANCAR)):
    _exige_escrita_liberada(s)
    if body.diferenca == 0:
        raise HTTPException(422, "Diferença zero não gera acerto.")
    return _gravar(s, user, lambda s: {"id": s.execute(text("""
        INSERT INTO estoque.movimento (unidade_id, material_id, tipo, data, quantidade, silo_id, observacao, criado_por)
        VALUES (:u, :m, 'acerto', :d, :q, :silo, :obs, :por) RETURNING id"""),
        {"u": body.unidade_id, "m": body.material_id, "d": body.data, "q": body.diferenca, "silo": body.silo_id,
         "obs": body.observacao, "por": user.username}).scalar_one()})


# ----------------------------------------------------------------- mapeamento das posições do misturador
@router.get("/posicoes", dependencies=[LEITURA])
def posicoes(data: dt.date | None = None, s: Session = Depends(db)):
    return _rows(s, """
        SELECT p.*, m.nome AS material, si.nome AS silo,
               coalesce(p.material_id, estoque.material_no_silo(p.silo_id, COALESCE(CAST(:d AS date), current_date))) AS material_efetivo
          FROM estoque.posicao_misturador p
          LEFT JOIN insumos.material m ON m.id = p.material_id
          LEFT JOIN estoque.silo si ON si.id = p.silo_id
         WHERE COALESCE(CAST(:d AS date), current_date) BETWEEN p.desde AND coalesce(p.ate, 'infinity'::date)
         ORDER BY p.unidade_id, p.ordem, p.coluna""", d=data)


class PosicaoIn(Strict):
    label: str | None = None
    material_id: int | None = None
    silo_id: int | None = None
    fator: Decimal = Field(gt=0)
    ativo: bool = True
    a_partir_de: dt.date


@router.put("/posicoes/{posicao_id}")
def alterar_posicao(posicao_id: int, body: PosicaoIn, s: Session = Depends(db), user=Depends(CONFIGURAR)):
    """Nova vigência: fecha a configuração atual na véspera e abre outra. O passado não muda."""
    def _fn(s):
        atual = s.execute(text("SELECT * FROM estoque.posicao_misturador WHERE id = :id"), {"id": posicao_id}).mappings().first()
        if atual is None:
            raise HTTPException(404, "Posição não encontrada.")
        if body.a_partir_de <= atual["desde"]:
            raise HTTPException(422, "A nova vigência deve começar depois da atual.")
        s.execute(text("UPDATE estoque.posicao_misturador SET ate = :ate WHERE id = :id"),
                  {"ate": body.a_partir_de - dt.timedelta(days=1), "id": posicao_id})
        novo = s.execute(text("""
            INSERT INTO estoque.posicao_misturador (unidade_id, coluna, label, material_id, silo_id, fator, ativo, ordem, desde)
            VALUES (:u, :c, :l, :m, :silo, :f, :a, :o, :d) RETURNING id"""),
            {"u": atual["unidade_id"], "c": atual["coluna"], "l": body.label or atual["label"], "m": body.material_id,
             "silo": body.silo_id, "f": body.fator, "a": body.ativo, "o": atual["ordem"], "d": body.a_partir_de}).scalar_one()
        return {"id": novo}
    return _gravar(s, user, _fn)


# ----------------------------------------------------------------- consumo da produção
@router.get("/consumo/calculado", dependencies=[LEITURA])
def consumo_calculado(de: dt.date, ate: dt.date, s: Session = Depends(db)):
    """Consumo que as massadas geram, comparado com as baixas gravadas (paridade com o ERP)."""
    return _rows(s, """
        WITH c AS (SELECT * FROM estoque.consumo_calculado(:de, :ate)),
             g AS (SELECT unidade_id, data, material_id, sum(quantidade) q FROM estoque.movimento
                    WHERE tipo = 'consumo' AND NOT anulado AND data BETWEEN :de AND :ate GROUP BY 1, 2, 3),
             cc AS (SELECT unidade_id, data, material_id, sum(quantidade) q FROM c GROUP BY 1, 2, 3)
        SELECT coalesce(cc.unidade_id, g.unidade_id) AS unidade_id, coalesce(cc.data, g.data) AS data,
               coalesce(cc.material_id, g.material_id) AS material_id, m.nome AS material,
               cc.q AS calculado, g.q AS gravado, round(coalesce(cc.q, 0) - coalesce(g.q, 0), 4) AS diferenca
          FROM cc FULL JOIN g USING (unidade_id, data, material_id)
          JOIN insumos.material m ON m.id = coalesce(cc.material_id, g.material_id)
         ORDER BY 2, 4""", de=de, ate=ate)


class PeriodoIn(Strict):
    de: dt.date
    ate: dt.date


@router.post("/consumo/gerar")
def gerar_consumo(body: PeriodoIn, s: Session = Depends(db), user=Depends(CONFIGURAR)):
    if body.ate < body.de or (body.ate - body.de).days > 62:
        raise HTTPException(422, "Período inválido (máximo de 62 dias por vez).")
    return _gravar(s, user, lambda s: dict(s.execute(
        text("SELECT * FROM estoque.gerar_consumo(:de, :ate, :por)"),
        {"de": body.de, "ate": body.ate, "por": user.username}).mappings().one()))


@router.get("/consumo/diario", dependencies=[LEITURA])
def consumo_diario(de: dt.date, ate: dt.date, material_id: int | None = None, s: Session = Depends(db)):
    return _rows(s, """SELECT * FROM estoque.consumo_diario WHERE data BETWEEN :de AND :ate
                        AND (CAST(:m AS int) IS NULL OR material_id = :m) ORDER BY data, material_id""",
                 de=de, ate=ate, m=material_id)


@router.get("/previsao/cimento", dependencies=[LEITURA])
def previsao_cimento(unidade_id: int, material_id: int, janela_dias_uteis: int = Query(30, ge=5, le=120),
                     horizonte: int = Query(10, ge=1, le=60), s: Session = Depends(db)):
    """Ponto de pedido e plano de cargas para um cimento. Simulação: não lança nada."""
    hoje = dt.date.today()
    inicio = hoje - dt.timedelta(days=janela_dias_uteis * 2)
    uteis = [d for d in dias_uteis(inicio, janela_dias_uteis * 2) if d < hoje][-janela_dias_uteis:]
    cons = {r["data"]: float(r["quantidade"]) for r in _rows(s, """
        SELECT data, quantidade FROM estoque.consumo_diario
         WHERE unidade_id = :u AND material_id = :m AND data BETWEEN :de AND :ate""",
        u=unidade_id, m=material_id, de=uteis[0], ate=uteis[-1])}
    silos = [SiloNivel(r["silo_id"], r["nome"], float(r["nivel_fisico"]), float(r["capacidade_operacional"]))
             for r in _rows(s, "SELECT * FROM estoque.nivel_silo WHERE unidade_id = :u AND material_id = :m",
                            u=unidade_id, m=material_id)]
    c = {k: _cfg(s, k) for k in ("previsao_lead_time_dias", "previsao_seguranca_dias", "previsao_nivel_servico", "previsao_carga_t")}
    plano = plano_ressuprimento(silos, [cons.get(d, 0.0) for d in uteis], hoje,
                                lead_time=int(c["previsao_lead_time_dias"]), seguranca_dias=float(c["previsao_seguranca_dias"]),
                                nivel_servico=float(c["previsao_nivel_servico"]), carga_t=float(c["previsao_carga_t"]),
                                horizonte=horizonte)
    return plano.__dict__ | {"silos": [x.__dict__ for x in silos]}


# ----------------------------------------------------------------- nota fiscal por IA
@router.get("/nota-fiscal/provider", dependencies=[LEITURA])
def provider():
    return {"provider": nf_leitura.provedor()}


@router.post("/nota-fiscal/leituras", status_code=202)
async def iniciar_leitura(request: Request, unidade_id: int, arquivo: UploadFile = File(...),
                          s: Session = Depends(db), user=Depends(LANCAR)):
    limite = int(_cfg(s, "nf_tamanho_max_mb")) * 1024 * 1024
    conteudo = await arquivo.read(limite + 1)
    if len(conteudo) > limite:
        raise HTTPException(413, f"Arquivo acima de {limite // (1024 * 1024)} MB.")
    if not conteudo:
        raise HTTPException(422, "Arquivo vazio.")
    try:
        mime = nf_leitura.detectar_mime(conteudo, arquivo.content_type)
    except ValueError as e:
        raise HTTPException(415, str(e)) from e
    sha, caminho = nf_leitura.guardar_arquivo(conteudo, mime)
    usada = s.execute(text("""SELECT id FROM estoque.nf_leitura WHERE arquivo_sha256 = :h AND status = 'confirmada'
                               LIMIT 1"""), {"h": sha}).scalar()
    if usada:
        raise HTTPException(409, f"Este arquivo já foi lançado (leitura {usada}).")
    lid = s.execute(text("""
        INSERT INTO estoque.nf_leitura (unidade_id, provider, arquivo_sha256, anexo_caminho, anexo_mime, anexo_bytes, criado_por)
        VALUES (:u, :p, :h, :c, :mime, :b, :por) RETURNING id::text"""),
        {"u": unidade_id, "p": "xml" if mime == "application/xml" else nf_leitura.provedor(), "h": sha, "c": caminho,
         "mime": mime, "b": len(conteudo), "por": user.username}).scalar_one()
    s.commit()
    nf_leitura.enfileirar(fabrica_sessao(request), lid, int(_cfg(s, "nf_timeout_s")))
    return {"id": lid, "status": "pendente"}


@router.get("/nota-fiscal/leituras/{leitura_id}", dependencies=[LEITURA])
def status_leitura(leitura_id: uuid.UUID, s: Session = Depends(db)):
    r = _rows(s, """SELECT id, status, provider, resultado, erro, tentativas, criado_em, concluido_em, anexo_mime
                      FROM estoque.nf_leitura WHERE id = :id""", id=str(leitura_id))
    if not r:
        raise HTTPException(404, "Leitura não encontrada.")
    return r[0]


@router.post("/nota-fiscal/leituras/{leitura_id}/descartar")
def descartar_leitura(leitura_id: uuid.UUID, s: Session = Depends(db), user=Depends(LANCAR)):
    return _gravar(s, user, lambda s: {"ok": bool(s.execute(text(
        "UPDATE estoque.nf_leitura SET status = 'descartada' WHERE id = :id AND status <> 'confirmada'"),
        {"id": str(leitura_id)}).rowcount)})
