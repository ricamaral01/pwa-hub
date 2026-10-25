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
- A árvore consolidada não altera `unificado/shell/`, `unificado/index.html` ou `unificado/sw.js` em relação ao pacote de navegação publicado.
- Os arquivos de cadastro por unidade (`users-unificado.js`, `.css`, tela PCP, roteador da produção e service worker do Mapa) foram comparados com a produção. O conteúdo é igual após normalizar CRLF/LF. Essas atualizações já tinham sido instaladas em produção.
- A produção respondeu HTTP 200 em `/unificado/` e `/unificado/mapa/api/health`, com `VERSION=1.0.56`. A publicação e o gate 7/7 do ajuste SVG, com backup e retorno automático, constam no [relatório de execução](relatorio-execucao.md).

## Limite do deploy

A consolidação de histórico não gera um novo pacote de produção: o ajuste SVG e os arquivos ativos de acesso por unidade já estão publicados. Os arquivos antigos de branches arquivadas não foram reinstalados. O serviço do Mapa contém uma concessão posterior para `labUsinasRelatorios` que ainda está na árvore de trabalho não commitada; uma publicação integral desta branch sobre o serviço seria regressiva. Por isso, o deploy desta execução foi o pacote de navegação `1.0.56`, já validado em homologação e produção. A integração ficará disponível no remoto sem sobrescrever essa concessão.
