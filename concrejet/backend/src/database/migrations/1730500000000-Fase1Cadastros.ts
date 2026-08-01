import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fase1Cadastros1730500000000 implements MigrationInterface {
  name = 'Fase1Cadastros1730500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);

    await queryRunner.query(`
      ALTER TABLE "maquina"
      ADD COLUMN IF NOT EXISTS "modelo" varchar(120),
      ADD COLUMN IF NOT EXISTS "numero_serie" varchar(80),
      ADD COLUMN IF NOT EXISTS "setor" varchar(80),
      ADD COLUMN IF NOT EXISTS "capacidade" integer
    `);

    await this.createSimple(queryRunner, 'funcao', 'uq_funcao_empresa_codigo');
    await queryRunner.query(`
      CREATE TABLE "colaborador" (
        ${this.baseColumns()},
        "matricula" varchar(40) NOT NULL,
        "nome" varchar(160) NOT NULL,
        "funcao_id" uuid NOT NULL REFERENCES "funcao"("id") ON DELETE RESTRICT,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_colaborador_empresa_matricula" UNIQUE ("empresa_id", "matricula")
      )
    `);
    await this.createSimple(queryRunner, 'operacao', 'uq_operacao_empresa_codigo');
    await this.createSimple(queryRunner, 'tipo_ocorrencia', 'uq_tipo_ocorrencia_empresa_codigo');
    await queryRunner.query(`
      CREATE TABLE "fornecedor" (
        ${this.baseColumns()},
        "nome" varchar(160) NOT NULL,
        "documento" varchar(32) NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_fornecedor_empresa_documento" UNIQUE ("empresa_id", "documento")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "resina" (
        ${this.baseColumns()},
        "codigo" varchar(40) NOT NULL,
        "descricao" varchar(140) NOT NULL,
        "fabricante" varchar(80),
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_resina_empresa_codigo" UNIQUE ("empresa_id", "codigo")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "lote_resina" (
        ${this.baseColumns()},
        "codigo" varchar(60) NOT NULL,
        "resina_id" uuid NOT NULL REFERENCES "resina"("id") ON DELETE RESTRICT,
        "fornecedor_id" uuid NOT NULL REFERENCES "fornecedor"("id") ON DELETE RESTRICT,
        "quantidade_inicial_kg" numeric(12,3) NOT NULL CHECK ("quantidade_inicial_kg" > 0),
        "saldo_atual_kg" numeric(12,3) NOT NULL CHECK ("saldo_atual_kg" >= 0),
        "data_recebimento" date NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_lote_resina_empresa_codigo" UNIQUE ("empresa_id", "codigo")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "movimento_estoque_lote" (
        ${this.baseColumns()},
        "lote_resina_id" uuid NOT NULL REFERENCES "lote_resina"("id") ON DELETE RESTRICT,
        "tipo" varchar(20) NOT NULL CHECK ("tipo" IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
        "quantidade_kg" numeric(12,3) NOT NULL CHECK ("quantidade_kg" > 0),
        "observacao" text
      )
    `);
    await this.createSimple(queryRunner, 'item', 'uq_item_empresa_codigo', 60, 180);
    await this.createSimple(queryRunner, 'molde', 'uq_molde_empresa_codigo', 60, 160);
    await queryRunner.query(`
      CREATE TABLE "configuracao_item_molde" (
        ${this.baseColumns()},
        "item_id" uuid NOT NULL REFERENCES "item"("id") ON DELETE RESTRICT,
        "molde_id" uuid NOT NULL REFERENCES "molde"("id") ON DELETE RESTRICT,
        "peso_peca_g" numeric(12,3) NOT NULL CHECK ("peso_peca_g" > 0),
        "ciclo_padrao_segundos" integer NOT NULL CHECK ("ciclo_padrao_segundos" > 0),
        "cavidades" integer NOT NULL CHECK ("cavidades" > 0),
        "vigencia_inicio" timestamptz NOT NULL,
        "vigencia_fim" timestamptz,
        "motivo_alteracao" text,
        "versao_configuracao" integer NOT NULL DEFAULT 1,
        "ativo" boolean NOT NULL DEFAULT true,
        CHECK ("vigencia_fim" IS NULL OR "vigencia_fim" > "vigencia_inicio")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "configuracao_item_molde"
      ADD CONSTRAINT "excl_config_item_molde_vigencia"
      EXCLUDE USING gist (
        "item_id" WITH =,
        "molde_id" WITH =,
        tstzrange("vigencia_inicio", "vigencia_fim", '[)') WITH &&
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "ordem_producao" (
        ${this.baseColumns()},
        "unidade_id" uuid NOT NULL REFERENCES "unidade"("id") ON DELETE RESTRICT,
        "numero" varchar(60) NOT NULL,
        "item_id" uuid NOT NULL REFERENCES "item"("id") ON DELETE RESTRICT,
        "molde_id" uuid NOT NULL REFERENCES "molde"("id") ON DELETE RESTRICT,
        "quantidade_planejada" integer NOT NULL CHECK ("quantidade_planejada" > 0),
        "data_inicio_planejada" date NOT NULL,
        "data_fim_planejada" date,
        "status" varchar(20) NOT NULL DEFAULT 'ABERTA' CHECK ("status" IN ('ABERTA', 'CANCELADA', 'ENCERRADA')),
        "justificativa_cancelamento" text,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_ordem_producao_empresa_numero" UNIQUE ("empresa_id", "numero")
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION block_lote_saldo_direct_update()
      RETURNS trigger AS $$
      BEGIN
        IF current_setting('app.allow_lote_saldo_update', true) IS DISTINCT FROM 'on' THEN
          RAISE EXCEPTION 'saldo_atual_kg nao pode ser alterado diretamente';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_block_lote_saldo_direct_update
      BEFORE UPDATE OF saldo_atual_kg ON lote_resina
      FOR EACH ROW EXECUTE FUNCTION block_lote_saldo_direct_update()
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION block_movimento_estoque_mutation()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'movimento_estoque_lote e imutavel';
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_block_movimento_estoque_update
      BEFORE UPDATE OR DELETE ON movimento_estoque_lote
      FOR EACH ROW EXECUTE FUNCTION block_movimento_estoque_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_block_movimento_estoque_update ON movimento_estoque_lote`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS block_movimento_estoque_mutation`);
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_block_lote_saldo_direct_update ON lote_resina`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS block_lote_saldo_direct_update`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ordem_producao"`);
    await queryRunner.query(
      `ALTER TABLE "configuracao_item_molde" DROP CONSTRAINT IF EXISTS "excl_config_item_molde_vigencia"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "configuracao_item_molde"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "molde"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "item"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "movimento_estoque_lote"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lote_resina"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "resina"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fornecedor"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tipo_ocorrencia"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operacao"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "colaborador"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "funcao"`);
    await queryRunner.query(`
      ALTER TABLE "maquina"
      DROP COLUMN IF EXISTS "capacidade",
      DROP COLUMN IF EXISTS "setor",
      DROP COLUMN IF EXISTS "numero_serie",
      DROP COLUMN IF EXISTS "modelo"
    `);
  }

  private baseColumns(): string {
    return `
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
      "criado_por_usuario_id" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
      "atualizado_por_usuario_id" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
      "criado_em" timestamptz NOT NULL DEFAULT now(),
      "atualizado_em" timestamptz NOT NULL DEFAULT now(),
      "versao" integer NOT NULL DEFAULT 1
    `;
  }

  private async createSimple(
    queryRunner: QueryRunner,
    table: string,
    constraint: string,
    codeLength = 40,
    descriptionLength = 140,
  ): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "${table}" (
        ${this.baseColumns()},
        "codigo" varchar(${codeLength}) NOT NULL,
        "descricao" varchar(${descriptionLength}) NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "${constraint}" UNIQUE ("empresa_id", "codigo")
      )
    `);
  }
}
