import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { getApiErrorMessage } from '@/api/client';
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
import { cadastroResources, findCadastroResource } from '@/features/cadastros/resources';

const EMPTY_FILTER = '';

export default function CadastrosPage() {
  const { resource: resourceSlug } = useParams();
  const resource = findCadastroResource(resourceSlug);
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [ativo, setAtivo] = useState(EMPTY_FILTER);
  const [editing, setEditing] = useState<CadastroRecord | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(getInitialForm(resource.slug));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const queryKey = useMemo(() => ['cadastros', resource.slug, q, ativo], [resource.slug, q, ativo]);
  useEffect(() => {
    setEditing(null);
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

  const saveMutation = useMutation({
    mutationFn: (payload: CadastroPayload) =>
      editing?.id
        ? updateCadastro(resource.slug, String(editing.id), payload)
        : createCadastro(resource.slug, payload),
    onSuccess: async () => {
      setEditing(null);
      setForm(getInitialForm(resource.slug));
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
    setForm(
      resource.fields.reduce<Record<string, string | boolean>>((acc, field) => {
        const value = record[field.name];
        acc[field.name] = typeof value === 'boolean' ? value : String(value ?? '');
        return acc;
      }, {}),
    );
  };

  const records = data?.data ?? [];
  const relationOptions = {
    resins: (resinsData?.data ?? []).map((item) => ({
      value: String(item.id),
      label: String(item.codigo ?? '') + ' - ' + String(item.descricao ?? ''),
    })),
    suppliers: (suppliersData?.data ?? []).map((item) => ({
      value: String(item.id),
      label: String(item.documento ?? '') + ' - ' + String(item.nome ?? ''),
    })),
  };

  return (
    <main
      style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 'var(--space-6)' }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 'var(--space-5)' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="field-label-text">Cadastros</p>
            <h1>{resource.title}</h1>
          </div>
          <Link className="btn btn-md btn-surface" to="/admin" style={{ textDecoration: 'none' }}>
            Voltar
          </Link>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--space-4)' }}>
          <nav
            aria-label="Cadastros disponiveis"
            style={{
              display: 'grid',
              alignContent: 'start',
              gap: 'var(--space-2)',
              borderRight: '1px solid var(--border-subtle)',
              paddingRight: 'var(--space-3)',
            }}
          >
            {cadastroResources.map((item) => (
              <Link
                key={item.slug}
                to={`/admin/cadastros/${item.slug}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  color: item.slug === resource.slug ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: item.slug === resource.slug ? 'var(--bg-card)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'end' }}>
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
            </div>

            <form
              onSubmit={submit}
              style={{
                display: 'grid',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
              }}
            >
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
                    }}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>

            <div
              style={{
                overflowX: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <table
                style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}
              >
                <thead>
                  <tr>
                    {resource.columns.map((column) => (
                      <th key={column} style={cellStyle}>
                        {column}
                      </th>
                    ))}
                    <th style={cellStyle}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={String(record.id)}>
                      {resource.columns.map((column) => (
                        <td key={column} style={cellStyle}>
                          {String(record[column] ?? '')}
                        </td>
                      ))}
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', gap: 8 }}>
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
                                const justificativa = window.prompt(
                                  'Justificativa de cancelamento',
                                );
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
                      <td style={cellStyle} colSpan={resource.columns.length + 1}>
                        {isFetching ? 'Carregando...' : 'Nenhum registro encontrado.'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function getInitialForm(resourceSlug: string): Record<string, string | boolean> {
  if (resourceSlug === 'resin-lots') {
    return { origem: 'COMPRA', status: 'DISPONIVEL', ativo: true };
  }
  return { ativo: true };
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
