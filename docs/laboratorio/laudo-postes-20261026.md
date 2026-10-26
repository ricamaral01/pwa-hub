# Laudo de ensaio de postes — correção e publicação em 26/10/2026

## Diagnóstico da inspeção

No ensaio `8013d087-ecd3-4446-a6d7-06a49d9e295e` (amostra *Protótipo - Ensaio*), a checklist visual e as etapas mecânicas aplicáveis estavam concluídas. Comprimento, diâmetro da base e diâmetro do topo tinham leituras dentro dos limites. A medição obrigatória de **engastamento (e)** tinha nominal de 1.600 mm, faixa aceita de 1.585 a 1.615 mm e leitura vazia. A interface antiga ocultava esse campo, apesar de o backend exigir a leitura. Por isso o ensaio continuava em rascunho.

O formulário agora exibe os campos dimensionais aplicáveis, inclusive engastamento. A resposta de finalização nomeia as medições ou itens de checklist que ainda faltam. Não alteramos a leitura nem o estado do ensaio: é necessário medir, registrar o valor real e salvar antes de finalizar. A absorção é informativa; sem amostras, o laudo mostra **N/A** em vez de **PENDENTE**.

## PDF e verificação

- Assinaturas de Ricardo do Amaral e Marcelo Eduardo Ishizaki de Sousa posicionadas no rodapé, com linhas alinhadas. A identificação do equipamento ocupa a faixa superior do rodapé.
- Fonte dimensional longa resumida nas linhas da tabela e preservada integralmente uma vez abaixo do resultado. O laudo da amostra relatada voltou a caber em **uma página A4 horizontal**.
- Laudo finalizado: QR e link clicável para `/v/postes/<id>/<assinatura>`, com página pública de verificação e botão de download do PDF. O PDF é gerado a partir do registro finalizado. Token inválido e rascunho retornam 404; anexos não são publicados por essa rota.
- Rascunho: continua sem QR público e informa que ele estará disponível após a finalização.
- Versão da casca e do service worker: **1.0.105**. O novo ativo da tela de postes tem hash próprio para evitar cache da interface anterior.

## Homologação e produção

| Verificação | Resultado |
| --- | --- |
| Backup do banco e arquivos, snapshot de donos e modos | Executados nos dois ambientes |
| `nginx -t` | Aprovado nos dois ambientes |
| Serviço do Laboratório e versão 1.0.105 | Ativos em produção |
| PDF autenticado de rascunho e finalizado | HTTP 200, arquivos PDF válidos |
| QR do PDF finalizado | Decodificado da imagem; coincide com o link clicável |
| Verificação pública e download | HTTP 200 em `:18446` e em produção |
| Token inválido, rascunho e finalização sem engastamento | 404, 404 e 409 com “Engastamento”, respectivamente |

**Gate: 7/7 aprovado.** O PDF do ensaio informado e um exemplo finalizado foram renderizados e inspecionados visualmente: ambos têm uma página, rodapé legível e linhas de assinatura alinhadas. Não houve mudança de dados de negócio.

A primeira tentativa de publicação em produção foi revertida automaticamente porque o teste de prontidão consultava `/openapi.json`, rota não exposta pelo serviço. Corrigimos o teste para `/`, confirmamos a versão anterior após o retorno e publicamos novamente com o gate aprovado.

Backups: `/opt/concrefer-unificado/backups/laudo-postes-stage-20261026T154219Z` e `/opt/concrefer-unificado/backups/laudo-postes-production-20261026T154230Z`. O procedimento reproduzível está em `deploy/scripts/deploy-laudo-postes-20261026.sh`.

## Arquivos

- Backend: `unificado/laboratorio/service/server/postes_api.py`, `postes_public.py`, `postes_report_v2.py`, `postes_certificates.py`.
- Interface: `unificado/laboratorio/service/server/static/novo/postes/novo.html` e `assets/novo-16d78bdbc677.js`.
- Casca/PWA: `unificado/VERSION`, `index.html`, `sw.js`, `shell/shell.js`.
- Homologação usa uma versão anterior de `postes_api.py`; a aplicação isolada e verificada das mudanças está em `unificado/laboratorio/laudo/patch_stage_api.py`.
- Os exemplos PDF gerados localmente para inspeção visual estão em `output/pdf/` e não são incluídos no Git por conterem dados de ensaios.
