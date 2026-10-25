from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from decimal import Decimal
import base64
import psycopg2
import psycopg2.extras
from api.ai_providers import AIProviderError, provider_status, read_invoice
from api.settings import settings
from datetime import date, datetime
from uuid import uuid4

router = APIRouter()

CATEGORIAS = ("cimento", "areia", "brita", "aditivo", "adicao", "agua", "outro")
UNIDADES   = ("kg", "sc", "m3", "L", "ton")
TIPOS_MOV  = ("entrada", "consumo", "acerto")
ORIGENS_MOV = ("manual", "massada", "producao_massadas", "acerto")
SOLIDOS_EM_TON = ("areia", "brita", "cimento", "adicao")

# Mapeamento físico da usina:
# - tbl_massadas.real_silo1 vem do Silo 1 (Filler ate 29/06/2026; CP V-ARI depois)
# - tbl_massadas.real_silo2 vem do Silo 2 (CP V)
# - tbl_massadas.real_silo3 vem do Silo 3 (CP II)
SILO_ID_BY_MASSADA_COL = {
    "real_silo1": 1,
    "real_silo2": 2,
    "real_silo3": 3,
}

SILO_ID_BY_MATERIAL_CODE = {
    "CIM-CP-II": 3,
}

SILO1_CP_V_DESDE = date(2026, 6, 30)


def _get_conn():
    return psycopg2.connect(settings.POSTGRES_URL)


def _fator_consumo_massada(coluna: str, fator, categoria: Optional[str], unidade: Optional[str]) -> float:
    """
    Normaliza consumo vindo de tbl_massadas.

    Os campos real_agregado* e real_silo* chegam em kg na base da usina.
    O fator configurado deve converter explicitamente a leitura do misturador
    para a unidade canônica do material no estoque.
    """
    f = float(fator or 1.0)
    if f <= 0:
        raise ValueError(f"Fator de conversão inválido para {coluna}: {fator}")
    esperado = _expected_massada_factor(coluna, unidade)
    if abs(f - esperado) > 0.0000001:
        raise ValueError(f"Fator de conversão inválido para {coluna}: esperado {esperado}, recebido {f}")
    return f


def _unidade_consumo_massada(categoria: Optional[str], unidade: Optional[str]) -> Optional[str]:
    return "ton" if (categoria or "").lower() in SOLIDOS_EM_TON else unidade


def _expected_massada_factor(coluna: str, unidade: Optional[str]) -> float:
    col = (coluna or "").lower()
    if (col.startswith("real_agregado") or col.startswith("real_silo")) and unidade == "ton":
        return 0.001
    return 1.0


def _silo_id_from_massada_col(coluna: Optional[str]) -> Optional[int]:
    return SILO_ID_BY_MASSADA_COL.get((coluna or "").lower())


def _silo_id_from_material_code(codigo: Optional[str]) -> Optional[int]:
    return SILO_ID_BY_MATERIAL_CODE.get((codigo or "").upper())


def _exibir_em_kg(categoria: Optional[str], unidade: Optional[str]) -> bool:
    return (categoria or "").lower() in SOLIDOS_EM_TON and (unidade or "").lower() == "ton"


def _convert_quantity(value: float, from_unit: Optional[str], to_unit: Optional[str]) -> float:
    """Converte quantidade entre kg e ton; demais unidades precisam coincidir."""
    source = from_unit or to_unit
    if not source or not to_unit or source == to_unit:
        return float(value)
    if source == "kg" and to_unit == "ton":
        return float(value) / 1000.0
    if source == "ton" and to_unit == "kg":
        return float(value) * 1000.0
    raise HTTPException(
        status_code=422,
        detail=f"Não é possível converter unidade {source} para {to_unit}",
    )


def _display_unit(categoria: Optional[str], unidade: Optional[str]) -> Optional[str]:
    return "kg" if _exibir_em_kg(categoria, unidade) else unidade


def _with_display_units(row: dict, fields: tuple[str, ...]) -> dict:
    out = dict(row)
    out["unidade_display"] = _display_unit(out.get("categoria"), out.get("unidade"))
    for field in fields:
        if out.get(field) is not None:
            out[f"{field}_display"] = round(
                _convert_quantity(out[field], out.get("unidade"), out["unidade_display"]),
                3,
            )
    return out


def _with_silo_display_units(row: dict, fields: tuple[str, ...]) -> dict:
    out = dict(row)
    out["unidade_display"] = "kg" if (out.get("unidade") or "").lower() == "ton" else out.get("unidade")
    for field in fields:
        if out.get(field) is not None:
            out[f"{field}_display"] = round(
                _convert_quantity(out[field], out.get("unidade"), out["unidade_display"]),
                3,
            )
    return out


def _with_movement_display_units(row: dict) -> dict:
    out = dict(row)
    out["unidade_display"] = _display_unit(
        out.get("material_categoria"),
        out.get("material_unidade"),
    )
    out["quantidade_display"] = round(
        _convert_quantity(
            out.get("quantidade") or 0,
            out.get("material_unidade"),
            out["unidade_display"],
        ),
        3,
    )
    return out


