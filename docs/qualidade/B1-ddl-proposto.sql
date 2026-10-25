-- B1: proposta para revisão. NÃO EXECUTAR antes de G-B1.
-- Banco dedicado: qualidade (PostgreSQL 16). UUIDv7 é gerado no serviço.
-- A criação do banco/roles e credenciais ocorre por operação administrativa, fora deste arquivo.
-- qualidade_app recebe CONNECT apenas neste banco e USAGE/DML apenas no schema qualidade.
-- A migration de unificado_auth fica em B1-ddl-acoes-proposto.sql, no banco Mapa.

CREATE SCHEMA IF NOT EXISTS qualidade;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE qualidade.empresa (
  id uuid PRIMARY KEY, codigo text NOT NULL UNIQUE, nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE TABLE qualidade.unidade (
  codigo text PRIMARY KEY CHECK (codigo IN ('pederneiras','ribeirao','noroeste')),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), nome text NOT NULL, ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);

-- Contato de entrega de alertas por usuário do Unificado, sem FK a outro banco.
CREATE TABLE qualidade.usuario_contato (
  usuario_id text PRIMARY KEY, email text NOT NULL, ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);

CREATE TABLE qualidade.origem (
  id uuid PRIMARY KEY, empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text REFERENCES qualidade.unidade(codigo),
  codigo text NOT NULL, nome text NOT NULL, codigo_legado text, ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  UNIQUE(empresa_id,codigo), UNIQUE(empresa_id,codigo_legado)
);
CREATE TABLE qualidade.tipo (
  id uuid PRIMARY KEY, empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text REFERENCES qualidade.unidade(codigo),
  codigo text NOT NULL, nome text NOT NULL, codigo_legado text, ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  UNIQUE(empresa_id,codigo), UNIQUE(empresa_id,codigo_legado)
);
CREATE TABLE qualidade.gravidade (
  id uuid PRIMARY KEY, empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text REFERENCES qualidade.unidade(codigo),
  codigo text NOT NULL, nome text NOT NULL, ativo boolean NOT NULL DEFAULT true,
  prazo_causa_dias integer CHECK (prazo_causa_dias >= 0),
  prazo_final_dias integer CHECK (prazo_final_dias >= 0),
  acao_corretiva_obrigatoria boolean NOT NULL DEFAULT false,
  corretiva_se_recorrente boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  UNIQUE(empresa_id,codigo)
);
CREATE TABLE qualidade.gravidade_legado_mapa (
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id),
  codigo_legado text NOT NULL, gravidade_id uuid NOT NULL REFERENCES qualidade.gravidade(id),
  PRIMARY KEY(empresa_id,codigo_legado)
);
CREATE TABLE qualidade.disposicao (
  id uuid PRIMARY KEY, empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text REFERENCES qualidade.unidade(codigo),
  codigo text NOT NULL, nome text NOT NULL, codigo_legado text, ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  UNIQUE(empresa_id,codigo)
);
CREATE TABLE qualidade.area (
  id uuid PRIMARY KEY, empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text REFERENCES qualidade.unidade(codigo),
  codigo text NOT NULL, nome text NOT NULL, codigo_legado text, ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  UNIQUE(empresa_id,codigo), UNIQUE(empresa_id,codigo_legado)
);

CREATE TABLE qualidade.nc_numero_contador (
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), ano integer NOT NULL CHECK (ano BETWEEN 2000 AND 9999),
  ultimo_numero integer NOT NULL CHECK (ultimo_numero >= 0), PRIMARY KEY(empresa_id,ano)
);
-- Apenas na transição RASCUNHO -> REGISTRADA, dentro da MESMA transação:
-- INSERT ... VALUES(empresa_id,ano,1)
-- ON CONFLICT(empresa_id,ano) DO UPDATE SET ultimo_numero=nc_numero_contador.ultimo_numero+1
-- RETURNING ultimo_numero; depois INSERT nc com NC-AAAA-NNNN.

