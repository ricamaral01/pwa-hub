# Menu compartilhado do unificado — 0.6.29

Publicado em `https://concrefer.concretrack.com.br/unificado/`.

O shell usa um único menu para Planejamento, Produção e Laboratório. No navegador, abre em lista no PC e começa em trilho no tablet; no tablet, a gaveta sobrepõe o conteúdo e fecha ao escolher um item ou tocar fora. A preferência de recolhimento do PC continua em `unificado_menu_collapsed`.

O modo novo só é ativado a partir de 601 px, fora de PWA instalado (`display-mode: standalone` ou `navigator.standalone`), fora de telefone identificado pelo navegador e fora de `kiosk-active`. O menu legado continua nos demais casos. A tela de login já mostrava os logos sobre cartão branco e manteve o mesmo visual.

Os logos são os PNG originais em `unificado/assets/img/`. Não há uma variante reduzida da Concrefer no projeto; o trilho reduz o logo inteiro, sem distorção.

Verificações na URL publicada com sessão válida e cliques Playwright: PC 1366×768 e 1920×1080, aberto e recolhido nos três módulos; tablet 800×1280 e 1280×800, trilho, gaveta, fechamento por item e fora, troca de módulo; conta `alexh` com apenas Produção e conta `ricardo.teste` com três módulos. O maior tempo de troca observado na versão final foi 2,10 s. Os botões dos módulos no trilho mediram 64×54 px. Nenhuma rota, item de menu ou permissão foi alterada.

Capturas antes e depois de celular e modo PWA simulado, além das telas principais, estão em `docs/capturas-menu-unificado-0.6.29/`. O celular teve zero pixels diferentes; o PWA simulado teve 79 pixels de diferença por renderização de texto, sem mudança visual observável. Não havia PWA instalado no ambiente de teste para captura real.

O arquivo `MenuAlternativas.html` não estava em `C:\Users\Admin\Downloads` nem em `docs/referencia-laboratorio` durante a implantação. O layout seguiu a descrição textual; falta comparar com a referência quando ela for anexada.
