# Comportamentos atuais suspeitos preservados

## Mapa — modo Liberação no Setor 4

**O que acontece:** ao clicar em uma forma do Setor 4 com o modo Liberação ativo, o aplicativo original abre a escolha do tipo de concreto; não envia POST para `liberacao_formas`. Nos Setores 1–3, o mesmo modo chama a liberação.

**Onde:** `mapa-concretagem/app.js`, função `createS4TableRow`, clique de `tdForma` (por volta da linha 2498), que chama `showConcreteTypePopup` sem consultar `state.liberationMode`. O clique em `createFormaCard` (por volta da linha 2400) consulta esse estado e chama `liberarFormaClicada`.

**Evidência:** captura Playwright sem rede em `tests/mapa/fixtures/captured-offline.json`: liberação nos Setores 1–3 produziu escrita simulada; no Setor 4, não. Ricardo decidiu em 03/10/2026 preservar esse comportamento. Nenhum `app.js` foi alterado.

## Mapa — consulta antiga por `CONFIG.API_URL` não executa o `fetch`

**O que acontece:** `getSetorRowsByDate('Setor 3', '2026-10-02')` retorna `[]`. A função chega à referência a `CONFIG.API_URL`, recebe `ReferenceError` e cai no `catch`, antes do `fetch`. A chamada da linha 2162 é a única das 73 ocorrências estáticas sem requisição ou invocação registrada na captura isolada.

**Onde:** `mapa-concretagem/app.js`, função `getSetorRowsByDate`, por volta das linhas 2157–2168. A busca por `CONFIG` em `mapa-concretagem/` encontrou somente essa referência, sem definição ou importação.

**Evidência:** o roteiro `liberação: linhas por setor e data` retornou zero e não gerou requisição; `tests/mapa/fixtures/coverage-summary.json` mantém `app.js:2162:28:fetch` descoberto. O código original foi preservado. Essa rota antiga não deve ser considerada coberta por uma configuração inventada no teste.

## PCP — outubro seleciona a planilha de agosto

**O que acontece:** o botão Sincronizar Google Sheets para 09/10/2026, Setor 3, usa `08- Controle de Produção Ago - 2026` (`1eq5GNZpN_aEU0xAK-bWInmAJvFzzD-4x_PLWzytbPT8`). Com o código original e `substituir=false`, a API de testes respondeu HTTP 200, `importados=0`, `removidos=0`, `total_ignorados=0` e `alocacao={total_datas:0,total_postes:0,total_faltas_forma:0}`. Nenhuma linha foi adicionada ao PostgreSQL de testes.

**Onde:** `unificado/pcp/backend/app/repositories/google_sheets_repository.py`, `_spreadsheet_id_para_periodo`: só setembro seleciona uma ID própria; os demais meses usam `settings.SPREADSHEET_ID`, configurado para agosto. O endpoint é `POST /api/pcp/alocacao-formas/importar` em `app/api/routers/alocacao_formas.py`.

**Evidência:** `scripts/verify_pcp_backend_identity.py` confirmou os 47 arquivos idênticos ao oficial antes do teste; `scripts/test_pcp_backend_writes.py` chamou apenas a API de testes com conta sintética, imprimiu o resultado acima e `cleanup_deltas={}`. Os escopos da credencial Google são somente leitura. Ricardo decidiu preservar a regra em 03/10/2026. Nenhum arquivo do backend ou configuração temporária de outubro foi alterado.
