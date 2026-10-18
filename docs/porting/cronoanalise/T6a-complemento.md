# T6a · Complemento funcional em homologação — 18/10/2026

Ambiente isolado: `https://concrefer.concretrack.com.br:18446/unificado/`, Laboratório `laboratorio-homolog.service`, banco `concretrack_postes_homolog`. Nenhum teste deste complemento escreveu em produção.

## 1. Coleta completa na interface

Com a sessão de Ricardo, preenchi setor 1, forma `TESTE-T6A-F01`, poste Duplo T e cronometrista `Ricardo TESTE T6a`. Iniciei e finalizei três cronômetros pela tela Coletar; cada registro foi sincronizado e apareceu na tela Medições.

| Atividade | Caso | Bruta | Efetiva | Distância | Autor gravado |
| --- | --- | ---: | ---: | ---: | --- |
| P01 | Pausa com motivo `Aguardando ponte` | 3,63 s | 2,49 s | — | `user-ricardo` |
| P02 | Coleta simples | 1,20 s | 1,20 s | — | `user-ricardo` |
| R04 | Deslocamento | 1,24 s | 1,24 s | 18,5 m | `user-ricardo` |

O detalhe de P01 mostra duração efetiva, cronometrista, intervalo e motivo da pausa, além de `user-ricardo` na auditoria: [detalhe](capturas-T6a/funcional-medicao-pausa-detalhe.png). As três linhas estão em [Medições](capturas-T6a/funcional-medicoes-3.png). Os IDs foram conferidos também pela API autenticada antes da limpeza.

## 2. Offline e envio único

Playwright abriu Coletar com o usuário restrito e catálogo carregado. `context.set_offline(True)` desligou a rede; P01 e P02 foram cronometradas e terminaram na fila local (`2 no aparelho`, **zero POSTs** enquanto offline). Ao religar, a fila esvaziou e a API, consultada com Ricardo, mostrou **dois registros** com autor `crono_teste_t6a_20261018`. Reenviei o mesmo lote: `gravadas=[]`, `ja_existiam=[os dois IDs]`, `rejeitadas=[]`; a contagem permaneceu dois. Capturas: [fila sem rede](capturas-T6a/funcional-offline-fila-2.png) e [após reconexão](capturas-T6a/funcional-offline-sincronizado.png).

## 3. Paridade golden

A suíte é `unificado/laboratorio/frontend/src/cronoanalise/engine.test.ts`, executada por Vitest. Ela lê `docs/porting/cronoanalise/especificacao/tests/golden.json`. A [saída verbosa](T6a-golden-vitest.txt) mostra **golden 1/18 até golden 18/18**, todos aprovados; mais dois testes de regra/layout, total **20/20**.

## 4. Tablet e celular

Playwright verificou `scrollWidth <= clientWidth + 1` tanto na casca quanto no aplicativo em cada rota: **zero overflow horizontal da página**. Todos os arquivos têm exatamente o tamanho de viewport indicado.

| Tela | Tablet 1194×834 | Celular 390×844 |
| --- | --- | --- |
| Coletar | [captura](capturas-T6a/tablet-coletar.png) | [captura](capturas-T6a/celular-coletar.png) |
| Medições | [captura](capturas-T6a/tablet-medicoes.png) | [captura](capturas-T6a/celular-medicoes.png) |
| Simular | [captura](capturas-T6a/tablet-simular.png) | [captura](capturas-T6a/celular-simular.png) |

## 5. Permissão limitada

Criei apenas em homologação `crono_teste_t6a_20261018` com uma tela liberada, `cronoanalise.coletar`, e uma ação, `laboratorio.cronoanalise.coletar`. O endpoint de permissões retornou só essa tela do Laboratório; o menu lateral e a navegação interna mostraram apenas **Coletar**. O usuário cronometrou as duas atividades offline acima. Uma tentativa autenticada de `PUT /atividades/P01` recebeu **403** sem alterar o catálogo. [Captura do perfil restrito](capturas-T6a/funcional-coletor-restrito.png).

