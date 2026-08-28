create table if not exists public.prog_s3_s4 (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  forma text not null,
  setor text not null,
  modelo text not null default '',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prog_s3_s4_setor_check check (setor in ('Setor 3', 'Setor 4')),
  constraint prog_s3_s4_unique unique (data, forma, setor)
);

create index if not exists idx_prog_s3_s4_data_setor
  on public.prog_s3_s4(data, setor);

create or replace function public.set_prog_s3_s4_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_prog_s3_s4_updated_at on public.prog_s3_s4;
create trigger trg_prog_s3_s4_updated_at
  before update on public.prog_s3_s4
  for each row
  execute function public.set_prog_s3_s4_updated_at();

alter table public.prog_s3_s4 enable row level security;

drop policy if exists prog_s3_s4_select_anon_authenticated on public.prog_s3_s4;
drop policy if exists prog_s3_s4_insert_anon_authenticated on public.prog_s3_s4;
drop policy if exists prog_s3_s4_update_anon_authenticated on public.prog_s3_s4;
drop policy if exists prog_s3_s4_delete_anon_authenticated on public.prog_s3_s4;

create policy prog_s3_s4_select_anon_authenticated
  on public.prog_s3_s4
  for select
  to anon, authenticated
  using (true);

create policy prog_s3_s4_insert_anon_authenticated
  on public.prog_s3_s4
  for insert
  to anon, authenticated
  with check (true);

create policy prog_s3_s4_update_anon_authenticated
  on public.prog_s3_s4
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy prog_s3_s4_delete_anon_authenticated
  on public.prog_s3_s4
  for delete
  to anon, authenticated
  using (true);

grant select, insert, update, delete on public.prog_s3_s4 to anon, authenticated;
