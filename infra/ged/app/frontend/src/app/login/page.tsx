'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

interface LoginForm {
  identifier: string;
  password: string;
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [embedded, setEmbedded] = useState<boolean | null>(null);

  useEffect(() => setEmbedded(window.self !== window.top), []);

  const { register, handleSubmit } = useForm<LoginForm>();

  if (embedded === null) return null;
  if (embedded) return <main role="alert" className="min-h-screen bg-slate-50 p-6 text-slate-900 font-semibold">
    Você ainda não tem acesso ao GED. Peça ao administrador.
  </main>;

  if (isAuthenticated) {
    router.replace('/dashboard');
    return null;
  }

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    try {
      await login(data.identifier, data.password);
      const savedUser = localStorage.getItem('ged_user');
      const parsed = savedUser ? JSON.parse(savedUser) : null;
      router.push(parsed?.must_change_password ? '/change-password' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-brand-600 px-8 py-10 text-center text-white">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-lg mb-5 border border-white/20">
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-3xl font-bold">CONCREFER</h1>
          <p className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase mt-1">Concretrack</p>
        </div>

        <form method="post" onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Bem-vindo</h2>
            <p className="text-gray-500 text-sm mt-1">Acesse o portal de gestão documental</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Usuário ou e-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoComplete="username"
                  {...register('identifier', { required: true })}
                  className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 outline-none text-sm"
                  placeholder="Seu usuário ou e-mail"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: true })}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 outline-none text-sm"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
