# Dicionario de Indicadores - Dashboards V1

Status: release candidate para homologacao
Ambiente: `mapa-concretagem-teste`
Data: 2026-08-20

## Escopos oficiais

| Codigo | Nome | Regra |
|---|---|---|
| `TOTAL` | Total | Soma `Setor 1` + `Setor 2` + `Setor 3` + `Setor 4` |
| `S1` | Setor 1 | Apenas `Setor 1` |
| `S2` | Setor 2 | Apenas `Setor 2` |
| `S3` | Setor 3 | Apenas `Setor 3` |
| `S4` | Setor 4 | Apenas `Setor 4` |
| `S1_S2` | Consolidado Setor 1 + Setor 2 | Soma numeradores e denominadores de S1 e S2 antes de calcular percentuais |

`S1_S2` nao e setor novo. `UNCLASSIFIED`, nulos, `Todos` e `Setor de Testes` nao entram no Total oficial.

## Produtividade

| Indicador | Numerador | Denominador | Observacao |
|---|---|---|---|
| Total de formas | Linhas elegiveis de `producao` | N/A | Status `LIBERADO`, `INSPECIONADO` ou `CONCRETADO` |
| Dias com producao | Datas distintas | N/A | Por escopo e periodo |
| Media formas/dia | Total de formas | Dias com producao | Calculado no backend |
| Fora do padrao | Linhas cujo `tipo_concreto` nao equivale a padrao | Total de formas | Aliases pendentes de homologacao fina |

## Montagem

| Indicador | Numerador | Denominador | Observacao |
|---|---|---|---|
| Produzidos | Linhas elegiveis de `producao` | N/A | Mesmo escopo e periodo |
| Montados | Linhas de `montagem_poste` | N/A | Mesmo escopo e periodo |
| Aprovados | `status_montagem = 'A'` | Montados | Nao substitui taxa de defeitos |
| Recusados | Linhas com defeito ou reprovas | Montados | Usa ocorrencias derivadas de `checklists` |
| Retrabalho | `status_montagem = 'RR'` | Montados | Percentual calculado no backend |
| Atingimento | Montados | Produzidos | Percentual por escopo |

## Defeitos

| Indicador | Numerador | Denominador | Observacao |
|---|---|---|---|
| Taxa NC | Ocorrencias de defeito | Oportunidades avaliadas | Indicador principal |
| Indice de reprovacao | Postes com defeito | Postes avaliados | Diferente de Taxa NC |
| Taxa postes reprovados | Postes reprovados | Producao do periodo | Diferente de postes com defeito |
| Taxa retrabalho | Registros `RR` | Postes avaliados | Nao implica custo aprovado |
| Pareto | Ocorrencias por tipo | Total de ocorrencias | Fase seguinte pode expandir tipo normalizado |

## Datas-base e timezone

- Periodos usam `data_fabricacao`.
- Horarios usam timestamp original da fonte.
- Timezone operacional: America/Sao_Paulo.

## Denominador zero

- Percentuais retornam `0` quando o denominador e zero.
- O frontend deve exibir estado vazio ou warning quando a ausencia de denominador for relevante para decisao.

## Pendencias de homologacao

- Normalizacao final de aliases de `tipo_concreto`.
- Regra definitiva para `Setor de Testes`.
- Metas oficiais por indicador.
- Catalogo normalizado de tipos de defeito para Pareto sem depender apenas de texto visual do checklist.
