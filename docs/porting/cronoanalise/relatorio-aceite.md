# T7 · Relatório de aceite final da Cronoanálise — 18/10/2026

**Resultado:** Cronoanálise publicada em `/unificado/laboratorio/cronoanalise`, com acesso exclusivo de `user-ricardo` nesta entrega. A homologação T6a foi aprovada pelo solicitante; a publicação T6b e as verificações finais estão documentadas em [T6b-producao.md](T6b-producao.md). O código funcional parte de `f4417660`; as correções de acesso master e XLSX foram autorizadas e revalidadas em homologação antes da produção (`468e1409` e `9a64e285`).

## Automatizados

| Critério | Evidência | Resultado |
| --- | --- | --- |
| API, permissões, golden estatístico, invalidação, CSV e XLSX | `pytest tests/auth/test_crono_screen_access.py unificado/laboratorio/service/cronoanalise/tests` | **13/13** passaram; o teste novo reproduz a exportação com UUID, data com fuso e decimal. A integração T3 incluiu lote idempotente, invalidação/restauração com auditoria e exportação CSV; a T6a acrescentou testes de invalidação e importação repetida do CSV do protótipo. |
| Motor TypeScript e regras | [saída Vitest T6a](T6a-golden-vitest.txt) e nova execução após T6b | **20/20**, incluindo os **18/18** casos de `golden.json`; regras de caçambas e 292 formas/129 caçambas cobertas na mesma suíte. |
| Suítes preexistentes | Execução após publicação | Raiz **63/65**: somente `dashboard-contracts` e `mapa-promocao-producao`, falhas preexistentes. Laboratório: **23 testes passaram**; única suíte falha pela fixture preexistente ausente `fl-pro-22.json`. Nenhuma falha nova. |

## Funcionais

- [T6a-complemento.md](T6a-complemento.md): três atividades cronometradas com autor e duração efetiva corretos, pausa com motivo, deslocamento com distância, usuário restrito a Coletar, fila offline de duas medições idempotentes, resultado de Dimensionar e seis sequências. Os dados e o usuário de teste foram removidos da homologação.
- Ensaio adicional T7 em homologação: dois contextos Chromium independentes representaram aparelho A (390×844) e B (1194×834). O cronômetro P01 reapareceu após fechar e reabrir a página. A ficou sem rede e enfileirou **três** atividades, com zero POSTs; B registrou uma enquanto A estava offline. Após reconexão, B viu **quatro medições**, autores corretos, e o reenvio das três retornou `ja_existiam` sem duplicar. [Fila](capturas-T7/dois-aparelhos-offline-3.png) e [Medições](capturas-T7/dois-aparelhos-medicoes-4.png).
- Na mesma rodada, CSV com BOM UTF-8, separador `;` e decimais com vírgula foi analisado; XLSX abriu com quatro linhas de dados. A falha inicial de XLSX preenchido foi corrigida, testada em homologação e publicada. Base × cenário com **8 replicações** mostrou diferença e IC, foi salvo e apareceu no [Histórico](capturas-T7/cenario-historico.png); [resultado](capturas-T7/cenario-diferenca.png). As quatro medições, a simulação e seus eventos de auditoria foram removidos **somente da homologação** após o ensaio.
- Seis sequências com 8 replicações no viewport celular 390×844 concluíram em **3,026 s**: [captura](capturas-T7/celular-sequencias-8.png). Essa medição foi no Chromium com tamanho de tela de celular, não em aparelho físico intermediário.
- Em produção, sessão autenticada abriu [as sete telas e o menu](T6b-producao.md#smoke-de-produção-sem-dados-de-teste); `/status` respondeu 200, Dimensionar calculou **34 pessoas** com aviso de estimativa e Simular concluiu seis sequências com 10 replicações em **4,006 s**. Nenhuma medição ou simulação foi salva em produção pelo smoke. Ricardo recebeu 7 telas e 3 ações; Marcelo e Alex tiveram 0 e HTTP 403. Não havia concessões de Cronoanálise para outros usuários.

### Matriz visual e largura

Playwright conferiu a casca e o aplicativo com `scrollWidth - clientWidth <= 1` em **18/18 combinações**, sempre com diferença zero. Capturas após carregamento do conteúdo:

| Tela | PC 1440×900 | Tablet 1194×834 | Celular 390×844 |
| --- | --- | --- | --- |
| Início | [captura](capturas-T7/pc-inicio.png) | [captura](capturas-T7/tablet-inicio.png) | [captura](capturas-T7/celular-inicio.png) |
| Coletar | [captura](capturas-T7/pc-coletar.png) | [captura](capturas-T7/tablet-coletar.png) | [captura](capturas-T7/celular-coletar.png) |
| Medições | [captura](capturas-T7/pc-medicoes.png) | [captura](capturas-T7/tablet-medicoes.png) | [captura](capturas-T7/celular-medicoes.png) |
| Dimensionar | [captura](capturas-T7/pc-dimensionar.png) | [captura](capturas-T7/tablet-dimensionar.png) | [captura](capturas-T7/celular-dimensionar.png) |
| Simular | [captura](capturas-T7/pc-simular.png) | [captura](capturas-T7/tablet-simular.png) | [captura](capturas-T7/celular-simular.png) |
| Metodologia | [captura](capturas-T7/pc-metodologia.png) | [captura](capturas-T7/tablet-metodologia.png) | [captura](capturas-T7/celular-metodologia.png) |

## Produção, recuperação e não interferência

- Bancos confirmados por configuração e consulta: `concretrack_postes` é o banco ativo dos ensaios e recebeu `cronoanalise`; `mapa_unificado_teste` contém `unificado_auth`. Antes da migração, foram verificados os dumps dos dois bancos de postes (`concretrack_postes` e o `concretrack_postes_unificado` solicitado) e do schema de autenticação. Após a migração, o dump de `cronoanalise` foi restaurado em banco temporário, com **11 tabelas**, e o banco temporário foi removido.
- O inventário [antes](T6b-inventario-antes.txt) e [depois](T6b-inventario-depois.txt) mostra **+1 porta local e +1 serviço**, ambos do `laboratorio-unificado.service` cuja ativação o solicitante autorizou após descobrir que estava parado. Não houve porta pública nova, remoção de porta/serviço ou alteração NGINX. Assim, o critério original de diff 0/0 foi substituído pela decisão posterior de ativar o Laboratório.
- Capturas autenticadas de [PCP](capturas-T6b/regressao-pcp.png), [Mapa](capturas-T6b/regressao-mapa.png), [GED](capturas-T6b/regressao-ged.png) e [Laboratório](capturas-T6b/regressao-laboratorio.png) passaram. `concretrack-unificado.service` não foi reiniciado e nenhuma operação foi feita na VPS antiga.
- O [roteiro de rollback](T6b-producao.md#roteiro-de-rollback--documentado-não-executado) cobre frontend, router, gateway, permissões e schema. Não foi executado. Após os testes finais, tanto produção quanto homologação tinham **0 medições, 0 simulações e 0 eventos de auditoria** da Cronoanálise.

**Aceite técnico:** os fluxos solicitados e as correções encontradas na validação passaram. Permanecem explícitas as três falhas de linha de base preexistentes, a diferença de inventário autorizada pela ativação do Laboratório e a limitação de desempenho medida em viewport celular sem dispositivo físico.
