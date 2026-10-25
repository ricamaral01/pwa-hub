"""
Laboratório · Carta Traço — API que substitui o Apps Script (doGet/doPost).

Montagem no serviço do Laboratório (server/app.py):
    from .carta_traco_api import router as carta_traco_router
    app.include_router(carta_traco_router)

Equivalência com o Apps Script:
    getCartas → GET /cartas · getCustos → GET /custos · getResumo → GET /resumo
    salvarCarta → POST /cartas · salvarCusto → POST /custos · salvarCustoBatch → POST /custos/lote
"""
from __future__ import annotations

import datetime as dt
import json
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.orm import Session

from .deps import current_user, db, papel

router = APIRouter(prefix="/api/laboratorio/carta-traco", tags=["carta-traco"])
LEITURA = Depends(current_user)
ESCRITA = papel("engenheiro", "admin")
Fonte = Literal["tabela", "ultima_entrada", "media_ponderada", "entrada_senao_tabela"]


# ----------------------------------------------------------------- modelos
class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ItemIn(Strict):
    material_id: int
    fornecedor_id: int | None = None
    qtd_kg: Decimal = Field(ge=0, le=5000)
    massa_especifica: Decimal | None = Field(default=None, gt=0, le=20)


class CartaIn(Strict):
    nome: str = Field(min_length=1, max_length=120)
    codigo_traco: str | None = Field(default=None, max_length=40)
    unidade_id: int
    vigencia: dt.date
    status: Literal["Ativa", "Rascunho"] = "Ativa"
    observacao: str | None = Field(default=None, max_length=2000)
    tipo_frete: Literal["CIF", "FOB"] | None = None
    itens: list[ItemIn] = Field(min_length=1, max_length=40)

    @field_validator("nome")
    @classmethod
    def _nome(cls, v: str) -> str:
        return " ".join(v.split())

    @field_validator("itens")
    @classmethod
    def _sem_repetir(cls, v: list[ItemIn]) -> list[ItemIn]:
        ids = [i.material_id for i in v]
        if len(ids) != len(set(ids)):
            raise ValueError("material repetido na carta")
        return v


class CalcularIn(Strict):
    unidade_id: int
    itens: list[ItemIn] = Field(max_length=40)
    data: dt.date | None = None
    fonte: Fonte | None = None


class CustoIn(Strict):
    unidade_id: int
    fornecedor_id: int
    material_id: int
    un_medida: Literal["kg", "t", "m3", "L", "saco"]
    valor: Decimal = Field(ge=0)
    icms_pct: Decimal = Field(default=Decimal(0), ge=0, le=100)
    frete: Decimal = Field(default=Decimal(0), ge=0)
    icms_frete_pct: Decimal = Field(default=Decimal(0), ge=0, le=100)
    tipo_frete: Literal["CIF", "FOB"] | None = None
    produto_fornecedor: str | None = None
    vigente_desde: dt.date | None = None


# ----------------------------------------------------------------- utilidades
def _rows(s: Session, sql: str, **p) -> list[dict]:
    return [dict(r._mapping) for r in s.execute(text(sql), p)]


def _auditar_como(s: Session, user) -> None:
    s.execute(text("SELECT set_config('app.usuario', :u, true)"), {"u": user.username})


def _itens_json(itens: list[ItemIn]) -> str:
    return json.dumps([i.model_dump(mode="json") for i in itens])


def _gravar(s: Session, fn):
    """Executa fn(s) e confirma; traduz erros do banco em respostas HTTP."""
    try:
        r = fn(s)
        s.commit()
        return r
    except IntegrityError as e:
        s.rollback()
        raise HTTPException(409, str(e.orig).split("\n")[0]) from e
    except DBAPIError as e:
        s.rollback()
        raise HTTPException(422, str(e.orig).split("\n")[0]) from e


# ----------------------------------------------------------------- cadastros
@router.get("/unidades", dependencies=[LEITURA])
def unidades(s: Session = Depends(db)):
    return _rows(s, "SELECT id, nome FROM insumos.unidade WHERE ativo ORDER BY nome")


@router.get("/materiais", dependencies=[LEITURA])
def materiais(s: Session = Depends(db)):
    return _rows(s, """SELECT id, codigo, nome, grupo, massa_especifica, massa_unitaria, un_estoque
                         FROM insumos.material WHERE ativo ORDER BY ordem, nome""")


@router.get("/fornecedores", dependencies=[LEITURA])
def fornecedores(s: Session = Depends(db)):
    return _rows(s, "SELECT id, nome, cnpj FROM insumos.fornecedor WHERE ativo ORDER BY nome")


