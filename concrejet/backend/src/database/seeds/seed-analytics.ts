import 'reflect-metadata';
import { AppDataSource } from '../data-source';

function uuid(seed: string) {
  return `00000000-0000-4000-8000-${seed.padStart(12, '0').slice(-12)}`;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed analitico bloqueado em producao.');
  }
  await AppDataSource.initialize();
  await AppDataSource.transaction(async (manager) => {
    const [empresa] = await manager.query(`select id from empresa order by criado_em limit 1`);
    const [unidade] = await manager.query(
      `select id from unidade where empresa_id=$1 order by criado_em limit 1`,
      [empresa.id],
    );
    const [funcao] = await manager.query(
      `select id from funcao where empresa_id=$1 order by criado_em limit 1`,
      [empresa.id],
    );
    const [maquina1] = await manager.query(
      `select id from maquina where unidade_id=$1 order by codigo limit 1`,
      [unidade.id],
    );
    await manager.query(
      `
        insert into maquina (id, unidade_id, codigo, nome, modelo, ativo)
        values ($1,$2,'INJ-02','Injetora 02','Seed analitico',true)
        on conflict (id) do nothing
      `,
      [uuid('2'), unidade.id],
    );
    await manager.query(
      `
        insert into colaborador (id, empresa_id, matricula, nome, funcao_id, pin_hash, ativo)
        values ($1,$2,'OP002','Operador Analitico 02',$3,'seed-sem-login',true)
        on conflict (empresa_id, matricula) do nothing
      `,
      [uuid('102'), empresa.id, funcao.id],
    );
    await manager.query(
      `
        insert into dispositivo (id, identificador, nome, tipo, maquina_id, ativo)
        values ($1,'DEV-TABLET-02','Tablet desenvolvimento 02','tablet',$2,true)
        on conflict (identificador) do nothing
      `,
      [uuid('202'), uuid('2')],
    );
    await manager.query(
      `
        insert into item (id, empresa_id, codigo, descricao, ativo)
        values
          ($1,$3,'ITEM-AN-002','Item analitico 002',true),
          ($2,$3,'ITEM-AN-003','Item analitico 003',true)
        on conflict (empresa_id, codigo) do nothing
      `,
      [uuid('302'), uuid('303'), empresa.id],
    );
    await manager.query(
      `
        insert into molde (id, empresa_id, codigo, descricao, ativo)
        values
          ($1,$3,'MOLDE-AN-002','Molde analitico 002',true),
          ($2,$3,'MOLDE-AN-003','Molde analitico 003',true)
        on conflict (empresa_id, codigo) do nothing
      `,
      [uuid('402'), uuid('403'), empresa.id],
    );
    const [operacao] = await manager.query(
      `select id from operacao where empresa_id=$1 order by codigo limit 1`,
      [empresa.id],
    );
    const [resina] = await manager.query(
      `select id from resina where empresa_id=$1 order by codigo limit 1`,
      [empresa.id],
    );
    const [fornecedor] = await manager.query(
      `select id from fornecedor where empresa_id=$1 order by nome limit 1`,
      [empresa.id],
    );
    for (const [item, molde, peso, ciclo, cavidades] of [
      [uuid('302'), uuid('402'), '180.000', 38, 2],
      [uuid('303'), uuid('403'), '95.000', 24, 4],
    ] as const) {
      await manager.query(
        `
          insert into configuracao_item_molde (
            empresa_id,item_id,molde_id,peso_peca_g,ciclo_padrao_segundos,cavidades,
            limite_perda_percentual,vigencia_inicio,ativo
          )
          values ($1,$2,$3,$4,$5,$6,'7.00','2026-01-01',true)
          on conflict do nothing
        `,
        [empresa.id, item, molde, peso, ciclo, cavidades],
      );
    }
    await manager.query(
      `
        insert into lote_resina (
          id, empresa_id, codigo, resina_id, fornecedor_id, quantidade_inicial_kg, saldo_atual_kg,
          data_recebimento, origem, status, custo_por_kg, ativo
        )
        values
          ($1,$3,'LOTE-AN-001',$4,$5,1200,980,'2026-07-20','COMPRA','DISPONIVEL',8.25,true),
          ($2,$3,'LOTE-AN-002',$4,$5,900,760,'2026-07-22','COMPRA','DISPONIVEL',8.70,true)
        on conflict (empresa_id, codigo) do nothing
      `,
      [uuid('501'), uuid('502'), empresa.id, resina.id, fornecedor.id],
    );
    for (const diaSemana of [1, 2, 3, 4, 5]) {
      await manager.query(
        `
          insert into calendario_turno (
            id, empresa_id, unidade_id, maquina_id, dia_semana, inicio_hora, fim_hora,
            vigencia_inicio, intervalos_excluidos, indisponibilidades_planejadas, observacao
          )
          values
            (gen_random_uuid(),$1,$2,$3,$5,'08:00','17:00','2026-01-01',$6::jsonb,$7::jsonb,'Seed analitico'),
            (gen_random_uuid(),$1,$2,$4,$5,'08:00','17:00','2026-01-01',$6::jsonb,$7::jsonb,'Seed analitico')
          on conflict do nothing
        `,
        [
          empresa.id,
          unidade.id,
          maquina1.id,
          uuid('2'),
          diaSemana,
          JSON.stringify([{ inicio: '12:00:00', fim: '13:00:00', motivo: 'Refeicao' }]),
          JSON.stringify([{ inicio: '15:00:00', fim: '15:15:00', motivo: 'Setup planejado' }]),
        ],
      );
    }
    const configs = await manager.query(
      `select id,item_id,molde_id,peso_peca_g,ciclo_padrao_segundos,cavidades from configuracao_item_molde where empresa_id=$1 order by criado_em limit 3`,
      [empresa.id],
    );
    const ops = [
      ['601', 'OP-AN-001', configs[0].item_id, configs[0].molde_id],
      ['602', 'OP-AN-002', configs[1].item_id, configs[1].molde_id],
    ];
    for (const [idSeed, numero, itemId, moldeId] of ops) {
      await manager.query(
        `
          insert into ordem_producao (id, empresa_id, unidade_id, numero, item_id, molde_id, quantidade_planejada, data_inicio_planejada, status, ativo)
          values ($1,$2,$3,$4,$5,$6,5000,'2026-07-27','ABERTA',true)
          on conflict (empresa_id, numero) do nothing
        `,
        [uuid(idSeed), empresa.id, unidade.id, numero, itemId, moldeId],
      );
    }
    const [op1] = await manager.query(
      `select id from colaborador where empresa_id=$1 and matricula='OP001'`,
      [empresa.id],
    );
    const [op2] = await manager.query(
      `select id from colaborador where empresa_id=$1 and matricula='OP002'`,
      [empresa.id],
    );
    const [dev1] = await manager.query(
      `select id from dispositivo where identificador='DEV-TABLET-01'`,
    );
    const [dev2] = await manager.query(
      `select id from dispositivo where identificador='DEV-TABLET-02'`,
    );
    const apontamentos = [
      [
        '701',
        dev1.id,
        uuid('2'),
        op1.id,
        uuid('601'),
        configs[0],
        uuid('501'),
        '2026-07-27T08:00:00-03:00',
        '2026-07-27T11:30:00-03:00',
        620,
        18,
        6,
        5.2,
        2.1,
        0.8,
        42,
      ],
      [
        '702',
        dev2.id,
        uuid('2'),
        op2.id,
        uuid('602'),
        configs[1],
        uuid('502'),
        '2026-07-27T13:00:00-03:00',
        '2026-07-27T16:50:00-03:00',
        1300,
        30,
        8,
        3.4,
        1.2,
        0.5,
        25,
      ],
      [
        '703',
        dev1.id,
        uuid('2'),
        op1.id,
        uuid('601'),
        configs[0],
        uuid('501'),
        '2026-07-28T08:00:00-03:00',
        '2026-07-28T12:00:00-03:00',
        700,
        12,
        4,
        4.1,
        1.8,
        0.4,
        39,
      ],
      [
        '704',
        dev2.id,
        uuid('2'),
        op2.id,
        uuid('602'),
        configs[1],
        uuid('502'),
        '2026-07-28T13:10:00-03:00',
        '2026-07-28T16:40:00-03:00',
        1180,
        44,
        15,
        5.6,
        1.7,
        1.2,
        28,
      ],
      [
        '705',
        dev1.id,
        maquina1.id,
        op1.id,
        uuid('601'),
        configs[0],
        uuid('501'),
        '2026-07-29T08:10:00-03:00',
        '2026-07-29T11:40:00-03:00',
        590,
        25,
        10,
        6.3,
        2.4,
        1.1,
        47,
      ],
      [
        '706',
        dev1.id,
        maquina1.id,
        op2.id,
        uuid('602'),
        configs[1],
        uuid('502'),
        '2026-07-29T13:05:00-03:00',
        '2026-07-29T16:20:00-03:00',
        1120,
        22,
        5,
        2.9,
        1.1,
        0.3,
        23,
      ],
    ] as const;
    for (const row of apontamentos) {
      const [
        seed,
        dispositivoId,
        maquinaId,
        operadorId,
        ordemId,
        cfg,
        loteId,
        inicio,
        fim,
        boas,
        refugo,
        falha,
        borra,
        galho,
        outras,
        cicloReal,
      ] = row;
      await manager.query(
        `
          insert into apontamento (
            id, empresa_id, unidade_id, dispositivo_id, maquina_id, operador_id, ordem_producao_id,
            item_id, molde_id, configuracao_item_molde_id, lote_resina_id, operacao_id, data_producao,
            inicio_em, fim_em, ciclo_real_s, pecas_boas, pecas_refugo, falha_preenchimento_qtd,
            borra_kg, galho_kg, outras_perdas_kg, status, origem, idempotency_key,
            peso_peca_aplicado_g, cavidades_aplicadas, ciclo_padrao_aplicado_s,
            limite_perda_aplicado_pct, custo_resina_aplicado_kg
          )
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,($13::timestamptz)::date,$13,$14,$15,$16,$17,$18,$19,$20,$21,'concluido','importacao',$22,$23,$24,$25,'7.00',8.50)
          on conflict (idempotency_key) do nothing
        `,
        [
          uuid(seed),
          empresa.id,
          unidade.id,
          dispositivoId,
          maquinaId,
          operadorId,
          ordemId,
          cfg.item_id,
          cfg.molde_id,
          cfg.id,
          loteId,
          operacao.id,
          inicio,
          fim,
          cicloReal,
          boas,
          refugo,
          falha,
          borra,
          galho,
          outras,
          uuid(`9${seed}`),
          cfg.peso_peca_g,
          cfg.cavidades,
          cfg.ciclo_padrao_segundos,
        ],
      );
      await manager.query(
        `
          insert into estoque_movimento (
            empresa_id, unidade_id, lote_id, tipo_movimento, origem_tipo, origem_id, quantidade_kg,
            saldo_anterior_kg, saldo_posterior_kg, custo_unitario_aplicado, custo_total_aplicado,
            observacao, idempotency_key
          )
          values ($1,$2,$3,'consumo','apontamento',$4,25,1000,975,8.50,212.50,'Consumo analitico desenvolvimento',$5)
          on conflict (idempotency_key) do nothing
        `,
        [empresa.id, unidade.id, loteId, uuid(seed), uuid(`8${seed}`)],
      );
    }
    const [tipo] = await manager.query(
      `select id from tipo_ocorrencia where empresa_id=$1 order by codigo limit 1`,
      [empresa.id],
    );
    await manager.query(
      `
        insert into ocorrencia (
          id, empresa_id, unidade_id, apontamento_id, maquina_id, dispositivo_id, operador_id,
          tipo_ocorrencia_id, classificacao, programacao, entra_calculo_oee, inicio_em, fim_em,
          descricao, causa, acao_corretiva, status, idempotency_key
        )
        values
          ($1,$3,$4,$5,$6,$7,$8,$9,'nao_produtiva','nao_programada',true,'2026-07-27T09:10:00-03:00','2026-07-27T09:35:00-03:00','Parada nao programada analitica','Ajuste sensor','Sensor ajustado','encerrada',$10),
          ($2,$3,$4,$11,$6,$7,$8,$9,'nao_produtiva','programada',false,'2026-07-28T15:00:00-03:00','2026-07-28T15:15:00-03:00','Setup planejado analitico','Troca planejada','Setup concluido','encerrada',$12)
        on conflict (idempotency_key) do nothing
      `,
      [
        uuid('801'),
        uuid('802'),
        empresa.id,
        unidade.id,
        uuid('701'),
        uuid('2'),
        dev1.id,
        op1.id,
        tipo.id,
        uuid('9801'),
        uuid('703'),
        uuid('9802'),
      ],
    );
    await manager.query(
      `
        insert into blenda (
          id, empresa_id, unidade_id, codigo, descricao, data_hora, quantidade_planejada_kg,
          quantidade_resultante_kg, perda_processo_kg, lote_resultante_id, status, observacao
        )
        values ($1,$2,$3,'BLENDA-AN-001','Blenda analitica desenvolvimento','2026-07-29T17:00:00-03:00',120,118,2,$4,'concluida','Seed analitico')
        on conflict (empresa_id, codigo) do nothing
      `,
      [uuid('901'), empresa.id, unidade.id, uuid('502')],
    );
    await manager.query(
      `
        insert into blenda_componente (blenda_id, lote_origem_id, quantidade_kg, percentual_calculado, custo_unitario_aplicado, custo_total_aplicado)
        select $1,$2,60,50,8.50,510
        where not exists (select 1 from blenda_componente where blenda_id=$1 and lote_origem_id=$2)
      `,
      [uuid('901'), uuid('501')],
    );
  });
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error('Falha ao executar seed analitico:', error);
  process.exitCode = 1;
});
