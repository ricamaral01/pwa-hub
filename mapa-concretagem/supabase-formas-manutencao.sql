create table if not exists public.formas_manutencao (
  id text primary key,
  setor text not null,
  forma_numero text not null,
  status text not null check (status in ('PARADA', 'LIBERADA')),
  motivo_parada text not null,
  acao_necessaria text not null,
  parada_em text not null,
  parada_por text not null,
  liberada_em text,
  liberada_por text,
  obs_liberacao text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_formas_manutencao_status
  on public.formas_manutencao (status);

create index if not exists idx_formas_manutencao_updated_at
  on public.formas_manutencao (updated_at desc);

alter table public.formas_manutencao enable row level security;

drop policy if exists "formas_manutencao_select" on public.formas_manutencao;
create policy "formas_manutencao_select"
  on public.formas_manutencao for select
  using (true);

drop policy if exists "formas_manutencao_insert" on public.formas_manutencao;
create policy "formas_manutencao_insert"
  on public.formas_manutencao for insert
  with check (true);

drop policy if exists "formas_manutencao_update" on public.formas_manutencao;
create policy "formas_manutencao_update"
  on public.formas_manutencao for update
  using (true)
  with check (true);

do $$
begin
  alter publication supabase_realtime add table public.formas_manutencao;
exception
  when duplicate_object then null;
end $$;
