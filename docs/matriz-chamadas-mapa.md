# Matriz de chamadas do Mapa original

**Fonte:** `mapa-concretagem/app.js`. Gerada por `python scripts/inventory_mapa_calls.py`.

Este é o **índice estático inicial**. Cada linha aponta para uma chamada identificada no código original. As colunas, filtros, ordenação, chave de conflito, resposta, erro e fluxo precisam ser conferidos no código e por captura de navegador com toda a rede interceptada antes de considerar B1/B2 concluídos. Chamadas dinâmicas e métodos montados em variáveis exigem revisão manual.

| Linha | Função ou fluxo inicial | Tipo | Alvo/ação | Operação inicial |
|---:|---|---|---|---|
| 743 | `carregarFormasManutencaoSupabase` | Supabase | `MANUTENCAO_FORMAS_TABLE` | SELECT |
| 760 | `sincronizarFormaManutencaoSupabase` | Supabase | `MANUTENCAO_FORMAS_TABLE` | UPSERT |
| 1467 | `chamarDashboardRpcComCache` | RPC | `rpcName` | POST /rpc |
| 1509 | `carregarLinhasSupabaseComCache` | Supabase | `opts.table` | SELECT |
| 1579 | `insertWithLegacyFallback` | Supabase | `tableName` | INSERT |
| 1583 | `insertWithLegacyFallback` | Supabase | `tableName` | INSERT |
| 1588 | `upsertWithLegacyFallback` | Supabase | `tableName` | UPSERT |
| 1591 | `upsertWithLegacyFallback` | Supabase | `tableName` | UPSERT |
| 1597 | `saveProducaoByNaturalKey` | Supabase | `producao` | SELECT |
| 1609 | `saveProducaoByNaturalKey` | Supabase | `producao` | UPDATE |
| 1616 | `saveProducaoByNaturalKey` | Supabase | `producao` | UPDATE |
| 1624 | `saveProducaoByNaturalKey` | Supabase | `producao` | DELETE |
| 1631 | `saveProducaoByNaturalKey` | Supabase | `producao` | INSERT |
| 1635 | `saveProducaoByNaturalKey` | Supabase | `producao` | INSERT |
| 1647 | `checkApiStatus` | Supabase | `usuarios` | SELECT |
| 1677 | `postToApi` | Supabase | `programacao_pcp` | UPSERT |
| 1690 | `postToApi` | Supabase | `liberacao_formas` | UPSERT |
| 1736 | `postToApi` | Supabase | `producao` | SELECT |
| 1756 | `postToApi` | Supabase | `producao` | SELECT |
| 1778 | `postToApi` | Supabase | `usuarios` | SELECT |
| 1786 | `postToApi` | Supabase | `usuarios` | SELECT |
| 1810 | `postToApi` | Supabase | `usuarios` | UPSERT |
| 1825 | `postToApi` | Supabase | `usuarios` | UPDATE |
| 1835 | `postToApi` | Supabase | `usuarios` | UPDATE |
| 2162 | `getSetorRowsByDate` | fetch | `url);` | GET/indefinido |
| 3195 | `programFormaInApiOrLocal` | ação postToApi | `salvar_forma_click` | chamada interna |
| 3220 | `unprogramFormaInApiOrLocal` | Supabase | `programacao_pcp` | DELETE |
| 3268 | `fetchFormStatusRowsFromTables` | Supabase | `programacao_pcp` | SELECT |
| 3269 | `fetchFormStatusRowsFromTables` | Supabase | `liberacao_formas` | SELECT |
| 3270 | `fetchFormStatusRowsFromTables` | Supabase | `producao` | SELECT |
| 3322 | `loadClickedFormsFromSupabase` | Supabase | `vw_formas_status` | SELECT |
| 3470 | `loadOfficialProgrammedFormas` | fetch | `'${PCP_PROGRAMACAO_URL}?${params.toString()}');` | GET/indefinido |
| 3497 | `loadProgrammedFormas` | Supabase | `programacao_pcp` | SELECT |
| 3548 | `loadProgrammedFormas` | ação postToApi | `salvar_forma_click` | chamada interna |
| 3839 | `postToApiWithTimeout` | ação postToApi | `dinâmica` | chamada interna |
| 4112 | `fetchSetor3Models` | fetch | `'${host}/api/programacao?setor_id=3&data_inicio=${filtroData}&data_fim=${filtroData}');` | GET/indefinido |
| 4138 | `fetchSetor3Models` | fetch | `'${fallbackHost}/api/programacao?setor_id=3&data_inicio=${filtroData}&data_fim=${filtroDat` | GET/indefinido |
| 4162 | `fetchSetor3Models` | Supabase | `programacao_pcp` | SELECT |
| 4583 | `syncMontagemPosteToApi` | ação postToMontagemApi | `salvar_montagem_poste` | chamada interna |
| 4719 | `uploadChecklistPhoto` | recurso local | `photoBase64` | leitura de data URL |
| 4724 | `uploadChecklistPhoto` | fetch | `'${getBackendUrl()}/inspecoes/${encodeURIComponent(poste.key)}/fotos'` | POST |
| 4943 | `openMontagemPosteDetalhe` | Supabase | `montagem_poste` | SELECT |
| 5123 | `syncMontagemPostesFromApi` | Supabase | `montagem_poste` | SELECT |
| 5299 | `openInspecaoPosteDetalhe` | Supabase | `montagem_poste` | SELECT |
| 5688 | `finalizarInspecaoPosteAtual` | ação postToApi | `salvar_inspecao_lote` | chamada interna |
| 6094 | `carregarDadosGlobaisDashboard` | Supabase | `producao` | SELECT |
| 6119 | `carregarDadosGlobaisDashboard` | Supabase | `montagem_poste` | SELECT |
| 6481 | `loadAcmpVolumeIndex` | fetch | `ACMP_PRODUTO_VOLUMES_URL` | GET/indefinido |
| 6548 | `fetchAcmpMassadas` | fetch | `url` | GET/indefinido |
| 6572 | `fetchAcmpLeiturasQr` | fetch | `ACMP_LEITURAS_QR_CSV_URL` | GET/indefinido |
| 6736 | `renderAcmpConcretagem` | Supabase | `producao` | SELECT |
| 6862 | `getRowsForDashboard` | Supabase | `producao` | SELECT |
| 7584 | `persistirMandrilModeloNaConcretagem` | Supabase | `producao` | SELECT |
| 7598 | `persistirMandrilModeloNaConcretagem` | Supabase | `producao` | UPDATE |
| 7730 | `buscarSaquesMandril` | fetch | `'${SAQUE_MANDRIL_API}?data=${encodeURIComponent(data)}'` | GET/indefinido |
| 7759 | `sincronizarSaquesMandrilLocais` | fetch | `'${SAQUE_MANDRIL_API}/importar'` | POST |
| 7841 | `carregarMandrilCircular` | Supabase | `producao` | SELECT |
| 7990 | `registrarSaque` | fetch | `SAQUE_MANDRIL_API` | POST |
| 8015 | `limparSaque` | fetch | `'${SAQUE_MANDRIL_API}?${query}'` | DELETE |
| 8053 | `gerarRelatorioSetor` | Supabase | `producao` | SELECT |
| 8063 | `gerarRelatorioSetor` | Supabase | `programacao_pcp` | SELECT |
| 8064 | `gerarRelatorioSetor` | Supabase | `liberacao_formas` | SELECT |
| 8223 | `listUsersFromApi` | ação postToApi | `listar_usuarios` | chamada interna |
| 8236 | `authenticateUserInApi` | ação postToApi | `autenticar_usuario` | chamada interna |
| 8240 | `createUserInApi` | ação postToApi | `criar_usuario` | chamada interna |
| 8244 | `deleteUserInApi` | ação postToApi | `excluir_usuario` | chamada interna |
| 8346 | `salvarNovaSenhaPrimeiroAcesso` | ação postToApi | `alterar_senha_primeiro_acesso` | chamada interna |
| 10080 | `syncOfflineData` | ação postToMontagemApi | `salvar_montagem_poste` | chamada interna |
| 10117 | `syncOfflineData` | ação postToApi | `salvar_forma_click` | chamada interna |
| 10149 | `syncOfflineData` | ação postToMontagemApi | `salvar_montagem_poste` | chamada interna |
| 10176 | `syncOfflineData` | Supabase | `prog_s3_s4` | UPSERT |
| 10240 | `subscribeToRealtimeUpdates` | Realtime | `custom-producao-channel` | assinatura |
| 13298 | `carregarBaseExportacaoPorPeriodo` | Supabase | `table` | SELECT |
| 13417 | `carregarLookupProducaoPorRecordIds` | Supabase | `producao` | SELECT |
| 14126 | `abrirVisualizacaoChecklist` | Supabase | `montagem_poste` | SELECT |
| 14341 | `abrirVisualizacaoChecklist` | Supabase | `montagem_poste` | UPDATE |
| 14381 | `abrirVisualizacaoChecklist` | fetch | `'${backendUrl}/inspecoes/${encodeURIComponent(normRow.id)}/fotos')` | GET/indefinido |
| 14438 | `excluirFotoVps` | fetch | `'${backendUrl}/fotos/${photoId}?usuario=${encodeURIComponent(user)}'` | DELETE |
| 14487 | `renderSequenciaS3` | Supabase | `prog_s3_s4` | SELECT |
| 14620 | `saveSequenciaS3` | Supabase | `prog_s3_s4` | UPSERT |
| 14704 | `cancelarConcretagemOdin` | Supabase | `producao` | SELECT |
| 14769 | `cancelarConcretagemOdin` | Supabase | `producao` | UPDATE |
| 14782 | `cancelarConcretagemOdin` | Supabase | `producao` | DELETE |
| 14832 | `updateSwVersionBadge` | fetch | `"sw.js?v=" + Date.now()` | GET/indefinido |

