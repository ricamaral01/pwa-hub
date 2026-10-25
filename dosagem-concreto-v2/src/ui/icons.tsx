import type { SVGProps } from 'react';
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const paths: Record<string, string> = {
  inicio:'M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  tracos:'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  empacotamento:`${circle(7, 8, 3)}${circle(16, 7, 2)}${circle(15, 15, 4)}${circle(6, 17, 2)}`,
  volume:'M5 3h14v18H5zM5 9h14M5 14h14',
  materiais:'m12 3 9 5-9 5-9-5zM3 13l9 5 9-5',
  fornecedores:'M3 21V9l6-4v4l6-4v4l6-4v16z',
  ensaios:'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9',
  producao:'M4 20V10l4 3V10l4 3V10l4 3V4h4v16z',
  importacao:'M12 3v12M7 10l5 5 5-5M4 21h16',
  ferramentas:'M14 3l7 7-2 2-7-7m-1 1L3 14l7 7 8-8',
  custos:'M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6',
  referencia:'M4 4h16v17H4zM8 8h8M8 12h8M8 16h5',
  config:`${circle(12, 12, 3)}M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1`,
  menu:'M4 6h16M4 12h16M4 18h16', mais:'M12 5v14M5 12h14', voltar:'m15 6-6 6 6 6', avancar:'m9 6 6 6-6 6',
  seta:'M5 12h14M13 6l6 6-6 6', busca:`${circle(11, 11, 7)}M20 20l-4-4`,
  salvar:'M4 3h14l3 3v15H3V3h1zm3 0v6h9V3M7 21v-9h10v9',
  alerta:'M12 3 2 21h20zM12 10v4M12 17.5v.5', check:'m5 12 5 5 9-10', erro:`${circle(12, 12, 9)}M15 9l-6 6M9 9l6 6`,
  info:`${circle(12, 12, 9)}M12 11v5M12 8v.5`, relogio:`${circle(12, 12, 9)}M12 7v5l3 2`,
  imprimir:'M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z',
  compartilhar:`${circle(18, 5, 3)}${circle(6, 12, 3)}${circle(18, 19, 3)}M8.6 13.5l6.8 4M15.4 6.5l-6.8 4`,
  recolher:'M4 4h16v16H4zM9 4v16M15 10l-2 2 2 2', sair:'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  curva:'M3 20C9 19 12 12 15 8s4-4 6-4'
};
export function Icon({ name, size=20, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}><path d={paths[name] || paths.mais}/></svg>; }
