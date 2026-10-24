CREATE TABLE IF NOT EXISTS cq_parametros (
 id integer PRIMARY KEY CHECK (id=1), fck_mpa numeric(7,2) NOT NULL DEFAULT 35,
 observacoes text NOT NULL DEFAULT 'Conforme ABNT NBR 8451-1 a 8451-5.', updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO cq_parametros(id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS cq_modelos_poste (
 id bigserial PRIMARY KEY, modelo varchar(64) NOT NULL UNIQUE, altura_m numeric(8,2),
 carga_dan numeric(10,2), peso_kg numeric(10,2), ativo boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS cq_prensas (
 id bigserial PRIMARY KEY, fabricante text NOT NULL, modelo text NOT NULL, serie text NOT NULL,
 patrimonio text, capacidade_kn numeric(10,2), classe text, certificado_calibracao text NOT NULL,
 laboratorio_rbc text NOT NULL, data_calibracao date NOT NULL, validade date NOT NULL,
 arquivo_certificado text, ativa boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS cq_sequencias (
 ano integer PRIMARY KEY, ultimo integer NOT NULL CHECK (ultimo >= 0)
);
CREATE TABLE IF NOT EXISTS cq_certificados (
 id bigserial PRIMARY KEY, numero text, revisao integer NOT NULL DEFAULT 0,
 status text NOT NULL CHECK (status IN ('rascunho','emitido','substituido','legado')),
 cliente text NOT NULL, endereco text NOT NULL DEFAULT '', nota_fiscal text NOT NULL DEFAULT '',
 data_emissao date NOT NULL, resp_laboratorio text NOT NULL,
 resp_tecnico text NOT NULL DEFAULT 'Eng. Marcelo Eduardo Ishizaki de Sousa · CREA 5063392251',
 observacoes text NOT NULL DEFAULT '', fck_mpa numeric(7,2) NOT NULL,
 prensa_snapshot jsonb, pdf_path text, pdf_hash text,
 emitido_por text, emitido_em timestamptz, criado_por text NOT NULL, criado_em timestamptz NOT NULL DEFAULT now(),
 origem text NOT NULL DEFAULT 'unificado', legado_snapshot jsonb,
 anterior_id bigint REFERENCES cq_certificados(id),
 UNIQUE(numero,revisao)
);
CREATE INDEX IF NOT EXISTS cq_certificados_busca ON cq_certificados (data_emissao DESC, cliente);
CREATE TABLE IF NOT EXISTS cq_itens (
 id bigserial PRIMARY KEY, certificado_id bigint NOT NULL REFERENCES cq_certificados(id) ON DELETE CASCADE,
 modelo text NOT NULL, altura_m numeric(8,2), carga_dan numeric(10,2), peso_kg numeric(10,2),
 quantidade integer NOT NULL CHECK (quantidade > 0), data_producao date NOT NULL, lote text NOT NULL
);
CREATE TABLE IF NOT EXISTS cq_resultados_data (
 id bigserial PRIMARY KEY, certificado_id bigint NOT NULL REFERENCES cq_certificados(id) ON DELETE CASCADE,
 data_producao date NOT NULL, traco text, n_cps integer, r3_media numeric(8,2),
 r7_media numeric(8,2), r28_media numeric(8,2), r28_min numeric(8,2),
 resultado text NOT NULL, data_prevista date, UNIQUE(certificado_id,data_producao)
);