**Chamadas identificadas:** 84.

## Captura de navegador sem rede externa

O script `scripts/capture_mapa_requests_offline.py` carregou o `app.js` original, interceptou todas as solicitações externas e respondeu localmente com a fotografia do PostgreSQL de testes quando havia tabela correspondente. Foram testados 18 modos e interceptados 71 pedidos externos. O arquivo completo da captura fica fora do Git em `.work-mapa-unificado/requests-original.json`.

| Fluxo | Método | Caminho | Pedidos |
|---|---|---|---:|
| DASHBOARD_DEFEITOS | GET | `/rest/v1/montagem_poste` | 2 |
| DASHBOARD_DEFEITOS | GET | `/rest/v1/producao` | 1 |
| MANDRIL_CIRCULAR | GET | `/api/programacao` | 1 |
| MANDRIL_CIRCULAR | GET | `/api/saques-mandril` | 1 |
| MANDRIL_CIRCULAR | GET | `/rest/v1/liberacao_formas` | 1 |
| MANDRIL_CIRCULAR | GET | `/rest/v1/producao` | 2 |
| MANDRIL_CIRCULAR | GET | `/rest/v1/programacao_pcp` | 1 |
| MANDRIL_CIRCULAR | GET | `/rest/v1/vw_formas_status` | 1 |
| MONTAGEM_INDICADORES | GET | `/rest/v1/montagem_poste` | 6 |
| MONTAGEM_INDICADORES | GET | `/rest/v1/producao` | 1 |
| PROD_ANALISE | GET | `/rest/v1/montagem_poste` | 3 |
| PROD_ANALISE | GET | `/rest/v1/producao` | 2 |
| PROD_ANALISE | POST | `/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1` | 1 |
| RELATORIO_MANUTENCAO | GET | `/rest/v1/formas_manutencao` | 1 |
| RELATORIO_MANUTENCAO | GET | `/rest/v1/montagem_poste` | 3 |
| RELATORIO_MANUTENCAO | GET | `/rest/v1/producao` | 1 |
| SEQUENCIA_S3 | GET | `/rest/v1/prog_s3_s4` | 1 |
| USUARIOS | GET | `/rest/v1/montagem_poste` | 3 |
| USUARIOS | GET | `/rest/v1/producao` | 1 |
| USUARIOS | GET | `/rest/v1/usuarios` | 1 |
| concretar cartão Setor 1 com tipo | GET | `/rest/v1/producao` | 1 |
| concretar cartão Setor 1 com tipo | POST | `/rest/v1/producao` | 1 |
| concretar cartão Setor 2 com tipo | GET | `/rest/v1/producao` | 1 |
| concretar cartão Setor 2 com tipo | POST | `/rest/v1/producao` | 1 |
| concretar cartão Setor 3 com tipo | GET | `/rest/v1/producao` | 1 |
| concretar cartão Setor 3 com tipo | POST | `/rest/v1/producao` | 1 |
| concretar cartão Setor 4 com tipo | GET | `/rest/v1/producao` | 1 |
| concretar cartão Setor 4 com tipo | POST | `/rest/v1/producao` | 1 |
| inicialização | GET | `/api/programacao` | 2 |
| inicialização | GET | `/rest/v1/formas_manutencao` | 1 |
| inicialização | GET | `/rest/v1/montagem_poste` | 2 |
| inicialização | GET | `/rest/v1/producao` | 2 |
| inicialização | GET | `/rest/v1/usuarios` | 1 |
| liberar cartão Setor 1 | POST | `/rest/v1/liberacao_formas` | 1 |
| liberar cartão Setor 2 | POST | `/rest/v1/liberacao_formas` | 1 |
| liberar cartão Setor 3 | DELETE | `/rest/v1/programacao_pcp` | 1 |
| liberar cartão Setor 3 | GET | `/rest/v1/montagem_poste` | 7 |
| liberar cartão Setor 3 | POST | `/rest/v1/liberacao_formas` | 1 |
| liberar cartão Setor 3 | POST | `/rest/v1/programacao_pcp` | 1 |
| programar/desprogramar cartão Setor 1 | DELETE | `/rest/v1/programacao_pcp` | 1 |
| programar/desprogramar cartão Setor 1 | POST | `/rest/v1/programacao_pcp` | 1 |
| programar/desprogramar cartão Setor 2 | DELETE | `/rest/v1/programacao_pcp` | 1 |
| programar/desprogramar cartão Setor 2 | POST | `/rest/v1/programacao_pcp` | 1 |
| programar/desprogramar cartão Setor 3 | GET | `/rest/v1/montagem_poste` | 3 |
| programar/desprogramar cartão Setor 4 | DELETE | `/rest/v1/programacao_pcp` | 1 |
| programar/desprogramar cartão Setor 4 | POST | `/rest/v1/programacao_pcp` | 1 |

