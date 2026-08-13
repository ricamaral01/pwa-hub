import { MigrationInterface, QueryRunner } from 'typeorm';

export class CorrigeLotesResina1730600000000 implements MigrationInterface {
  name = 'CorrigeLotesResina1730600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lote_resina"
      ADD COLUMN IF NOT EXISTS "origem" varchar(20) NOT NULL DEFAULT 'COMPRA',
      ADD COLUMN IF NOT EXISTS "validade" date,
      ADD COLUMN IF NOT EXISTS "custo_por_kg" numeric(12,4),
      ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'DISPONIVEL'
    `);
    await queryRunner.query(`ALTER TABLE "lote_resina" ALTER COLUMN "fornecedor_id" DROP NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "lote_resina"
      ADD CONSTRAINT "ck_lote_resina_origem"
      CHECK ("origem" IN ('COMPRA', 'INTERNA', 'AJUSTE'))
    `);
    await queryRunner.query(`
      ALTER TABLE "lote_resina"
      ADD CONSTRAINT "ck_lote_resina_status"
      CHECK ("status" IN ('DISPONIVEL', 'BLOQUEADO', 'ESGOTADO', 'INATIVO'))
    `);
    await queryRunner.query(`
      ALTER TABLE "lote_resina"
      ADD CONSTRAINT "ck_lote_resina_fornecedor_origem"
      CHECK ("origem" <> 'COMPRA' OR "fornecedor_id" IS NOT NULL)
    `);
    await queryRunner.query(`
      ALTER TABLE "lote_resina"
      ADD CONSTRAINT "ck_lote_resina_custo_nao_negativo"
      CHECK ("custo_por_kg" IS NULL OR "custo_por_kg" >= 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lote_resina" DROP CONSTRAINT IF EXISTS "ck_lote_resina_custo_nao_negativo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lote_resina" DROP CONSTRAINT IF EXISTS "ck_lote_resina_fornecedor_origem"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lote_resina" DROP CONSTRAINT IF EXISTS "ck_lote_resina_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lote_resina" DROP CONSTRAINT IF EXISTS "ck_lote_resina_origem"`,
    );
    await queryRunner.query(`ALTER TABLE "lote_resina" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "lote_resina" DROP COLUMN IF EXISTS "custo_por_kg"`);
    await queryRunner.query(`ALTER TABLE "lote_resina" DROP COLUMN IF EXISTS "validade"`);
    await queryRunner.query(`ALTER TABLE "lote_resina" DROP COLUMN IF EXISTS "origem"`);
  }
}
