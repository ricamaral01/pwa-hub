import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fase2Apontamento1730700000000 implements MigrationInterface {
  name = 'Fase2Apontamento1730700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);
    await queryRunner.query(`
      ALTER TABLE "colaborador"
      ADD COLUMN IF NOT EXISTS "pin_hash" varchar(255),
      ADD COLUMN IF NOT EXISTS "tentativas_pin" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "bloqueado_ate" timestamptz,
      ADD COLUMN IF NOT EXISTS "ultimo_login_operacional_em" timestamptz
    `);
    await queryRunner.query(`
      ALTER TABLE "configuracao_item_molde"
      ADD COLUMN IF NOT EXISTS "limite_perda_percentual" numeric(5,2) NOT NULL DEFAULT 100,
      ADD COLUMN IF NOT EXISTS "ciclo_custo_segundos" numeric(8,2)
    `);
    await queryRunner.query(`
      CREATE TABLE "apontamento" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
        "unidade_id" uuid NOT NULL REFERENCES "unidade"("id") ON DELETE RESTRICT,
        "dispositivo_id" uuid NOT NULL REFERENCES "dispositivo"("id") ON DELETE RESTRICT,
        "maquina_id" uuid NOT NULL REFERENCES "maquina"("id") ON DELETE RESTRICT,
        "operador_id" uuid NOT NULL REFERENCES "colaborador"("id") ON DELETE RESTRICT,
        "ordem_producao_id" uuid REFERENCES "ordem_producao"("id") ON DELETE RESTRICT,
        "item_id" uuid NOT NULL REFERENCES "item"("id") ON DELETE RESTRICT,
        "molde_id" uuid NOT NULL REFERENCES "molde"("id") ON DELETE RESTRICT,
        "configuracao_item_molde_id" uuid NOT NULL REFERENCES "configuracao_item_molde"("id") ON DELETE RESTRICT,
        "lote_resina_id" uuid NOT NULL REFERENCES "lote_resina"("id") ON DELETE RESTRICT,
        "operacao_id" uuid NOT NULL REFERENCES "operacao"("id") ON DELETE RESTRICT,
        "data_producao" date NOT NULL,
        "inicio_em" timestamptz NOT NULL,
        "fim_em" timestamptz,
        "ciclo_real_s" numeric(10,2),
        "pecas_boas" integer NOT NULL DEFAULT 0 CHECK ("pecas_boas" >= 0),
        "pecas_refugo" integer NOT NULL DEFAULT 0 CHECK ("pecas_refugo" >= 0),
        "falha_preenchimento_qtd" integer NOT NULL DEFAULT 0 CHECK ("falha_preenchimento_qtd" >= 0),
        "borra_kg" numeric(12,3) NOT NULL DEFAULT 0 CHECK ("borra_kg" >= 0),
        "galho_kg" numeric(12,3) NOT NULL DEFAULT 0 CHECK ("galho_kg" >= 0),
        "outras_perdas_kg" numeric(12,3) NOT NULL DEFAULT 0 CHECK ("outras_perdas_kg" >= 0),
        "observacao" text,
        "status" varchar(20) NOT NULL CHECK ("status" IN ('rascunho', 'em_andamento', 'concluido', 'cancelado')),
        "origem" varchar(20) NOT NULL CHECK ("origem" IN ('tablet', 'desktop', 'importacao')),
        "idempotency_key" uuid NOT NULL UNIQUE,
        "peso_peca_aplicado_g" numeric(12,3) NOT NULL CHECK ("peso_peca_aplicado_g" > 0),
        "cavidades_aplicadas" integer NOT NULL CHECK ("cavidades_aplicadas" > 0),
        "ciclo_padrao_aplicado_s" numeric(8,2) NOT NULL CHECK ("ciclo_padrao_aplicado_s" > 0),
        "ciclo_custo_aplicado_s" numeric(8,2),
        "limite_perda_aplicado_pct" numeric(5,2) NOT NULL CHECK ("limite_perda_aplicado_pct" >= 0),
        "custo_resina_aplicado_kg" numeric(12,4),
        "motivo_cancelamento" text,
        "cancelado_por" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "cancelado_em" timestamptz,
        "created_by" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "updated_by" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CHECK ("fim_em" IS NULL OR "fim_em" > "inicio_em"),
        CHECK ("status" <> 'concluido' OR "fim_em" IS NOT NULL),
        CHECK ("status" <> 'cancelado' OR length(trim(coalesce("motivo_cancelamento", ''))) > 0)
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "apontamento"
      ADD CONSTRAINT "excl_apontamento_maquina_periodo"
      EXCLUDE USING gist (
        "maquina_id" WITH =,
        tstzrange("inicio_em", "fim_em", '[)') WITH &&
      )
      WHERE ("status" <> 'cancelado')
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_apontamento_maquina_inicio" ON "apontamento" ("maquina_id", "inicio_em")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_apontamento_status" ON "apontamento" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_apontamento_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_apontamento_maquina_inicio"`);
    await queryRunner.query(
      `ALTER TABLE "apontamento" DROP CONSTRAINT IF EXISTS "excl_apontamento_maquina_periodo"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "apontamento"`);
    await queryRunner.query(`
      ALTER TABLE "configuracao_item_molde"
      DROP COLUMN IF EXISTS "ciclo_custo_segundos",
      DROP COLUMN IF EXISTS "limite_perda_percentual"
    `);
    await queryRunner.query(`
      ALTER TABLE "colaborador"
      DROP COLUMN IF EXISTS "ultimo_login_operacional_em",
      DROP COLUMN IF EXISTS "bloqueado_ate",
      DROP COLUMN IF EXISTS "tentativas_pin",
      DROP COLUMN IF EXISTS "pin_hash"
    `);
  }
}
