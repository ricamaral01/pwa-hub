# GED e atualização do Unificado — versão 1.0.109

Publicada em 2026-11-06. Esta pasta contém os arquivos exatos implantados em `/opt/concrefer-unificado/public/unificado` a partir da versão 1.0.108. A origem `unificado/` do repositório estava atrás dos arquivos publicados, por isso a correção foi feita sobre a versão ativa e guardada aqui.

## Correção

- `shell/router.js`: o servidor GED decide o acesso. O indicador do menu pode estar desatualizado; uma resposta 200 da sessão GED abre a tela. Uma resposta 401/403 ainda passa pelo tratamento de renovação e negação.
- `shell/shell.js`: Ricardo, Ilson, Alex e Marcelo veem o módulo GED no menu. A sessão GED continua conferindo o vínculo de cada usuário. `APP_VERSION` foi atualizado de 1.0.107 para 1.0.109; o valor antigo deixava o botão de atualização preso em um ciclo de recarga.
- `index.html`, `sw.js` e `VERSION`: versão de scripts, cache e arquivo público alinhados em 1.0.109.
- `grant_ilson.sql`: vínculo do usuário Mapa `ilson` com o usuário GED Ilson Ifanger, aplicado em produção após confirmar as duas contas ativas. Os vínculos de Ricardo, Alex e Marcelo já estavam ativos.

## Publicação e verificação

Arquivos e backup em `/opt/concrefer-unificado/releases/20261106T-ged-access-2`; `publish.sh` verifica a versão anterior e publica os cinco arquivos. O banco GED mostrou os quatro vínculos ativos após a alteração.

`test.cjs` verifica a abertura do GED e a versão exibida para os quatro IDs, com respostas de autorização simuladas; `USE_LIVE=1 node test.cjs` usa os arquivos servidos pelo site. `test-update.cjs` inicia com a tela 1.0.107 e confirma que o botão termina na 1.0.109 usando o service worker real. Esses testes passaram após a publicação. A autorização real de Ricardo foi observada nos registros do servidor GED com HTTP 200; o teste de navegador não possui a sessão privada do usuário.
