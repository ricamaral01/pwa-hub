# Relatório de execução — navegação do Unificado

Data: 25/10/2026. Branch atual: `feat/unificado-consolidado-20261025`. A navegação começou em `feat/navegacao-unidades`, a partir de `feat/laboratorio-certificado-producao` (`2fd2a461`). `main` não foi movida.

## Resultado

- **Produção publicada:** `https://concrefer.concretrack.com.br/unificado/`, versão `1.0.57`.
- **Homologação validada primeiro:** `https://concrefer.concretrack.com.br:18446/unificado/`, versão `1.0.57`.
- Correção prioritária do botão de atualização publicada separadamente em `1.0.49` antes da navegação. [Causa e correção](causa-botao-atualizacao.md).
- Produção agrupa Campinas (Produção, Montagem, Controle, Indicadores) e Pederneiras (itens diretos). Os outros módulos mantêm seus grupos. [Árvore completa](estrutura-menu.md).
- Celular: barra superior, chips do grupo atual, menu em tela cheia e barra inferior Início/Telas/Recentes/Conta. Tablet: trilho de 84 px e painel recolhível de 300 px. Desktop: seletor de módulo e menu recolhível. Busca global e estado da árvore por usuário/módulo.
- Links existentes Como funciona, Usuários e Relatar problema preservados conforme as permissões. PWAs dedicadas não foram alteradas.
- Ajuste visual de 25/10: os chevrons dos grupos, unidades e seletor de módulo agora são SVGs de traço que giram ao abrir/fechar. O botão de fechar usa X SVG de 22 px, conforme os mockups. Os caracteres tipográficos anteriores foram removidos desses controles.

## Verificação

| Evidência | Resultado |
|---|---|
| Playwright 390×844, 820×1180, 1180×820 e 1440×900 | 24 capturas antes, 20 em homologação e 24 após publicação; sem rolagem horizontal da página |
| Módulos | Planejamento, Produção, Qualidade, Usinas, Laboratório e GED verificados em produção nos quatro tamanhos |
| Homologação | Cinco módulos permitidos pelo IAM de homologação. Usinas e as telas de Pederneiras estavam sem concessão nessa base; a navegação as ocultou corretamente |
| Produção/Pederneiras | Duas unidades visíveis, item ativo e breadcrumb `Produção › Pederneiras › Produção Pederneiras` confirmados em celular |
| Interações | Abrir/fechar unidade e grupo, expandir/recolher tudo, busca em todos os módulos permitidos, navegar, Recentes, Escape/voltar, persistência do painel no tablet/desktop |
| Ícones e acessibilidade | SVG de 22 px no botão fechar; chevrons SVG com rotação ligada a `aria-expanded`; navegação por teclado e alvos de toque mantidos |
| Atualização do PWA | Estados em dia, disponível, atualizando e falhou simulados; duas falhas exibem limpeza de cache. Atualizações reais `1.0.49 → 1.0.54`, `1.0.54 → 1.0.55` e `1.0.55 → 1.0.56` concluídas pelo botão em produção |
| Deploy | `nginx -t`, saúde do Unificado/Mapa/PCP/Laboratório/Qualidade/GED, versão e assets, leitura por `www-data`, permissões sem escrita global: gate 7/7 em homologação e produção |

Capturas: [matriz antes](capturas/matrix-production-before.json), [homologação](capturas/matrix-homolog-after.json), [produção final](capturas/matrix-production-after.json). Exemplos: [desktop antes](capturas/desktop-production-before-producao.png), [desktop depois](capturas/desktop-production-after-producao.png), [celular antes](capturas/celular-production-before-producao.png), [celular depois](capturas/celular-production-after-producao.png), [Pederneiras](capturas/celular-production-after-pederneiras.png), [atualização real](capturas/desktop-atualizacao-sucesso-producao.png). As séries completas incluem os seis módulos e os quatro tamanhos.

O teste `tests/navegacao/nav_matrix.py` gerou as capturas e mediu a largura do documento. `nav_interactions.py` validou a navegação. `update_smoke.py` simulou os estados. `production_release.py` validou a atualização real do service worker e executou a matriz de produção com retorno automático se qualquer etapa pós-deploy falhasse.

## Publicação anterior e retorno (1.0.56)

O script `deploy/navigation_shell.sh` prepara backup dos arquivos e permissões, valida `VERSION` contra `APP_VERSION` e o cache do service worker, instala arquivos `root:root 0644`, executa o gate e restaura automaticamente se uma etapa falhar. `deploy/navigation_rollback.sh` fornece retorno para falhas detectadas pelo teste de navegador após o deploy. Nenhum arquivo foi instalado com modo 777 ou 666.

- Backup da homologação final: `/opt/concrefer-unificado/backups/navigation-homolog-20261025T123144Z`.
- Backup da produção final: `/opt/concrefer-unificado/backups/navigation-production-20261025T123407Z`.
- Produção verificada após o deploy: `VERSION=1.0.56`, página HTTP 200, arquivos do shell e da navegação com dono `root:root` e modo `644`.

## Arquivos alterados na navegação inicial

