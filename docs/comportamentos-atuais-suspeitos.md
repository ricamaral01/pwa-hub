# Comportamentos atuais suspeitos preservados

## Mapa — envio de relatório pelo WhatsApp cai no texto sem PDF no navegador de teste

**O que acontece:** ao executar o botão de WhatsApp com o HTML original no navegador automatizado de testes, a geração do PDF pela biblioteca externa falha, o indicador mostra “Erro ao gerar PDF.” e a função abre o texto de fallback. A rota unificada produz o mesmo resultado. Isto foi observado no navegador de teste; não há evidência de que a biblioteca falhe em todos os navegadores do sistema oficial. A impressão pelo botão Imprimir, que usa `window.print`, gerou PDF idêntico nas duas variantes.

**Onde:** `mapa-concretagem/app.js`, `loadHtml2Pdf` e `enviarRelatorioWhatsapp`, por volta das linhas 7433–7507. A biblioteca é carregada de `cdnjs.cloudflare.com`; o `catch` abre `api.whatsapp.com/send` somente com o texto do relatório. O código original foi preservado.

**Evidência:** `tests/mapa/e2e/report_share_matrix.py` executou os quatro setores em GERENCIA e GESTOR com HTML original e rota unificada. Nos 16 casos, o texto preparado para compartilhar e a mensagem de erro foram iguais. As navegações para WhatsApp foram interceptadas e abortadas antes de qualquer envio externo. `tests/mapa/e2e/report_ui_parity.py` comparou os PDFs de impressão em oito pares: duas páginas com hashes de texto e pixels iguais. As evidências privadas estão em `.work-mapa-unificado/e2e/report-share-*.json` e `report-*-s*.json`.

## Mapa — respostas muito rápidas do checklist podem renderizar estado anterior

**O que acontece:** em um roteiro acelerado que respondeu todos os itens do checklist sem intervalo, a primeira inspeção gravou `R` no PostgreSQL de testes, mas uma renderização imediata da lista mostrou temporariamente “Pendente”. Após aguardar as gravações disparadas por cada resposta, a mesma ação mostrou “Reprovado · 2ª inspeção pendente” nas duas variantes. Isto foi observado somente no roteiro acelerado; não houve alteração do aplicativo para mascarar a diferença.

**Onde:** `mapa-concretagem/app.js`, `setInspecaoChecklistAnswer` por volta da linha 5533 chama `syncMontagemPosteToApi(...).catch(...)` sem aguardar cada gravação. `finalizarInspecaoPosteAtual`, por volta da linha 5606, faz a gravação final, e `renderInspecaoLiberados`, por volta da linha 4350, consulta o resultado da lista.

**Evidência:** primeira rodada de `tests/mapa/e2e/inspection_photo_parity.py` sob MONTADOR no Setor 3: linha de inspeção capturada com status `R`, porém lista original renderizada como “Pendente”; a cópia mostrou “Reprovado”. O roteiro passou a aguardar as escritas assíncronas antes da finalização e da releitura. Em nova rodada, requisições, linha, foto e lista tiveram o mesmo resultado nas duas variantes. As linhas e fotos sintéticas foram removidas.

## Mapa — indicador ainda menciona Supabase na cópia

**O que acontece:** a topbar mostra “Conectado ao Supabase: sincronização online ativa.” mesmo na operação de testes, cuja conexão de dados passa pelo proxy local e pelo PostgreSQL de testes. É um texto fixado pelo aplicativo original e foi preservado conforme a regra de não alterar textos e `app.js`.

**Onde:** `mapa-concretagem/app.js`, chamada de `setSyncStatus` na linha 1649. A casca desktop apresenta o estado recebido nessa pílula, sem trocar sua mensagem.

**Evidência:** captura `mapa-mandril_circular-1920x1080-depois.png` da matriz desktop em `.work-mapa-unificado/e2e/desktop-layout/all-modes/`; o teste de 18 modos confirmou a casca em 28 telas fora do quiosque. A rota publicada usa `/unificado/mapa/api/` para dados.

## PCP — botão “Redefinir senha” na tela Usuários

**O que acontece:** o botão de cada linha não envia a redefinição. O navegador interpreta o atributo `onclick` como JavaScript inválido porque o nome, serializado com aspas duplas, é inserido dentro de outro atributo delimitado por aspas duplas. A função `redefinirSenha` existente funciona quando invocada diretamente e grava apenas no banco PCP de testes; o botão permaneceu com o comportamento do oficial.

