'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UseFormRegister, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface FormValues {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface PasswordInputProps {
  name: keyof FormValues;
  label: string;
  show: boolean;
  register: UseFormRegister<FormValues>;
  onToggle: () => void;
}

function PasswordInput({ name, label, show, register, onToggle }: PasswordInputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? 'text' : 'password'}
          {...register(name, { required: true })}
          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 outline-none text-sm"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600"
          title={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch } = useForm<FormValues>();
  const password = watch('new_password') || '';

  const rules = [
    ['Mínimo de 8 caracteres', password.length >= 8],
    ['Letra maiúscula', /[A-Z]/.test(password)],
    ['Letra minúscula', /[a-z]/.test(password)],
    ['Número', /[0-9]/.test(password)],
    ['Caractere especial', /[^A-Za-z0-9]/.test(password)],
  ] as const;

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      await authApi.changePassword(data);
      toast.success('Senha alterada. Entre novamente.');
      await logout();
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-brand-600 px-8 py-8 text-center text-white">
          <ShieldCheck size={34} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Troca obrigatória de senha</h1>
          <p className="text-white/70 text-sm mt-1">Defina uma senha definitiva para acessar o GED.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-5">
          <PasswordInput
            name="current_password"
            label="Senha tempor?ria atual"
            show={!!show.current_password}
            register={register}
            onToggle={() => setShow((s) => ({ ...s, current_password: !s.current_password }))}
          />
          <PasswordInput
            name="new_password"
            label="Nova senha"
            show={!!show.new_password}
            register={register}
            onToggle={() => setShow((s) => ({ ...s, new_password: !s.new_password }))}
          />
          <PasswordInput
            name="confirm_password"
            label="Confirmar nova senha"
            show={!!show.confirm_password}
            register={register}
            onToggle={() => setShow((s) => ({ ...s, confirm_password: !s.confirm_password }))}
          />

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Requisitos mínimos</p>
            <div className="grid grid-cols-1 gap-1">
              {rules.map(([label, ok]) => (
                <span key={label} className={ok ? 'text-xs text-green-700' : 'text-xs text-gray-400'}>
                  {ok ? '✓' : '○'} {label}
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
