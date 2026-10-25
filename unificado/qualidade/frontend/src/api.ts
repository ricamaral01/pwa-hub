export const API = '/unificado/qualidade/api';

export type User = { id: string; name: string; actions: string[]; superuser: boolean };
export type Unit = { codigo: string; nome: string; empresa_id: string };
export type Company = { id: string; codigo: string; nome: string };
export type Context = { user: User; units: Unit[]; companies: Company[]; active_unit: string | null; last_unit: string | null };
export type CatalogRow = { id: string; codigo: string; nome: string };
export type Catalogs = { origem: CatalogRow[]; tipo: CatalogRow[]; gravidade: CatalogRow[]; area: CatalogRow[]; disposicao: CatalogRow[]; local: CatalogRow[]; atividade: CatalogRow[] };
export type Nc = { id: string; numero: string | null; titulo: string; descricao: string; status: string; unidade_codigo: string; criado_por: string; responsavel_id: string | null; prazo_final: string | null; em_atraso?: boolean; legado: boolean; area_responsavel_id: string | null; gravidade_id: string | null; criado_em: string; empresa_id: string; origem_id?: string|null; local_id?: string|null; atividade_id?: string|null; processo_texto?: string|null; emitente_nome?: string|null; data_emissao?: string|null; identificacao_texto?: string|null; numero_anterior_texto?: string|null; requisito_texto?: string|null; evidencias_texto?: string|null; data_ocorrencia?: string|null; envolvidos_funcoes?: string|null; causas_provaveis?: string|null; equipe_texto?: string|null; sistematica_adequada?: boolean|null; sistematica_seguida?: boolean|null; poka_yoke_possivel?: boolean|null; alterar_documentos?: boolean|null; documentos_alterar_texto?: string|null; verificar_eficacia_a_partir?: string|null };
export type Detail = { nc: Nc; nc_contencao: Record<string, unknown>[]; nc_causa: Record<string, unknown>[]; nc_acao: Record<string, unknown>[]; nc_eficacia: Record<string, unknown>[]; nc_eficacia_acompanhamento: Record<string, unknown>[]; nc_vinculo: Record<string, unknown>[]; nc_encerramento: Record<string, unknown>[]; nc_documento_ref: Record<string, unknown>[]; nc_anexo: Record<string, unknown>[]; nc_evento: Record<string, unknown>[]; nc_comentario: Record<string, unknown>[]; campos_pendentes: string[]; cliente_pendente: boolean };

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API}${path}`, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) {
    let detail = `Erro ${response.status}`;
    try { const body = await response.json(); detail = typeof body.detail === 'string' ? body.detail : detail; } catch { /* preserve status */ }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function post<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });
}

export function put<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(data) });
}

export function patch<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
}

export function can(ctx: Context, action: string): boolean {
  return ctx.user.superuser || ctx.user.actions.includes(action);
}
