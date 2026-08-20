# Conclusao das Fases 7, 8 e 9 - Dashboards Backend ISO v1

Data de execucao: 2026-08-20

Projeto Supabase vinculado pela CLI: `fbvvdyirhtgvycullsqy`

Ambiente declarado pelo solicitante: teste, `mapa-concretagem-teste`.

Nao houve deploy de producao nesta execucao.

## Fase 7 - Retrabalho, Custos e Evidencias

Entregas concluidas:

- Criada a migration versionada `supabase/migrations/202608200003_dashboards_fases_7_8_9_v1.sql`.
- Criada a tabela `public.dashboard_retrabalho_eventos_v1` para registro rastreavel de eventos de retrabalho.
- Preservado o modelo de setor oficial por coluna gerada `setor_code`, usando `public.dashboard_sector_code_v1(setor)`.
- Criadas colunas de custo por natureza:
  - `custo_mao_obra`;
  - `custo_material`;
  - `custo_equipamento`;
  - `custo_outros`;
  - `custo_total` gerado.
- Criado campo `evidencias jsonb` para anexar rastreabilidade SGQ sem inventar tabela externa.
- Criados campos de aprovacao e autoria:
  - `aprovado_por`;
  - `aprovado_em`;
  - `created_by`;
  - `created_at`;
  - `updated_at`.
- Habilitado RLS em `dashboard_retrabalho_eventos_v1`.
- Criadas politicas RLS para leitura, insercao e atualizacao por usuario autenticado ou master.
- Criada RPC `public.rpc_dashboard_retrabalho_resumo_v1`.
- Protecao de custos aplicada: chamada anonima com `p_incluir_custos=true` retorna `costs_visible=false` e nao expõe `custo_total`.

Pendencias de homologacao:

- Confirmar papeis que devem aprovar custos reais e fechamento de oportunidade.
- Confirmar se `public.is_master()` representa integralmente o papel de aprovador SGQ/gestao.
- Confirmar fluxo operacional de alimentacao de eventos de retrabalho.

## Fase 8 - Paginacao, Ranking e Contratos de Consulta

Entregas concluidas:

- Criada RPC paginada `public.rpc_dashboard_montagem_lista_v1`.
- Criada RPC de ranking `public.rpc_dashboard_montagem_ranking_v1`.
- A paginacao limita `page_size` a 200 linhas por chamada.
- A ordenacao aceita campos controlados:
  - `finalizado_em`;
  - `data_fabricacao`;
  - `setor`;
  - `forma_numero`;
  - `montador_nome`.
- O ranking aceita dimensoes controladas:
  - `montador`;
  - `setor`;
  - `modelo`.
- Os retornos possuem `contract_version`, `generated_at`, `scope`, `rows` e metadados de paginacao quando aplicavel.

Pendencias de homologacao:

- Confirmar se o frontend deve substituir imediatamente todas as tabelas legadas por `rpc_dashboard_montagem_lista_v1` ou manter fallback durante homologacao.
- Confirmar quais dimensoes adicionais de ranking podem ser usadas sem inventar regra de negocio.

## Fase 9 - Tendencia, Detalhe e Evidencia Analitica

Entregas concluidas:

- Criada RPC `public.rpc_dashboard_produtividade_tendencia_v1`.
- Criada RPC `public.rpc_dashboard_produtividade_detalhe_v1`.
- A tendencia retorna agregacao diaria por data de fabricacao.
- O detalhe de produtividade possui paginacao server-side com limite maximo de 500 linhas por chamada.
- As consultas usam as views oficiais versionadas criadas na Fase 1, sem `select("*")` no frontend para KPIs oficiais.
- Incluidos testes automatizados para exigir os contratos das Fases 7, 8 e 9.

Pendencias de homologacao:

- Confirmar o dicionario definitivo de `tipo_concreto` fora de padrao. A regra atual segue a formula existente auditada, sem alterar meta ou conceito.
- Confirmar se tendencia deve ser por dia civil, turno ou janela operacional.

## Validacao Executada

Comandos executados:

```powershell
npx supabase db push
npm test
node --check mapa-concretagem-teste/app.js
git diff --check -- .gitignore mapa-concretagem-teste\app.js mapa-concretagem-teste\index.html tests\dashboard-contracts.test.js docs supabase\migrations\202608200002_dashboard_analytics_v1.sql supabase\migrations\202608200003_dashboards_fases_7_8_9_v1.sql
```

Validacao real das RPCs no Supabase:

```text
rpc_dashboard_retrabalho_resumo_v1: dashboard-retrabalho-v1; costs_visible=false
rpc_dashboard_montagem_lista_v1: dashboard-montagem-lista-v1; rows=5; total_rows=1472
rpc_dashboard_montagem_ranking_v1: dashboard-montagem-ranking-v1; rows=5
rpc_dashboard_produtividade_tendencia_v1: dashboard-produtividade-tendencia-v1; rows=16
rpc_dashboard_produtividade_detalhe_v1: dashboard-produtividade-detalhe-v1; rows=5; total_rows=2842
```

## Observacao de Risco

A auditoria da Fase 0 registrou risco de o projeto Supabase atualmente vinculado atender mais de um ambiente logico. A migration foi aplicada somente no projeto Supabase ja vinculado pela CLI, respeitando a solicitacao de ambiente de teste e sem alterar credenciais, autenticacao ou configuracoes de deploy.
