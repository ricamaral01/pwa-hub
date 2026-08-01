# Memoria de calculo OEE

Formula implementada: `OEE = disponibilidade * performance * qualidade`.

- Disponibilidade: tempo operacional dividido pelo tempo planejado liquido calculado a partir de `calendario_turno`.
- Tempo operacional: tempo planejado menos paradas nao planejadas marcadas para entrar no OEE.
- Performance: tempo ideal dividido pelo tempo operacional.
- Qualidade: pecas boas divididas pelo total apontado.

O endpoint `/analytics/oee` retorna os indicadores e a memoria de calculo com periodo, turnos considerados, intervalos excluidos, indisponibilidades planejadas, paradas incluidas/excluidas, quantidades, tempo ideal e `formulaVersion`.

Versao da formula: `oee-v1-2026-08-01`.

Quando nao existe calendario aplicavel para o periodo, o OEE nao assume 24h nem o intervalo bruto da consulta: os indicadores ficam nulos e a memoria retorna `configuracaoAusente`/inconsistencias para ajuste do calendario produtivo.
