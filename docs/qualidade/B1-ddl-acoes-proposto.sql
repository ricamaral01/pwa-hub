-- B1: migration ADITIVA proposta para o banco Mapa. NÃO EXECUTAR antes de G-B1.
-- Grants de ação usam IDs presentes em public.usuarios, inclusive identidade Mapa
-- vinculada administrativamente a uma conta só PCP. Fluxos de tela não tocam esta tabela.
CREATE TABLE unificado_auth.user_action_permissions (
  user_id text NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  action_id text NOT NULL,
  granted_by text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,action_id),
  CHECK (action_id LIKE 'qualidade.%')
);
CREATE INDEX user_action_permissions_action_idx ON unificado_auth.user_action_permissions(action_id);

-- Áreas concedidas administrativamente para qualidade.nc.ver_area.
-- Não há FK entre bancos; códigos são validados contra o catálogo B1 de 20 áreas.
CREATE TABLE unificado_auth.user_quality_areas (
  user_id text NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  area_codigo text NOT NULL,
  granted_by text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,area_codigo)
);

GRANT USAGE ON SCHEMA unificado_auth TO mapa_api_login;
GRANT SELECT,INSERT,UPDATE,DELETE ON unificado_auth.user_action_permissions,
  unificado_auth.user_quality_areas TO mapa_api_login;
