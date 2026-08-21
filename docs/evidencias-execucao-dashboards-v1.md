# Evidencias de Execucao - Dashboards V1

Data: 2026-08-20
Ambiente: Supabase linkado `fbvvdyirhtgvycullsqy`, usado pelo `mapa-concretagem-teste`
Deploy de producao: nao executado.

## 1. Migration

Comando executado:

```text
npx supabase db push
```

Migrations aplicadas:

- `202608200001_add_vibrado_to_producao.sql`
- `202608200002_dashboard_analytics_v1.sql`

Resultado:

```text
Finished supabase db push.
```

## 2. Contratos RPC validados

Periodo testado:

- `2026-08-01` a `2026-08-20`

Escopos testados:

- `TOTAL`
- `S1`
- `S2`
- `S3`
- `S4`
- `S1_S2`

RPCs testadas:

- `rpc_dashboard_produtividade_resumo_v1`
- `rpc_dashboard_montagem_resumo_v1`
- `rpc_dashboard_defeitos_resumo_v1`

## 3. Resultados principais

Produtividade:

| Escopo | Total formas | Dias | Fora padrao |
|---|---:|---:|---:|
| TOTAL | 2842 | 16 | 688 |
| S1 | 802 | 13 | 31 |
| S2 | 956 | 13 | 46 |
| S3 | 623 | 16 | 580 |
| S4 | 461 | 12 | 31 |
| S1_S2 | 1758 | 13 | 77 |

Montagem:

| Escopo | Produzidos | Montados | Aprovados | Recusados | Retrabalho | Atingimento |
|---|---:|---:|---:|---:|---:|---:|
| TOTAL | 2842 | 1472 | 1382 | 79 | 70 | 51.79% |
| S1 | 802 | 630 | 597 | 26 | 24 | 78.55% |
| S2 | 956 | 842 | 785 | 53 | 46 | 88.08% |
| S3 | 623 | 0 | 0 | 0 | 0 | 0% |
| S4 | 461 | 0 | 0 | 0 | 0 | 0% |
| S1_S2 | 1758 | 1472 | 1382 | 79 | 70 | 83.73% |

Defeitos:

| Escopo | Producao | Postes | Oportunidades | Erros | Taxa NC | Postes com defeito | Reprovados | Retrabalho |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| TOTAL | 2842 | 1472 | 41019 | 101 | 0.25% | 73 | 9 | 70 |
| S1 | 802 | 630 | 17486 | 39 | 0.22% | 25 | 2 | 24 |
| S2 | 956 | 842 | 23533 | 62 | 0.26% | 48 | 7 | 46 |
| S3 | 623 | 0 | 0 | 0 | 0% | 0 | 0 | 0 |
| S4 | 461 | 0 | 0 | 0 | 0% | 0 | 0 | 0 |
| S1_S2 | 1758 | 1472 | 41019 | 101 | 0.25% | 73 | 9 | 70 |

## 4. Invariantes confirmadas

`S1_S2` em Defeitos:

| Campo | S1_S2 | S1 + S2 | Resultado |
|---|---:|---:|---|
| `producao` | 1758 | 1758 | OK |
| `postes` | 1472 | 1472 | OK |
| `total_possivel` | 41019 | 41019 | OK |
| `total_erros` | 101 | 101 | OK |
| `postes_com_defeito` | 73 | 73 | OK |
| `postes_reprovados` | 9 | 9 | OK |
| `retrabalho` | 70 | 70 | OK |

`TOTAL` retornou `included_sectors`:

```json
["Setor 1", "Setor 2", "Setor 3", "Setor 4"]
```

## 5. Validacoes locais

- `node --check mapa-concretagem-teste/app.js`: passou.
- `node --check mapa-concretagem-teste/sw.js`: passou.
- Parse de `docs/dataset-ouro-dashboards-v1.json`: passou.
- `npm test`: passou, incluindo 9 testes Node e testes de dosagem.
- Checagem estatica de DOM/JS dos dashboards: passou.
- `git diff --check -- mapa-concretagem-teste/app.js mapa-concretagem-teste/index.html`: passou com avisos de EOL do Git.

Validacao visual:

- Foi iniciado servidor local em `http://localhost:8087`.
- O conector de navegador nao estava disponivel neste ambiente.
- `npx playwright --version` funcionou, mas o pacote temporario nao ficou resolvivel via `require('playwright')` no stdin do PowerShell; por isso a validacao visual automatizada nao foi concluida.

## 6. Pendencias restantes

- Validacao visual com navegador real em desktop/tablet/celular/TV.
- Comparar uma amostra de tela contra os contratos RPC no navegador.
- Decidir se os fluxos operacionais legados fora dos dashboards devem tambem remover `select("*")`.
- Definir se `Setor de Testes` deve ser preservado apenas como `UNCLASSIFIED` ou removido das fontes.

## 7. Pacote final para push

Documentos adicionais emitidos:

- `docs/dicionario-indicadores-dashboards-v1.md`
- `docs/matriz-setores-dashboards-v1.md`
- `docs/pacote-iso-sgq-dashboards-v1.md`
- `docs/release-candidate-cutover-dashboards-v1.md`
- `docs/plano-suporte-dashboards-v1.md`
- `docs/relatorio-pos-implantacao-dashboards-v1.md`

Teste automatizado adicional:

- `tests/dashboard-contracts.test.js`