def _serialize(d: dict) -> dict:
    """Convert Decimal/date/datetime to JSON-safe types."""
    out = {}
    for k, v in d.items():
        if isinstance(v, Decimal):
            out[k] = float(v)
        elif isinstance(v, (date, datetime)):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


# ─── Models ─────────────────────────────────────────────────────────────────

class MaterialIn(BaseModel):
    codigo: str
    nome: str
    categoria: str = "outro"
    unidade: str = "kg"
    saldo_inicial: float = 0.0
    ativo: bool = True

    @field_validator("categoria")
    @classmethod
    def val_categoria(cls, v: str) -> str:
        if v not in CATEGORIAS:
            raise ValueError(f"categoria deve ser um de: {CATEGORIAS}")
        return v

    @field_validator("unidade")
    @classmethod
    def val_unidade(cls, v: str) -> str:
        if v not in UNIDADES:
            raise ValueError(f"unidade deve ser um de: {UNIDADES}")
        return v

    @model_validator(mode="after")
    def val_unidade_solido(self):
        if self.categoria in SOLIDOS_EM_TON and self.unidade != "ton":
            raise ValueError(f"categoria {self.categoria} deve ser controlada em ton")
        return self


class MovimentoIn(BaseModel):
    material_id: int
    tipo: str
    data: str  # ISO YYYY-MM-DD
    quantidade: float
    unidade: Optional[str] = None
    nota_fiscal: Optional[str] = None
    nf_referencia: Optional[str] = None  # alias aceito pelo frontend
    fornecedor: Optional[str] = None
    observacao: Optional[str] = None
    responsavel: Optional[str] = None
    origem: str = "manual"
    silo_id: Optional[int] = None
    valor_nota: Optional[float] = 0.0
    icms_perc: Optional[float] = 0.0
    valor_frete: Optional[float] = 0.0
    icms_frete: Optional[float] = 0.0

    @field_validator("tipo")
    @classmethod
    def val_tipo(cls, v: str) -> str:
        if v not in TIPOS_MOV:
            raise ValueError(f"tipo deve ser um de: {TIPOS_MOV}")
        return v

    @field_validator("quantidade")
    @classmethod
    def val_quantidade(cls, v: float) -> float:
        if v == 0:
            raise ValueError("quantidade não pode ser zero")
        return v

    @field_validator("valor_nota", "valor_frete")
    @classmethod
    def val_valores_financeiros(cls, v: Optional[float]) -> float:
        value = float(v or 0)
        if value < 0:
            raise ValueError("valores financeiros não podem ser negativos")
        return value

    @field_validator("icms_perc")
    @classmethod
    def val_icms_perc(cls, v: Optional[float]) -> float:
        value = float(v or 0)
        if value < 0 or value > 100:
            raise ValueError("ICMS deve estar entre 0 e 100%")
        return value

    @field_validator("icms_frete")
    @classmethod
    def val_icms_frete_perc(cls, v: Optional[float]) -> float:
        value = float(v or 0)
        if value < 0 or value > 100:
            raise ValueError("ICMS do frete deve estar entre 0 e 100%")
        return value

    @field_validator("unidade")
    @classmethod
    def val_unidade_mov(cls, v: Optional[str]) -> Optional[str]:
        if not v:  # None or empty string → None
            return None
        if v not in UNIDADES:
            raise ValueError(f"unidade deve ser um de: {UNIDADES}")
        return v

    @field_validator("origem")
    @classmethod
    def val_origem(cls, v: str) -> str:
        if v not in ORIGENS_MOV:
            raise ValueError(f"origem deve ser um de: {ORIGENS_MOV}")
        return v

    @field_validator("data")
    @classmethod
    def val_data(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except (TypeError, ValueError):
            raise ValueError("data deve estar no formato YYYY-MM-DD")
        return v

    def get_nota_fiscal(self) -> Optional[str]:
        """Retorna nota_fiscal, aceitando nf_referencia como alias."""
        return self.nota_fiscal or self.nf_referencia


class DocumentoFiscalIn(BaseModel):
    nome_arquivo: str
    mime_type: str
    conteudo_base64: str
    material_id: Optional[int] = None


NF_SCHEMA = {
    "type": "object",
    "properties": {
        "numero_nota": {"type": ["string", "null"]},
        "data_emissao": {"type": ["string", "null"], "description": "Data em YYYY-MM-DD"},
        "fornecedor": {"type": ["string", "null"]},
        "cnpj_fornecedor": {"type": ["string", "null"]},
        "chave_acesso": {"type": ["string", "null"]},
        "valor_nota": {"type": ["number", "null"]},
        "icms_perc": {"type": ["number", "null"]},
        "valor_frete": {"type": ["number", "null"]},
        "icms_frete": {"type": ["number", "null"]},
        "quantidade": {"type": ["number", "null"]},
        "unidade": {"type": ["string", "null"]},
        "descricao_material": {"type": ["string", "null"]},
        "confianca": {"type": "number", "minimum": 0, "maximum": 1},
        "avisos": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["numero_nota", "data_emissao", "fornecedor", "cnpj_fornecedor", "chave_acesso",
                 "valor_nota", "icms_perc", "valor_frete", "icms_frete", "quantidade", "unidade",
                 "descricao_material", "confianca", "avisos"],
    "additionalProperties": False,
}

NF_JOBS: dict[str, dict] = {}


def _material_contexto_nf(material_id: Optional[int]) -> str:
    contexto = "Nenhum material foi selecionado."
    if not material_id:
        return contexto
    conn = _get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT nome, codigo, unidade FROM tbl_est_materiais WHERE id=%s AND ativo=true", (material_id,))
        material = cur.fetchone()
        if material:
            contexto = (f"Material selecionado: {material['nome']} ({material['codigo']}), unidade de estoque "
                        f"{material['unidade']}. Extraia quantidade e valores desse item. "
                        "Mantenha a unidade impressa na nota; a tela fará a conversão necessária.")
        return contexto
    finally:
        conn.close()


def _executar_job_nf(job_id: str, documento: DocumentoFiscalIn) -> None:
    try:
        dados, provider = read_invoice(documento.conteudo_base64, documento.mime_type, documento.nome_arquivo,
                                       _material_contexto_nf(documento.material_id), NF_SCHEMA)
        NF_JOBS[job_id] = {"status": "concluido", "dados": dados, "provider": provider}
    except AIProviderError as exc:
        NF_JOBS[job_id] = {"status": "erro", "detail": str(exc), "status_code": exc.status_code}
    except Exception:
        NF_JOBS[job_id] = {"status": "erro", "detail": "Falha interna ao processar a nota", "status_code": 500}


@router.get("/estoque/nota-fiscal/provider")
def status_provider_nota_fiscal():
    return provider_status()


@router.post("/estoque/nota-fiscal/ler/iniciar")
def iniciar_leitura_nota_fiscal(documento: DocumentoFiscalIn, background_tasks: BackgroundTasks):
    mime = (documento.mime_type or "").lower()
    if mime not in {"image/jpeg", "image/png", "image/webp", "application/pdf"}:
        raise HTTPException(status_code=415, detail="Use uma imagem JPG, PNG, WEBP ou arquivo PDF")
    try:
        raw = base64.b64decode(documento.conteudo_base64, validate=True)
    except Exception:
        raise HTTPException(status_code=422, detail="Arquivo inválido")
    if not raw or len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="O arquivo deve ter no máximo 12 MB")
    status = provider_status()
    if not status["configured"]:
        raise HTTPException(status_code=503, detail=status["message"])
    job_id = uuid4().hex
    NF_JOBS[job_id] = {"status": "processando", "provider": status["provider"]}
    background_tasks.add_task(_executar_job_nf, job_id, documento)
    return {"ok": True, "job_id": job_id, "status": "processando", "provider": status["provider"]}


@router.get("/estoque/nota-fiscal/ler/status/{job_id}")
def consultar_leitura_nota_fiscal(job_id: str):
    job = NF_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Leitura não encontrada ou expirada")
    return job


@router.post("/estoque/nota-fiscal/ler")
def ler_nota_fiscal(documento: DocumentoFiscalIn):
    """Lê foto ou PDF de NF e apenas sugere campos; não cria movimento."""
    mime = (documento.mime_type or "").lower()
    if mime not in {"image/jpeg", "image/png", "image/webp", "application/pdf"}:
        raise HTTPException(status_code=415, detail="Use uma imagem JPG, PNG, WEBP ou arquivo PDF")
    try:
        raw = base64.b64decode(documento.conteudo_base64, validate=True)
    except Exception:
        raise HTTPException(status_code=422, detail="Arquivo inválido")
    if not raw or len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="O arquivo deve ter no máximo 12 MB")

    material_contexto = _material_contexto_nf(documento.material_id)

    try:
        dados, provider = read_invoice(documento.conteudo_base64, mime, documento.nome_arquivo,
                                       material_contexto, NF_SCHEMA)
        return {"ok": True, "dados": dados, "provider": provider, "requer_confirmacao": True}
    except AIProviderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))


