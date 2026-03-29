create extension if not exists pgcrypto;

create table if not exists rompimentos (
  id uuid primary key,
  source text not null default 'qr-concreto',
  etiqueta_id text,
  traco_id text not null,
  idade_dias integer not null,
  cp text not null,
  data_moldagem date,
  hora_moldagem text,
  data_ruptura date,
  mpa numeric(8,2) not null,
  status_meta text,
  meta_min numeric(8,2),
  meta_max numeric(8,2),
  responsavel text,
  qr_raw text,
  payload_json jsonb not null default '{}'::jsonb,
  client_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rompimentos_data_moldagem on rompimentos (data_moldagem desc);
create index if not exists idx_rompimentos_traco_id on rompimentos (traco_id);
create index if not exists idx_rompimentos_idade_dias on rompimentos (idade_dias);
create index if not exists idx_rompimentos_created_at on rompimentos (created_at desc);
