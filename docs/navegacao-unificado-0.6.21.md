# Navegação do unificado — 0.6.21

## Problema observado

O Mapa e o PCP ainda podiam abrir como documentos de topo por atalhos antigos, pelo início do aplicativo instalado e por URLs diretas. Isso recriava o menu e o topo e dava a impressão de passar por várias telas. O teste anterior exercitava principalmente a rota `/unificado/` e não cobria esses pontos de entrada. Em rotas com `index.html`, a normalização do parâmetro `view` também podia abrir a casca sem o conteúdo solicitado.

## Correção

- A rota `/unificado/` mantém a casca única e troca o conteúdo depois que a tela de destino está pronta. A última tela de cada módulo é lembrada durante a sessão.
- O HTML publicado do Mapa e das páginas do PCP envia visitas diretas de topo à rota única antes de desenhar o módulo. Dentro da casca, as funções originais continuam no iframe. Os arquivos originais `app.js` do Mapa e o backend PCP não foram alterados.
- URLs antigas com `index.html` são normalizadas antes de abrir a tela.
- O manifesto do aplicativo instalado aponta para `/unificado/`; o service worker da casca só armazena recursos estáticos e não armazena respostas de login ou API.
- O indicador visual de versão não é criado; a versão continua identificada internamente no arquivo `VERSION`.

## Conferência no endereço publicado

Em 0.6.21, uma conta sintética ligada aos dois módulos abriu Produção → Setor 1 → Planejamento → Programação e voltou aos módulos em Chromium (1366×768, 1920×1080, 1024×768, 768×1024) e WebKit (768×1024, 1024×768). Os 39 destinos do menu (22 do PCP e 17 do Mapa) abriram a tela esperada em Chromium. Nas trocas dentro da casca, não houve pedido de documento de topo, retorno ao login ou erro de JavaScript. Visitas diretas às URLs antigas de Mapa e PCP chegaram à rota única e abriram o conteúdo correto. Nenhum indicador visual de versão apareceu. As contas sintéticas foram removidas.

As capturas locais de conferência estão em `.work-mapa-unificado/nav-map-sector-*.png` e `.work-mapa-unificado/nav-pcp-programacao-*.png`. A confirmação no tablet físico do Ricardo depende da próxima tentativa dele.
