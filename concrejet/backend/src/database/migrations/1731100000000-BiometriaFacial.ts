import { MigrationInterface, QueryRunner } from 'typeorm';

export class BiometriaFacial1731100000000 implements MigrationInterface {
  name = 'BiometriaFacial1731100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS biometria_facial (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id uuid NOT NULL REFERENCES empresa(id) ON DELETE RESTRICT,
        unidade_id uuid NOT NULL REFERENCES unidade(id) ON DELETE RESTRICT,
        colaborador_id uuid NOT NULL REFERENCES colaborador(id) ON DELETE RESTRICT,
        modelo_nome varchar(80) NOT NULL,
        modelo_versao varchar(40) NOT NULL,
        template_criptografado bytea NOT NULL,
        template_iv bytea NOT NULL,
        template_auth_tag bytea NOT NULL,
        qualidade numeric(6,4) NOT NULL,
        threshold_aplicado numeric(6,4) NOT NULL,
        ativa boolean NOT NULL DEFAULT true,
        emitida_em timestamptz NOT NULL,
        ultima_utilizacao_em timestamptz,
        revogada_em timestamptz,
        revogada_por uuid,
        motivo_revogacao text,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        versao integer NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS biometria_evento (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id uuid NOT NULL,
        unidade_id uuid NOT NULL,
        colaborador_id uuid,
        dispositivo_id uuid,
        maquina_id uuid,
        tipo_evento varchar(40) NOT NULL,
        resultado varchar(40) NOT NULL,
        similaridade numeric(6,4),
        motivo text,
        correlation_id uuid,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        versao integer NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_biometria_facial_colaborador_ativa ON biometria_facial (empresa_id, unidade_id, colaborador_id, ativa)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_biometria_evento_busca ON biometria_evento (empresa_id, unidade_id, colaborador_id, criado_em)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_biometria_facial_ativa ON biometria_facial (colaborador_id) WHERE ativa = true`,
    );
    await queryRunner.query(`
      INSERT INTO permissao (chave, descricao, modulo)
      VALUES
        ('biometria.consultar', 'Consultar biometria facial', 'biometria'),
        ('biometria.cadastrar', 'Cadastrar biometria facial', 'biometria'),
        ('biometria.testar', 'Testar biometria facial', 'biometria'),
        ('biometria.revogar', 'Revogar biometria facial', 'biometria'),
        ('biometria.excluir', 'Excluir biometria facial', 'biometria'),
        ('biometria.auditar', 'Auditar biometria facial', 'biometria'),
        ('operadores.autenticar_face', 'Autenticar operador por biometria facial', 'operacao')
      ON CONFLICT (chave) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_biometria_facial_ativa`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_biometria_evento_busca`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_biometria_facial_colaborador_ativa`);
    await queryRunner.query(`DROP TABLE IF EXISTS biometria_evento`);
    await queryRunner.query(`DROP TABLE IF EXISTS biometria_facial`);
  }
}