# ----------------------------------------------------------------- cartas
@router.get("/cartas", dependencies=[LEITURA])
def listar_cartas(unidade_id: int | None = None,
                  status: Literal["Ativa", "Inativa", "Rascunho", "todas"] = "Ativa",
                  busca: str | None = None, limit: int = Query(100, le=500), offset: int = 0,
                  s: Session = Depends(db)):
    return _rows(s, """
        SELECT r.*, c.unidade_id
          FROM carta_traco.resumo r JOIN carta_traco.carta c ON c.id = r.carta_id
         WHERE (CAST(:un AS int) IS NULL OR c.unidade_id = :un)
           AND (:st = 'todas' OR r.status = :st)
           AND (CAST(:busca AS text) IS NULL OR r.nome ILIKE '%' || :busca || '%')
         ORDER BY r.unidade, r.nome, r.revisao DESC LIMIT :lim OFFSET :off""",
                 un=unidade_id, st=status, busca=busca, lim=limit, off=offset)


@router.get("/cartas/{carta_id}", dependencies=[LEITURA])
def obter_carta(carta_id: int, data: dt.date | None = None, fonte: Fonte | None = None, s: Session = Depends(db)):
    cab = _rows(s, """SELECT r.*, c.unidade_id, c.observacao, c.tipo_frete, c.criado_por, c.criado_em
                        FROM carta_traco.resumo r JOIN carta_traco.carta c ON c.id = r.carta_id
                       WHERE r.carta_id = :id""", id=carta_id)
    if not cab:
        raise HTTPException(404, "Carta não encontrada")
    return {
        "carta": cab[0],
        "itens": _rows(s, """SELECT * FROM carta_traco.mcc_itens(COALESCE(CAST(:d AS date), current_date), CAST(:f AS text))
                              WHERE carta_id = :id ORDER BY grupo, material""", d=data, f=fonte, id=carta_id),
        "indicadores": (_rows(s, "SELECT * FROM carta_traco.indicadores_carta WHERE carta_id = :id", id=carta_id) or [None])[0],
        "revisoes": _rows(s, """
            SELECT o.id, o.revisao, o.status, o.vigencia, o.criado_por, m.mcc
              FROM carta_traco.carta c
              JOIN carta_traco.carta o ON lower(o.nome) = lower(c.nome) AND o.unidade_id = c.unidade_id
              LEFT JOIN carta_traco.mcc_cartas(current_date) m ON m.carta_id = o.id
             WHERE c.id = :id ORDER BY o.revisao DESC""", id=carta_id),
    }


@router.get("/cartas/{carta_id}/comparar/{outra_id}", dependencies=[LEITURA])
def comparar(carta_id: int, outra_id: int, s: Session = Depends(db)):
    return _rows(s, """
        WITH i AS (SELECT * FROM carta_traco.mcc_itens(current_date) WHERE carta_id IN (:a, :b))
        SELECT COALESCE(a.material, b.material) AS material,
               b.qtd_kg AS qtd_antes, a.qtd_kg AS qtd_depois, b.custo_m3 AS custo_antes, a.custo_m3 AS custo_depois,
               COALESCE(a.custo_m3, 0) - COALESCE(b.custo_m3, 0) AS delta
          FROM (SELECT * FROM i WHERE carta_id = :a) a
          FULL JOIN (SELECT * FROM i WHERE carta_id = :b) b ON a.material_id = b.material_id
         WHERE a.qtd_kg IS DISTINCT FROM b.qtd_kg OR a.custo_m3 IS DISTINCT FROM b.custo_m3
         ORDER BY abs(COALESCE(a.custo_m3, 0) - COALESCE(b.custo_m3, 0)) DESC""", a=carta_id, b=outra_id)


@router.post("/cartas/calcular", dependencies=[LEITURA])
def calcular(body: CalcularIn, s: Session = Depends(db)):
    """Prévia do editor (indicadores + MCC ao vivo), sem gravar."""
    j = _itens_json(body.itens)
    itens = _rows(s, """SELECT * FROM carta_traco.calcular_itens(CAST(:u AS smallint), CAST(:j AS jsonb),
                          COALESCE(CAST(:d AS date), current_date), CAST(:f AS text))""",
                  u=body.unidade_id, j=j, d=body.data, f=body.fonte)
    ind = _rows(s, "SELECT * FROM carta_traco.indicadores_itens(CAST(:j AS jsonb))", j=j)[0]
    tol = Decimal(_rows(s, "SELECT valor FROM insumos.config WHERE chave = 'fechamento_tolerancia_l'")[0]["valor"])
    return {
        "itens": itens,
        "indicadores": ind,
        "mcc": round(sum((i["custo_m3"] or 0) for i in itens), 2),
        "itens_sem_custo": [i["material"] for i in itens if i["sem_custo"]],
        "fechamento_ok": ind["fechamento_l"] is not None and abs(ind["fechamento_l"]) <= tol,
    }


