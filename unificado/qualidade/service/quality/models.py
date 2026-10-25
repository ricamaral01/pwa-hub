from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DraftIn(BaseModel):
    empresa_id: UUID
    unidade_codigo: str
    titulo: str = ""
    descricao: str = ""
    origem_id: UUID | None = None
    tipo_id: UUID | None = None
    gravidade_id: UUID | None = None
    area_emissora_id: UUID | None = None
    local_id: UUID | None = None
    atividade_id: UUID | None = None
    emitente_nome: str | None = None
    data_emissao: date | None = None
    identificacao_texto: str | None = None
    numero_anterior_texto: str | None = None
    requisito_texto: str | None = None
    setor_pcp_id: str | None = None
    setor_codigo_snapshot: str | None = None
    setor_nome_snapshot: str | None = None
    produto_pcp_id: str | None = None
    produto_codigo_snapshot: str | None = None
    produto_nome_snapshot: str | None = None
    produto_texto: str | None = None
    lote_texto: str | None = None
    data_deteccao: datetime | None = None
    data_ocorrencia: datetime | None = None
    impacto: str | None = None
    evidencias_texto: str | None = None
    processo_texto: str | None = None
    fornecedor_texto: str | None = None
    cliente_texto: str | None = None
    pedido_texto: str | None = None
    cliente_afetado: bool = False
    envolvidos_funcoes: str | None = None
    causas_provaveis: str | None = None
    equipe_texto: str | None = None
    sistematica_adequada: bool | None = None
    sistematica_seguida: bool | None = None
    poka_yoke_possivel: bool | None = None
    alterar_documentos: bool | None = None
    documentos_alterar_texto: str | None = None
    verificar_eficacia_a_partir: date | None = None


class FormIn(BaseModel):
    processo_texto: str | None = None
    emitente_nome: str | None = None
    data_emissao: date | None = None
    identificacao_texto: str | None = None
    numero_anterior_texto: str | None = None
    requisito_texto: str | None = None
    descricao: str | None = None
    evidencias_texto: str | None = None
    local_id: UUID | None = None
    atividade_id: UUID | None = None
    data_ocorrencia: datetime | None = None
    envolvidos_funcoes: str | None = None
    causas_provaveis: str | None = None
    equipe_texto: str | None = None
    sistematica_adequada: bool | None = None
    sistematica_seguida: bool | None = None
    poka_yoke_possivel: bool | None = None
    alterar_documentos: bool | None = None
    documentos_alterar_texto: str | None = None
    verificar_eficacia_a_partir: date | None = None


class RegistrationIn(BaseModel):
    mobile: bool = False
    titulo: str | None = None
    origem_id: UUID | None = None
    tipo_id: UUID | None = None
    gravidade_id: UUID | None = None
    data_deteccao: datetime | None = None


class TriageIn(BaseModel):
    origem_id: UUID | None = None
    gravidade_id: UUID
    tipo_id: UUID
    area_responsavel_id: UUID
    responsavel_id: str
    prazo_final: date
    observacoes: str | None = None


class ContainmentIn(BaseModel):
    disposicao_id: UUID
    descricao: str
    quantidade_bloqueada: float | None = None
    aprovador_id: str | None = None
    responsavel_texto: str | None = None
    prazo: date | None = None


class CauseIn(BaseModel):
    metodo: str
    problema: str
    causa_raiz: str
    pode_ocorrer_outro_local: bool
    outro_local_descricao: str | None = None
    porques: list[str] = Field(default_factory=list, max_length=5)
    metodo_payload: dict = Field(default_factory=dict)


class ActionIn(BaseModel):
    tipo: str
    o_que: str
    por_que: str | None = None
    onde: str | None = None
    quem_id: str | None = None
    quando: date | None = None
    como: str | None = None
    quanto: float | None = None


class ActionFinishIn(BaseModel):
    evidencia: str


class ActionPatch(BaseModel):
    tipo: str | None = None
    o_que: str | None = None
    por_que: str | None = None
    onde: str | None = None
    quem_id: str | None = None
    quando: date | None = None
    como: str | None = None
    quanto: float | None = None


class ReasonIn(BaseModel):
    motivo: str


class EffectivenessIn(BaseModel):
    criterio: str
    resultado: str
    notas: str | None = None
    verificador_id: str | None = None


class EffectivenessFollowupIn(BaseModel):
    data: date
    evidencia: str


class ClosureIn(BaseModel):
    atualizar_riscos: bool
    justificativa_riscos: str
    revisar_documento: bool
    justificativa_documento: str
    treinamento: bool = False
    conclusao: str


class CommentIn(BaseModel):
    texto: str


class LinkIn(BaseModel):
    relacionada_id: UUID
    tipo: str


class DocumentRefIn(BaseModel):
    codigo: str
    revisao: str | None = None
    papel: str


class ContactIn(BaseModel):
    email: str


class CatalogIn(BaseModel):
    empresa_id: UUID
    unidade_codigo: str | None = None
    codigo: str
    nome: str
    ativo: bool = True
    prazo_causa_dias: int | None = None
    prazo_final_dias: int | None = None
    acao_corretiva_obrigatoria: bool | None = None
    corretiva_se_recorrente: bool | None = None


class CatalogPatch(BaseModel):
    codigo: str | None = None
    nome: str | None = None
    ativo: bool | None = None
    prazo_causa_dias: int | None = None
    prazo_final_dias: int | None = None
    acao_corretiva_obrigatoria: bool | None = None
    corretiva_se_recorrente: bool | None = None


class ContactPatch(BaseModel):
    email: str | None = None
    ativo: bool | None = None


class NcList(BaseModel):
    items: list[dict]
    total: int
