'use client';

import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const ROLE_LABELS: Record<string, string> = {
  ADMIN:       'Administrador',
  ADMIN_MASTER: 'Administrador Master',
  OPERACIONAL: 'Operacional',
  COLABORADOR: 'Colaborador',
  SUPERVISOR: 'Supervisor/Líder',
  GERENCIA: 'Gerência',
  DIRETORIA: 'Diretoria',
  QUALIDADE:   'Qualidade',
  ENGENHARIA:  'Engenharia',
  LABORATORIO: 'Laboratório',
  LEITOR:      'Leitor',
};

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      {/* Breadcrumb placeholder */}
      <div />

      {/* User */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role ?? '']}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          title="Sair"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
