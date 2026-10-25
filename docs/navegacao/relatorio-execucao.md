# Relatório de execução — navegação do Unificado

Data: 25/10/2026. Branch: `feat/navegacao-unidades`, criada a partir de `feat/laboratorio-certificado-producao` (`2fd2a461`), sem merge em `main`.

## Resultado

- **Produção publicada:** `https://concrefer.concretrack.com.br/unificado/`, versão `1.0.56`.
- **Homologação validada primeiro:** `https://concrefer.concretrack.com.br:18446/unificado/`, versão `1.0.56`.
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

## Publicação e retorno

O script `deploy/navigation_shell.sh` prepara backup dos arquivos e permissões, valida `VERSION` contra `APP_VERSION` e o cache do service worker, instala arquivos `root:root 0644`, executa o gate e restaura automaticamente se uma etapa falhar. `deploy/navigation_rollback.sh` fornece retorno para falhas detectadas pelo teste de navegador após o deploy. Nenhum arquivo foi instalado com modo 777 ou 666.

- Backup da homologação final: `/opt/concrefer-unificado/backups/navigation-homolog-20261025T123144Z`.
- Backup da produção final: `/opt/concrefer-unificado/backups/navigation-production-20261025T123407Z`.
- Produção verificada após o deploy: `VERSION=1.0.56`, página HTTP 200, arquivos do shell e da navegação com dono `root:root` e modo `644`.

## Arquivos alterados

- `unificado/index.html`, `VERSION`, `sw.js`.
- `unificado/shell/shell.js`, `menu.config.js`, `router.js`, `navigation.js`, `navigation.css`, `modelo-a-loader.js`, `modelo-a/menu.js`, `modelo-a/menu.css`.
- `deploy/navigation_shell.sh`, `deploy/navigation_rollback.sh`.
- `tests/navegacao/` e `docs/navegacao/`.

Commit de implementação e evidências: `b0828187`. Push concluído em `origin/feat/navegacao-unidades` em 25/10/2026. Nenhum merge em `main` foi feito.
