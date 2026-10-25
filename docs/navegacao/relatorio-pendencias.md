# Consolidação das pendências — 25/10/2026

## Escopo e segurança

- Nenhum deploy, reinício de serviço ou alteração de produção foi feito nesta tarefa. A VPS foi lida para comparação de hashes e estrutura.
- Backup externo compactado e verificado: `C:\Users\Admin\Documents\pwa-hub-fase1-active-worktree-20261025T134247Z.tar.gz` (622.099.751 bytes; 16.824 arquivos do worktree ativo e bundle completo do histórico Git). A tentativa inicial de compactação de cópias internas de worktrees foi interrompida; o backup direcionado foi concluído e lido para conferir a contagem de membros.
- O `dosagem-concreto-v2/.env.production` saiu do índice nas duas árvores, continuou no disco local e está ignorado. `dosagem-concreto-v2/.env.example` contém apenas as chaves, sem valores. `.gitignore` passou a ignorar caches, builds, capturas e worktrees temporários.
- Classificação de 5899 pendências: **A 156**, **B 1283**, **C 4460**. Detalhes arquivo a arquivo em [classificacao-pendencias.md](classificacao-pendencias.md). Os C permanecem no backup e na árvore principal.
- Detector de segredos: **292 alertas potenciais** em 5899 caminhos; distribuição por tipo: URL com usuário e senha 13, chave/credencial 9, segredo 13, senha 200, token 57. Saída sanitizada com caminho/linha/tipo em [segredos-pendencias.md](segredos-pendencias.md). Nenhum valor foi incluído nos relatórios.

### Arquivos retidos por segurança

Os 8 arquivos abaixo são B e não foram enviados a branch WIP. Continuam intactos na árvore original e no backup, pois podem conter credenciais ou são arquivos de ambiente. Esta exceção segue a proibição de incluir segredos em commits.

| Caminho | Motivo |
|---|---|
| `dosagem-concreto-v2/.env.production` | arquivo de ambiente/chave |
| `unificado/pcp/backend/app/core/config.py` | credencial local embutida no histórico |
| `concrejet/legacy-reference/erp-concretrack/README.md` | possível segredo em URL/chave |
| `docs/dosagem-v2/PROJETO-COMPLETO-CODIGO-HTML-20261021.md` | possíveis literais de credencial em dump de código |
| `docs/porting/laboratorio/insumos/pacote/infra/insumos.env.exemplo` | possível segredo em URL/chave |
| `docs/porting/usinas/execucao/API-LEGADA-TRACOS-CAMPINAS-20261022.md` | possível segredo em URL/chave |
| `infra/ged/docker-compose.homolog.yml` | possível segredo em URL/chave |
| `infra/ged/docker-compose.yml` | possível segredo em URL/chave |

### Credenciais no histórico a revisar

