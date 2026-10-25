'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Eye, EyeOff, KeyRound, Plus, UserX, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';

const ROLE_LABELS: Record<string, string> = {
  OPERACIONAL: 'Operacional',
  COLABORADOR: 'Colaborador',
  SUPERVISOR: 'Supervisor/Líder',
  QUALIDADE: 'Qualidade',
  GERENCIA: 'Gerência',
  DIRETORIA: 'Diretoria',
  ADMIN_MASTER: 'Administrador Master',
  ADMIN: 'Administrador',
};

const ROLE_COLORS: Record<string, string> = {
  OPERACIONAL: 'bg-gray-100 text-gray-700',
  COLABORADOR: 'bg-sky-100 text-sky-700',
  SUPERVISOR: 'bg-purple-100 text-purple-700',
  QUALIDADE: 'bg-blue-100 text-blue-700',
  GERENCIA: 'bg-amber-100 text-amber-800',
  DIRETORIA: 'bg-indigo-100 text-indigo-700',
  ADMIN_MASTER: 'bg-red-100 text-red-700',
  ADMIN: 'bg-red-100 text-red-700',
};

interface UserRow {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: string;
  department_id?: string | null;
  department_name?: string | null;
  job_title?: string | null;
  active: boolean;
  must_change_password: boolean;
  last_login_at?: string | null;
  password_changed_at?: string | null;
  created_at: string;
  permissions?: string[];
}

interface OptionData {
  roles: string[];
  departments: { id: string; code: string; name: string }[];
  permissions: { key: string; description: string }[];
}

interface UserForm {
  name: string;
  username: string;
  email: string;
  department_id: string;
  job_title: string;
  role: string;
  active: boolean;
  must_change_password: boolean;
  password: string;
  confirm_password: string;
  extra_permissions: string[];
}

