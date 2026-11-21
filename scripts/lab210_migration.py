"""Schema plan for H only. No execution on import; no new connection pool.

The release driver must back up H before executing this DDL in one transaction.
The two schemas are new; existing Campinas/Noroeste tables are never altered.
"""
EXPECTED_DATABASE = 'laboratorio_visual_homolog_20261118'
SCHEMAS = {'pederneiras': 'lab_cec_pederneiras', 'ribeirao': 'lab_cec_ribeirao'}


def ddl_for(unit):
    schema = SCHEMAS[unit]
    return f'''
CREATE SCHEMA {schema};
REVOKE ALL ON SCHEMA {schema} FROM PUBLIC;
CREATE TABLE {schema}.release_metadata (
 version text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(),
 origin text NOT NULL, extra_pools integer NOT NULL CHECK(extra_pools=0));
INSERT INTO {schema}.release_metadata(version,origin,extra_pools)
 VALUES ('2.1.0','Noroeste: contrato CEC, agrupamento por série; pool do Laboratório',0);
CREATE TABLE {schema}.massadas (
 id bigint PRIMARY KEY, produto text NOT NULL, formula text NOT NULL,
 data date NOT NULL, hora text, numero_serie text NOT NULL,
 source_database text NOT NULL, source_payload jsonb NOT NULL,
 imported_at timestamptz NOT NULL DEFAULT now(), test_marker text);
CREATE INDEX ON {schema}.massadas (data DESC,id DESC);
CREATE TABLE {schema}.faixas_resistencia (
 idade_dias integer PRIMARY KEY CHECK(idade_dias>0),
 valor_minimo numeric(8,2) NOT NULL, valor_maximo numeric(8,2) NOT NULL,
 source text NOT NULL, CHECK(valor_maximo>=valor_minimo));
-- Existing DEFAULT_FAIXAS in cec-noroeste/src/services/analytics_service.js.
-- These are the versioned Noroeste rules, not invented factory/equipment data.
INSERT INTO {schema}.faixas_resistencia VALUES
 (1,8,14,'cec-noroeste DEFAULT_FAIXAS'),(3,16,24,'cec-noroeste DEFAULT_FAIXAS'),
 (7,22,32,'cec-noroeste DEFAULT_FAIXAS'),(28,32,42,'cec-noroeste DEFAULT_FAIXAS');
CREATE TABLE {schema}.rompimentos (
 id uuid PRIMARY KEY, numero_serie text NOT NULL, traco_id text NOT NULL,
 idade_dias integer NOT NULL CHECK(idade_dias BETWEEN 1 AND 365),
 cp text NOT NULL CHECK(cp IN ('1','2')), data_moldagem date NOT NULL,
 hora_moldagem text, data_ruptura date NOT NULL, mpa numeric(8,2) NOT NULL CHECK(mpa>=0),
 responsavel_id text NOT NULL, responsavel text NOT NULL,
 qr_raw text NOT NULL, payload_json jsonb NOT NULL, payload_digest text NOT NULL,
 client_created_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(data_ruptura-data_moldagem=idade_dias));
CREATE INDEX ON {schema}.rompimentos
 (data_moldagem,traco_id,numero_serie,idade_dias,cp,updated_at DESC,created_at DESC);
CREATE TABLE {schema}.rompimentos_eventos (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 rompimento_id uuid NOT NULL REFERENCES {schema}.rompimentos(id),
 tipo_evento text NOT NULL CHECK(tipo_evento IN ('INSERT','UPDATE')),
 responsavel_id text NOT NULL, payload_original jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON {schema}.rompimentos_eventos (rompimento_id,created_at);
CREATE VIEW {schema}.rompimentos_atuais AS
 SELECT DISTINCT ON (data_moldagem,traco_id,numero_serie,idade_dias,cp) *
 FROM {schema}.rompimentos
 ORDER BY data_moldagem,traco_id,numero_serie,idade_dias,cp,
          updated_at DESC,created_at DESC,id DESC;
-- Same natural grouping as Noroeste; evaluated in the reading transaction,
-- so a new worker/pool is unnecessary and a confirmed reading is immediately visible.
CREATE VIEW {schema}.rompimentos_grupos AS
 WITH grouped AS (
 SELECT data_moldagem,traco_id,numero_serie,idade_dias,
        coalesce(max(data_ruptura) FILTER(WHERE cp='1'),
                 max(data_ruptura) FILTER(WHERE cp='2')) AS data_ruptura,
        max(mpa) FILTER(WHERE cp='1') AS mpa_cp1,
        max(mpa) FILTER(WHERE cp='2') AS mpa_cp2,
        count(*)::integer AS quantidade_cp, max(updated_at) AS updated_at
 FROM {schema}.rompimentos_atuais
 GROUP BY data_moldagem,traco_id,numero_serie,idade_dias),
 averages AS (SELECT *, CASE WHEN quantidade_cp=2
                     THEN round((mpa_cp1+mpa_cp2)/2,2)
                     ELSE coalesce(mpa_cp1,mpa_cp2) END AS media_mpa
             FROM grouped)
 SELECT g.*,CASE WHEN g.media_mpa IS NULL THEN 'PEND'
                  WHEN f.valor_minimo IS NULL THEN 'OK'
                  WHEN g.media_mpa<f.valor_minimo THEN 'NOK'
                  WHEN g.media_mpa>f.valor_maximo THEN 'AMP' ELSE 'OK' END AS status_resultado,
        f.valor_minimo AS meta_minima,f.valor_maximo AS meta_maxima
 FROM averages g LEFT JOIN {schema}.faixas_resistencia f USING(idade_dias);
GRANT USAGE ON SCHEMA {schema} TO postes_app;
GRANT SELECT,INSERT,UPDATE ON {schema}.massadas,{schema}.rompimentos,
 {schema}.rompimentos_eventos TO postes_app;
GRANT SELECT ON {schema}.rompimentos_atuais,{schema}.rompimentos_grupos,
 {schema}.faixas_resistencia,{schema}.release_metadata TO postes_app;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA {schema} TO postes_app;
'''


def complete_ddl():
    return 'BEGIN; SET LOCAL lock_timeout=\'3s\'; SET LOCAL statement_timeout=\'30s\';\n' + (
        "DO $$ BEGIN IF current_database() <> '" + EXPECTED_DATABASE +
        "' THEN RAISE EXCEPTION 'Migração permitida apenas no Laboratório H'; END IF; END $$;\n"
    ) + ''.join(ddl_for(unit) for unit in SCHEMAS) + '\nCOMMIT;\n'
