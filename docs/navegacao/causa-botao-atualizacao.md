# Causa do desaparecimento do botão de atualização

## Diagnóstico

Em produção, o `VERSION` e o `APP_VERSION` estavam alinhados em `1.0.48`. O registro do service worker e a busca de `VERSION` funcionavam. O problema era a integração com o menu Modelo A: `window.UnificadoSidebarModelA.snapshot()` devolvia `updateAvailable: false` de forma fixa. O componente React do menu só desenhava o botão quando esse campo era verdadeiro. O botão da Home, por sua vez, era ocultado pelo CSS do cabeçalho compacto quando desabilitado. Assim, o usuário não tinha um controle visível para verificar a versão nem para atualizar quando uma nova versão fosse detectada.

## Correção prioritária

O shell agora publica `updateState`, `updateAvailable`, `latestVersion` e `updateFailures` reais no snapshot e emite o evento de atualização do Modelo A. O menu mantém o controle visível nos estados em dia, disponível, atualizando e falhou; após duas falhas oferece limpeza de cache. A consulta usa `cache: 'no-store'` e parâmetro variável em `/unificado/VERSION`, ao abrir, a cada 15 minutos e quando a aba volta ao primeiro plano. O trilho do tablet e a Conta do celular mostram o mesmo estado.

Essa correção foi publicada separadamente como versão `1.0.49`, primeiro em `:18446` e depois em produção, antes da nova navegação. O teste automatizado confirmou os estados em dia, disponível, falhou e recuperação. A versão final da navegação amplia essa verificação com o estado atualizando.

## Controle da publicação

`shell.js` contém a versão de origem. O script `deploy/navigation_shell.sh` compara essa constante com o arquivo `VERSION` e com a chave de cache do `sw.js`, rejeita divergências e grava o `VERSION` publicado a partir da constante. O pacote usa URLs versionadas para `shell.js`, `menu.config.js`, `router.js` e os arquivos da navegação.