A captura inclui navegação, programação e desprogramação por cartão nos quatro setores, liberação nos Setores 1 a 3 e concretagem com tipo nos quatro setores. Permanecem pendentes capturas de cancelamento Odin, manutenção, mandril, inspeção, montagem, fotos, segunda inspeção, retrabalho, relatórios, exportações e permissões por perfil. Esta matriz ainda não libera a implementação operacional.

## Varredura ampliada e rastreio de origem — 03/10/2026

`scripts/inventory_mapa_all_calls.py` registrou **143 ocorrências** no `app.js` de `.from(` (68), `.rpc(` (1), `.channel(` (1), `fetch(` (16), `localStorage` (54) e `caches` (3); `.storage`, `XMLHttpRequest` e `indexedDB` tiveram zero ocorrências. Treze ocorrências de `.from(` são `Array.from`, auxiliares de coleção. Após excluí-las, há **73 locais de chamada de rede**. A lista por linha/coluna e o fluxo que cobriu cada local estão em `tests/mapa/fixtures/static-call-sites.json`; os 55 ainda não cobertos estão em `tests/mapa/fixtures/coverage-summary.json`.

A captura Playwright foi repetida com `page.route('**/*')` e servidor local alimentado por **62.178 linhas** das visões `api` do PostgreSQL de testes, exportadas para `.work-mapa-unificado/snapshot/` (ignorada pelo Git). Nenhum pedido do navegador alcançou host externo: **71 requisições foram interceptadas e respondidas localmente**, com 55 GET e 16 escritas simuladas em memória. As pilhas de `fetch` associaram as requisições a **16 linhas de origem** do `app.js`. Os GETs recebem listas com formato e campos da fotografia; o recorder altera apenas cópias em memória. Cabeçalhos `Prefer` e `Range` foram registrados quando presentes; para `apikey`, ficou somente a indicação de presença, sem valor. Método, caminho, query, corpo, forma da resposta e fluxo estão em `tests/mapa/fixtures/captured-offline.json`. O arquivo ainda é **rascunho**, pois não demonstra todas as respostas, erros e fluxos do oficial. Programar/desprogramar e concretar por cartão foram exercitados nos quatro setores sob GERENCIA; liberação produziu escrita nos Setores 1, 2 e 3, mas não no 4 nesse roteiro. Os demais fluxos e perfis exigem ações completas.

