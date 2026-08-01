# Memoria de calculo OEE

Formula implementada: `OEE = disponibilidade * performance * qualidade`.

- Disponibilidade: tempo operacional dividido pelo tempo planejado do periodo consultado.
- Tempo operacional: tempo planejado menos paradas nao planejadas marcadas para entrar no OEE.
- Performance: tempo ideal dividido pelo tempo operacional.
- Qualidade: pecas boas divididas pelo total apontado.

O endpoint `/analytics/oee` retorna os indicadores e a memoria de calculo com periodo, tempos, paradas incluidas/excluidas, quantidades, tempo ideal e `formulaVersion`.

Versao da formula: `oee-v1-2026-08-01`.

Pendencia conhecida: a tabela `calendario_turno` foi criada como base historica, mas o tempo planejado ainda usa o intervalo informado na consulta.

