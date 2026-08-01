# Views de analytics

A migration `1730900000000-Fases5A7EstoqueAnalyticsImportacao` cria views SQL reconstruiveis a partir das tabelas brutas.

- `vw_producao_diaria`: producao concluida por dia, maquina, item e molde.
- `vw_perdas_diarias`: perdas por dia e resina.
- `vw_ocorrencias_duracao`: duracao de ocorrencias e flags de OEE.
- `vw_consumo_lotes`: movimentos de consumo por lote.
- `vw_rastreabilidade_lotes`: rastreabilidade basica de lotes e movimentos.
- `vw_oee_base`: base diaria para calculo de OEE.

Nenhum agregado e fonte da verdade. Relatorios e dashboards usam essas views ou agregacoes SQL diretas.