O cruzamento entre pilhas capturadas e ocorrências estáticas comprova **18 de 73 locais de rede** exercitados por pelo menos um pedido; nenhum dos 71 pedidos ficou sem linha mapeada. Isso mede apenas alcance de chamadas, não paridade de suas respostas ou de todos os estados da tela.

`scripts/capture_mapa_role_sector_navigation.py` abriu os 18 modos originais nas 16 combinações de quatro perfis e quatro setores, em navegador isolado: **288 casos de navegação**, com 184 modos permitidos abertos e 104 negados sem abrir. Foram interceptados 299 pedidos externos. O resultado em `tests/mapa/fixtures/role-sector-navigation.json` **não comprova as ações dentro das telas** e não conta para a cobertura integral da etapa B.

## Ampliação dos roteiros após as decisões do Ricardo

O aplicativo original permaneceu intacto. `scripts/capture_mapa_requests_offline.py` executou programação/desprogramação e concretagem nos quatro setores; liberação nos Setores 1–3; ODIN com alteração de tipo e cancelamento; manutenção; inspeção com checklist, foto e retrabalho; montagem com checklist e conclusão; Saque Mandril; sequência S3 e reenvio offline; usuários; dashboards, acompanhamento, relatórios e exportação. Os ramos de compatibilidade antiga receberam erros de coluna **simulados pelo servidor local**, seguidos do fallback do próprio aplicativo. O recorder interceptou **228 pedidos externos** e registrou três leituras locais de assets: **231 entradas**, todas sem acesso externo do navegador. Também registrou quatro invocações sem HTTP (`fetch` de data URL, canal Realtime e duas chamadas à biblioteca PDF). O PDF usou biblioteca simulada apenas para alcançar os pontos de chamada; seu conteúdo não foi validado.

