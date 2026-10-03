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

`scripts/inventory_mapa_all_calls.py` registrou **143 ocorrências** no `app.js` de `.from(` (68), `.rpc(` (1), `.channel(` (1), `fetch(` (16), `localStorage` (54) e `caches` (3); `.storage`, `XMLHttpRequest` e `indexedDB` tiveram zero ocorrências. A lista por linha/coluna está em `tests/mapa/fixtures/static-call-sites.json`. Entre essas ocorrências, **86 são locais candidatos a chamada de rede**; as demais incluem armazenamento local e cache. Essa é a base para provar cobertura, não uma afirmação de que todos os locais já foram executados.

A captura Playwright foi repetida com `page.route('**/*')` e servidor local alimentado por **62.178 linhas** das visões `api` do PostgreSQL de testes, exportadas para `.work-mapa-unificado/snapshot/` (ignorada pelo Git). Nenhum pedido do navegador alcançou host externo: **71 requisições foram interceptadas e respondidas localmente**, com 55 GET e 16 escritas simuladas em memória. As pilhas de `fetch` associaram as requisições a **16 linhas de origem** do `app.js`. Os GETs recebem listas com formato e campos da fotografia; o recorder altera apenas cópias em memória. Cabeçalhos `Prefer` e `Range` foram registrados quando presentes; para `apikey`, ficou somente a indicação de presença, sem valor. Método, caminho, query, corpo, forma da resposta e fluxo estão em `tests/mapa/fixtures/captured-offline.json`. O arquivo ainda é **rascunho**, pois não demonstra todas as respostas, erros e fluxos do oficial. Programar/desprogramar e concretar por cartão foram exercitados nos quatro setores sob GERENCIA; liberação produziu escrita nos Setores 1, 2 e 3, mas não no 4 nesse roteiro. Os demais fluxos e perfis exigem ações completas.

`scripts/capture_mapa_role_sector_navigation.py` abriu os 18 modos originais nas 16 combinações de quatro perfis e quatro setores, em navegador isolado: **288 casos de navegação**, com 184 modos permitidos abertos e 104 negados sem abrir. Foram interceptados 299 pedidos externos. O resultado em `tests/mapa/fixtures/role-sector-navigation.json` **não comprova as ações dentro das telas** e não conta para a cobertura integral da etapa B.
