# Comportamentos atuais suspeitos preservados

## Mapa — reenvio offline reaplica manutenções locais

**O que acontece:** quando a fila offline sincroniza algum item, o código chama `sincronizarManutencaoLocalPendente`. Essa função percorre todas as manutenções guardadas localmente, sem filtrar por uma marca de pendência, e pode reenviar linhas que já existem. O servidor de testes aplica o mesmo upsert do original; os pedidos extras apareceram iguais nas duas interfaces.

**Onde:** `mapa-concretagem/app.js`, `sincronizarManutencaoLocalPendente` por volta das linhas 768–771 e chamada de `syncOfflineData` por volta da linha 10204.

**Evidência:** `tests/mapa/e2e/offline_queue_parity.py` capturou, além do item offline, dois POSTs de `formas_manutencao` para registros locais preexistentes após o reenvio. Os mesmos corpos e a mesma ordem ocorreram com o HTML original e a rota unificada. A fotografia dos bancos de teste será refeita ao concluir as rodadas.

## Mapa — ocorrências e tratativas de defeitos ficam no navegador

**O que acontece:** Nova Ocorrência e Salvar Tratativa gravam `mapa_tratativa_defeitos_v1` em `localStorage`; não enviam escrita ao servidor. A ocorrência manual aparece no relatório e na impressão do mesmo navegador, com o mesmo comportamento do original. Isso limita o compartilhamento de uma tratativa manual entre dispositivos.

**Onde:** `mapa-concretagem/app.js`, `getTratativaDefeitos`, `salvarTratativaDefeitosObj` e os handlers dos modais, por volta das linhas 2784–2807 e 9239–9315.

**Evidência:** `tests/mapa/e2e/defects_treatment_parity.py` criou e concluiu uma ocorrência manual sintética em GERENCIA, GESTOR, MONTADOR e APONTADOR. Original e cópia mostraram os mesmos campos, KPIs, filtros e PDF de duas páginas com hashes iguais de texto e pixels. Não houve escrita HTTP; o dado local desapareceu com o contexto descartável do teste.

## Mapa — Salvar do Acompanhamento guarda notas no navegador

**O que acontece:** o botão Salvar do Acompanhamento Concretagem grava os campos de traço e observação no `localStorage` da sessão do navegador. Ele não envia escrita à API nem ao PostgreSQL. A releitura no mesmo navegador restaura as notas; a função depende do armazenamento local desse dispositivo, como no app original.

**Onde:** `mapa-concretagem/app.js`, `readAcmpNotes`, `writeAcmpNotes` e `salvarAcmp`, por volta das linhas 6354–6385.

**Evidência:** `tests/mapa/e2e/acompanhamento_ui_parity.py` percorreu GERENCIA/GESTOR, os modos data/pendentes e os Setores 1/3. Após Salvar e recarregar, os campos reapareceram com os mesmos valores no HTML original e na cópia; zero requisição de escrita foi enviada. Os PDFs de 2–3 páginas deram hashes de texto e pixels iguais.

## Mapa — formulário de criar usuário atualiza login existente

**O que acontece:** a tela Usuários não tem botão separado de edição. Se a gerência informa no formulário Criar usuário um login já cadastrado, o código faz upsert: muda nome, perfil, setor e senha e volta a marcar primeiro acesso. Excluir apenas inativa o cadastro. O teste preserva esse fluxo, sem acrescentar outra ação à tela.

**Onde:** `mapa-concretagem/app.js`, `postToApi("criar_usuario")` e `postToApi("excluir_usuario")` por volta das linhas 1808–1842; botões da tela por volta das linhas 8275–8297 e 8931–8955.

**Evidência:** `tests/mapa/e2e/users_ui_parity.py` executou criação, upsert com o mesmo login e inativação em conta sintética no HTML original e na rota unificada. Requisições normalizadas, campos da linha e texto da tabela coincidiram. O cadastro sintético foi excluído fisicamente após cada variante, com zero resíduo; nenhuma senha foi exibida ou salva na evidência.

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

## PCP — Sincronizar Google Sheets usa a opção Substituir escondida

**O que acontece:** os botões de Sincronizar Google Sheets nos Setores 3 e 4 enviam `substituir=true` porque leem a caixa `#importar-substituir`, marcada por padrão dentro de um painel oculto. O operador não vê essa opção nessa tela. Para 09/10/2026, os dois botões retornaram HTTP 200, `importados=0` e `removidos=0`; a programação do banco de testes permaneceu vazia nessa data. A regra de outubro continuou escolhendo a planilha de agosto.

**Onde:** `unificado/pcp/programacao/index.html`, `#card-importar-programacao` tem `d-none`; `sincronizarGoogleSheetsSetor` lê `#importar-substituir.checked` e envia o valor no POST `/api/pcp/alocacao-formas/importar`. O código original foi mantido.

