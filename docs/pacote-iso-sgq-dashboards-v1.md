# Pacote ISO/SGQ - Dashboards V1

Status: release candidate
Ambiente: `mapa-concretagem-teste`

## Controle do documento

| Campo | Valor |
|---|---|
| Processo | Dashboards de Produtividade, Montagem e Defeitos |
| Sistema | mapa-concretagem-teste |
| Versao tecnica | `dashboard-v1` |
| Data | 2026-08-20 |
| Responsavel tecnico | A definir |
| Gestor SGQ | A definir |
| Autoridade de liberacao | A definir |

## Matriz de rastreabilidade

| Requisito | Evidencia |
|---|---|
| Seis escopos oficiais | `docs/matriz-setores-dashboards-v1.md` |
| S1_S2 ponderado | `docs/dataset-ouro-dashboards-v1.json` e `docs/evidencias-execucao-dashboards-v1.md` |
| Total S1+S2+S3+S4 | RPCs `*_resumo_v1` |
| Defeitos independente de Montagem | `viewDashboardDefeitos`, filtros `df*`, `carregarDashboardDefeitos()` |
| Agregacao server-side | `supabase/migrations/202608200002_dashboard_analytics_v1.sql` |
| Sem `select("*")` nos carregamentos refatorados | `tests/dashboard-contracts.test.js` |
| Cache/concorrencia | `dashboardRequestSeq`, cache de payload RPC |
| Dataset ouro | `docs/dataset-ouro-dashboards-v1.json` |
| Plano de testes | `docs/plano-testes-dashboards-v1.md` |

## IQ - Qualificacao de instalacao

- Migrations aplicadas no Supabase linkado.
- Contratos RPC disponiveis via anon key atual.
- `npm test` passou.
- `node --check` de `app.js` e `sw.js` passou.
- Service worker de teste esta em modo reset/unregister.

## OQ - Qualificacao operacional

- RPCs testadas para `TOTAL`, `S1`, `S2`, `S3`, `S4`, `S1_S2`.
- Invariantes de S1+S2 validadas.
- Dashboard Defeitos tem view e filtros proprios.
- Fallback local/cache permanece disponivel.

## PQ - Qualificacao de desempenho

Executado:

- Validacao funcional das RPCs em periodo real de 2026-08-01 a 2026-08-20.

Pendente:

- Medicao p50/p95 formal.
- Validacao visual em navegador real.
- Acompanhamento de dois periodos fechados.

## Registro de release

| Item | Status |
|---|---|
| Migration aplicada em teste | Concluido |
| Testes automatizados | Concluido |
| Validacao visual | Pendente por indisponibilidade de navegador no ambiente |
| Deploy producao | Nao executado |
| Rollback documentado | Concluido em `docs/release-candidate-cutover-dashboards-v1.md` |

## Assinaturas

| Papel | Nome | Data | Assinatura |
|---|---|---|---|
| Responsavel tecnico | A definir | A definir | A definir |
| Gestor SGQ | A definir | A definir | A definir |
| Autoridade de liberacao | A definir | A definir | A definir |