@router.post("/cartas", status_code=201)
def salvar_carta(body: CartaIn, s: Session = Depends(db), user=Depends(ESCRITA)):
    """Grava nova revisão (máx + 1, calculada aqui). Inativa só revisões menores."""
    def _fn(s):
        _auditar_como(s, user)
        s.execute(text("SELECT pg_advisory_xact_lock(hashtext(lower(:n) || '|' || :u))"),
                  {"n": body.nome, "u": body.unidade_id})
        rev = s.execute(text("""SELECT COALESCE(max(revisao), 0) + 1 FROM carta_traco.carta
                                 WHERE lower(nome) = lower(:n) AND unidade_id = :u"""),
                        {"n": body.nome, "u": body.unidade_id}).scalar_one()
        cid = s.execute(text("""
            INSERT INTO carta_traco.carta (nome, codigo_traco, revisao, unidade_id, status, vigencia, observacao, tipo_frete, criado_por)
            VALUES (:nome, :cod, :rev, :u, :st, :vig, :obs, :tf, :por) RETURNING id"""),
            {"nome": body.nome, "cod": body.codigo_traco, "rev": rev, "u": body.unidade_id, "st": body.status,
             "vig": body.vigencia, "obs": body.observacao, "tf": body.tipo_frete, "por": user.username}).scalar_one()
        s.execute(text("""
            INSERT INTO carta_traco.carta_item (carta_id, material_id, fornecedor_id, qtd_kg, massa_especifica, ordem)
            SELECT :cid, x.material_id, x.fornecedor_id, x.qtd_kg, COALESCE(x.massa_especifica, m.massa_especifica), x.ord
              FROM ROWS FROM (jsonb_to_recordset(CAST(:j AS jsonb))
                     AS (material_id int, fornecedor_id int, qtd_kg numeric, massa_especifica numeric))
                   WITH ORDINALITY AS x(material_id, fornecedor_id, qtd_kg, massa_especifica, ord)
              JOIN insumos.material m ON m.id = x.material_id"""), {"cid": cid, "j": _itens_json(body.itens)})
        return {"id": cid, "revisao": rev}
    return _gravar(s, _fn)


# ----------------------------------------------------------------- tabela de preços
@router.get("/custos", dependencies=[LEITURA])
def listar_custos(unidade_id: int | None = None, material_id: int | None = None, vigentes: bool = True,
                  s: Session = Depends(db)):
    filtro_vigente = """AND c.id IN (SELECT custo_id FROM carta_traco.custo_vigente)""" if vigentes else ""
    return _rows(s, f"""
        SELECT c.*, u.nome AS unidade, f.nome AS fornecedor, m.nome AS material,
               insumos.custo_por_kg(c.valor_liquido, c.un_medida, m.massa_especifica, m.massa_unitaria) AS custo_kg,
               (SELECT count(DISTINCT ci.carta_id) FROM carta_traco.carta_item ci
                  JOIN carta_traco.carta ca ON ca.id = ci.carta_id AND ca.status = 'Ativa'
                 WHERE ci.material_id = c.material_id AND ca.unidade_id = c.unidade_id) AS cartas_ativas
          FROM insumos.custo c
          JOIN insumos.unidade u ON u.id = c.unidade_id
          JOIN insumos.fornecedor f ON f.id = c.fornecedor_id
          JOIN insumos.material m ON m.id = c.material_id
         WHERE c.ativo {filtro_vigente}
           AND (CAST(:u AS int) IS NULL OR c.unidade_id = :u)
           AND (CAST(:m AS int) IS NULL OR c.material_id = :m)
         ORDER BY m.ordem, m.nome, c.vigente_desde DESC, c.id DESC""", u=unidade_id, m=material_id)


