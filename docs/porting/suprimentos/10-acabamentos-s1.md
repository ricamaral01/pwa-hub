# F0 — acabamentos da S1

Data: 25/10/2026. Homologação: `https://concrefer.concretrack.com.br:18446`, versão final da F0 **1.0.62**. A produção e a VPS antiga não foram alteradas; nenhum push foi feito.

Os acabamentos iniciais estavam publicados antes desta ordem F0–F8, nos commits locais `369fbb0d` e `b9b7a368`. A revisão final acrescentou eventos de item ao histórico da solicitação e rótulos para entrega parcial e recebimento com problema, na web e no PWA.

| Requisito | Implementação e evidência |
| --- | --- |
| Sigla e cor do menu | `SU` e teal `#2DD4BF` no seletor, trilho, fallback e Home. Arquivos: `unificado/shell/navigation.js`, `navigation.css`, `shell.js`, `shared-menu.css`. A captura `manual/img/painel-pc.png` mostra o menu real. |
| Histórico legível | `unificado/suprimentos/service/suprimentos/api/solicitacoes.py` inclui eventos dos itens; `frontend/app.js` e `pwa/app.js` formatam situação, ator, data e hora. Inclui aprovação N1/N2, entrega parcial, recebimento com problema e conclusão automática. |
| Fotos vazias | `unificado/suprimentos/frontend/app.css` exibe uma linha discreta, “Sem fotos anexadas”. |
| ADMIN de homologação | `ricardo.teste` aparece em Cadastros e Fornecedores nas capturas autenticadas `manual/img/cadastros-usuarios-papeis-pc.png` e `manual/img/fornecedores-pc.png`. O papel ADMIN não substitui o de APROVADOR, conforme D7. |

Teste de regressão E1–E7 anterior à revisão: **21 aprovados**. Após a revisão, os testes locais sem banco terminaram em **8 aprovados, 13 pulados por falta de `SUPRIMENTOS_TEST_ADMIN_URL`**; verificação de sintaxe JS/Python aprovada. O smoke HTTPS final da homologação: **43/43**. As 57 capturas do manual foram feitas com sessão real pela casca/PWA, sem 404 ou erro de console. A versão 1.0.62 da casca, APP_VERSION e cache de SW foi aplicada na homologação.

Publicação final: `/opt/concrefer-unificado/homolog-next/backups/suprimentos-f0-20261025T233215Z/`; `nginx -t` e serviço responderam. O script [f0-finish-homolog.sh](../../../unificado/suprimentos/deploy/f0-finish-homolog.sh) contém retorno automático. A primeira tentativa parou numa âncora de versão inexistente no `pwa/index.html`; a segunda encontrou o serviço ainda inicializando. Ambas restauraram o backup. A terceira acrescentou espera de health, instalou e passou no smoke. Os dados DEMO permaneceram intactos.
