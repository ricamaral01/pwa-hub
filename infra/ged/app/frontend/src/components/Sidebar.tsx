'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  ListTodo,
  Gauge,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'documents.read' },
  { href: '/documents', label: 'Documentos', icon: FileText, permission: 'documents.read' },
  { href: '/approvals', label: 'Aprovações', icon: CheckSquare, permission: 'documents.comment' },
  { href: '/tasks', label: 'Tarefas', icon: ListTodo, permission: 'documents.comment' },
  { href: '/calibrations', label: 'Calibrações', icon: Gauge, permission: 'documents.read' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  const visible = navItems.filter((item) =>
    hasPermission(item.permission)
  );

  const isConcrefer = user?.company_slug === 'concrefer';

  return (
    <>
      <aside className="hidden lg:flex w-64 min-h-screen bg-brand-600 flex-col transition-colors duration-500">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="text-white font-bold text-2xl tracking-tight uppercase">
            {isConcrefer ? 'Concrefer' : (user?.company_slug ?? 'GED')}
          </div>
          <div className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
            {isConcrefer ? 'Concretrack · Gestão' : 'Sistema de Documentos'}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {visible.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-white text-brand-600 shadow-lg shadow-black/10'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase">Sistema Ativo</p>
          </div>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-2 py-1.5 flex items-stretch justify-around overflow-x-auto">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'min-w-14 px-2 py-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium sm:min-w-20 sm:text-xs',
                active ? 'text-brand-600' : 'text-gray-500'
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