def _inserir_custo(s: Session, c: CustoIn, por: str) -> int:
    return s.execute(text("""
        INSERT INTO insumos.custo (unidade_id, fornecedor_id, material_id, un_medida, valor, icms_pct, frete, icms_frete_pct,
                                   tipo_frete, produto_fornecedor, vigente_desde, criado_por)
        VALUES (:unidade_id, :fornecedor_id, :material_id, :un_medida, :valor, :icms_pct, :frete, :icms_frete_pct,
                :tipo_frete, :produto_fornecedor, COALESCE(CAST(:vigente_desde AS date), current_date), :por)
        RETURNING id"""), c.model_dump() | {"por": por}).scalar_one()


@router.post("/custos", status_code=201)
def salvar_custo(body: CustoIn, s: Session = Depends(db), user=Depends(ESCRITA)):
    return _gravar(s, lambda s: (_auditar_como(s, user), {"id": _inserir_custo(s, body, user.username)})[1])


@router.post("/custos/lote", status_code=201)
def salvar_custos_lote(body: list[CustoIn], s: Session = Depends(db), user=Depends(ESCRITA)):
    if not body or len(body) > 500:
        raise HTTPException(422, "Envie de 1 a 500 custos.")
    return _gravar(s, lambda s: (_auditar_como(s, user), {"ids": [_inserir_custo(s, c, user.username) for c in body]})[1])


@router.post("/custos/{custo_id}/desativar")
def desativar_custo(custo_id: int, s: Session = Depends(db), user=Depends(ESCRITA)):
    def _fn(s):
        _auditar_como(s, user)
        n = s.execute(text("UPDATE insumos.custo SET ativo = false WHERE id = :id AND ativo"), {"id": custo_id}).rowcount
        if not n:
            raise HTTPException(404, "Custo não encontrado ou já desativado")
        return {"ok": True}
    return _gravar(s, _fn)


@router.post("/custos/impacto", dependencies=[LEITURA])
def impacto_custo(body: CustoIn, s: Session = Depends(db)):
    """Prévia do 'Novo custo': quanto muda o MCC das cartas ativas (pela tabela de preços). Nada é gravado."""
    atual = {x["carta_id"]: x["mcc"] for x in _rows(s, "SELECT * FROM carta_traco.mcc_cartas(current_date, 'tabela')")}
    try:
        _inserir_custo(s, body, "previa")
        r = _rows(s, """
            SELECT c.id, c.nome, c.revisao, d.mcc AS mcc_novo
              FROM carta_traco.carta c
              JOIN carta_traco.mcc_cartas(COALESCE(CAST(:d AS date), current_date), 'tabela') d ON d.carta_id = c.id
             WHERE c.status = 'Ativa' AND c.unidade_id = :u
               AND EXISTS (SELECT 1 FROM carta_traco.carta_item i WHERE i.carta_id = c.id AND i.material_id = :m)""",
                  d=body.vigente_desde, u=body.unidade_id, m=body.material_id)
    finally:
        s.rollback()
    return [x | {"mcc_atual": atual.get(x["id"]), "delta": (x["mcc_novo"] or 0) - (atual.get(x["id"]) or 0)} for x in r]


# ----------------------------------------------------------------- resumo e consumo
@router.get("/resumo", dependencies=[LEITURA])
def resumo(data: dt.date | None = None, fonte: Fonte | None = None, s: Session = Depends(db)):
    """MCC das cartas ativas com os custos vigentes na data (padrão: hoje)."""
    return _rows(s, """
        SELECT c.id AS carta_id, c.nome, c.codigo_traco, c.revisao, u.nome AS unidade, m.mcc, m.itens_sem_custo,
               i.rel_ac, i.fechamento_l
          FROM carta_traco.carta c
          JOIN insumos.unidade u ON u.id = c.unidade_id
          LEFT JOIN carta_traco.mcc_cartas(COALESCE(CAST(:d AS date), current_date), CAST(:f AS text)) m ON m.carta_id = c.id
          LEFT JOIN carta_traco.indicadores_carta i ON i.carta_id = c.id
         WHERE c.status = 'Ativa'
         ORDER BY c.nome, u.nome""", d=data, f=fonte)


@router.get("/consumo-teorico-real", dependencies=[LEITURA])
def consumo_teorico_real(de: dt.date, ate: dt.date, unidade_id: int | None = None, s: Session = Depends(db)):
    """Quanto a produção deveria ter consumido (cartas × volume) contra a baixa real do estoque."""
    if ate < de or (ate - de).days > 400:
        raise HTTPException(422, "Período inválido (máximo de 400 dias).")
    return _rows(s, """SELECT * FROM carta_traco.consumo_teorico_real(:de, :ate, CAST(:u AS smallint))
                        ORDER BY abs(coalesce(desvio_kg, 0)) DESC""", de=de, ate=ate, u=unidade_id)
