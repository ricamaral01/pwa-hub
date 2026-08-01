import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fase3Ocorrencias1730800000000 implements MigrationInterface {
  name = 'Fase3Ocorrencias1730800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tipo_ocorrencia"
      ADD COLUMN IF NOT EXISTS "classificacao_padrao" varchar(20) NOT NULL DEFAULT 'nao_produtiva',
      ADD COLUMN IF NOT EXISTS "programacao_padrao" varchar(20) NOT NULL DEFAULT 'nao_programada',
      ADD COLUMN IF NOT EXISTS "entra_calculo_oee" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "exige_acao_corretiva" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "exige_aprovacao" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "tipo_ocorrencia"
      ADD CONSTRAINT "ck_tipo_ocorrencia_classificacao"
      CHECK ("classificacao_padrao" IN ('produtiva', 'nao_produtiva'))
    `);
    await queryRunner.query(`
      ALTER TABLE "tipo_ocorrencia"
      ADD CONSTRAINT "ck_tipo_ocorrencia_programacao"
      CHECK ("programacao_padrao" IN ('programada', 'nao_programada'))
    `);
    await queryRunner.query(`
      CREATE TABLE "ocorrencia" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
        "unidade_id" uuid NOT NULL REFERENCES "unidade"("id") ON DELETE RESTRICT,
        "apontamento_id" uuid NOT NULL REFERENCES "apontamento"("id") ON DELETE RESTRICT,
        "maquina_id" uuid NOT NULL REFERENCES "maquina"("id") ON DELETE RESTRICT,
        "dispositivo_id" uuid NOT NULL REFERENCES "dispositivo"("id") ON DELETE RESTRICT,
        "operador_id" uuid NOT NULL REFERENCES "colaborador"("id") ON DELETE RESTRICT,
        "tipo_ocorrencia_id" uuid NOT NULL REFERENCES "tipo_ocorrencia"("id") ON DELETE RESTRICT,
        "classificacao" varchar(20) NOT NULL CHECK ("classificacao" IN ('produtiva', 'nao_produtiva')),
        "programacao" varchar(20) NOT NULL CHECK ("programacao" IN ('programada', 'nao_programada')),
        "entra_calculo_oee" boolean NOT NULL DEFAULT true,
        "inicio_em" timestamptz NOT NULL,
        "fim_em" timestamptz,
        "descricao" text NOT NULL,
        "causa" text,
        "acao_corretiva" text,
        "responsavel_acao_id" uuid REFERENCES "colaborador"("id") ON DELETE RESTRICT,
        "exige_acao_corretiva_aplicado" boolean NOT NULL DEFAULT false,
        "exige_aprovacao_aplicado" boolean NOT NULL DEFAULT false,
        "aprovada_por" uuid REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "aprovada_em" timestamptz,
        "status" varchar(30) NOT NULL CHECK ("status" IN ('aberta', 'aguardando_acao', 'aguardando_aprovacao', 'encerrada', 'cancelada')),
        "idempotency_key" uuid NOT NULL UNIQUE,
        "motivo_cancelamento" text,
        "encerrada_por" uuid,
        "encerrada_em" timestamptz,
        "cancelada_por" uuid,
        "cancelada_em" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CHECK ("fim_em" IS NULL OR "fim_em" > "inicio_em"),
        CHECK ("status" <> 'cancelada' OR length(trim(coalesce("motivo_cancelamento", ''))) > 0),
        CHECK ("status" <> 'encerrada' OR "fim_em" IS NOT NULL)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_ocorrencia_aberta_maquina"
      ON "ocorrencia" ("maquina_id")
      WHERE "status" IN ('aberta', 'aguardando_acao', 'aguardando_aprovacao')
    `);
    for (const [name, column] of [
      ['idx_ocorrencia_empresa', 'empresa_id'],
      ['idx_ocorrencia_unidade', 'unidade_id'],
      ['idx_ocorrencia_maquina', 'maquina_id'],
      ['idx_ocorrencia_dispositivo', 'dispositivo_id'],
      ['idx_ocorrencia_apontamento', 'apontamento_id'],
      ['idx_ocorrencia_operador', 'operador_id'],
      ['idx_ocorrencia_tipo', 'tipo_ocorrencia_id'],
      ['idx_ocorrencia_inicio', 'inicio_em'],
      ['idx_ocorrencia_status', 'status'],
    ]) {
      await queryRunner.query(`CREATE INDEX "${name}" ON "ocorrencia" ("${column}")`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ocorrencia"`);
    await queryRunner.query(`ALTER TABLE "tipo_ocorrencia" DROP CONSTRAINT IF EXISTS "ck_tipo_ocorrencia_programacao"`);
    await queryRunner.query(`ALTER TABLE "tipo_ocorrencia" DROP CONSTRAINT IF EXISTS "ck_tipo_ocorrencia_classificacao"`);
    await queryRunner.query(`
      ALTER TABLE "tipo_ocorrencia"
      DROP COLUMN IF EXISTS "exige_aprovacao",
      DROP COLUMN IF EXISTS "exige_acao_corretiva",
      DROP COLUMN IF EXISTS "entra_calculo_oee",
      DROP COLUMN IF EXISTS "programacao_padrao",
      DROP COLUMN IF EXISTS "classificacao_padrao"
    `);
  }
}
