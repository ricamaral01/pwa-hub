import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { apiGet, getApiErrorMessage } from '@/api/client';
import {
  cancelProductionOrder,
  createCadastro,
  inactivateCadastro,
  listCadastros,
  reactivateCadastro,
  updateCadastro,
  type CadastroPayload,
  type CadastroRecord,
} from '@/features/cadastros/api';
import { findCadastroResource } from '@/features/cadastros/resources';
import { DataTable, DesktopShell, FilterBar, Pagination } from '@/ui/desktop';

const EMPTY_FILTER = '';

export default function CadastrosPage() {
  const { resource: resourceSlug } = useParams();
  const resource = findCadastroResource(resourceSlug);
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [ativo, setAtivo] = useState(EMPTY_FILTER);
  const [editing, setEditing] = useState<CadastroRecord | null>(null);
  const [showForm, setShowForm] = useState(resource.slug !== 'collaborators');
  const [details, setDetails] = useState<CadastroRecord | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(getInitialForm(resource.slug));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const queryKey = useMemo(() => ['cadastros', resource.slug, q, ativo], [resource.slug, q, ativo]);
  useEffect(() => {
    setEditing(null);
    setShowForm(resource.slug !== 'collaborators');
    setDetails(null);
    setForm(getInitialForm(resource.slug));
    setFieldErrors({});
    setError(null);
  }, [resource.slug]);

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: () => listCadastros(resource.slug, q, ativo),
  });
  const { data: resinsData } = useQuery({
    queryKey: ['cadastro-options', 'resins'],
    queryFn: () => listCadastros('resins', '', 'true'),
    enabled: resource.slug === 'resin-lots',
  });
  const { data: suppliersData } = useQuery({
    queryKey: ['cadastro-options', 'suppliers'],
    queryFn: () => listCadastros('suppliers', '', 'true'),
    enabled: resource.slug === 'resin-lots',
  });
  const { data: functionsData } = useQuery({
    queryKey: ['cadastro-options', 'functions'],
    queryFn: () => listCadastros('functions', '', 'true'),
    enabled: resource.slug === 'collaborators',
  });
  const records = data?.data ?? [];
  const { data: biometricStatuses } = useQuery({
    queryKey: ['collaborator-biometrics', records.map((record) => record.id).join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        records.map(async (record) => {
          try {
            const response = await fetchStatus(String(record.id));
            return [String(record.id), response] as const;
          } catch {
            return [String(record.id), null] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: resource.slug === 'collaborators' && records.length > 0,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: CadastroPayload) =>
      editing?.id
        ? updateCadastro(resource.slug, String(editing.id), payload)
        : createCadastro(resource.slug, payload),
    onSuccess: async () => {
      setEditing(null);
      setForm(getInitialForm(resource.slug));
      setShowForm(resource.slug !== 'collaborators');
      setError(null);
      setFieldErrors({});
      await queryClient.invalidateQueries({ queryKey: ['cadastros', resource.slug] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? reactivateCadastro(resource.slug, id) : inactivateCadastro(resource.slug, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cadastros', resource.slug] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, justificativa }: { id: string; justificativa: string }) =>
      cancelProductionOrder(id, justificativa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cadastros', resource.slug] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(resource.slug, form);
    setFieldErrors(validation);
    if (Object.keys(validation).length) {
      setError('Corrija os campos destacados antes de salvar.');
      return;
    }
    const payload = resource.fields.reduce<CadastroPayload>((acc, field) => {
      const value = form[field.name];
      if (value === '' || value === undefined || field.readonly) return acc;
      acc[field.name] = field.type === 'number' ? Number(value) : value;
      return acc;
    }, {});
    saveMutation.mutate(payload);
  };

  const startEdit = (record: CadastroRecord) => {
    setEditing(record);
    setShowForm(true);
    setForm(
      resource.fields.reduce<Record<string, string | boolean>>((acc, field) => {
        const value = record[field.name];
        acc[field.name] = typeof value === 'boolean' ? value : String(value ?? '');
        return acc;
      }, {}),
    );
  };

  const relationOptions = {
    resins: (resinsData?.data ?? []).map((item) => ({
      value: String(item.id),
      label: String(item.codigo ?? '') + ' - ' + String(item.descricao ?? ''),
    })),
    suppliers: (suppliersData?.data ?? []).map((item) => ({
      value: String(item.id),
      label: String(item.documento ?? '') + ' - ' + String(item.nome ?? ''),
    })),
    functions: (functionsData?.data ?? []).map((item) => ({
      value: String(item.id),
      label: formatFunctionLabel(item),
    })),
  };
  const isCollaborators = resource.slug === 'collaborators';

  return (
    <DesktopShell
      title={resource.title}
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {isCollaborators ? (
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(getInitialForm(resource.slug));
                setShowForm(true);
              }}
            >
              Novo colaborador
            </Button>
          ) : null}
          <Link className="btn btn-md btn-surface" to="/admin" style={{ textDecoration: 'none' }}>
            Voltar
          </Link>
        </div>
      }
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <FilterBar>
            <label style={{ display: 'grid', gap: 6, flex: 1 }}>
              <span className="field-label-text">Busca</span>
              <input value={q} onChange={(event) => setQ(event.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: 6, width: 180 }}>
              <span className="field-label-text">Status</span>
              <select value={ativo} onChange={(event) => setAtivo(event.target.value)}>
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </label>
          </FilterBar>

          {showForm ? (
            <form
              onSubmit={submit}
              style={{
                display: 'grid',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                background: isCollaborators ? 'var(--bg-secondary)' : 'var(--bg-card)',
              }}
            >
              {isCollaborators ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>
                      {editing ? 'Editar colaborador' : 'Novo colaborador'}
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                      Informe matricula, nome, funcao e PIN operacional quando aplicavel.
                    </p>
                  </div>
                </div>
              ) : null}
              {resource.appendOnly && editing ? (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                  Este cadastro e historico. Crie uma nova versao em vez de editar a anterior.
                </p>
              ) : null}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 'var(--space-3)',
                }}
              >
                {resource.fields.map((field) => (
                  <label key={field.name} style={{ display: 'grid', gap: 6 }}>
                    <span className="field-label-text">{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={String(form[field.name] ?? '')}
                        required={field.required}
                        onChange={(event) =>
                          setForm((state) => ({ ...state, [field.name]: event.target.value }))
                        }
                      />
                    ) : field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.name])}
                        onChange={(event) =>
                          setForm((state) => ({ ...state, [field.name]: event.target.checked }))
                        }
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={String(form[field.name] ?? '')}
                        required={field.required}
                        onChange={(event) =>
                          setForm((state) => ({ ...state, [field.name]: event.target.value }))
                        }
                      >
                        <option value="">Selecione</option>
                        {(field.optionsFrom
                          ? relationOptions[field.optionsFrom]
                          : (field.options ?? [])
                        ).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type ?? 'text'}
                        value={String(form[field.name] ?? '')}
                        required={field.required}
                        readOnly={field.readonly}
                        onChange={(event) =>
                          setForm((state) => ({ ...state, [field.name]: event.target.value }))
                        }
                      />
                    )}
                    {fieldErrors[field.name] ? (
                      <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
                        {fieldErrors[field.name]}
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
              {error ? <p style={{ color: 'var(--color-danger)', margin: 0 }}>{error}</p> : null}
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  type="submit"
                  loading={saveMutation.isPending}
                  disabled={resource.appendOnly && Boolean(editing)}
                >
                  {editing ? 'Salvar' : 'Criar'}
                </Button>
                {editing ? (
                  <Button
                    type="button"
                    variant="surface"
                    onClick={() => {
                      setEditing(null);
                      setForm(getInitialForm(resource.slug));
                      setFieldErrors({});
                      setShowForm(resource.slug !== 'collaborators');
                    }}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}

          {details ? (
            <section
              aria-label="Detalhes do colaborador"
              style={{
                display: 'grid',
                gap: 8,
                padding: 'var(--space-4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
              }}
            >
              <strong>{String(details.nome ?? '-')}</strong>
              <span>Matricula: {String(details.matricula ?? '-')}</span>
              <span>Funcao: {formatFunctionName(details, relationOptions.functions)}</span>
              <span>Status: {details.ativo ? 'Ativo' : 'Inativo'}</span>
            </section>
          ) : null}

          <DataTable>
            <thead>
              <tr>
                {(isCollaborators
                  ? ['Matricula', 'Nome', 'Funcao', 'Status', 'Biometria']
                  : resource.columns
                ).map((column) => (
                  <th key={column} style={cellStyle}>
                    {formatHeader(column)}
                  </th>
                ))}
                <th style={cellStyle}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={String(record.id)}>
                  {isCollaborators ? (
                    <>
                      <td style={cellStyle}>{formatCellValue(record.matricula)}</td>
                      <td style={cellStyle}>{formatCellValue(record.nome)}</td>
                      <td style={cellStyle}>
                        {formatFunctionName(record, relationOptions.functions)}
                      </td>
                      <td style={cellStyle}>{record.ativo ? 'Ativo' : 'Inativo'}</td>
                      <td style={cellStyle}>
                        <BiometricStatusBadge status={biometricStatuses?.[String(record.id)]} />
                      </td>
                    </>
                  ) : (
                    resource.columns.map((column) => (
                      <td key={column} style={cellStyle}>
                        {formatCellValue(record[column])}
                      </td>
                    ))
                  )}
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {isCollaborators ? (
                        <>
                          <Button
                            type="button"
                            variant="surface"
                            onClick={() => setDetails(record)}
                          >
                            Ver detalhes
                          </Button>
                          <Link
                            className="btn btn-md btn-surface"
                            to={`/admin/cadastros/colaboradores/${String(record.id)}/biometria`}
                            style={{ textDecoration: 'none' }}
                          >
                            Biometria facial
                          </Link>
                        </>
                      ) : null}
                      <Button type="button" variant="surface" onClick={() => startEdit(record)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="surface"
                        loading={activeMutation.isPending}
                        onClick={() =>
                          activeMutation.mutate({
                            id: String(record.id),
                            active: !record.ativo,
                          })
                        }
                      >
                        {record.ativo ? 'Inativar' : 'Reativar'}
                      </Button>
                      {resource.supportsCancel && record.status === 'ABERTA' ? (
                        <Button
                          type="button"
                          variant="surface"
                          loading={cancelMutation.isPending}
                          onClick={() => {
                            const justificativa = window.prompt('Justificativa de cancelamento');
                            if (justificativa)
                              cancelMutation.mutate({ id: String(record.id), justificativa });
                          }}
                        >
                          Cancelar OP
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!records.length ? (
                <tr>
                  <td
                    style={cellStyle}
                    colSpan={(isCollaborators ? 5 : resource.columns.length) + 1}
                  >
                    {isFetching ? 'Carregando...' : 'Nenhum registro encontrado.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </DataTable>
          <Pagination total={data?.meta.total ?? 0} />
        </section>
      </div>
    </DesktopShell>
  );
}

function getInitialForm(resourceSlug: string): Record<string, string | boolean> {
  if (resourceSlug === 'resin-lots') {
    return { origem: 'COMPRA', status: 'DISPONIVEL', ativo: true };
  }
  return { ativo: true };
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ativo' : 'Inativo';
  if (typeof value === 'string' && isUuid(value)) return 'identificador interno';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
  if (typeof value === 'object') return 'detalhe interno';
  return '-';
}

type FaceStatus = {
  ativa?: boolean;
  modeloNome?: string | null;
  modeloVersao?: string | null;
  qualidade?: string | number | null;
  ultimaUtilizacaoEm?: string | null;
  emitidaEm?: string | null;
};

function fetchStatus(id: string): Promise<FaceStatus> {
  return apiGet<FaceStatus>(`/employees/${id}/face-enrollment/status`);
}

function formatHeader(column: string): string {
  const labels: Record<string, string> = {
    ativo: 'Status',
    funcaoId: 'Funcao',
  };
  return labels[column] ?? column;
}

function formatFunctionLabel(record: CadastroRecord): string {
  const codigo = String(record.codigo ?? '').trim();
  const descricao = String(record.descricao ?? '').trim();
  return [codigo, descricao].filter(Boolean).join(' - ') || 'Funcao sem nome';
}

function formatFunctionName(
  record: CadastroRecord,
  options: Array<{ value: string; label: string }>,
): string {
  const value = String(record.funcaoId ?? '');
  return options.find((option) => option.value === value)?.label ?? 'Funcao nao encontrada';
}

function BiometricStatusBadge({ status }: { status: FaceStatus | null | undefined }) {
  const state = biometricState(status);
  const styles: Record<string, { color: string; icon: string }> = {
    'Nao cadastrada': { color: 'var(--text-muted)', icon: '○' },
    Ativa: { color: 'var(--color-green)', icon: '●' },
    Bloqueada: { color: 'var(--color-warning)', icon: '!' },
    Revogada: { color: 'var(--color-danger)', icon: '×' },
    'Incompativel com o modelo atual': { color: 'var(--color-warning)', icon: '!' },
  };
  const style = styles[state];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: style.color }}>
      <span aria-hidden="true">{style.icon}</span>
      {state}
    </span>
  );
}

function biometricState(status: FaceStatus | null | undefined): string {
  if (!status) return 'Nao cadastrada';
  if (!status.ativa && status.emitidaEm) return 'Revogada';
  if (!status.ativa) return 'Nao cadastrada';
  if (
    status.modeloNome &&
    (status.modeloNome !== 'opencv_sface' || status.modeloVersao !== '2021dec-int8bq')
  ) {
    return 'Incompativel com o modelo atual';
  }
  return 'Ativa';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateForm(
  resourceSlug: string,
  form: Record<string, string | boolean>,
): Record<string, string> {
  if (resourceSlug !== 'resin-lots') return {};
  const errors: Record<string, string> = {};
  if (!form.codigo) errors.codigo = 'Informe o codigo do lote.';
  if (!form.resinaId) errors.resinaId = 'Selecione uma resina cadastrada.';
  if (!form.origem) errors.origem = 'Selecione a origem.';
  if (form.origem === 'COMPRA' && !form.fornecedorId) {
    errors.fornecedorId = 'Selecione um fornecedor para origem Compra.';
  }
  const quantidade = Number(form.quantidadeInicialKg);
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    errors.quantidadeInicialKg = 'Informe quantidade inicial maior que zero.';
  }
  if (!form.dataRecebimento) errors.dataRecebimento = 'Informe a data de recebimento.';
  if (!form.status) errors.status = 'Selecione o status.';
  if (form.custoPorKg !== undefined && form.custoPorKg !== '') {
    const custo = Number(form.custoPorKg);
    if (!Number.isFinite(custo) || custo < 0)
      errors.custoPorKg = 'Custo por kg nao pode ser negativo.';
  }
  return errors;
}
const cellStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--border-subtle)',
  textAlign: 'left',
} as const;
