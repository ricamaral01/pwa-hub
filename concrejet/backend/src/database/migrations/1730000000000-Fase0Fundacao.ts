import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fase0Fundacao1730000000000 implements MigrationInterface {
  name = 'Fase0Fundacao1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "empresa" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "razao_social" varchar(200) NOT NULL,
        "cnpj" varchar(14) NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_empresa_cnpj" UNIQUE ("cnpj"),
        CONSTRAINT "ck_empresa_cnpj_formato" CHECK ("cnpj" ~ '^[0-9]{14}$')
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "unidade" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
        "codigo" varchar(20) NOT NULL,
        "nome" varchar(150) NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_unidade_empresa_codigo" UNIQUE ("empresa_id", "codigo")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_unidade_empresa_id" ON "unidade" ("empresa_id")`);

    await queryRunner.query(`
      CREATE TABLE "perfil" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
        "codigo" varchar(60) NOT NULL,
        "nome" varchar(120) NOT NULL,
        "descricao" text,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_perfil_empresa_codigo" UNIQUE ("empresa_id", "codigo")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permissao" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "chave" varchar(100) NOT NULL,
        "descricao" varchar(150) NOT NULL,
        "modulo" varchar(60) NOT NULL,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_permissao_chave" UNIQUE ("chave")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "perfil_permissao" (
        "perfil_id" uuid NOT NULL REFERENCES "perfil"("id") ON DELETE CASCADE,
        "permissao_id" uuid NOT NULL REFERENCES "permissao"("id") ON DELETE CASCADE,
        PRIMARY KEY ("perfil_id", "permissao_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "usuario" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL REFERENCES "empresa"("id") ON DELETE RESTRICT,
        "unidade_id" uuid REFERENCES "unidade"("id") ON DELETE RESTRICT,
        "nome" varchar(150) NOT NULL,
        "email" varchar(180) NOT NULL,
        "senha_hash" varchar(255) NOT NULL,
        "deve_trocar_senha" boolean NOT NULL DEFAULT true,
        "tentativas_login" integer NOT NULL DEFAULT 0,
        "bloqueado_ate" timestamptz,
        "ultimo_login_em" timestamptz,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_usuario_empresa_email" UNIQUE ("empresa_id", "email"),
        CONSTRAINT "ck_usuario_tentativas_login_nao_negativo" CHECK ("tentativas_login" >= 0),
        CONSTRAINT "ck_usuario_email_formato" CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_usuario_empresa_id" ON "usuario" ("empresa_id")`);

    await queryRunner.query(`
      CREATE TABLE "usuario_perfil" (
        "usuario_id" uuid NOT NULL REFERENCES "usuario"("id") ON DELETE CASCADE,
        "perfil_id" uuid NOT NULL REFERENCES "perfil"("id") ON DELETE RESTRICT,
        PRIMARY KEY ("usuario_id", "perfil_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "maquina" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "unidade_id" uuid NOT NULL REFERENCES "unidade"("id") ON DELETE RESTRICT,
        "codigo" varchar(30) NOT NULL,
        "nome" varchar(150) NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_maquina_unidade_codigo" UNIQUE ("unidade_id", "codigo")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_maquina_unidade_id" ON "maquina" ("unidade_id")`);

    await queryRunner.query(`
      CREATE TABLE "dispositivo" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "maquina_id" uuid REFERENCES "maquina"("id") ON DELETE RESTRICT,
        "identificador" varchar(100) NOT NULL,
        "nome" varchar(150) NOT NULL,
        "tipo" varchar(40) NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "versao" integer NOT NULL DEFAULT 1,
        CONSTRAINT "uq_dispositivo_identificador" UNIQUE ("identificador")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "auditoria" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "entidade" varchar(100) NOT NULL,
        "entidade_id" uuid NOT NULL,
        "acao" varchar(20) NOT NULL,
        "usuario_id" uuid REFERENCES "usuario"("id") ON DELETE SET NULL,
        "dados_antes" jsonb,
        "dados_depois" jsonb,
        "correlation_id" varchar(100),
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "ck_auditoria_acao" CHECK ("acao" IN ('CREATE', 'UPDATE', 'DELETE'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_auditoria_entidade" ON "auditoria" ("entidade", "entidade_id")`,
    );

    // Auditoria não permite alteração ou exclusão posterior (imutável por design).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION bloquear_alteracao_auditoria()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'Registros de auditoria são imutáveis e não podem ser alterados ou excluídos';
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_auditoria_bloquear_update
      BEFORE UPDATE OR DELETE ON "auditoria"
      FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao_auditoria();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_auditoria_bloquear_update ON "auditoria"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS bloquear_alteracao_auditoria`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auditoria"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dispositivo"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "maquina"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario_perfil"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "perfil_permissao"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissao"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "perfil"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "unidade"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "empresa"`);
  }
}
