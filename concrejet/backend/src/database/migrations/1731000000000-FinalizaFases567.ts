import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinalizaFases5671731000000000 implements MigrationInterface {
  name = 'FinalizaFases5671731000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE calendario_turno
        ADD COLUMN IF NOT EXISTS intervalos_excluidos jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS indisponibilidades_planejadas jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS observacao text
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_calendario_turno_busca
      ON calendario_turno (empresa_id, unidade_id, maquina_id, dia_semana, vigencia_inicio, vigencia_fim)
      WHERE ativo = true
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_calendario_turno_idempotente
      ON calendario_turno (
        empresa_id,
        unidade_id,
        coalesce(maquina_id, '00000000-0000-0000-0000-000000000000'::uuid),
        dia_semana,
        inicio_hora,
        fim_hora,
        vigencia_inicio
      )
    `);
    await queryRunner.query(`DROP VIEW IF EXISTS vw_oee_base`);
    await queryRunner.query(`
      CREATE VIEW vw_oee_base AS
      SELECT
        a.empresa_id,
        a.unidade_id,
        a.maquina_id,
        date_trunc('day', a.inicio_em)::date AS dia,
        count(*) FILTER (WHERE a.status = 'concluido')::int AS apontamentos_concluidos,
        coalesce(sum(a.pecas_boas), 0)::numeric AS pecas_boas,
        coalesce(sum(a.pecas_boas + a.pecas_refugo + a.falha_preenchimento_qtd), 0)::numeric AS quantidade_total,
        coalesce(sum(((a.pecas_boas + a.pecas_refugo + a.falha_preenchimento_qtd) * a.ciclo_padrao_aplicado_s) / greatest(a.cavidades_aplicadas, 1)), 0)::numeric AS tempo_ideal_s
      FROM apontamento a
      WHERE a.status = 'concluido' AND a.fim_em IS NOT NULL
      GROUP BY a.empresa_id, a.unidade_id, a.maquina_id, date_trunc('day', a.inicio_em)::date
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_calendario_turno_busca`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_calendario_turno_idempotente`);
    await queryRunner.query(`
      ALTER TABLE calendario_turno
        DROP COLUMN IF EXISTS observacao,
        DROP COLUMN IF EXISTS indisponibilidades_planejadas,
        DROP COLUMN IF EXISTS intervalos_excluidos
    `);
  }
}