CREATE TABLE qualidade.nc (
  id uuid PRIMARY KEY, empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id),
  unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  numero text, titulo text NOT NULL, descricao text NOT NULL,
  origem_id uuid REFERENCES qualidade.origem(id), tipo_id uuid REFERENCES qualidade.tipo(id),
  gravidade_id uuid REFERENCES qualidade.gravidade(id),
  status text NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO','REGISTRADA','CONTENCAO','ANALISE_CAUSA','PLANO_ACAO','VERIFICACAO_EFICACIA','ENCERRAMENTO','ENCERRADA','CANCELADA')),
  area_emissora_id uuid REFERENCES qualidade.area(id), area_responsavel_id uuid REFERENCES qualidade.area(id),
  setor_pcp_id text, setor_codigo_snapshot text, setor_nome_snapshot text,
  produto_pcp_id text, produto_codigo_snapshot text, produto_nome_snapshot text, produto_texto text,
  lote_texto text, data_ocorrencia timestamptz, data_deteccao timestamptz,
  requisito_texto text, evidencias_texto text, impacto text, referencia_origem text,
  processo_texto text, fornecedor_texto text, cliente_texto text, pedido_texto text,
  quantidade_afetada numeric(14,3), cliente_afetado boolean,
  responsavel_id text, atribuido_por text, observacoes_triagem text,
  prazo_final date, prazo_etapa date, encerrada_em timestamptz, encerrada_por text,
  reaberta_em timestamptz, reaberta_por text,
  legado boolean NOT NULL DEFAULT false, id_legado uuid UNIQUE, numero_legado text UNIQUE,
  status_legado text, origem_legado text, tipo_legado text, gravidade_legado text,
  legado_payload jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  CHECK (status <> 'RASCUNHO' OR numero IS NULL),
  CHECK (status IN ('RASCUNHO','CANCELADA') OR numero IS NOT NULL)
);
CREATE UNIQUE INDEX nc_empresa_numero_uk ON qualidade.nc(empresa_id,numero) WHERE numero IS NOT NULL;
CREATE INDEX nc_unidade_status_idx ON qualidade.nc(unidade_codigo,status);
CREATE INDEX nc_responsavel_status_idx ON qualidade.nc(responsavel_id,status);
CREATE INDEX nc_prazo_etapa_idx ON qualidade.nc(prazo_etapa);
CREATE INDEX nc_area_responsavel_idx ON qualidade.nc(area_responsavel_id);
CREATE INDEX nc_titulo_trgm_idx ON qualidade.nc USING gin(titulo gin_trgm_ops);
CREATE INDEX nc_semelhante_idx ON qualidade.nc(empresa_id,unidade_codigo,produto_pcp_id,setor_pcp_id,criado_em DESC);