O cruzamento atual comprova **72 de 73 locais estáticos exercitados**; todos os pedidos de dados capturados foram ligados a um local do código. O único local restante é `app.js:2162` em `getSetorRowsByDate`: `CONFIG` não é definido no Mapa original, então o `ReferenceError` capturado impede que o `fetch` aconteça. A evidência está em `docs/comportamentos-atuais-suspeitos.md`. A matriz continua rascunho de contrato: as respostas do servidor local são sintéticas e não foram comparadas integralmente ao oficial por método, campo e erro.

## Decisão sobre a chamada 73

**73/73 ocorrências estão cobertas pelo comportamento original.** A ocorrência `app.js:2162` foi exercitada por invocação direta de `getSetorRowsByDate` e confirmou retorno `[]` após `ReferenceError` de `CONFIG.API_URL`, sem pedido HTTP. Nenhum botão ou tela chama essa função no `app.js` atual; a busca de referências encontrou somente a definição e o roteiro de captura. Não houve alteração no aplicativo para produzir um `fetch` inexistente. Esta cobertura de comportamento não equivale a um fixture HTTP.

## Classificação individual das diferenças de ordem — 03/10/2026

Os 12 casos abaixo usam GETs oficiais e respostas da rota de testes na mesma fotografia. Os pares completos ficam fora do Git em `.work-mapa-unificado/order-pairs-private.json`; `tests/mapa/analyze_order_diffs.py` registra somente as formas das diferenças. `tests/mapa/e2e/compare_order_render.py` injetou cada lado no **mesmo `app.js`** e comparou texto final e classes de cartão. A hora dinâmica “Emitido” do relatório foi normalizada. `a` significa que o consumo reordena ou agrega; `b` significa que a posição/página pode influenciar o resultado.

