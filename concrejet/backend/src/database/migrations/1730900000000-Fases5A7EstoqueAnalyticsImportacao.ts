import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fases5A7EstoqueAnalyticsImportacao1730900000000 implements MigrationInterface {
  name = 'Fases5A7EstoqueAnalyticsImportacao1730900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lote_resina" DROP CONSTRAINT IF EXISTS "chk_lote_resina_saldo_nao_negativo"`);
    await queryRunner.query(`ALTER TABLE "lote_resina" ADD CONSTRAINT "chk_lote_resina_saldo_nao_negativo" CHECK ("saldo_atual_kg" >= 0)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "estoque_movimento" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
        "unidade_id" uuid NOT NULL REFERENCES "unidade"("id") ON DELETE RESTRICT,
        "lote_id" uuid NOT NULL REFERENCES "lote_resina"("id") ON DELETE RESTRICT,
        "tipo_movimento" varchar(40) NOT NULL CHECK ("tipo_movimento" IN (
          'entrada','ajuste_positivo','ajuste_negativo','consumo','devolucao',
          'transferencia_entrada','transferencia_saida','blenda_consumo','blenda_producao','estorno'
        )),
        "origem_tipo" varchar(60) NOT NULL,
        "origem_id" uuid,
        "quantidade_kg" numeric(12,3) NOT NULL CHECK ("quantidade_kg" > 0),
        "saldo_anterior_kg" numeric(12,3) NOT NULL CHECK ("saldo_anterior_kg" >= 0),
        "saldo_posterior_kg" numeric(12,3) NOT NULL CHECK ("saldo_posterior_kg" >= 0),
        "custo_unitario_aplicado" numeric(12,4),
        "custo_total_aplicado" numeric(14,4),
        "observacao" text,
        "motivo" text,
        "movimento_estornado_id" uuid REFERENCES "estoque_movimento"("id") ON DELETE RESTRICT,
        "idempotency_key" uuid NOT NULL,
        "criado_por" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_estoque_movimento_idempotency" UNIQUE ("idempotency_key")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_estoque_movimento_lote_data" ON "estoque_movimento" ("lote_id", "criado_em")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_estoque_movimento_origem" ON "estoque_movimento" ("origem_tipo", "origem_id")`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION block_estoque_movimento_mutation()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'estoque_movimento e imutavel';
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_block_estoque_movimento_update ON estoque_movimento`);
    await queryRunner.query(`
      CREATE TRIGGER trg_block_estoque_movimento_update
      BEFORE UPDATE OR DELETE ON estoque_movimento
      FOR EACH ROW EXECUTE FUNCTION block_estoque_movimento_mutation()
    `);

    await queryRunner.query(`
      INSERT INTO "estoque_movimento" (
        "empresa_id", "unidade_id", "lote_id", "tipo_movimento", "origem_tipo", "origem_id",
        "quantidade_kg", "saldo_anterior_kg", "saldo_posterior_kg", "custo_unitario_aplicado",
        "custo_total_aplicado", "observacao", "idempotency_key"
      )
      SELECT
        l.empresa_id,
        (SELECT u.id FROM unidade u WHERE u.empresa_id = l.empresa_id AND u.ativo = true ORDER BY u.criado_em LIMIT 1),
        l.id,
        'entrada',
        'reconciliacao_inicial',
        l.id,
        l.saldo_atual_kg,
        0,
        l.saldo_atual_kg,
        l.custo_por_kg,
        CASE WHEN l.custo_por_kg IS NULL THEN NULL ELSE l.custo_por_kg * l.saldo_atual_kg END,
        'Movimento inicial gerado por reconciliacao da Fase 5.',
        (substring(md5('reconciliacao:' || l.id::text),1,8)||'-'||substring(md5('reconciliacao:' || l.id::text),9,4)||'-'||substring(md5('reconciliacao:' || l.id::text),13,4)||'-'||substring(md5('reconciliacao:' || l.id::text),17,4)||'-'||substring(md5('reconciliacao:' || l.id::text),21,12))::uuid
      FROM lote_resina l
      WHERE l.saldo_atual_kg > 0
        AND NOT EXISTS (
          SELECT 1 FROM estoque_movimento m
          WHERE m.lote_id = l.id AND m.origem_tipo = 'reconciliacao_inicial'
        )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blenda" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
        "unidade_id" uuid NOT NULL REFERENCES "unidade"("id") ON DELETE RESTRICT,
        "codigo" varchar(60) NOT NULL,
        "descricao" varchar(180) NOT NULL,
        "data_hora" timestamptz NOT NULL,
        "quantidade_planejada_kg" numeric(12,3) NOT NULL CHECK ("quantidade_planejada_kg" > 0),
        "quantidade_resultante_kg" numeric(12,3),
        "perda_processo_kg" numeric(12,3),
        "lote_resultante_id" uuid REFERENCES "lote_resina"("id") ON DELETE RESTRICT,
        "status" varchar(30) NOT NULL DEFAULT 'rascunho' CHECK ("status" IN ('rascunho','em_processamento','concluida','cancelada')),
        "observacao" text,
        "criado_por" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "concluido_por" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "concluido_em" timestamptz,
        "cancelado_por" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "cancelado_em" timestamptz,
        "motivo_cancelamento" text,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_blenda_empresa_codigo" UNIQUE ("empresa_id", "codigo"),
        CHECK ("perda_processo_kg" IS NULL OR "perda_processo_kg" >= 0)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blenda_componente" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "blenda_id" uuid NOT NULL REFERENCES "blenda"("id") ON DELETE RESTRICT,
        "lote_origem_id" uuid NOT NULL REFERENCES "lote_resina"("id") ON DELETE RESTRICT,
        "quantidade_kg" numeric(12,3) NOT NULL CHECK ("quantidade_kg" > 0),
        "percentual_calculado" numeric(8,4) NOT NULL CHECK ("percentual_calculado" > 0),
        "custo_unitario_aplicado" numeric(12,4),
        "custo_total_aplicado" numeric(14,4),
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_blenda_componente_lote" ON "blenda_componente" ("lote_origem_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "calendario_turno" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
        "unidade_id" uuid NOT NULL REFERENCES "unidade"("id") ON DELETE RESTRICT,
        "maquina_id" uuid REFERENCES "maquina"("id") ON DELETE RESTRICT,
        "dia_semana" integer NOT NULL CHECK ("dia_semana" BETWEEN 0 AND 6),
        "inicio_hora" time NOT NULL,
        "fim_hora" time NOT NULL,
        "vigencia_inicio" date NOT NULL,
        "vigencia_fim" date,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CHECK ("vigencia_fim" IS NULL OR "vigencia_fim" >= "vigencia_inicio")
      )
    `);

    await this.createImportTables(queryRunner);
    await this.createViews(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS vw_oee_base`);
    await queryRunner.query(`DROP VIEW IF EXISTS vw_rastreabilidade_lotes`);
    await queryRunner.query(`DROP VIEW IF EXISTS vw_consumo_lotes`);
    await queryRunner.query(`DROP VIEW IF EXISTS vw_ocorrencias_duracao`);
    await queryRunner.query(`DROP VIEW IF EXISTS vw_perdas_diarias`);
    await queryRunner.query(`DROP VIEW IF EXISTS vw_producao_diaria`);
    await queryRunner.query(`DROP TABLE IF EXISTS import_entity_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS import_reconciliation`);
    await queryRunner.query(`DROP TABLE IF EXISTS import_mappings`);
    await queryRunner.query(`DROP TABLE IF EXISTS import_errors`);
    await queryRunner.query(`DROP TABLE IF EXISTS import_rows`);
    await queryRunner.query(`DROP TABLE IF EXISTS import_sheets`);
    await queryRunner.query(`DROP TABLE IF EXISTS import_files`);
    await queryRunner.query(`DROP TABLE IF EXISTS import_batches`);
    await queryRunner.query(`DROP TABLE IF EXISTS calendario_turno`);
    await queryRunner.query(`DROP TABLE IF EXISTS blenda_componente`);
    await queryRunner.query(`DROP TABLE IF EXISTS blenda`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_block_estoque_movimento_update ON estoque_movimento`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS block_estoque_movimento_mutation`);
    await queryRunner.query(`DROP TABLE IF EXISTS estoque_movimento`);
  }

  private async createImportTables(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome varchar(160) NOT NULL,
        origem text NOT NULL,
        checksum varchar(128),
        status varchar(40) NOT NULL DEFAULT 'criado',
        total_arquivos integer NOT NULL DEFAULT 0,
        total_abas integer NOT NULL DEFAULT 0,
        total_linhas integer NOT NULL DEFAULT 0,
        validas integer NOT NULL DEFAULT 0,
        rejeitadas integer NOT NULL DEFAULT 0,
        importadas integer NOT NULL DEFAULT 0,
        duplicadas integer NOT NULL DEFAULT 0,
        warnings integer NOT NULL DEFAULT 0,
        importador_versao varchar(40) NOT NULL DEFAULT '1',
        iniciado_em timestamptz,
        finalizado_em timestamptz,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        versao integer NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS import_files (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE RESTRICT,
        caminho text NOT NULL,
        nome varchar(260) NOT NULL,
        checksum varchar(128) NOT NULL,
        status varchar(40) NOT NULL DEFAULT 'analisado',
        criado_em timestamptz NOT NULL DEFAULT now(),
        UNIQUE (batch_id, checksum)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS import_sheets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id uuid NOT NULL REFERENCES import_files(id) ON DELETE RESTRICT,
        nome varchar(160) NOT NULL,
        indice integer NOT NULL DEFAULT 0,
        headers jsonb NOT NULL DEFAULT '[]'::jsonb,
        criado_em timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS import_rows (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sheet_id uuid NOT NULL REFERENCES import_sheets(id) ON DELETE RESTRICT,
        numero_linha integer NOT NULL,
        conteudo_original jsonb NOT NULL,
        checksum_linha varchar(128) NOT NULL,
        status varchar(40) NOT NULL DEFAULT 'pendente',
        chave_origem varchar(240),
        criado_em timestamptz NOT NULL DEFAULT now(),
        UNIQUE (sheet_id, checksum_linha)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS import_errors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        row_id uuid REFERENCES import_rows(id) ON DELETE RESTRICT,
        codigo varchar(80) NOT NULL,
        severidade varchar(20) NOT NULL,
        coluna varchar(120),
        valor_original text,
        mensagem text NOT NULL,
        sugestao text,
        criado_em timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS import_mappings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), batch_id uuid REFERENCES import_batches(id), nome varchar(120) NOT NULL, definicao jsonb NOT NULL, criado_em timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS import_reconciliation (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), batch_id uuid REFERENCES import_batches(id), metricas jsonb NOT NULL, criado_em timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS import_entity_links (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), row_id uuid REFERENCES import_rows(id), entidade varchar(80) NOT NULL, entidade_id uuid NOT NULL, chave_origem varchar(240) NOT NULL, imported_at timestamptz NOT NULL DEFAULT now(), UNIQUE (entidade, chave_origem))`);
  }

  private async createViews(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE OR REPLACE VIEW vw_producao_diaria AS SELECT empresa_id, unidade_id, maquina_id, data_producao, count(*) FILTER (WHERE status='concluido') apontamentos_concluidos, sum(pecas_boas) pecas_boas, sum(pecas_refugo) pecas_refugo, sum(falha_preenchimento_qtd) falha_preenchimento FROM apontamento GROUP BY empresa_id, unidade_id, maquina_id, data_producao`);
    await queryRunner.query(`CREATE OR REPLACE VIEW vw_perdas_diarias AS SELECT empresa_id, unidade_id, maquina_id, data_producao, sum(borra_kg + galho_kg + outras_perdas_kg + ((pecas_refugo + falha_preenchimento_qtd) * peso_peca_aplicado_g / 1000)) perda_total_kg, sum(borra_kg + outras_perdas_kg + ((pecas_refugo + falha_preenchimento_qtd) * peso_peca_aplicado_g / 1000)) perda_sem_galho_kg FROM apontamento GROUP BY empresa_id, unidade_id, maquina_id, data_producao`);
    await queryRunner.query(`CREATE OR REPLACE VIEW vw_ocorrencias_duracao AS SELECT o.*, EXTRACT(EPOCH FROM (COALESCE(o.fim_em, now()) - o.inicio_em))::numeric duracao_segundos FROM ocorrencia o`);
    await queryRunner.query(`CREATE OR REPLACE VIEW vw_consumo_lotes AS SELECT empresa_id, unidade_id, lote_id, date_trunc('day', criado_em)::date data, sum(quantidade_kg) FILTER (WHERE tipo_movimento IN ('consumo','blenda_consumo')) consumo_kg, sum(quantidade_kg) FILTER (WHERE tipo_movimento IN ('entrada','devolucao','blenda_producao')) entrada_kg FROM estoque_movimento GROUP BY empresa_id, unidade_id, lote_id, date_trunc('day', criado_em)::date`);
    await queryRunner.query(`CREATE OR REPLACE VIEW vw_rastreabilidade_lotes AS SELECT l.id lote_id, l.codigo lote_codigo, r.codigo resina_codigo, f.nome fornecedor_nome, m.tipo_movimento, m.origem_tipo, m.origem_id, m.quantidade_kg, m.saldo_anterior_kg, m.saldo_posterior_kg, m.criado_em FROM lote_resina l LEFT JOIN resina r ON r.id=l.resina_id LEFT JOIN fornecedor f ON f.id=l.fornecedor_id LEFT JOIN estoque_movimento m ON m.lote_id=l.id`);
    await queryRunner.query(`CREATE OR REPLACE VIEW vw_oee_base AS SELECT a.empresa_id, a.unidade_id, a.maquina_id, a.data_producao, a.inicio_em, a.fim_em, a.pecas_boas, a.pecas_refugo, a.falha_preenchimento_qtd, a.ciclo_padrao_aplicado_s, a.cavidades_aplicadas FROM apontamento a WHERE a.status='concluido'`);
  }
}