- `unificado/index.html`, `VERSION`, `sw.js`.
- `unificado/shell/shell.js`, `menu.config.js`, `router.js`, `navigation.js`, `navigation.css`, `modelo-a-loader.js`, `modelo-a/menu.js`, `modelo-a/menu.css`.
- `deploy/navigation_shell.sh`, `deploy/navigation_rollback.sh`.
- `tests/navegacao/` e `docs/navegacao/`.

Commit de implementação e evidências: `b0828187`. Push concluído em `origin/feat/navegacao-unidades` em 25/10/2026. Nenhum merge em `main` foi feito.

## Execução adicional de 25/10/2026 — versão 1.0.57

### 0. Concessão do Mapa

- Commit isolado `6cc6f70a`: seis linhas da concessão `labUsinasRelatorios` em `unificado/mapa/api/screen_access.py`. O arquivo ficou igual ao da produção após normalizar CRLF/LF; `py_compile` passou.
- As demais alterações da árvore principal ficaram intactas. O [inventário](alteracoes-nao-commitadas-raiz-20261025.txt) lista 737 entradas de `git status --short`, com diretórios não rastreados agrupados pelo Git.
- A conferência integral encontrou outras dependências publicadas na VPS e ausentes da branch: uma entrada em `screen_catalog.json`, duas linhas em `app.py` e `usinas_reporting.py`. Um deploy integral sobre o Mapa ainda seria regressivo; o pacote isolado do shell preservou o serviço. [Detalhes](consolidacao-branches.md).

### 1. Logo e botão superior

- O topo do menu usa `/unificado/assets/img/logo-concrefer.png` no desktop, tablet e celular. O trilho recolhido usa `/unificado/assets/img/logo-concretrack.png`, como no menu anterior.
- Desktop: chevron para recolher. Tablet e celular: X SVG de 22 px para fechar o painel.

### 2. Atualização permanente

- O botão **Atualizar** ocupa toda a largura e 44 px, aparece no rodapé, no trilho do tablet e em Conta no celular; a versão fica abaixo. A caixa antiga de estado foi removida.
- O clique consulta `/unificado/VERSION` sem cache. Uma versão nova usa o fluxo do service worker; sem versão nova, chama `registration.update()`, recarrega e avisa “Você já está na versão mais recente (X)”. A detecção automática deixa o botão e a faixa móvel laranja. Os estados Atualizando, Falhou e limpeza de cache após duas falhas permanecem.
- Atualização real em produção pelo botão: **1.0.56 → 1.0.57**. `VERSION`, `APP_VERSION` e a chave do cache do service worker são `1.0.57`.

### 3. Rodapé compacto

- Ajuda abre Como funciona e Relatar problema conforme as permissões existentes. Ajuda e Usuários ficam lado a lado; avatar, nome e Sair ocupam uma linha.
- Rodapé medido em 139 px no tablet e desktop e 106 px no celular. Com grupos abertos, aparecem 18 itens em 820×1180 e **10 itens inteiros** em 1180×820 e 1440×900 sem rolar o painel.

### 4. Testes, capturas e publicação

- Playwright em 390×844, 820×1180, 1180×820 e 1440×900 validou logo aberto/recolhido, Ajuda, Usuários oculto após remoção da permissão na resposta IAM, atualização com e sem versão nova, duas falhas e recuperação. Excesso de largura horizontal: zero. [Resultado em homologação](capturas/compact-acceptance-homolog-1.0.57.json) e [em produção](capturas/compact-acceptance-production-1.0.57.json).
- Capturas antes e depois: [desktop antes](capturas/desktop-before-1.0.57-producao.png) e [depois](capturas/desktop-homolog-compact-1.0.57.png); [celular antes](capturas/celular-before-1.0.57-producao.png) e [depois](capturas/celular-homolog-compact-1.0.57.png). As quatro resoluções e a matriz de 20 telas em homologação e 24 em produção estão em `capturas/`.
- Homologação primeiro, backup `/opt/concrefer-unificado/backups/navigation-homolog-20261025T125355Z`. Produção depois, backup `/opt/concrefer-unificado/backups/navigation-production-20261025T130140Z`. O procedimento validou `nginx -t`, leitura por `www-data`, arquivos `root:root 0644`, ausência de 777/666, versão e saúde de Unificado, Mapa, PCP, Laboratório, Qualidade e GED: gate **7/7** nos dois ambientes. O retorno automático restaura o backup se o deploy ou o teste posterior falhar.
- `node --check`, `py_compile`, `git diff --check`, `nav_interactions.py`, `update_smoke.py`, `compact_acceptance.py` e `nav_matrix.py` passaram. Código e capturas enviados a `origin/feat/unificado-consolidado-20261025`; `main` não foi alterada.

## Consolidação de branches após o ajuste SVG

Todas as 48 branches locais e 19 referências remotas foram reunidas em `feat/unificado-consolidado-20261025`; `git branch -a --no-merged HEAD` não apontou nenhuma. `main` permaneceu no commit atual. As atualizações ativas de acesso por unidade já estavam publicadas e foram comparadas com a produção. O ajuste de navegação permanece publicado na versão `1.0.56`, com gate 7/7 e backup. Os detalhes de conflitos, verificações e do conteúdo posterior presente no serviço do Mapa estão em [consolidacao-branches.md](consolidacao-branches.md).