**Onde:** `unificado/pcp/usuarios/index.html`, construção das linhas de `loadUsers`, por volta da linha 161 do arquivo oficial. O trecho é `onclick="redefinirSenha(${r.id}, ${JSON.stringify(r.nome)})"`.

**Evidência:** consulta somente leitura ao arquivo oficial `/opt/pcp-concrefer/frontend/pages/usuarios/index.html` confirmou o mesmo trecho. `tests/pcp/users_ui_write.py` criou um usuário sintético pela tela publicada (HTTP 201 e linha visível); o clique em “Redefinir senha” gerou erro no navegador e nenhum segundo POST. Invocar a função original diretamente no navegador produziu POST e confirmou a mensagem de sucesso. O usuário sintético foi removido. Nenhum arquivo do backend PCP foi alterado.

## Mapa — modo Liberação no Setor 4

**O que acontece:** ao clicar em uma forma do Setor 4 com o modo Liberação ativo, o aplicativo original abre a escolha do tipo de concreto; não envia POST para `liberacao_formas`. Nos Setores 1–3, o mesmo modo chama a liberação.

**Onde:** `mapa-concretagem/app.js`, função `createS4TableRow`, clique de `tdForma` (por volta da linha 2498), que chama `showConcreteTypePopup` sem consultar `state.liberationMode`. O clique em `createFormaCard` (por volta da linha 2400) consulta esse estado e chama `liberarFormaClicada`.

**Evidência:** captura Playwright sem rede em `tests/mapa/fixtures/captured-offline.json`: liberação nos Setores 1–3 produziu escrita simulada; no Setor 4, não. Ricardo decidiu em 03/10/2026 preservar esse comportamento. Nenhum `app.js` foi alterado.

## Mapa — consulta antiga por `CONFIG.API_URL` não executa o `fetch`

**O que acontece:** `getSetorRowsByDate('Setor 3', '2026-10-02')` retorna `[]`. A função chega à referência a `CONFIG.API_URL`, recebe `ReferenceError` e cai no `catch`, antes do `fetch`. **Nenhum botão ou tela chama essa função no `app.js` atual**: a busca de referências encontrou apenas sua definição e a invocação direta no roteiro de captura. Ela é código antigo sem caminho de interface. Por decisão do Ricardo, esta 73ª ocorrência conta como coberta pelo teste do comportamento original, sem fabricar uma requisição.

**Onde:** `mapa-concretagem/app.js`, função `getSetorRowsByDate`, por volta das linhas 2157–2168. A busca por `CONFIG` em `mapa-concretagem/` encontrou somente essa referência, sem definição ou importação.

**Evidência:** o roteiro `liberação: linhas por setor e data` invocou a função diretamente, retornou zero e não gerou requisição; `tests/mapa/fixtures/coverage-summary.json` mantém `app.js:2162:28:fetch` sem HTTP. O código original foi preservado. A cobertura dessa ocorrência é a verificação do ramo de erro, não a execução do `fetch` inacessível.

## PCP — outubro seleciona a planilha de agosto

**O que acontece:** o botão Sincronizar Google Sheets para 09/10/2026, Setor 3, usa `08- Controle de Produção Ago - 2026` (`1eq5GNZpN_aEU0xAK-bWInmAJvFzzD-4x_PLWzytbPT8`). Com o código original e `substituir=false`, a API de testes respondeu HTTP 200, `importados=0`, `removidos=0`, `total_ignorados=0` e `alocacao={total_datas:0,total_postes:0,total_faltas_forma:0}`. Nenhuma linha foi adicionada ao PostgreSQL de testes.

**Onde:** `unificado/pcp/backend/app/repositories/google_sheets_repository.py`, `_spreadsheet_id_para_periodo`: só setembro seleciona uma ID própria; os demais meses usam `settings.SPREADSHEET_ID`, configurado para agosto. O endpoint é `POST /api/pcp/alocacao-formas/importar` em `app/api/routers/alocacao_formas.py`.

**Evidência:** `scripts/verify_pcp_backend_identity.py` confirmou os 47 arquivos idênticos ao oficial antes do teste; `scripts/test_pcp_backend_writes.py` chamou apenas a API de testes com conta sintética, imprimiu o resultado acima e `cleanup_deltas={}`. Os escopos da credencial Google são somente leitura. Ricardo decidiu preservar a regra em 03/10/2026. Nenhum arquivo do backend ou configuração temporária de outubro foi alterado.
