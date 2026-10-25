# Consolidação de branches após o ajuste SVG

Data: 25/10/2026. Branch de integração: `feat/unificado-consolidado-20261025`.

## Resultado

- Todas as 48 branches locais e as 19 referências remotas de `origin` são ancestrais da branch de integração. `git branch -a --no-merged HEAD` não retornou nenhuma referência.
- A branch incorpora `origin/main`, `feat/sistema-unificado`, `codex/user-units-pederneiras-20261024` e o commit `9dfc9098` dos ícones SVG.
- `main` não foi movida. A árvore principal de trabalho contém alterações ainda não commitadas de outras tarefas; elas não foram descartadas nem incluídas nesta consolidação.
- Branches históricas do laboratório, etiquetas, Concrejet e três correções do Controle Estatístico tiveram o histórico incorporado mantendo o conteúdo posterior já existente. Isso evita restaurar versões antigas desses módulos.

## Resoluções e verificação

- No merge de `main`, 18 conflitos em arquivos com alterações mais recentes na navegação e em produção foram resolvidos mantendo a versão recente. Os demais arquivos de `main` entraram automaticamente.
- No merge de acesso por unidade, `VERSION` permaneceu `1.0.56` e a regra mais recente de acesso a certificados do laboratório foi preservada. `screen_access.py` e `producao_unidade.py` passaram na compilação Python; `git diff --check` passou.
- A consolidação inicial preservou o shell publicado na 1.0.56; a execução seguinte atualizou o shell para a 1.0.57.
- Os arquivos de cadastro por unidade (`users-unificado.js`, `.css`, tela PCP, roteador da produção e service worker do Mapa) foram comparados com a produção. O conteúdo é igual após normalizar CRLF/LF. Essas atualizações já tinham sido instaladas em produção.
- A produção respondeu HTTP 200 em `/unificado/` e `/unificado/mapa/api/health`, com `VERSION=1.0.56`. A publicação e o gate 7/7 do ajuste SVG, com backup e retorno automático, constam no [relatório de execução](relatorio-execucao.md).

## Concessão publicada e limite do deploy integral

- O commit `6cc6f70a` trouxe somente os seis trechos de `labUsinasRelatorios` em `unificado/mapa/api/screen_access.py`. O arquivo ficou igual ao da produção após normalizar CRLF/LF; passou em `py_compile`.
- A conferência integral mostrou outras dependências publicadas na VPS e ainda não commitadas na árvore principal: uma entrada em `screen_catalog.json`, duas linhas de registro em `app.py` e o módulo `usinas_reporting.py`. Elas não foram incluídas, conforme a instrução de preservar as demais alterações sem commit.
- **Resultado da conferência:** um deploy integral desta branch sobre o serviço do Mapa ainda seria regressivo. O deploy realizado nesta execução foi estritamente o pacote do shell do Unificado; o Mapa instalado foi preservado.
- A árvore principal permaneceu intocada. O [inventário completo das alterações pendentes](alteracoes-nao-commitadas-raiz-20261025.txt) registra 737 entradas, com diretórios não rastreados agrupados pelo Git.

## Publicação da navegação 1.0.57

A branch consolidada contém o novo logo, atualização sempre visível e rodapé compacto. Homologação em `:18446` e produção passaram pelo gate 7/7. Backup final de produção: `/opt/concrefer-unificado/backups/navigation-production-20261025T130140Z`. O service worker atualizou de 1.0.56 para 1.0.57, e os testes de quatro viewports passaram. `main` não foi movida. Detalhes no [relatório de execução](relatorio-execucao.md).
