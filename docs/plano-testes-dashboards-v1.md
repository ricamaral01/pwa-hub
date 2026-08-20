# Plano de Testes - Dashboards V1

Data: 2026-08-20
Ambiente alvo: `mapa-concretagem-teste`
Proibido nesta etapa: deploy de producao.

## 1. Validacoes tecnicas locais

- `node --check mapa-concretagem-teste/app.js`
- `node --check mapa-concretagem-teste/sw.js`
- `git diff --check -- mapa-concretagem-teste/app.js mapa-concretagem-teste/index.html docs/fase-0-auditoria-e-baseline.md supabase/migrations/202608200002_dashboard_analytics_v1.sql docs/dataset-ouro-dashboards-v1.json docs/plano-testes-dashboards-v1.md`

## 2. Validacoes SQL no Supabase de teste

Aplicar em ambiente de teste:

- `supabase/migrations/202608200002_dashboard_analytics_v1.sql`

Validar:

- `public.dashboard_sector_code_v1('Setor 1') = 'S1'`
- `public.dashboard_sector_code_v1('Setor de Testes') = 'UNCLASSIFIED'`
- `public.dashboard_scope_sectors_v1('TOTAL') = ['Setor 1','Setor 2','Setor 3','Setor 4']`
- `public.dashboard_scope_sectors_v1('S1_S2') = ['Setor 1','Setor 2']`
- RPCs retornam `contract_version`, `generated_at`, `scope`, `included_sectors`, `kpis` e `by_sector`.

## 3. Dataset ouro

Arquivo de referencia:

- `docs/dataset-ouro-dashboards-v1.json`

Criterios:

- `TOTAL` deve somar somente S1, S2, S3 e S4.
- `S1_S2` deve somar numeradores e denominadores antes de calcular percentual.
- `UNCLASSIFIED`, nulos e `Setor de Testes` nao entram no Total oficial.
- Taxa NC esperada para `S1_S2`: `18 / 130 * 100 = 13,8462`.

## 4. Testes frontend

Montagem:

- Abrir Dashboard Montagem.
- Selecionar cada escopo: Todos, Setores 1 e 2, Setor 1, Setor 2, Setor 3, Setor 4.
- Validar que os KPIs carregam e que o fallback local nao duplica resultados.
- Validar que resposta antiga nao sobrescreve filtro novo ao trocar datas rapidamente.

Defeitos:

- Abrir Dashboard Defeitos.
- Confirmar que a view ativa e `viewDashboardDefeitos`, nao `viewMontagemIndicadores` com abas escondidas.
- Repetir filtros de escopo.
- Validar KPIs do contrato RPC quando a migration estiver aplicada.
- Desativar rede e validar mensagem/cache sem quebrar a tela.

Produtividade:

- Abrir Produtividade.
- Validar escopos Total, S1, S2, S3, S4 e S1_S2.
- Validar que `paKpiFormas` usa retorno do contrato quando disponivel e fallback quando a RPC nao existe.

## 5. Regressao visual

Testar resolucoes:

- Desktop 1366x768
- Tablet 1024x768
- Celular 390x844
- TV/kiosk 1920x1080

Critérios:

- Nenhum texto sobreposto.
- Filtros acessiveis.
- Cards e tabelas sem overflow incoerente.
- Defeitos sem aba de Montagem visivel.

## 6. Evidencias SGQ

Guardar:

- Commit/branch.
- Migration aplicada.
- JSON retornado pelas RPCs.
- Screenshots dos seis escopos em cada dashboard.
- Resultado de `git diff --check`.
- Registro de divergencias e pendencias de homologacao.