export default function UsersPage() {
  useRequireAuth();
  const { user, isLoading } = useAuth();
  const isRicardo = user?.id === 'f4ad0ccf-888e-4d14-aa7a-8b595bf9f459';
  const [users, setUsers] = useState<UserRow[]>([]);
  const [options, setOptions] = useState<OptionData>({ roles: [], departments: [], permissions: [] });
  const [filters, setFilters] = useState({ name: '', email: '', role: '', department_id: '', active: '', must_change_password: '' });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; user?: UserRow } | null>(null);
  const [passwordModal, setPasswordModal] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<UserForm>();
  const passwordForm = useForm<{ password: string; confirm_password: string }>();
  const watchedRole = form.watch('role');
  const watchedPassword = form.watch('password') || '';

  async function load() {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const [usersRes, optionsRes] = await Promise.all([usersApi.list(params), usersApi.options()]);
      setUsers(usersRes.data);
      setOptions(optionsRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (!isLoading && isRicardo) load(); }, [isLoading, isRicardo]);

  const rolePermissions = useMemo(() => {
    const matrix: Record<string, string[]> = {
      OPERACIONAL: ['documents.read', 'documents.download'],
      COLABORADOR: ['documents.read', 'documents.download', 'documents.create', 'documents.upload', 'documents.submit'],
      SUPERVISOR: ['documents.approve_technical', 'documents.reject', 'documents.comment'],
      QUALIDADE: ['documents.approve_quality', 'documents.publish', 'documents.make_obsolete', 'audit.read'],
      GERENCIA: ['documents.approve_final', 'documents.publish', 'documents.make_obsolete'],
      DIRETORIA: ['documents.approve_final', 'audit.read'],
      ADMIN_MASTER: options.permissions.map((p) => p.key),
      ADMIN: options.permissions.map((p) => p.key),
    };
    return matrix[watchedRole] || [];
  }, [watchedRole, options.permissions]);

  function openCreate() {
    form.reset({
      name: '', username: '', email: '', role: 'OPERACIONAL', department_id: '', job_title: '',
      active: true, must_change_password: true, password: '', confirm_password: '', extra_permissions: [],
    });
    setModal({ mode: 'create' });
  }

  async function openEdit(user: UserRow) {
    const res = await usersApi.getById(user.id);
    const full = res.data;
    form.reset({
      name: full.name,
      username: full.username || '',
      email: full.email,
      role: full.role,
      department_id: full.department_id || '',
      job_title: full.job_title || '',
      active: full.active,
      must_change_password: full.must_change_password,
      password: '',
      confirm_password: '',
      extra_permissions: full.permissions || [],
    });
    setModal({ mode: 'edit', user });
  }

  async function onSubmit(data: UserForm) {
    if (modal?.mode === 'create' && data.password !== data.confirm_password) {
      toast.error('As senhas não conferem.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...data, extra_permissions: data.extra_permissions || [] };
      delete (payload as any).confirm_password;
      if (modal?.mode === 'create') {
        await usersApi.create(payload);
        toast.success('Usuário criado.');
      } else if (modal?.user) {
        delete (payload as any).password;
        await usersApi.update(modal.user.id, payload);
        toast.success('Usuário atualizado.');
      }
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function onResetPassword(data: { password: string; confirm_password: string }) {
    if (!passwordModal) return;
    if (data.password !== data.confirm_password) return toast.error('As senhas não conferem.');
    setSaving(true);
    try {
      await usersApi.resetPassword(passwordModal.id, data.password);
      toast.success('Senha temporária redefinida.');
      setPasswordModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(user: UserRow) {
    if (!confirm(`Desativar ${user.name}?`)) return;
    await usersApi.remove(user.id);
    toast.success('Usuário desativado.');
    load();
  }

  const passwordRules = [
    ['8 caracteres', watchedPassword.length >= 8],
    ['Maiúscula', /[A-Z]/.test(watchedPassword)],
    ['Minúscula', /[a-z]/.test(watchedPassword)],
    ['Número', /[0-9]/.test(watchedPassword)],
    ['Especial', /[^A-Za-z0-9]/.test(watchedPassword)],
  ];

  if (!isRicardo)
    return <p role="alert">Você não tem acesso a esta tela.</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários e permissões</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <input className={inputClass} placeholder="Nome" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
        <input className={inputClass} placeholder="E-mail" value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} />
        <select className={inputClass} value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">Todos os perfis</option>
          {options.roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
        </select>
        <select className={inputClass} value={filters.department_id} onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}>
          <option value="">Todos os setores</option>
          {options.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className={inputClass} value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })}>
          <option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option>
        </select>
        <button onClick={load} className="rounded-lg bg-gray-900 text-white text-sm font-semibold px-4 py-2">Filtrar</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-10 text-center text-gray-400">Carregando...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>{['Nome', 'Usuário', 'E-mail', 'Setor', 'Perfil', 'Status', 'Senha', 'Último acesso', 'Criado em', 'Ações'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{u.name}</td>
                    <td className="px-4 py-3">{u.username || '-'}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.department_name || '-'}</td>
                    <td className="px-4 py-3"><span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', ROLE_COLORS[u.role])}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td className="px-4 py-3">{u.active ? 'Ativo' : 'Inativo'}</td>
                    <td className="px-4 py-3">{u.must_change_password ? 'Troca pendente' : 'Definitiva'}</td>
                    <td className="px-4 py-3 text-xs">{u.last_login_at ? format(new Date(u.last_login_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}</td>
                    <td className="px-4 py-3 text-xs">{format(new Date(u.created_at), 'dd/MM/yyyy', { locale: ptBR })}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <IconButton label="Editar" icon={<Edit2 size={15} />} onClick={() => openEdit(u)} />
                        <IconButton label="Redefinir senha" icon={<KeyRound size={15} />} onClick={() => { passwordForm.reset(); setPasswordModal(u); }} />
                        {u.active && <IconButton label="Desativar" danger icon={<UserX size={15} />} onClick={() => deactivate(u)} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">{modal.mode === 'create' ? 'Novo usuário' : 'Editar usuário'}</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nome completo"><input className={inputClass} {...form.register('name', { required: true })} /></Field>
                <Field label="Nome de usuário"><input className={inputClass} {...form.register('username', { required: true })} /></Field>
                <Field label="E-mail"><input type="email" className={inputClass} {...form.register('email', { required: true })} /></Field>
                <Field label="Cargo"><input className={inputClass} {...form.register('job_title')} /></Field>
                <Field label="Setor"><select className={inputClass} {...form.register('department_id')}><option value="">Selecione</option>{options.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
                <Field label="Perfil"><select className={inputClass} {...form.register('role')} >{options.roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}</select></Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('active')} /> Ativo</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('must_change_password')} /> Exigir troca no primeiro acesso</label>
              </div>

              {modal.mode === 'create' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PasswordField label="Senha temporária" show={showPassword} setShow={setShowPassword} register={form.register('password', { required: true })} />
                  <PasswordField label="Confirmação" show={showConfirm} setShow={setShowConfirm} register={form.register('confirm_password', { required: true })} />
                  <div className="sm:col-span-2 rounded-lg border bg-gray-50 p-3 flex flex-wrap gap-3">
                    {passwordRules.map(([label, ok]) => <span key={label as string} className={ok ? 'text-xs text-green-700' : 'text-xs text-gray-400'}>{ok ? '✓' : '○'} {label}</span>)}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">Permissões adicionais</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto border rounded-lg p-3">
                  {options.permissions.map((p) => (
                    <label key={p.key} className="flex gap-2 text-xs text-gray-600">
                      <input type="checkbox" value={p.key} {...form.register('extra_permissions')} />
                      <span><strong>{p.key}</strong><br />{p.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900 mb-2">Resumo do perfil selecionado</p>
                <div className="flex flex-wrap gap-1">
                  {rolePermissions.slice(0, 16).map((p) => <span key={p} className="rounded bg-white px-2 py-0.5 text-[11px] text-blue-700">{p}</span>)}
                  {rolePermissions.length > 16 && <span className="text-[11px] text-blue-700">+{rolePermissions.length - 16}</span>}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-sm">Cancelar</button>
                <button disabled={saving} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full sm:max-w-sm rounded-t-xl sm:rounded-xl p-5 space-y-4">
            <div className="flex justify-between"><h2 className="font-semibold">Redefinir senha</h2><button onClick={() => setPasswordModal(null)}><X size={20} /></button></div>
            <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
              <input type="password" className={inputClass} placeholder="Senha temporária" {...passwordForm.register('password', { required: true })} />
              <input type="password" className={inputClass} placeholder="Confirmar senha temporária" {...passwordForm.register('confirm_password', { required: true })} />
              <button disabled={saving} className="w-full rounded-lg bg-brand-600 py-2 text-white text-sm font-semibold">Redefinir e exigir troca</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-700 space-y-1"><span>{label}</span>{children}</label>;
}

function PasswordField({ label, show, setShow, register }: { label: string; show: boolean; setShow: (v: boolean) => void; register: any }) {
  return (
    <Field label={label}>
      <div className="relative">
        <input type={show ? 'text' : 'password'} className={`${inputClass} pr-10`} {...register} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

function IconButton({ label, icon, onClick, danger }: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" title={label} onClick={onClick} className={danger ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-brand-600'}>{icon}</button>;
}
