# Plano de Suporte - Dashboards V1

Ambiente: `mapa-concretagem-teste`

## Monitoramento operacional

Checar diariamente durante piloto:

- RPCs respondem para os seis escopos.
- Sem erros de console nos dashboards.
- Sem divergencia entre `S1_S2` e soma de `S1 + S2`.
- `TOTAL` nao inclui `UNCLASSIFIED`.
- Cache nao apresenta dados stale sem aviso.

## Incidentes

Classificacao:

- P1: KPI oficial incorreto, falha de seguranca ou tela indisponivel.
- P2: erro parcial em grafico/tabela sem afetar KPI principal.
- P3: ajuste visual, texto, responsividade ou melhoria.

## Evidencias obrigatorias em incidente

- Data/hora.
- Usuario/perfil.
- Dashboard.
- Escopo.
- Filtros.
- Screenshot.
- Payload RPC quando aplicavel.
- Commit/versao.

## Acao de contencao

- Usar fallback local/cache somente como contingencia temporaria.
- Se a divergencia vier das RPCs, desabilitar uso do contrato no frontend por rollback de commit.
- Se a divergencia vier de dados de origem, registrar como pendencia de homologacao.

## Rotina de acompanhamento

- D+1: validar todos os escopos.
- D+7: revisar incidentes e tempos de resposta.
- Dois periodos fechados: emitir parecer de estabilizacao.

## Treinamento minimo

Publicos:

- Producao/PCP: leitura de escopos, Total e S1+S2.
- Qualidade: Taxa NC, reprovacao, retrabalho e Pareto.
- TI: migrations, rollback, cache e evidencias.
- Gestao: diferenca entre Total, setores e consolidado.
