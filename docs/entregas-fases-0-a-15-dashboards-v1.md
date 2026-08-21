# Entregas Fases 0 a 15 - Dashboards V1

Status: pacote pronto para revisao e push
Ambiente trabalhado: `mapa-concretagem-teste`
Deploy de producao: nao executado
Data: 2026-08-20

## Nota de escopo

O plano mestre numera fases executivas ate a Fase 10. Para atender a solicitacao de avancar ate a Fase 15 sem inventar requisitos, este pacote mapeia:

- Fases 0 a 10: plano de execucao final por fases.
- Fase 11: testes e criterios de aceite.
- Fase 12: migracao, release e rollback.
- Fase 13: backlog priorizado.
- Fase 14: prompt/execucao Codex consolidada.
- Fase 15: pendencias obrigatorias antes da aprovacao SGQ.

## Fase 0 - Auditoria real e protecao do repositorio

Entregas:

- Auditoria de estrutura, schema observado, consultas, formulas atuais, acoplamento Montagem/Defeitos e riscos.
- Relatorio em `docs/fase-0-auditoria-e-baseline.md`.

Status: concluida.

## Fase 1 - Contrato de negocio, setor e SGQ

Entregas:

- `docs/dicionario-indicadores-dashboards-v1.md`
- `docs/matriz-setores-dashboards-v1.md`
- Escopos oficiais `TOTAL`, `S1`, `S2`, `S3`, `S4`, `S1_S2`.
- Pendencias de homologacao registradas sem transformar suposicoes em regra.

Status: tecnicamente concluida; homologacao formal pendente.

## Fase 2 - Dataset ouro e baseline

Entregas:

- `docs/dataset-ouro-dashboards-v1.json`
- Invariantes de Total e S1+S2.
- Teste automatizado em `tests/dashboard-contracts.test.js`.

Status: concluida para release candidate; dataset real adicional de dois periodos segue pendente para PQ formal.

## Fase 3 - Normalizacao e qualidade dos dados

Entregas:

- `dashboard_sector_code_v1`
- `dashboard_scope_sectors_v1`
- Views `vw_dashboard_producao_base_v1` e `vw_dashboard_montagem_base_v1`.
- Tratamento `UNCLASSIFIED`.

Arquivo:

- `supabase/migrations/202608200002_dashboard_analytics_v1.sql`

Status: concluida e aplicada em teste.

## Fase 4 - Backend analitico obrigatorio

Entregas:

- `rpc_dashboard_produtividade_resumo_v1`
- `rpc_dashboard_montagem_resumo_v1`
- `rpc_dashboard_defeitos_resumo_v1`
- Indices de apoio.
- Contratos JSON retornando `contract_version`, `generated_at`, `scope`, `included_sectors`, `kpis` e `by_sector`.

Status: concluida e validada em teste.

## Fase 5 - Shell V4 e componentes compartilhados

Entregas:

- Constantes de contrato frontend para colunas explicitas.
- Escopos compartilhados.
- Cache de payload RPC.
- Controle de concorrencia por dashboard via `dashboardRequestSeq`.
- Filtros dedicados para Defeitos.

Arquivos:

- `mapa-concretagem-teste/app.js`
- `mapa-concretagem-teste/index.html`

Status: concluida em nivel release candidate.

## Fase 6 - Piloto Dashboard Defeitos V4

Entregas:

- View propria `viewDashboardDefeitos`.
- Filtros proprios `dfDataInicio`, `dfDataFim`, `dfFiltroSetor`, `dfFiltroStatus`, `dfFiltroPesquisa`.
- Lifecycle proprio `carregarDashboardDefeitos()`.
- Uso da RPC `rpc_dashboard_defeitos_resumo_v1`.
- Fallback/cache preservado.
- Teste estrutural automatizado.

Status: tecnicamente concluida; validacao visual e aceite da Qualidade pendentes.

## Fase 7 - Retrabalho e custo

Entregas nesta execucao:

- Indicadores de retrabalho no contrato de Defeitos e Montagem.
- Documentacao de alcadas/custos como pendencia controlada.
- Inclusao no pacote SGQ e plano de suporte.

Status: parcialmente concluida. Eventos financeiros, formularios, policies de custo e aprovacao financeira seguem pendentes por regra de negocio.

## Fase 8 - Dashboard Montagem V4

Entregas:

- RPC propria `rpc_dashboard_montagem_resumo_v1`.
- Escopos oficiais.
- Contrato server-side para resumo.
- Protecao contra concorrencia e cache.

Status: release candidate tecnico para resumo. Tabela paginada server-side e remocao de handlers inline ficam como backlog controlado.

## Fase 9 - Dashboard Produtividade V4

Entregas:

- RPC propria `rpc_dashboard_produtividade_resumo_v1`.
- Escopos oficiais.
- KPI principal de formas integrado ao contrato quando disponivel.
- Fallback legado preservado para graficos detalhados.

Status: release candidate tecnico para resumo. Percentis/medianas server-side e tabelas PCP x Producao completas ficam como backlog controlado.

## Fase 10 - Hardening, SGQ e cutover

Entregas:

- `docs/pacote-iso-sgq-dashboards-v1.md`
- `docs/release-candidate-cutover-dashboards-v1.md`
- `docs/plano-suporte-dashboards-v1.md`
- `docs/relatorio-pos-implantacao-dashboards-v1.md`
- Service worker de teste verificado como reset/unregister.
- Rollback documentado.

Status: concluida como release candidate. Cutover produtivo nao executado.

## Fase 11 - Testes e criterios de aceite

Entregas:

- `docs/plano-testes-dashboards-v1.md`
- `tests/dashboard-contracts.test.js`
- `npm test` passou com 13 testes.
- `node --check mapa-concretagem-teste/app.js` passou.
- `node --check mapa-concretagem-teste/sw.js` passou.
- `git diff --check` dos arquivos desta entrega passou.

Status: concluida tecnicamente. Testes visuais/E2E dependem de navegador disponivel.

## Fase 12 - Migracao, release e rollback

Entregas:

- Migrations aplicadas em teste com `npx supabase db push`.
- `npx supabase migration list` confirmou `202608200002` local/remoto.
- Rollback documentado como aditivo e por reversao frontend.
- `.gitignore` atualizado com `supabase/.temp/`.

Status: concluida em teste. Producao nao alterada.

## Fase 13 - Backlog priorizado

Entregas:

- Backlog consolidado nos documentos:
  - `docs/release-candidate-cutover-dashboards-v1.md`
  - `docs/plano-suporte-dashboards-v1.md`
  - `docs/pendencias-homologacao-dashboards-v1.md`

Status: concluida como controle de pendencias.

## Fase 14 - Prompt/execucao Codex consolidada

Entregas:

- Este pacote consolida a execucao do prompt aprovado.
- Divergencias registradas.
- Evidencias registradas em `docs/evidencias-execucao-dashboards-v1.md`.

Status: concluida.

## Fase 15 - Pendencias obrigatorias antes da aprovacao SGQ

Entregas:

- `docs/pendencias-homologacao-dashboards-v1.md`
- Lista de pendencias obrigatorias e tecnicas nao bloqueantes para push.

Status: concluida como registro; fechamento depende de SGQ/negocio.

## Banco e contratos aplicados

Aplicado em teste:

- `202608200001_add_vibrado_to_producao.sql`
- `202608200002_dashboard_analytics_v1.sql`
- `202608200003_dashboards_fases_7_8_9_v1.sql`

Validado:

- `rpc_dashboard_produtividade_resumo_v1`
- `rpc_dashboard_montagem_resumo_v1`
- `rpc_dashboard_defeitos_resumo_v1`
- `rpc_dashboard_retrabalho_resumo_v1`
- `rpc_dashboard_montagem_lista_v1`
- `rpc_dashboard_montagem_ranking_v1`
- `rpc_dashboard_produtividade_tendencia_v1`
- `rpc_dashboard_produtividade_detalhe_v1`

Escopos validados:

- `TOTAL`
- `S1`
- `S2`
- `S3`
- `S4`
- `S1_S2`

## Arquivos para push

- `.gitignore`
- `mapa-concretagem-teste/app.js`
- `mapa-concretagem-teste/index.html`
- `supabase/migrations/202608200002_dashboard_analytics_v1.sql`
- `supabase/migrations/202608200003_dashboards_fases_7_8_9_v1.sql`
- `tests/dashboard-contracts.test.js`
- todos os documentos `docs/*dashboards-v1*`
- `docs/fase-0-auditoria-e-baseline.md`
- `docs/fases-7-8-9-conclusao-dashboards-v1.md`

## Nao incluir no push

- `supabase/.temp/`
- arquivos HTML soltos de relatorio se nao forem parte da release
- alteracoes pre-existentes fora do escopo desta entrega

## Validacoes finais

- `npm test`: passou.
- `node --check mapa-concretagem-teste/app.js`: passou.
- `node --check mapa-concretagem-teste/sw.js`: passou.
- `npx supabase migration list`: migrations locais/remotas alinhadas.
- `git diff --check` desta entrega: passou.
- `git diff --check` global: falha por sujeira pre-existente fora da entrega.

## Pendencias antes de producao

- Validacao visual em navegador real.
- Homologacao SGQ e assinaturas.
- Acompanhamento de dois periodos fechados.
- Decisao formal sobre `Setor de Testes`.
- Decisao sobre remocao de legado/CSS morto.
