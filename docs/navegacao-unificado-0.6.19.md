# Navegação do unificado — 0.6.19

## Causa

A troca entre Produção e Planejamento usava `location.assign` para carregar dois documentos completos. Cada documento reconstruía menu e topo e executava sua própria verificação de sessão. Isso produzia uma tela intermediária e, em algumas sessões, passagem pelo login. O conteúdo do PCP também animava a margem do menu antigo ao aparecer.

## Correção

A rota `/unificado/` mantém o menu e o topo montados. As páginas dos módulos carregam em quadros da mesma origem; o quadro anterior permanece visível até que o seguinte e seu CSS estejam prontos. Há um quadro em cache por módulo. A navegação entre telas do Mapa usa o `setMode` existente; links das páginas do PCP passam pelo roteador da casca. O build adiciona redirecionamento antecipado dos endereços diretos de desktop para a rota unificada. Não há indicador de versão visível.

Os arquivos de lógica `app.js` do Mapa e do backend PCP não foram alterados nesta correção. A publicação contém apenas HTML, CSS e JavaScript de navegação/casca, além do service worker do Mapa com cache versionado.

## Conferência no endereço publicado

Versão `0.6.19`, endereço `https://concrefer.concretrack.com.br/unificado/`, Chrome real com conta sintética pareada e removida ao fim. Em 1366×768, 1920×1080, 1024×768 e 768×1024, o percurso login → Setor 1 → Planejamento → Programação S1/S2 → Produção → Planejamento manteve o mesmo documento principal; somente login e início fizeram requisições de documento. Não houve retorno ao login nem erro de página. Menu recolhido/expandido preservou a escolha.

Em 1366×768, 22 destinos do menu PCP e 17 destinos do menu Mapa abriram as telas correspondentes, sem diferenças. A sessão com cache aquecido manteve o acesso, e um endereço direto antigo do Mapa chegou à tela correta na casca. Backup de ambos os bancos foi criado e a restauração testada antes da publicação (`20261006T011848Z`); a versão anterior ficou em `/opt/concrefer-unificado/releases/0.6.18-before-0.6.19-navigation`.
