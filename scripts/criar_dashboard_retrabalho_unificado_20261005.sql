-- Aplicar somente no PostgreSQL do unificado, apos backup.
-- Fonte: supabase/migrations/202608200003_dashboards_fases_7_8_9_v1.sql.
-- Divergencia documentada: auth.uid() e public.is_master() sao funcoes do Supabase
-- ausentes no novo servidor. created_by fica sem default; politicas dependentes
-- dessas funcoes nao sao recriadas ate mapear a identidade da sessao do unificado.
BEGIN;
CREATE TABLE public.dashboard_retrabalho_eventos_v1 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  montagem_id text,
  data_fabricacao date NOT NULL,
  setor text NOT NULL,
  setor_code text GENERATED ALWAYS AS (public.dashboard_sector_code_v1(setor)) STORED,
  forma text,
  modelo text,
  tipo_evento text NOT NULL,
  origem text,
  executor text,
  custo_mao_obra numeric(14,2),
  custo_material numeric(14,2),
  custo_equipamento numeric(14,2),
  custo_outros numeric(14,2),
  custo_total numeric(14,2) GENERATED ALWAYS AS (
    coalesce(custo_mao_obra,0)+coalesce(custo_material,0)+
    coalesce(custo_equipamento,0)+coalesce(custo_outros,0)
  ) STORED,
  moeda text NOT NULL DEFAULT 'BRL',
  status_custo text NOT NULL DEFAULT 'ESTIMADO',
  observacao text,
  evidencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  aprovado_por uuid,
  aprovado_em timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_retrabalho_status_custo_v1 CHECK (
    status_custo IN ('ESTIMADO','REAL_PARCIAL','REAL_FECHADO','OPORTUNIDADE')
  )
);
ALTER TABLE public.dashboard_retrabalho_eventos_v1 ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_dashboard_retrabalho_data_setor_v1 ON public.dashboard_retrabalho_eventos_v1(data_fabricacao,setor);
CREATE INDEX idx_dashboard_retrabalho_montagem_v1 ON public.dashboard_retrabalho_eventos_v1(montagem_id);
CREATE INDEX idx_dashboard_retrabalho_status_v1 ON public.dashboard_retrabalho_eventos_v1(status_custo,data_fabricacao);
COMMIT;