**Evidência:** `tests/pcp/google_sync_ui.py` acionou os dois botões pela interface publicada com conta sintética PCP, confirmou o parâmetro `substituir=true`, o resultado e as linhas inalteradas no PostgreSQL PCP de testes. A data foi escolhida após confirmar zero registros no período; não houve risco de remover dados existentes. A conta sintética foi removida.

## PCP — importação Mega sem setor não é removida por “Limpar programação”

**O que acontece:** a tela Programação Setor 1 e 2 importa um CSV Mega válido e grava a linha em `programacao_alex` com `setor_id=NULL`. A tabela “Base Mega Setor 1 e 2”, onde a linha tem botão Excluir, está oculta por `d-none`. O botão visível “Limpar programação” envia `setor_ids=[1,2]`; o backend filtra por esses setores e responde `removidos=0`, deixando a linha importada. O quadro de formas, porém, mostra os dados importados. O botão e a regra foram preservados.

**Onde:** `unificado/pcp/programacao-alex/index.html`, painel `.section-card.d-none`, `importarMegaAlex` e `limparProgramacaoAlex`; `unificado/pcp/backend/app/api/routers/pcp.py`, `importar_programacao_alex_mega` sem `setor_id` no formulário e `limpar_programacao_alex` com filtro de setores. Os 47 arquivos do backend continuam idênticos ao oficial.

**Evidência:** `tests/pcp/alex_mega_import_ui.py` enviou um CSV sintético de uma linha por `input[type=file]` no ambiente de testes, conferiu os campos gravados e a linha no quadro, clicou “Limpar programação” e recebeu HTTP 200 com `removidos=0`. A linha sintética foi excluída pela API de testes no bloco de limpeza, restando zero registros nessa data. Nenhum arquivo real do Mega ou planilha oficial foi modificado.

## PCP — excluir mão de obra com rateio retorna erro

**O que acontece:** depois de criar um registro de Mão de Obra Indireta com rateio por dois setores, `DELETE /api/maodeobra/{id}` retorna HTTP 500 e deixa o registro no banco. A criação e a leitura funcionam. A interface de rateio não oferece botão de exclusão, mas a rota de exclusão é usada para outros registros de mão de obra.

**Onde:** `unificado/pcp/backend/app/models/producao.py`, relacionamento `MaoDeObra.rateios` sem exclusão em cascata; `app/api/routers/pcp.py`, exclusão do pai sem remover os itens de `maodeobra_rateio`. Os 47 arquivos do backend permanecem idênticos aos do oficial.

**Evidência:** teste isolado de 04/10/2026 no PostgreSQL PCP de testes criou um registro com dois itens; a chamada DELETE respondeu HTTP 500. `tests/pcp/rateio_ui_write.py` confirmou as criações e leituras da tela nos grupos 1/2 e 3/4, com ADMIN e PRODUCAO. `scripts/cleanup_pcp_rateio_probe.py` removeu os itens e o pai diretamente do banco de testes após cada rodada; nenhuma linha sintética restou. O backend original não foi alterado.

## PCP — Teste Programação retorna erro ao consultar compatibilidade

**O que acontece:** na tela Teste Programação, uma demanda manual de um poste para o Setor 3 enviou `POST /api/teste-prog/programar` com os campos esperados. A cópia respondeu HTTP 500 e a tela ocultou o resultado. Nenhuma linha foi gravada. O resultado HTTP do oficial não foi testado porque a regra permite somente leitura nele; este caso permanece como comportamento suspeito do código original, não como paridade de resposta comprovada.

**Onde:** `unificado/pcp/backend/app/api/routers/teste_programacao.py`, `_get_compatibilidade`, compara `MapeamentoFormaPoste.codigo_forma` (texto) a `forma.id` (inteiro). PostgreSQL de testes não possui operador `varchar = integer` e a consulta falha antes do cálculo. Os 47 arquivos do backend são idênticos aos oficiais.

**Evidência:** `tests/pcp/teste_programacao_ui.py` reproduziu HTTP 500 com conta sintética ADMIN em 04/10/2026; log de `pcp-unificado-test.service` mostrou `psycopg2.errors.UndefinedFunction: operator does not exist: character varying = integer`, com parâmetro inteiro `9`. `scripts/check_pcp_simulator_schema.py` consultou somente o catálogo dos dois bancos: `formas.id` é `integer`, `mapeamento_forma_postes.codigo_forma` é `character varying`, e nenhum dos dois tem operador de igualdade texto/inteiro. Isso sustenta a inferência de que a mesma chamada falharia no oficial, mas não substitui uma resposta HTTP oficial. A conta sintética foi removida. Não houve ajuste no backend ou no esquema para mudar esse comportamento.
