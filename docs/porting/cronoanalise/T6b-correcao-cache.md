# T6b · Correção do menu em navegadores já atualizados — 19/10/2026

O solicitante informou que a Cronoanálise não aparecia no menu do Laboratório. O serviço `laboratorio-unificado.service` e o gateway de autenticação estavam ativos. O catálogo e o bundle do menu em produção continham as sete telas, e uma sessão de navegador nova as mostrava. A falha ocorria na atualização do cache da casca: `index.html` ainda solicitava `menu.config.js`, `shell.js`, `router.js` e `modelo-a-loader.js` com `v=1.0.15`, enquanto o NGINX entrega esses scripts por até um ano como `immutable`. Além disso, o loader ainda importava o menu desktop com `v=1.0.13`. Um navegador que já tivesse essas URLs em cache podia continuar a renderizar o menu anterior.

Foi criado o backup de `index.html`, `sw.js` e `shell/modelo-a-loader.js` em `/opt/concrefer-unificado/backups/crono-cache-20261019/before`. O [preparo](integracao/corrige-cache-shell.sh) copiou os três arquivos atuais para `stage` e aplicou [substituições verificadas](integracao/corrige-cache-shell.py): as URLs dos quatro scripts alterados e a importação do menu desktop passaram para `v=1.0.16-cronoanalise`; o cache da service worker e suas entradas correspondentes receberam a mesma versão. CSS, autenticação e demais módulos conservaram as URLs anteriores. O diff dos três arquivos foi revisado; os dois JavaScripts passaram em `node --check` local após copiar os bytes de `stage`. A [publicação](integracao/publica-cache-shell.sh) conferiu que os arquivos ativos ainda coincidiam com o backup e copiou apenas os três arquivos preparados. Nenhum serviço foi reiniciado e nenhuma configuração NGINX foi alterada.

SHA-256 final em produção:

| Arquivo | SHA-256 |
| --- | --- |
| `index.html` | `407867af0b99a6c9f5e4d469687294b1474abf9a8bb7b980199c9911668ee863` |
| `sw.js` | `b16043debb48c0c4fb2cdac58579e9c9651eb4f4d772aec3743273669dc6b390` |
| `shell/modelo-a-loader.js` | `41021f6e3cb59cca1de9e489f08232e9f00c613b230d5a9f28f5a4275364820d` |

O [smoke autenticado](../../../tests/porting/cronoanalise_production_cache_smoke.py), com service worker habilitada, abriu a rota da Cronoanálise duas vezes. Em ambas, os scripts alterados vieram nas URLs `v=1.0.16-cronoanalise` e o menu do Laboratório exibiu os **sete links**; o conteúdo da Cronoanálise carregou. [Captura do menu](capturas-T6b/crono-menu-cache-corrigido.png). Uma página que já estava aberta precisa ser recarregada ou usar o botão **“Nova versão — atualizar”** para trocar o JavaScript que já está na memória.

Rollback desta correção: restaurar somente os três arquivos de `before` para os caminhos originais. O código e os dados da Cronoanálise não foram alterados por este ajuste.