CREATE TABLE qualidade.nc_contencao (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  disposicao_id uuid REFERENCES qualidade.disposicao(id), descricao text,
  quantidade_bloqueada numeric(14,3), aprovador_id text,
  concessao_aprovada_por text, concessao_aprovada_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE TABLE qualidade.nc_causa (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL UNIQUE REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  metodo text NOT NULL CHECK (metodo IN ('5_PORQUES','ISHIKAWA_6M','PARETO','ESTRATIFICACAO','FALHA_CLASSIFICADA')),
  problema text NOT NULL, causa_direta text, causa_raiz text, causas_contribuintes text,
  categoria_6m text, pode_ocorrer_outro_local boolean, outro_local_descricao text,
  metodo_payload jsonb NOT NULL DEFAULT '{}'::jsonb, validado_por text,
  id_legado uuid UNIQUE, legado_payload jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE TABLE qualidade.nc_porque (
  id uuid PRIMARY KEY, nc_causa_id uuid NOT NULL REFERENCES qualidade.nc_causa(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  ordem smallint NOT NULL CHECK (ordem BETWEEN 1 AND 5), texto text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  UNIQUE(nc_causa_id,ordem)
);
CREATE TABLE qualidade.nc_acao (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  tipo text NOT NULL CHECK (tipo IN ('CONTENCAO','CORRETIVA_IMEDIATA','CORRETIVA','PREVENTIVA')),
  status text NOT NULL CHECK (status IN ('PENDENTE','EM_ANDAMENTO','CONCLUIDA','CANCELADA')),
  status_legado text, o_que text NOT NULL, por_que text, onde text, quem_id text, quando date,
  como text, quanto numeric(12,2), evidencia text, concluida_em timestamptz,
  verificada_por text, notas_verificacao text,
  id_legado uuid UNIQUE, legado_payload jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE INDEX nc_acao_prazo_idx ON qualidade.nc_acao(quando,status);
CREATE TABLE qualidade.nc_eficacia (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  rodada integer NOT NULL CHECK (rodada > 0), criterio text, data_prevista date, verificador_id text,
  resultado text CHECK (resultado IN ('EFICAZ','NAO_EFICAZ')), verificada_em timestamptz,
  notas text, requer_acompanhamento boolean NOT NULL DEFAULT false,
  id_legado uuid UNIQUE, legado_payload jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  UNIQUE(nc_id,rodada)
);
CREATE TABLE qualidade.nc_encerramento (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL UNIQUE REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  atualizar_riscos boolean, justificativa_riscos text,
  revisar_documento boolean, justificativa_documento text,
  treinamento boolean, conclusao text, aprovado_por text, aprovado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE TABLE qualidade.nc_documento_ref (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  ged_documento_id text, codigo text NOT NULL, revisao text,
  papel text NOT NULL CHECK (papel IN ('REQUISITO','A_REVISAR')), referenciado_em timestamptz NOT NULL DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE TABLE qualidade.nc_vinculo (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id), nc_relacionada_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  tipo text NOT NULL CHECK (tipo IN ('REINCIDENCIA','SEMELHANTE')),
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
  CHECK (nc_id <> nc_relacionada_id), UNIQUE(nc_id,nc_relacionada_id,tipo)
);
CREATE TABLE qualidade.nc_anexo (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  nome_original text NOT NULL, nome_armazenado text NOT NULL, mime text NOT NULL,
  tamanho bigint NOT NULL CHECK (tamanho BETWEEN 0 AND 26214400), sha256 char(64) NOT NULL,
  etapa text NOT NULL, storage_path text NOT NULL, storage_path_legado text,
  enviado_por text, enviado_em timestamptz NOT NULL DEFAULT now(),
  id_legado uuid UNIQUE, legado_payload jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE TABLE qualidade.nc_evento (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  tipo text NOT NULL, status_anterior text, status_novo text, descricao text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, autor_id text, autor_texto text,
  ocorrido_em timestamptz NOT NULL DEFAULT now(), importado boolean NOT NULL DEFAULT false,
  id_legado uuid UNIQUE, legado_payload jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE INDEX nc_evento_nc_ocorrido_idx ON qualidade.nc_evento(nc_id,ocorrido_em);
CREATE FUNCTION qualidade.nc_evento_imutavel() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'nc_evento é imutável'; END; $$;
CREATE TRIGGER nc_evento_imutavel BEFORE UPDATE OR DELETE ON qualidade.nc_evento
FOR EACH ROW EXECUTE FUNCTION qualidade.nc_evento_imutavel();
CREATE TABLE qualidade.nc_comentario (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  texto text NOT NULL, mencoes jsonb NOT NULL DEFAULT '[]'::jsonb, autor_id text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE TABLE qualidade.notificacao_outbox (
  id uuid PRIMARY KEY, nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
  empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id), unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  evento text NOT NULL CHECK (evento IN ('ATRIBUICAO','PEDIDO_APROVACAO','PRAZO_2_DIAS','ATRASO')),
  destinatario_id text, destinatario_email text, payload jsonb NOT NULL,
  enviar_apos timestamptz NOT NULL, enviado_em timestamptz, tentativas integer NOT NULL DEFAULT 0,
  ultimo_erro_codigo text, dedupe_key text NOT NULL UNIQUE,
  criado_em timestamptz NOT NULL DEFAULT now(), criado_por text, atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text
);
CREATE INDEX notificacao_outbox_pendente_idx ON qualidade.notificacao_outbox(enviar_apos) WHERE enviado_em IS NULL;
CREATE TABLE qualidade.preferencia_usuario (
  usuario_id text PRIMARY KEY, unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