| Caso | GET e uso | Classe | Resultado final com os dados reais |
|---:|---|:---:|---|
| 1 | `producao`, `order=data_hora.asc`, página 1000–1444; produtividade | b | Mesmas 445 linhas. Indicadores iguais, mas a ordem final da tabela podia trocar `A-36` e `DTB 03`, ambas com horário 01/10/2026 19:15:17 UTC. A rota de testes passou a desempatar pelo ranking de IDs lido da origem; após isso, linha exibida, indicadores e gráficos foram iguais em 36 casos de dashboard. |
| 2 | `producao`, 01–03/10, 415 linhas sem `order`; relatórios | a | Mesmas linhas e contagens; texto final do relatório igual. |
| 3 | `vw_formas_status`, 02/10, 209 formas | a | 209 chaves `(data,setor,forma)` distintas; classes e textos dos cartões iguais. |
| 4 | `producao`, `order=data_fabricacao.desc`, página 0–999 | b | 39 IDs mudam de página por empate de data; conjunto final e indicadores iguais. |
| 5 | `producao`, mesma consulta, página 1000–1055 | b | Complemento dos mesmos 1.056 IDs, sem falta ou repetição; indicadores iguais. |
| 6 | `producao` Setor 1, 02/10, 67 linhas; acompanhamento | a | O app ordena pelo horário; 67 horários distintos e linhas exibidas iguais. |
| 7 | `producao` Setor 2, 02/10, 76 linhas; acompanhamento | a | O app ordena pelo horário; 76 horários distintos e linhas exibidas iguais. |
| 8 | `producao` Setor 3, 02/10, 46 linhas; acompanhamento | a | Mesmos 46 IDs da consulta equivalente do caso 9; acompanhamento exibido igual. |
| 9 | `producao` Setor 3, filtros em ordem inversa; relatório | a | Deduplicação/ordenação do app; texto final do relatório igual. |
| 10 | `producao` Setor 3, colunas do dashboard | a | 46 formas distintas; totais e estados derivados iguais. |
| 11 | `producao` `LIBERADO`, Setor 3, 02/10; helper de pendências | a | 46 registros iguais; o helper só é chamado pelo roteiro direto, sem tela chamadora no código atual. |
| 12 | Mesma consulta com filtros em ordem inversa | a | Mesmo conjunto e contagem do caso 11; sem tela chamadora. |

Uma diferença **com efeito visível** foi encontrada antes da correção: `montagem_poste` sem `order` retornava os mesmos 665 registros em outra sequência. O resumo do dashboard exibia modelos com a mesma contagem em posições diferentes. `scripts/sync_mapa_montagem_source_order.py` captura por GET apenas a ordem da consulta oficial; o proxy de testes a aplica somente a leituras sem ordenação/paginação, sem tocar no `app.js`. Depois do ajuste, esse GET teve status e corpo em ordem iguais na auditoria. Naquela rodada, o total das leituras exatas ficou em **66/78**; a conferência posterior da Produtividade encontrou outro efeito visível em 24/09–03/10 e o corrigiu no proxy, conforme a atualização abaixo.

Em 04/10/2026, a conferência de todos os filtros do dashboard de produtividade encontrou também a troca visível entre `A-36` e `DTB 03` no empate de `data_hora`, apesar dos indicadores iguais. `scripts/sync_mapa_producao_source_order.py` lê por GET a ordem de IDs da origem, e o proxy de testes usa esse ranking somente para desempatar leituras `producao?order=data_hora.asc` que incluem `id`. Após a correção, 36 combinações entre GERENCIA e GESTOR, três dashboards e seis filtros deram linha, KPI, gráfico e hash das requisições iguais ao HTML original. A posição em empate agora é estável na rota de testes, sem alterar o `app.js`.

`tests/mapa/contract_producao_pagination.py` percorreu as duas páginas do destino até a página curta: **1.056 linhas, 1.056 IDs únicos**, mesmos 1.056 registros e SHA-256 canônico da origem (`89a5bb6388d9279a34fc366a979c3b79ca3a0255a30a14073888c92b0c58b913`).

## Rota operacional aberta e contratos adicionais — 03/10/2026

