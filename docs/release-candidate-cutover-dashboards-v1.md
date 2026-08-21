# Release Candidate e Cutover - Dashboards V1

Status: pronto para revisao e push
Deploy de producao: nao executado

## Escopo do release candidate

- Backend analitico V1 em Supabase.
- Dashboard Defeitos com view, filtros e lifecycle proprios.
- Contratos por escopo para Produtividade, Montagem e Defeitos.
- Dataset ouro, plano de testes e evidencias SGQ.

## Arquivos para incluir no push

- `mapa-concretagem-teste/app.js`
- `mapa-concretagem-teste/index.html`
- `supabase/migrations/202608200002_dashboard_analytics_v1.sql`
- `tests/dashboard-contracts.test.js`
- `docs/fase-0-auditoria-e-baseline.md`
- `docs/dataset-ouro-dashboards-v1.json`
- `docs/plano-testes-dashboards-v1.md`
- `docs/evidencias-execucao-dashboards-v1.md`
- `docs/dicionario-indicadores-dashboards-v1.md`
- `docs/matriz-setores-dashboards-v1.md`
- `docs/pacote-iso-sgq-dashboards-v1.md`
- `docs/release-candidate-cutover-dashboards-v1.md`
- `docs/plano-suporte-dashboards-v1.md`
- `docs/relatorio-pos-implantacao-dashboards-v1.md`

Nao incluir:

- `supabase/.temp/`
- arquivos nao relacionados ja existentes no worktree
- relatorios HTML gerados fora desta entrega

## Pre-cutover

- Conferir `npm test`.
- Conferir `node --check mapa-concretagem-teste/app.js`.
- Conferir `node --check mapa-concretagem-teste/sw.js`.
- Conferir `npx supabase migration list`.
- Conferir que `202608200002` aparece local e remoto.
- Revisar visualmente no navegador real.

## Cutover

1. Fazer commit dos arquivos listados.
2. Fazer push para a branch desejada.
3. Nao fazer deploy de producao sem aceite formal.
4. Em ambiente de teste, abrir:
   - Dashboard Defeitos
   - Dashboard Montagem
   - Produtividade
5. Testar escopos `TOTAL`, `S1`, `S2`, `S3`, `S4`, `S1_S2`.

## Rollback

Frontend:

- Reverter commit da alteracao de `app.js` e `index.html`.

Banco:

- As migrations sao aditivas.
- Para rollback logico, parar chamadas frontend para RPCs V1.
- Para rollback fisico em teste, remover views/funcoes/indices V1 somente apos backup e aprovacao tecnica.

## Criterios para remover legado

- Aceite formal do SGQ.
- Dois periodos fechados acompanhados.
- Validacao visual concluida.
- Nenhuma divergencia critica nos contratos.
- Backup marcado.