def _calcular_valor_unitario_liquido(
    quantidade: float,
    valor_nota: float,
    icms_perc: float,
    valor_frete: float,
    icms_frete: float,
) -> float:
    """Recalcula o custo líquido na unidade canônica do material."""
    if quantidade <= 0:
        raise HTTPException(status_code=422, detail="Quantidade da entrada deve ser positiva")
    valor_nota = float(valor_nota or 0)
    icms_perc = float(icms_perc or 0)
    valor_frete = float(valor_frete or 0)
    icms_frete = float(icms_frete or 0)
    frete_bruto_total = valor_frete * quantidade
    valor_icms_frete = frete_bruto_total * (icms_frete / 100)
    frete_liquido_total = frete_bruto_total - valor_icms_frete
    total_liquido = valor_nota * (1 - icms_perc / 100) + frete_liquido_total
    if total_liquido < 0:
        raise HTTPException(status_code=422, detail="O valor líquido total não pode ser negativo")
    return round(total_liquido / quantidade, 4)


# ─── Materiais ───────────────────────────────────────────────────────────────

@router.get("/estoque/materiais")
def listar_materiais(apenas_ativos: bool = True):
    sql = "SELECT * FROM tbl_est_materiais"
    params = []
    if apenas_ativos:
        sql += " WHERE ativo = true"
    sql += " ORDER BY categoria, nome"
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        rows = [
            _with_display_units(_serialize(dict(r)), ("saldo_inicial",))
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/estoque/materiais")
def criar_material(item: MaterialIn):
    sql = """
        INSERT INTO tbl_est_materiais (codigo, nome, categoria, unidade, saldo_inicial, ativo)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
    """
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, (item.codigo, item.nome, item.categoria,
                          item.unidade, item.saldo_inicial, item.ativo))
        row = _serialize(dict(cur.fetchone()))
        conn.commit(); cur.close(); conn.close()
        return {"ok": True, "id": row["id"], "created_at": row["created_at"]}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Código já cadastrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/estoque/materiais/{material_id}")