`/unificado/mapa/operacao/` está publicada com faixa de ambiente de teste e escreve somente no PostgreSQL de testes. O `app.js` original foi preservado; o build substitui apenas o bloco de conexão com a API. Uma ponte local redireciona leituras e escritas do cliente para a origem de testes. `tests/mapa/e2e/live_navigation.py` confirmou 288/288 navegações por perfil/setor. `live_captured_flows.py` executou 30 roteiros na rota real, após correção de URL absoluta de fotos no **servidor novo**, sem exceções e sem pedidos a hosts externos; o roteiro de PDF ainda não foi executado. Isso não certifica sozinho os 24 fluxos E2E completos, documentados em `docs/paridade-mapa-unificado.md`.

O contrato de programação PCP usa a API PCP de testes. O contrato Mandril fez criação, leitura, remoção e conferiu ausência final de registro sintético, apenas no PCP de testes; foi repetido em 04/10/2026, com todas as seis verificações passando. A leitura de massadas é GET no serviço existente, passada pelo proxy autenticado; `tests/mapa/contract_massadas.py` obteve HTTP 200 em ambos os lados e SHA-256 idêntico `0fdd0e084369ed5c71b41d8cb9b90a2e4de2b2c5f7159ebbd50814e2b997b109`. O CSV fixo de leituras QR (`gid=0`) também foi servido por GET no proxy, sem cópia: HTTP 200 e SHA-256 idêntico `123804dd614daf3d40a1bdc9377218287cdc72f3d3517f1428ed09fdc6d4dffa`. Ambos os hashes foram reconfirmados em 04/10/2026. O teste `tests/mapa/e2e/realtime_poll.py` confirmou que uma gravação em `producao` no banco de testes aparece no cartão de um segundo tablet após a consulta periódica. `tests/mapa/e2e/realtime_event.py` confirmou também entrega pelo WebSocket do evento `INSERT` e atualização do cartão do segundo tablet em 0,39 s, usando o `app.js` original. `tests/mapa/e2e/offline_s3_retry.py` confirmou item S3 pendente na fila local, reenvio com corpo e cabeçalho iguais ao fixture `offline-199`, uma linha gravada e fila sem pendência. `tests/mapa/e2e/csv_exports.py` baixou pelo aplicativo os dois CSV de produtividade em 02–03/10/2026, com cabeçalhos corretos e 191 linhas de dados/8 linhas de paradas, iguais às listas exibidas. `tests/mapa/e2e/csv_export_parity.py` comparou os dois arquivos byte a byte entre o HTML original e o publicado, na mesma fotografia de testes; ambos foram iguais. Faltam os demais tipos de item da fila e a comparação de arquivos baixados diretamente do domínio oficial. `scripts/refresh_unificado_snapshots.py --apply` restaura as duas fotografias, reaplica somente os vínculos de identidade confirmados e atualiza a ordem de montagem da fonte para o dashboard; não recria contas sintéticas.

Em 04/10/2026, `tests/mapa/contract_write_all_tables.py` repetiu insert, update, upsert e delete nas seis tabelas operacionais do Mapa: **24/24 ações passaram** e as seis contagens de resíduos sintéticos foram zero.

Após a correção de ordem visível da Produtividade, `tests/mapa/contract_read_tables.py` foi repetido em 04/10/2026, sempre com GET na origem. O primeiro resultado foi 65/78 respostas brutas exatas e 76/78 com as mesmas linhas. O teste do resultado final para 24/09–03/10 revelou uma linha diferente em Produtividade, apesar dos KPIs iguais. O proxy passou a usar o ranking da consulta capturada, gerado pela fotografia em `scripts/sync_mapa_producao_source_order.py`, e o teste final passou **14/14 cenários** de Montagem e Produtividade com KPIs, linhas e texto iguais. A repetição do contrato bruto passou para **67/78 respostas exatas** e **76/78 com as mesmas linhas**. Das onze diferenças brutas restantes, nove têm as mesmas linhas em outra ordem; duas páginas dividem um empate, já auditado no percurso completo de 1.056/1.056 linhas. O relatório privado sem corpos de linha está em `/opt/concrefer-unificado/migration/contract-read-tables.json` na VPS de testes. As onze diferenças restantes ainda não foram promovidas a contratos exatos.
