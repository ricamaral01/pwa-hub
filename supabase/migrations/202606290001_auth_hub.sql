create extension if not exists citext;
create extension if not exists pgcrypto;

create type public.app_access_level as enum ('operacional', 'gestao', 'gerencia', 'master');

create table public.users_app (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 3 and 160),
  username citext not null unique check (username ~ '^[a-zA-Z0-9._-]{3,40}$'),
  email citext not null unique,
  access_level public.app_access_level not null default 'operacional',
  is_active boolean not null default true,
  first_login boolean not null default true,
  mfa_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users_app(id) on delete set null
);

create table public.login_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  email citext,
  event_type text not null default 'login' check (event_type in ('login','logout','user_created','user_updated','password_changed','password_reset')),
  success boolean not null,
  ip_address inet,
  user_agent text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.app_permissions (
  id bigint generated always as identity primary key,
  app_key text not null check (app_key ~ '^[a-z0-9-]{2,80}$'),
  app_name text not null,
  access_level public.app_access_level not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_key, access_level)
);

create table public.login_attempts (
  id bigint generated always as identity primary key,
  identifier_hash text not null,
  ip_hash text not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);

create index login_logs_user_created_idx on public.login_logs(user_id, created_at desc);
create index login_logs_email_created_idx on public.login_logs(email, created_at desc);
create index login_attempts_lookup_idx on public.login_attempts(identifier_hash, ip_hash, attempted_at desc);

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger users_app_updated before update on public.users_app
for each row execute function public.set_updated_at();
create trigger app_permissions_updated before update on public.app_permissions
for each row execute function public.set_updated_at();

create function public.is_master(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.users_app where id = check_user and access_level = 'master' and is_active);
$$;

create function public.my_access_context()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'user', to_jsonb(u),
    'permissions', coalesce((select jsonb_agg(jsonb_build_object('app_key',p.app_key,'app_name',p.app_name,'enabled',p.enabled)) from public.app_permissions p where p.access_level=u.access_level and p.enabled), '[]'::jsonb)
  ) from public.users_app u where u.id = auth.uid() and u.is_active;
$$;

revoke all on function public.is_master(uuid) from public;
grant execute on function public.is_master(uuid) to authenticated, service_role;
revoke all on function public.my_access_context() from public;
grant execute on function public.my_access_context() to authenticated;

alter table public.users_app enable row level security;
alter table public.login_logs enable row level security;
alter table public.app_permissions enable row level security;
alter table public.login_attempts enable row level security;

create policy users_read_self_or_master on public.users_app for select to authenticated
using (id = auth.uid() or public.is_master());
create policy permissions_read_authenticated on public.app_permissions for select to authenticated using (true);
create policy logs_read_master on public.login_logs for select to authenticated using (public.is_master());

revoke all on public.users_app, public.login_logs, public.app_permissions, public.login_attempts from anon;
grant select on public.users_app, public.app_permissions to authenticated;
grant select on public.login_logs to authenticated;
grant all on public.users_app, public.login_logs, public.app_permissions, public.login_attempts to service_role;
grant usage, select on sequence public.login_logs_id_seq, public.app_permissions_id_seq, public.login_attempts_id_seq to service_role;

insert into public.app_permissions(app_key, app_name, access_level, enabled)
select app.app_key, app.app_name, level.access_level, true
from (values
 ('dashboard-usina','Dashboard Usina'),('qr-concreto','Leitor de Etiquetas'),('slump','Slump / Flow'),
 ('parada-usina','Parada Usina'),('massadas','Problema Massadas'),('setor-botoes','Setor Botões'),
 ('dosagem-concreto','Calculadora Dosagem'),('controle-cimento','Controle de Cimento'),
 ('controle-agregados','Controle de Agregados'),('checklist-usina','Checklist da Usina'),
 ('mapa-concretagem','Mapa de Concretagem'),('etiquetas-cp','Etiquetas CP'),
 ('controle-estatistico','Controle Estatístico'),('manual-dosagem','Manual Dosagem'),
 ('alertas','Alertas'),('cartas-traco-unidades','Cartas Traço Unidades'),('pcp','PCP')
) app(app_key,app_name)
cross join (values ('operacional'::public.app_access_level),('gestao'),('gerencia'),('master')) level(access_level);

insert into public.app_permissions(app_key, app_name, access_level, enabled)
values ('admin-usuarios','Administração de Usuários','master',true);
