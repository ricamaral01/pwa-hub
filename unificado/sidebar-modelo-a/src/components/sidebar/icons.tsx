import type { ReactElement } from 'react';
import type { IconName } from './navConfig';

// Ícones de traço (24×24, stroke = currentColor). Sem dependência externa.
const PATHS: Record<IconName, ReactElement> = {
  calendar: <><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>,
  factory: <path d="M3 20.5h18M4 20.5V11l5 3v-3l5 3v-3l5 3V4.5h2v16" />,
  shield: <><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  flask: <><path d="M9 3h6M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9.5V3" /><path d="M7 15h10" /></>,
  folder: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.8l2 2.5h8.2A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />,
  thermometer: <path d="M14 14.8V4.5a2 2 0 0 0-4 0v10.3a4 4 0 1 0 4 0z" />,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3.5 4v4.5H8M12 7.5V12l3 2" /></>,
  database: <><ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" /><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.7 2.7 2.4 3 5.2" /></>,
  post: <path d="M10.5 21.5h3M11 21.5l.5-19h1l.5 19M8 6h8M9 10h6" />,
  alert: <><path d="M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  map: <><path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z" /><path d="M9 4.5v13M15 6.5v13" /></>,
  doc: <><path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" /><path d="M14 3v4.5h4.5M9 13h6M9 16.5h6" /></>,
};

export function Icon({ name, size = 18 }: { name: IconName | 'chevronLeft' | 'chevronRight' | 'updown' | 'logout' | 'check'; size?: number }) {
  const extra: Record<string, ReactElement> = {
    chevronLeft: <path d="M15 6l-6 6 6 6" />,
    chevronRight: <path d="M9 6l6 6-6 6" />,
    updown: <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />,
    logout: <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l-4-4 4-4M6 12h10" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  };
  return (
    <svg className="sb-ic" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {(PATHS as Record<string, ReactElement>)[name] ?? extra[name]}
    </svg>
  );
}
