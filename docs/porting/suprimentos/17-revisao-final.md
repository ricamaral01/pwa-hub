# F7 — Revisão integrada, segurança e desempenho

## Escopo e resultado

Revisão do módulo Suprimentos em `:18446`, sem alteração de produção ou da VPS antiga. A unidade de teste é Campinas. A publicação final desta etapa usa a versão 1.0.90 da casca e do service worker.

## Regressão

| Verificação | Evidência |
|---|---|
| Serviço, E1/E2 e F1–F5 | 3 execuções consecutivas em banco descartável: `37 passed` em cada execução. |
| Casca, interface e PWA, E3–E5 | 3 execuções consecutivas: `8 passed` em cada uma. Duas expectativas antigas dos testes foram atualizadas para o catálogo e as rotas atuais; o produto não precisou de correção. |
| Cinco contas e telas preexistentes | 3 rodadas de sessão IAM assinada, comparadas com `e7-screen-access-final.json`: 5/5 contas sem perda ou acréscimo de telas preexistentes. [Rodada 1](capturas/f7/acessos-rodada-1.json), [2](capturas/f7/acessos-rodada-2.json), [3](capturas/f7/acessos-rodada-3.json). |
| Layout integrado | A primeira auditoria apontou 100 estados por interpretar abas com rolagem interna e rótulos com `text-overflow:ellipsis` como estouro. O auditor foi corrigido para verificar o `overflow-x` do próprio elemento, além dos ancestrais. As **três rodadas seguintes passaram 348/348 cada**, sem rolagem horizontal da página/iframe, erro de console ou recurso ausente. [Rodada 1](capturas/f7/rodada-1.json), [2](capturas/f7/rodada-2.json), [3](capturas/f7/rodada-3.json). |

## Segurança

- Auditoria estática de [114 rotas](capturas/f7/rotas.json): 110 usam identidade IAM; as quatro exceções são `health` sem dados de negócio, leitura de flags restrita ao gateway local e duas rotas de serviço com assertion assinada do Laboratório e flag S4. As funções de negócio aplicam unidade, papel, CC e flag conforme o recurso. Os pedidos e suas listas filtram todos os itens pelos CCs do ator; os indicadores filtram os CCs antes das consultas.
- Anexos: armazenamento privado fora de `public`, modo `0700`, dono `concrefer-suprimentos`; os arquivos são retornados por rota autenticada com verificação de escopo e `Cache-Control: private, no-store`. Requisição anônima de NF: HTTP 401; tentativa de URL sob `public/unificado/suprimentos/uploads`: HTTP 403.
- O cadastro de colaborador guarda somente nome, matrícula, setor, unidade e situação necessários à ficha de EPI. Jobs registram contagens/status, sem nome de colaborador no log.
- A [varredura do Suprimentos](capturas/f7/segredos.json) não encontrou credenciais no módulo. A [varredura ampliada do repositório](capturas/f7/segredos-repositorio.json) leu 1.125 arquivos e marcou cinco padrões de DSN: dois são interpolação dinâmica em scripts, e três são exemplos ou defaults locais que exigem revisão antes de uma publicação integral. Separadamente, há duas atribuições em `dosagem-concreto-v2/.env.production` no **HEAD preexistente** de outra frente. Os valores não são exibidos aqui. A remoção do `.env.production` do histórico/índice e a troca das credenciais são pendências separadas antes de um deploy integral. A exclusão já preparada na árvore de trabalho não integra o commit F7.

## Desempenho e recuperação

- [EXPLAIN ANALYZE](capturas/f7/explain.json) no banco de homologação: listas de solicitações e pedidos, saldo, consumo e prazo ficaram entre 0,030 e 0,072 ms nessa amostra pequena; existem 17 índices `ix_sup_*`. Estes números não projetam desempenho de produção. A F5 mediu 50 mil movimentos em 0,310 s no cenário de carga documentado em `15-analises.md`.
- Dump da homologação restaurado em banco novo descartável: `F7_RESTORE_OK|sup_0012|1|60|4|8` (revisão, unidades, solicitações, pedidos, flags). O banco de restauração foi removido ao fim; a base ativa não foi alterada.

## Publicação em homologação

Versão **1.0.90** publicada apenas em `:18446`. O procedimento criou dump, arquivos compactados e snapshot de permissões em `backups/suprimentos-f7-review-20261026T041740Z` (arquivos 0600/root), passou em `nginx -t` e smoke **43/43**. O retorno foi executado com sucesso (`F7_ROLLBACK_OK`); a versão 1.0.90 foi reinstalada a partir de `backups/suprimentos-f7-review-reinstall-20261026T041804Z`, com novo smoke **43/43**, serviço ativo e `/unificado/VERSION=1.0.90`. O script também aciona retorno automático em erro de publicação. Os avisos preexistentes de server name do nginx não impediram o teste de sintaxe.

## Arquivos desta etapa

`00-plano-suprimentos.md`, `progresso.md`, este relatório, os scripts `f7-review-stage.py`, `f7-restore-homolog.sh`, `f7-security-homolog.py`, `f7-review-homolog.sh`, os verificadores `check_f7_*`, as expectativas de `test_e3_gateway.py` e `test_e4_ui.py` e os JSON de evidência em `capturas/f7/`.
