'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();
  const embedded = typeof window !== 'undefined' && window.self !== window.top &&
    (new URLSearchParams(window.location.search).get('embed') === '1' ||
     sessionStorage.getItem('ged_embed') === '1');

  useEffect(() => {
    if (embedded && new URLSearchParams(window.location.search).get('embed') === '1')
      sessionStorage.setItem('ged_embed', '1');
  }, [embedded]);

  useEffect(() => {
    if (embedded && !isLoading && isAuthenticated)
      window.parent.postMessage({ type: 'unificado-ged-route', path: pathname }, window.location.origin);
  }, [embedded, isLoading, isAuthenticated, pathname]);

  // Do not mount any GED screen until the embedded SSO assertion is confirmed.
  if (isLoading || (embedded && !isAuthenticated))
    return <div className="min-h-screen bg-white" aria-hidden="true" />;

  return (
    <div className="flex min-h-screen">
      {!embedded && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!embedded && <Header />}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 ${embedded ? '' : 'pb-20 lg:pb-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