- A versão histórica de `dosagem-concreto-v2/.env.production` contém URL pública e versão, sem usuário ou senha embutidos: **nenhuma credencial desse arquivo a trocar**. Ainda assim, o arquivo foi retirado do Git.
- `unificado/pcp/backend/app/core/config.py:7` contém um fallback local de banco com usuário/senha já presente no histórico Git. Remover o fallback e trocar essa senha se foi reutilizada; o arquivo ficou em B por segurança e é a única diferença direta remanescente no PCP.
- Exemplos `.env.example` históricos contêm valores de `DATABASE_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, `MASTER_TEMP_PASSWORD`, `SFTP_PASSWORD`, `PGPASSWORD` e uma `DATABASE_URL` com autenticação. Conferir se algum valor foi usado fora de exemplo e trocar o correspondente. O detector descartou variáveis de duração de token, que não são credenciais.
- A senha fixa em `db/*.py` do sistema antigo, já documentada anteriormente, continua pendente de troca fora desta branch.

## Código publicado registrado na branch consolidada

Branch: `feat/unificado-consolidado-20261025`. Commits nesta tarefa:

| Commit | Frente / alteração |
|---|---|
| `c0440872` | chore(security): stop tracking production env and ignore generated work |
| `7c6aa0fe` | feat(dosagem): registrar API nativa publicada |
| `03569b75` | feat(usinas): registrar reporting e serviÃ§os publicados |
| `ef1329fa` | feat(laboratorio): registrar serviÃ§o e telas publicadas |
| `bfea1e7b` | feat(pcp): registrar cÃ³digo publicado |
| `3592c35d` | feat(mapa): registrar API e painÃ©is publicados |
| `a700e398` | feat(shell): registrar recursos publicados |
| `5b7ebf60` | feat(maodeobra): registrar PWA publicado |
| `9580840f` | feat(relatorios): registrar telas publicadas |
| `4b55158b` | feat(pcp): registrar pÃ¡ginas jÃ¡ publicadas na VPS |
| `5594698c` | feat(usinas): registrar integraÃ§Ã£o publicada no Mapa |
| `054adb4b` | feat(mapa): registrar pÃ¡gina de diagnÃ³stico publicada |
| `5b00bd34` | feat(pcp): registrar entrada publicada |
| `6dd82d99` | feat(laboratorio): registrar migraÃ§Ãµes instaladas |
| `ac0cc76d` | feat(pcp): registrar seis arquivos publicados restantes |

Além das entradas A da árvore principal, importei da VPS 18 páginas do PCP, seis arquivos adicionais do PCP, a integração de Usinas no Mapa, a página de diagnóstico do Mapa, a entrada do PCP e duas migrações de Laboratório. `app.py` e `screen_catalog.json` do Mapa receberam somente as versões publicadas; as versões locais divergentes ficaram em WIP. Os três arquivos systemd de Usinas têm SHA-256 normalizado idêntico às unidades instaladas; as 10 tabelas previstas em `004_reporting.sql` existem no esquema de produção.

## Trabalho em andamento publicado apenas no Git

As branches abaixo foram criadas a partir da base consolidada anterior às importações finais da VPS. Permanecem separadas, sem merge e sem deploy. Os caminhos de cada frente estão na tabela de classificação (classe B).

| Frente | Branch | Commit | Candidatos B seguros | Arquivos alterados no commit |
|---|---|---|---:|---:|
| dosagem-v2 | `wip/dosagem-v2-20261025` | `fc37e851` | 222 | 220 |
| usinas | `wip/usinas-20261025` | `48a3412e` | 91 | 90 |
| laboratorio | `wip/laboratorio-20261025` | `68c7d0af` | 88 | 87 |
| pcp | `wip/pcp-20261025` | `d6458ba0` | 151 | 146 |
| mapa | `wip/mapa-20261025` | `30934172` | 40 | 40 |
| shell | `wip/shell-20261025` | `6aaa3dce` | 29 | 11 |
| ged | `wip/ged-20261025` | `c7a95aab` | 230 | 230 |
| qualidade | `wip/qualidade-20261025` | `5164c225` | 91 | 80 |
| documentacao | `wip/documentacao-20261025` | `3b65b9ae` | 108 | 88 |
| deploy | `wip/deploy-20261025` | `d0b3eabd` | 83 | 81 |
| geral | `wip/geral-20261025` | `9d24458a` | 142 | 139 |

Os candidatos B que não produziram delta contra a base já tinham o mesmo conteúdo no Git. Os oito arquivos retidos por segurança não foram adicionados a nenhuma branch.

## Verificação com a VPS

| Frente | Arquivos comparados e iguais | Diferenças |
|---|---:|---|
| Shell | 28 | zero |
| Mapa API e arquivos diretos | 34 | zero |
| Usinas | 15 | zero; systemd 3/3 |
| Laboratório | 95 | zero |
| PCP | 108 | `unificado/pcp/backend/app/core/config.py` (B, retenção por credencial) |

Comparação do build completo do Mapa: **31/33** arquivos iguais à produção. `app.js` e `index.html` diferem por fontes B registradas em `wip/mapa-20261025`. Os arquivos de dados operacionais, runtimes Python e assets antigos com hash de build foram excluídos da comparação de código; permanecem na VPS. Assim, todos os arquivos de código comparáveis da branch coincidem com a produção, exceto esses três itens B explicitamente listados. Um deploy integral ainda alteraria esses itens B, portanto **nenhum deploy foi executado**.

## Push

As 11 branches `wip/*-20261025` e a branch `feat/unificado-consolidado-20261025` foram enviadas ao `origin`. Os 12 refs remotos foram comparados com os locais; todos coincidem. `main` não foi alterada.
