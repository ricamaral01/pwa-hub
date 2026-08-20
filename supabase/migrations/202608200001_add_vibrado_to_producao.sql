alter table if exists public.producao
  add column if not exists vibrado boolean;

comment on column public.producao.vibrado is
  'Indica se a concretagem de concreto padrao no Setor 3 foi vibrada.';