def atualizar_material(material_id: int, item: MaterialIn):
    sql = """
        UPDATE tbl_est_materiais
        SET codigo=%s, nome=%s, categoria=%s, unidade=%s, saldo_inicial=%s, ativo=%s
        WHERE id=%s RETURNING id
    """
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, (item.codigo, item.nome, item.categoria,
                          item.unidade, item.saldo_inicial, item.ativo, material_id))
        updated = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        if not updated:
            raise HTTPException(status_code=404, detail="Material não encontrado")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Saldo ───────────────────────────────────────────────────────────────────

@router.get("/estoque/saldo")
def consultar_saldo():
    """Retorna saldo atual por material (saldo_inicial + entradas - consumos + acertos)."""
    sql = """
        SELECT
            m.id,
            m.id        AS material_id,
            m.codigo,
            m.nome,
            m.categoria,
            m.unidade,
            m.unidade AS unidade_padrao,
            m.saldo_inicial + COALESCE(SUM(
                CASE
                    WHEN mv.tipo = 'entrada' THEN  mv.quantidade
                    WHEN mv.tipo = 'consumo' THEN -mv.quantidade
                    WHEN mv.tipo = 'acerto'  THEN  mv.quantidade
                    ELSE 0
                END
            ), 0) AS saldo,
            COALESCE(SUM(CASE WHEN mv.tipo = 'entrada' THEN mv.quantidade ELSE 0 END), 0) AS total_entradas,
            COALESCE(SUM(CASE WHEN mv.tipo = 'consumo' THEN mv.quantidade ELSE 0 END), 0) AS total_consumo,
            COUNT(mv.id) AS total_movimentos,
            MAX(mv.data) AS ultima_movimentacao
        FROM tbl_est_materiais m
        LEFT JOIN tbl_est_movimentos mv ON mv.material_id = m.id
        WHERE m.ativo = true
        GROUP BY m.id, m.codigo, m.nome, m.categoria, m.unidade, m.saldo_inicial
        ORDER BY m.categoria, m.nome
    """
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql)
        rows = [
            _with_display_units(
                _serialize(dict(r)),
                ("saldo", "total_entradas", "total_consumo"),
            )
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Movimentos ───────────────────────────────────────────────────────────────

@router.get("/estoque/movimentos")
def listar_movimentos(
    limit: int = Query(100, ge=1, le=1000),
    tipo: Optional[str] = None,
    material_id: Optional[int] = None,
    data_ini: Optional[str] = None,
    data_fim: Optional[str] = None,
):
    conditions = ["1=1"]
    params = []
    if tipo:
        conditions.append("mv.tipo = %s")
        params.append(tipo)
    if material_id:
        conditions.append("mv.material_id = %s")
        params.append(material_id)
    if data_ini:
        conditions.append("mv.data >= %s")
        params.append(data_ini)
    if data_fim:
        conditions.append("mv.data <= %s")
        params.append(data_fim)

    where = " AND ".join(conditions)
    sql = f"""
        SELECT
            mv.*,
            m.nome  AS material_nome,
            m.codigo AS material_codigo,
            m.unidade AS material_unidade,
            m.categoria AS material_categoria
        FROM tbl_est_movimentos mv
        JOIN tbl_est_materiais m ON m.id = mv.material_id
        WHERE {where}
        ORDER BY mv.data DESC, mv.created_at DESC
        LIMIT %s
    """
    params.append(limit)
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        rows = [
            _with_movement_display_units(_serialize(dict(r)))
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/estoque/movimentos")
def registrar_movimento(item: MovimentoIn):
    sql = """
        INSERT INTO tbl_est_movimentos
            (material_id, tipo, data, quantidade, unidade,
             nota_fiscal, fornecedor, observacao, responsavel, origem, silo_id,
             valor_nota, icms_perc, valor_frete, icms_frete, valor_unitario_liquido)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
    """
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Validate material exists
        cur.execute("SELECT id, codigo, categoria, unidade FROM tbl_est_materiais WHERE id = %s AND ativo = true",
                    (item.material_id,))
        material = cur.fetchone()
        if not material:
            raise HTTPException(status_code=404, detail="Material não encontrado ou inativo")
        if item.tipo != "acerto" and item.quantidade < 0:
            raise HTTPException(status_code=422, detail=f"Quantidade de {item.tipo} deve ser positiva")

        quantidade = round(
            _convert_quantity(item.quantidade, item.unidade, material["unidade"]),
            6,
        )
        silo_fixo = _silo_id_from_material_code(material.get("codigo"))
        if silo_fixo and item.silo_id and item.silo_id != silo_fixo:
            raise HTTPException(
                status_code=422,
                detail=f"Material {material['codigo']} pertence ao silo {silo_fixo}",
            )
        silo_id = silo_fixo or item.silo_id

        valor_unitario_liquido = (
            _calcular_valor_unitario_liquido(
                quantidade, item.valor_nota, item.icms_perc, item.valor_frete, item.icms_frete
            )
            if item.tipo == "entrada" else 0.0
        )

        params = (
            item.material_id, item.tipo, item.data, quantidade,
            material["unidade"],
            item.get_nota_fiscal(), item.fornecedor, item.observacao,
            item.responsavel, item.origem, silo_id,
            item.valor_nota, item.icms_perc, item.valor_frete, item.icms_frete, valor_unitario_liquido
        )
        cur.execute(sql, params)
        row = _serialize(dict(cur.fetchone()))
        conn.commit(); cur.close(); conn.close()
        return {
            "ok": True,
            "id": row["id"],
            "created_at": row["created_at"],
            "quantidade": quantidade,
            "unidade": material["unidade"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/estoque/movimentos/{mov_id}")
def editar_entrada(mov_id: int, item: MovimentoIn):
    """Edita uma entrada manual e recalcula integralmente os valores financeiros."""
    if item.tipo != "entrada":
        raise HTTPException(status_code=422, detail="Esta função edita somente notas de entrada")
    if item.quantidade <= 0:
        raise HTTPException(status_code=422, detail="Quantidade da entrada deve ser positiva")

    try:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id, tipo FROM tbl_est_movimentos WHERE id=%s FOR UPDATE", (mov_id,))
        movimento = cur.fetchone()
        if not movimento:
            raise HTTPException(status_code=404, detail="Movimento não encontrado")
        if movimento["tipo"] != "entrada":
            raise HTTPException(status_code=422, detail="O movimento informado não é uma entrada")

        cur.execute(
            "SELECT id, codigo, categoria, unidade FROM tbl_est_materiais WHERE id=%s AND ativo=true",
            (item.material_id,),
        )
        material = cur.fetchone()
        if not material:
            raise HTTPException(status_code=404, detail="Material não encontrado ou inativo")

        quantidade = round(_convert_quantity(item.quantidade, item.unidade, material["unidade"]), 6)
        if quantidade <= 0:
            raise HTTPException(status_code=422, detail="Quantidade convertida deve ser positiva")

        silo_fixo = _silo_id_from_material_code(material.get("codigo"))
        if silo_fixo and item.silo_id and item.silo_id != silo_fixo:
            raise HTTPException(
                status_code=422,
                detail=f"Material {material['codigo']} pertence ao silo {silo_fixo}",
            )
        silo_id = silo_fixo or item.silo_id
        valor_unitario_liquido = _calcular_valor_unitario_liquido(
            quantidade, item.valor_nota, item.icms_perc, item.valor_frete, item.icms_frete
        )

        cur.execute("""
            UPDATE tbl_est_movimentos
            SET material_id=%s, data=%s, quantidade=%s, unidade=%s,
                nota_fiscal=%s, fornecedor=%s, observacao=%s, responsavel=%s,
                origem=%s, silo_id=%s, valor_nota=%s, icms_perc=%s,
                valor_frete=%s, icms_frete=%s, valor_unitario_liquido=%s
            WHERE id=%s
            RETURNING id
        """, (
            item.material_id, item.data, quantidade, material["unidade"],
            item.get_nota_fiscal(), item.fornecedor, item.observacao, item.responsavel,
            item.origem, silo_id, item.valor_nota, item.icms_perc,
            item.valor_frete, item.icms_frete, valor_unitario_liquido, mov_id,
        ))
        cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {
            "ok": True,
            "id": mov_id,
            "quantidade": quantidade,
            "unidade": material["unidade"],
            "valor_unitario_liquido": valor_unitario_liquido,
        }
    except HTTPException:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/estoque/movimentos/{mov_id}")
def deletar_movimento(mov_id: int):
    try:
        conn = _get_conn()
        cur  = conn.cursor()
        cur.execute("DELETE FROM tbl_est_movimentos WHERE id = %s RETURNING id", (mov_id,))
        deleted = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        if not deleted:
            raise HTTPException(status_code=404, detail="Movimento não encontrado")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Silos ───────────────────────────────────────────────────────────────────

# Categorias e materiais que usam controle de silo
CATEGORIAS_SILO = ("cimento",)
CODIGOS_SILO    = ()


@router.get("/estoque/silos")
def listar_silos():
    """Retorna os silos cadastrados."""
    sql = "SELECT id, nome, capacidade_nominal, capacidade_operacional, unidade, ativo FROM tbl_est_silos ORDER BY id"
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql)
        rows = [_serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/estoque/silos/nivel")
def nivel_silos():
    """Retorna o nível estimado de cada silo (entradas - consumo + acertos)."""
    sql = """
        WITH
        movimentos_com_silo AS (
            SELECT
                COALESCE(
                    mv.silo_id,
                    CASE
                        WHEN m.codigo = 'ADD-FILL'   THEN 1
                        WHEN m.codigo = 'CIM-CP-V'   THEN 2
                        WHEN m.codigo = 'CIM-CP-II'  THEN 3
                        ELSE NULL
                    END
                ) AS silo_id,
                mv.tipo,
                mv.quantidade
            FROM tbl_est_movimentos mv
            JOIN tbl_est_materiais m ON m.id = mv.material_id
            WHERE m.ativo = true
        )
        SELECT
            s.id,
            s.nome,
            s.capacidade_nominal,
            s.capacidade_operacional,
            s.unidade,
            COALESCE(SUM(CASE WHEN mv.tipo='entrada' THEN mv.quantidade ELSE 0 END), 0) AS entradas_silo,
            COALESCE(SUM(CASE WHEN mv.tipo='consumo' THEN mv.quantidade ELSE 0 END), 0) AS consumo_total,
            COALESCE(SUM(CASE WHEN mv.tipo='acerto'  THEN mv.quantidade ELSE 0 END), 0) AS acerto_silo,
            GREATEST(0,
                COALESCE(SUM(CASE WHEN mv.tipo='entrada' THEN mv.quantidade ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN mv.tipo='consumo' THEN mv.quantidade ELSE 0 END), 0)
              + COALESCE(SUM(CASE WHEN mv.tipo='acerto'  THEN mv.quantidade ELSE 0 END), 0)
            ) AS nivel
        FROM tbl_est_silos s
        LEFT JOIN movimentos_com_silo mv ON mv.silo_id = s.id
        WHERE s.ativo = true
        GROUP BY s.id, s.nome, s.capacidade_nominal, s.capacidade_operacional, s.unidade
        ORDER BY s.id
    """
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql)
        rows = [
            _with_silo_display_units(
                _serialize(dict(r)),
                ("entradas_silo", "consumo_total", "acerto_silo", "nivel"),
            )
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Relatório ───────────────────────────────────────────────────────────────

@router.get("/estoque/relatorio")
def relatorio(
    data_ini: Optional[str] = None,
    data_fim: Optional[str] = None,
    categoria: Optional[str] = None,
):
    """Retorna totais de entrada, consumo e acerto por material no período."""
    conditions = ["m.ativo = true"]
    params: list = []
    if data_ini:
        conditions.append("mv.data >= %s"); params.append(data_ini)
    if data_fim:
        conditions.append("mv.data <= %s"); params.append(data_fim)
    if categoria:
        conditions.append("m.categoria = %s"); params.append(categoria)

    where = " AND ".join(conditions)
    sql = f"""
        SELECT
            m.id,
            m.codigo,
            m.nome,
            m.categoria,
            m.unidade,
            COALESCE(SUM(CASE WHEN mv.tipo = 'entrada'  THEN mv.quantidade ELSE 0 END), 0) AS total_entradas,
            COALESCE(SUM(CASE WHEN mv.tipo = 'consumo'  THEN mv.quantidade ELSE 0 END), 0) AS total_consumo,
            COALESCE(SUM(CASE WHEN mv.tipo = 'acerto'   THEN mv.quantidade ELSE 0 END), 0) AS total_acerto,
            COUNT(mv.id) AS qtd_movimentos
        FROM tbl_est_materiais m
        LEFT JOIN tbl_est_movimentos mv
               ON mv.material_id = m.id
              AND {where}
        GROUP BY m.id, m.codigo, m.nome, m.categoria, m.unidade
        HAVING COUNT(mv.id) > 0 OR m.ativo = true
        ORDER BY m.categoria, m.nome
    """
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        rows = [
            _with_display_units(
                _serialize(dict(r)),
                ("total_entradas", "total_consumo", "total_acerto"),
            )
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Config Mapeamento Massada ────────────────────────────────────────────────

@router.get("/estoque/config-massada")
def listar_config_massada():
    """Retorna mapeamento de colunas do misturador para materiais do estoque."""
    sql = """
        SELECT c.id, c.coluna, c.label, c.material_id, c.ativo, c.ordem,
               c.fator_conversao,
               m.nome AS material_nome, m.codigo AS material_codigo,
               m.categoria AS material_categoria, m.unidade AS material_unidade
        FROM tbl_est_config_massada c
        LEFT JOIN tbl_est_materiais m ON m.id = c.material_id
        ORDER BY c.ordem, c.coluna
    """
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql)
        rows = [_serialize(dict(r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/estoque/config-massada/{config_id}")
def atualizar_config_massada(config_id: int, body: dict):
    """Atualiza label, material_id, fator_conversao e ativo de uma posição do mapeamento."""
    label            = body.get("label")
    material_id      = body.get("material_id")
    ativo            = body.get("ativo", True)
    fator_conversao  = body.get("fator_conversao", 1.0)
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT coluna FROM tbl_est_config_massada WHERE id=%s",
            (config_id,),
        )
        config = cur.fetchone()
        if not config:
            raise HTTPException(status_code=404, detail="Config não encontrada")
        if fator_conversao is None or float(fator_conversao) <= 0:
            raise HTTPException(status_code=422, detail="Fator de conversão deve ser maior que zero")
        if material_id:
            cur.execute(
                "SELECT unidade FROM tbl_est_materiais WHERE id=%s AND ativo=true",
                (material_id,),
            )
            material = cur.fetchone()
            if not material:
                raise HTTPException(status_code=422, detail="Material não encontrado ou inativo")
            esperado = _expected_massada_factor(config["coluna"], material["unidade"])
            if abs(float(fator_conversao) - esperado) > 0.0000001:
                raise HTTPException(
                    status_code=422,
                    detail=f"Fator esperado para {config['coluna']} → {material['unidade']}: {esperado}",
                )
        cur.execute(
            "UPDATE tbl_est_config_massada SET label=%s, material_id=%s, ativo=%s, fator_conversao=%s WHERE id=%s RETURNING id",
            (label, material_id, ativo, fator_conversao, config_id)
        )
        cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Consumo da Produção (a partir de tbl_massadas) ──────────────────────────

COLUNAS_MASSADA = [
    "real_agregado1","real_agregado2","real_agregado3","real_agregado4",
    "real_agregado5","real_agregado6","real_agregado7",
    "real_silo1","real_silo2","real_silo3","real_silo4",
    "real_aditivo1","real_aditivo2","real_aditivo3",
    "real_agua1",
]

@router.get("/estoque/consumo-producao")
def consumo_producao(
    data_ini: Optional[str] = None,
    data_fim: Optional[str] = None,
    produto:  Optional[str] = None,
):
    """
    Agrega consumo de materiais diretamente das massadas (produção real),
    cruzado com o mapeamento tbl_est_config_massada.
    """
    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. Buscar mapeamento
        cur.execute("""
            SELECT c.coluna, c.label, c.ativo,
                   m.id AS material_id, m.nome AS material_nome,
                   m.codigo AS material_codigo, m.categoria, m.unidade
            FROM tbl_est_config_massada c
            LEFT JOIN tbl_est_materiais m ON m.id = c.material_id
            ORDER BY c.ordem, c.coluna
        """)
        mapeamento = {r["coluna"]: dict(r) for r in cur.fetchall()}

        # 2. Montar query de agregação nas massadas
        sums_list = []
        for col in COLUNAS_MASSADA:
            db_col = col
            sums_list.append(f"COALESCE(SUM({db_col}), 0) AS {col}")
        sums = ", ".join(sums_list)
        conditions, params = ["data IS NOT NULL"], []
        if data_ini:
            conditions.append("data >= %s"); params.append(data_ini)
        if data_fim:
            conditions.append("data <= %s"); params.append(data_fim)
        if produto:
            conditions.append("produto = %s"); params.append(produto)
        where = " AND ".join(conditions)

        cur.execute(f"""
            SELECT
                COUNT(*) AS num_massadas,
                ROUND(COALESCE(SUM(qtd), 0)::numeric, 2) AS total_m3,
                {sums}
            FROM tbl_massadas
            WHERE {where}
        """, params)
        totais_row = _serialize(dict(cur.fetchone()))

        # Por produto
        cur.execute(f"""
            SELECT
                produto,
                COUNT(*) AS num_massadas,
                ROUND(COALESCE(SUM(qtd),0)::numeric,2) AS total_m3,
                {sums}
            FROM tbl_massadas
            WHERE {where}
            GROUP BY produto
            ORDER BY num_massadas DESC
        """, params)
        por_produto = [_serialize(dict(r)) for r in cur.fetchall()]

        cur.close(); conn.close()

        # 3. Montar resultado por coluna com label e material
        itens = []
        for col in COLUNAS_MASSADA:
            total = totais_row.get(col, 0) or 0
            if float(total) == 0:
                continue
            info = mapeamento.get(col, {})
            itens.append({
                "coluna":         col,
                "label":          info.get("label") or col,
                "total_kg":       round(float(total), 2),
                "material_id":    info.get("material_id"),
                "material_nome":  info.get("material_nome"),
                "material_codigo":info.get("material_codigo"),
                "categoria":      info.get("categoria"),
                "unidade":        info.get("unidade", "kg"),
                "mapeado":        info.get("material_id") is not None,
            })

        return {
            "num_massadas": int(totais_row.get("num_massadas") or 0),
            "total_m3":     float(totais_row.get("total_m3") or 0),
            "itens":        itens,
            "por_produto":  por_produto,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Sync Consumo Produção → tbl_est_movimentos ───────────────────────────────

@router.post("/estoque/sync-consumo-producao")
def sync_consumo_producao(
    data_ini: Optional[str] = None,
    data_fim: Optional[str] = None,
):
    """
    Gera/atualiza movimentos de CONSUMO em tbl_est_movimentos a partir da
    produção real registrada em tbl_massadas, usando o mapeamento de
    tbl_est_config_massada.  É idempotente: remove os consumos anteriores
    de origem='producao_massadas' no período antes de reinserir.

    data_ini / data_fim: YYYY-MM-DD (padrão: hoje)
    """
    from datetime import date as _date
    today = _date.today().isoformat()
    DATA_CORTE = "2026-04-22"  # Saldo zerado nesta data — ignorar produção anterior
    if not data_ini:
        data_ini = today
    if not data_fim:
        data_fim = today

    # Não processar antes da data de corte
    if data_ini < DATA_CORTE:
        data_ini = DATA_CORTE

    try:
        conn = _get_conn()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # 1. Buscar mapeamentos ativos com material vinculado
        cur.execute("""
            SELECT c.coluna, c.fator_conversao,
                   m.id AS material_id, m.nome AS material_nome,
                   m.unidade AS material_unidade, m.categoria AS material_categoria
            FROM tbl_est_config_massada c
            JOIN tbl_est_materiais m ON m.id = c.material_id
            WHERE c.ativo = true AND c.material_id IS NOT NULL
            ORDER BY c.ordem
        """)
        mappings = cur.fetchall()

        cur.execute("""
            SELECT id AS material_id, nome AS material_nome,
                   unidade AS material_unidade, categoria AS material_categoria
            FROM tbl_est_materiais
            WHERE codigo = 'ADD-FILL'
        """)
        silo1_filler_historico = cur.fetchone()
        if not silo1_filler_historico:
            raise HTTPException(status_code=500, detail="Material historico ADD-FILL nao encontrado")

        if not mappings:
            cur.close(); conn.close()
            return {"ok": True, "aviso": "Nenhum mapeamento ativo encontrado",
                    "movimentos_gerados": 0}

        # 2. Agregar consumo por (data, coluna) nas massadas do período
        colunas_mapeadas = [r["coluna"] for r in mappings]
        invalidas = sorted(set(colunas_mapeadas) - set(COLUNAS_MASSADA))
        if invalidas:
            raise HTTPException(status_code=422, detail=f"Colunas de massada inválidas: {invalidas}")
        sums_sql_list = []
        for col in colunas_mapeadas:
            db_col = col
            sums_sql_list.append(f"COALESCE(SUM({db_col}), 0) AS {col}")
        sums_sql = ", ".join(sums_sql_list)
        cur.execute(f"""
            SELECT data, {sums_sql}
            FROM tbl_massadas
            WHERE data >= %s AND data <= %s AND data IS NOT NULL
            GROUP BY data
            ORDER BY data
        """, (data_ini, data_fim))
        por_dia = cur.fetchall()

        if not por_dia:
            cur.close(); conn.close()
            return {"ok": True, "aviso": f"Sem massadas no período {data_ini} → {data_fim}",
                    "movimentos_gerados": 0}

        # 3. Apagar consumos automáticos anteriores no período
        cur2 = conn.cursor()
        cur2.execute("""
            DELETE FROM tbl_est_movimentos
            WHERE origem = 'producao_massadas'
              AND data >= %s AND data <= %s
        """, (data_ini, data_fim))
        deleted = cur2.rowcount

        # 4. Inserir novos consumos: um por (material, dia)
        inseridos = 0
        for row in por_dia:
            dia = row["data"]
            for mp in mappings:
                material = (
                    silo1_filler_historico
                    if mp["coluna"] == "real_silo1" and dia < SILO1_CP_V_DESDE
                    else mp
                )
                col   = mp["coluna"]
                fator = _fator_consumo_massada(
                    col,
                    mp["fator_conversao"],
                    material.get("material_categoria"),
                    material.get("material_unidade"),
                )
                qtd_raw = float(row.get(col) or 0)
                if qtd_raw <= 0:
                    continue
                qtd = round(qtd_raw * fator, 6)
                if qtd <= 0:
                    continue
                cur2.execute("""
                    INSERT INTO tbl_est_movimentos
                        (material_id, tipo, data, quantidade, unidade, origem, silo_id, observacao)
                    VALUES (%s, 'consumo', %s, %s, %s, 'producao_massadas', %s, %s)
                """, (
                    material["material_id"],
                    dia,
                    qtd,
                    _unidade_consumo_massada(material.get("material_categoria"), material.get("material_unidade")),
                    _silo_id_from_massada_col(mp["coluna"]),
                    f"Consumo produção {dia} [{mp['coluna']}]",
                ))
                inseridos += 1

        conn.commit()
        cur.close(); cur2.close(); conn.close()

        return {
            "ok": True,
            "periodo": {"inicio": data_ini, "fim": data_fim},
            "dias_processados": len(por_dia),
            "movimentos_removidos": deleted,
            "movimentos_gerados": inseridos,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