O complemento também fez a navegação interna respeitar as telas liberadas, com `/unified/screen-access/me`; o botão de simulação aguarda configuração e layout carregados. Esses ajustes estão no bundle compilado da Cronoanálise, instalado apenas no Laboratório de homologação. O SHA-256 de `cronoanalise.html` local e publicado coincide: `172b3c6a...06aeb`.

## 6. Dimensionamento e simulação

Dimensionar calculou **30 pessoas** (`N=29,1`, takt 1,81 min/forma, capacidade atual 261 formas/dia) e exibiu o aviso **“Estimativa: há atividades sem amostra suficiente”**: [resultado](capturas-T6a/funcional-dimensionar-estimativa.png). Simular concluiu **Comparar 6 sequências**, com 10 replicações em **2,337 s** medidos por `time.perf_counter()` no navegador; as seis linhas e a recomendação aparecem na [captura](capturas-T6a/funcional-simular-6-sequencias.png). A rodada não foi salva no banco.

## 7. Testes Python

Os **oito testes originais** eram:

1. `test_cronometrista_nao_herda_outras_telas_laboratorio`
2. `test_usuario_laboratorio_atual_nao_ganha_cronoanalise`
3. `test_rota_da_coleta_identificada_sem_reaproveitar_tela_antiga`
4. `test_estatistica_golden`
5. `test_tempo_padrao_golden`
6. `test_dimensionamento_golden`
7. `test_sem_sessao_401`
8. `test_sem_permissao_403`

Os testes 4–6 cobrem os exemplos `estatistica` e `dimensionamento` do `golden.json`. **Os oito originais não cobriam invalidação nem importação CSV**. Acrescentei `test_autor_invalida_medicao_recente_com_motivo`, `test_outro_coletor_nao_invalida_medicao` e `test_importacao_csv_prototipo_decimais_duplicata_e_linha_ruim`. A suíte agora passa **11/11** ([saída do pytest](T6a-python-tests.txt)). Na API real de homologação, também invalidei uma medição de teste e importei/reimportei um CSV do protótipo: a primeira importação gravou uma linha inválida com motivo e a segunda retornou `ja_existiam` sem duplicar.

Depois dos ajustes, o teste de interface local passou (`SIMULATION_WORKER_OK`, `SEVEN_SCREENS_OK`, `OFFLINE_QUEUE_OK`, larguras desktop/tablet/celular). A linha de base externa continua igual: raiz `63 passaram, 2 falharam` (`dashboard-contracts`, `mapa-promocao-producao`); Laboratório `23 passaram`, única suíte falha pela fixture ausente `fl-pro-22.json`.

## 8. Limpeza

Removi em transações conferidas **seis medições de teste** identificadas por `observacao LIKE 'TESTE T6A%'`, suas pausas por cascata, **oito eventos de auditoria** associados e a conta de teste com sua permissão de tela e ação. Conferência final: `remaining_test_measurements=0`, `all_measurements=0`, `remaining_test_users=0`; `/status` respondeu 200 com `medicoes=0`. Ambos os serviços de homologação estão ativos e `/cronoanalise` responde 200. Os dados de teste não permanecem no banco.

Os scripts `tests/porting/cronoanalise_homolog_functional.py`, `_offline.py` e `_responsive.py` registram os passos de Playwright. Para repetir o ensaio offline, é preciso recriar uma conta de teste com apenas a tela e a ação Coletar; os scripts de coleta criam novas medições e exigem a mesma limpeza ao final.

## Próximo limite

T6a permanece aguardando aprovação. Antes de qualquer T6b, confirmar por configuração e consulta somente leitura **qual é o banco de autenticação de produção**; então fazer backup de `concretrack_postes_unificado` e do schema `unificado_auth` desse banco, verificar os arquivos de backup e só depois publicar em `/opt/concrefer-unificado` e reiniciar `concretrack-unificado.service`.
