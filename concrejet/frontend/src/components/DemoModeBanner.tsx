import { isDemoMode } from '@/config/runtime';

export function DemoModeBanner() {
  if (!isDemoMode) return null;

  return (
    <div className="demo-mode-banner" role="status" aria-live="polite">
      <strong>MODO DEMONSTRACAO</strong>
      <span>Dados simulados - nenhuma informacao sera enviada ao servidor</span>
    </div>
  );
}
