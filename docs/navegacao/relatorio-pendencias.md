# ConsolidaÃ§Ã£o das pendÃªncias â€” 25/10/2026

## Escopo e seguranÃ§a

- Nenhum deploy, reinÃ­cio de serviÃ§o ou alteraÃ§Ã£o de produÃ§Ã£o foi feito nesta tarefa. A VPS foi lida para comparaÃ§Ã£o de hashes e estrutura.
- Backup externo compactado e verificado: `C:\Users\Admin\Documents\pwa-hub-fase1-active-worktree-20261025T134247Z.tar.gz` (622.099.751 bytes; 16.824 arquivos do worktree ativo e bundle completo do histÃ³rico Git). A tentativa inicial de compactaÃ§Ã£o de cÃ³pias internas de worktrees foi interrompida; o backup direcionado foi concluÃ­do e lido para conferir a contagem de membros.
- O `dosagem-concreto-v2/.env.production` saiu do Ã­ndice nas duas Ã¡rvores, continuou no disco local e estÃ¡ ignorado. `dosagem-concreto-v2/.env.example` contÃ©m apenas as chaves, sem valores. `.gitignore` passou a ignorar caches, builds, capturas e worktrees temporÃ¡rios.
- ClassificaÃ§Ã£o de 5899 pendÃªncias: **A 156**, **B 1283**, **C 4460**. Detalhes arquivo a arquivo em [classificacao-pendencias.md](classificacao-pendencias.md). Os C permanecem no backup e na Ã¡rvore principal.
- Detector de segredos: **292 alertas potenciais** em 5899 caminhos; distribuiÃ§Ã£o por tipo: URL com usuÃ¡rio e senha 13, chave/credencial 9, segredo 13, senha 200, token 57. SaÃ­da sanitizada com caminho/linha/tipo em [segredos-pendencias.md](segredos-pendencias.md). Nenhum valor foi incluÃ­do nos relatÃ³rios.

### Arquivos retidos por seguranÃ§a

Os 8 arquivos abaixo sÃ£o B e nÃ£o foram enviados a branch WIP. Continuam intactos na Ã¡rvore original e no backup, pois podem conter credenciais ou sÃ£o arquivos de ambiente. Esta exceÃ§Ã£o segue a proibiÃ§Ã£o de incluir segredos em commits.

| Caminho | Motivo |
|---|---|
| `dosagem-concreto-v2/.env.production` | arquivo de ambiente/chave |
| `unificado/pcp/backend/app/core/config.py` | credencial local embutida no histÃ³rico |
| `concrejet/legacy-reference/erp-concretrack/README.md` | possÃ­vel segredo em URL/chave |
| `docs/dosagem-v2/PROJETO-COMPLETO-CODIGO-HTML-20261021.md` | possÃ­veis literais de credencial em dump de cÃ³digo |
| `docs/porting/laboratorio/insumos/pacote/infra/insumos.env.exemplo` | possÃ­vel segredo em URL/chave |
| `docs/porting/usinas/execucao/API-LEGADA-TRACOS-CAMPINAS-20261022.md` | possÃ­vel segredo em URL/chave |
| `infra/ged/docker-compose.homolog.yml` | possÃ­vel segredo em URL/chave |
| `infra/ged/docker-compose.yml` | possÃ­vel segredo em URL/chave |

### Credenciais no histÃ³rico a revisar

- A versÃ£o histÃ³rica de `dosagem-concreto-v2/.env.production` contÃ©m URL pÃºblica e versÃ£o, sem usuÃ¡rio ou senha embutidos: **nenhuma credencial desse arquivo a trocar**. Ainda assim, o arquivo foi retirado do Git.
- `unificado/pcp/backend/app/core/config.py:7` contÃ©m um fallback local de banco com usuÃ¡rio/senha jÃ¡ presente no histÃ³rico Git. Remover o fallback e trocar essa senha se foi reutilizada; o arquivo ficou em B por seguranÃ§a e Ã© a Ãºnica diferenÃ§a direta remanescente no PCP.
- Exemplos `.env.example` histÃ³ricos contÃªm valores de `DATABASE_PASSWORD`, `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, `MASTER_TEMP_PASSWORD`, `SFTP_PASSWORD`, `PGPASSWORD` e uma `DATABASE_URL` com autenticaÃ§Ã£o. Conferir se algum valor foi usado fora de exemplo e trocar o correspondente. O detector descartou variÃ¡veis de duraÃ§Ã£o de token, que nÃ£o sÃ£o credenciais.
- A senha fixa em `db/*.py` do sistema antigo, jÃ¡ documentada anteriormente, continua pendente de troca fora desta branch.

## CÃ³digo publicado registrado na branch consolidada

Branch: `feat/unificado-consolidado-20261025`. Commits nesta tarefa:

| Commit | Frente / alteraÃ§Ã£o |
|---|---|
| `c0440872` | chore(security): stop tracking production env and ignore generated work |
| `7c6aa0fe` | feat(dosagem): registrar API nativa publicada |
| `03569b75` | feat(usinas): registrar reporting e serviÃƒÂ§os publicados |
| `ef1329fa` | feat(laboratorio): registrar serviÃƒÂ§o e telas publicadas |
| `bfea1e7b` | feat(pcp): registrar cÃƒÂ³digo publicado |
| `3592c35d` | feat(mapa): registrar API e painÃƒÂ©is publicados |
| `a700e398` | feat(shell): registrar recursos publicados |
| `5b7ebf60` | feat(maodeobra): registrar PWA publicado |
| `9580840f` | feat(relatorios): registrar telas publicadas |
| `4b55158b` | feat(pcp): registrar pÃƒÂ¡ginas jÃƒÂ¡ publicadas na VPS |
| `5594698c` | feat(usinas): registrar integraÃƒÂ§ÃƒÂ£o publicada no Mapa |
| `054adb4b` | feat(mapa): registrar pÃƒÂ¡gina de diagnÃƒÂ³stico publicada |
| `5b00bd34` | feat(pcp): registrar entrada publicada |
| `6dd82d99` | feat(laboratorio): registrar migraÃƒÂ§ÃƒÂµes instaladas |
| `ac0cc76d` | feat(pcp): registrar seis arquivos publicados restantes |

AlÃ©m das entradas A da Ã¡rvore principal, importei da VPS 18 pÃ¡ginas do PCP, seis arquivos adicionais do PCP, a integraÃ§Ã£o de Usinas no Mapa, a pÃ¡gina de diagnÃ³stico do Mapa, a entrada do PCP e duas migraÃ§Ãµes de LaboratÃ³rio. `app.py` e `screen_catalog.json` do Mapa receberam somente as versÃµes publicadas; as versÃµes locais divergentes ficaram em WIP. Os trÃªs arquivos systemd de Usinas tÃªm SHA-256 normalizado idÃªntico Ã s unidades instaladas; as 10 tabelas previstas em `004_reporting.sql` existem no esquema de produÃ§Ã£o.

## Trabalho em andamento publicado apenas no Git

As branches abaixo foram criadas a partir da base consolidada anterior Ã s importaÃ§Ãµes finais da VPS. Permanecem separadas, sem merge e sem deploy. Os caminhos de cada frente estÃ£o na tabela de classificaÃ§Ã£o (classe B).

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

Os candidatos B que nÃ£o produziram delta contra a base jÃ¡ tinham o mesmo conteÃºdo no Git. Os oito arquivos retidos por seguranÃ§a nÃ£o foram adicionados a nenhuma branch.

## VerificaÃ§Ã£o com a VPS

| Frente | Arquivos comparados e iguais | DiferenÃ§as |
|---|---:|---|
| Shell | 28 | zero |
| Mapa API e arquivos diretos | 34 | zero |
| Usinas | 15 | zero; systemd 3/3 |
| LaboratÃ³rio | 95 | zero |
| PCP | 108 | `unificado/pcp/backend/app/core/config.py` (B, retenÃ§Ã£o por credencial) |

ComparaÃ§Ã£o do build completo do Mapa: **31/33** arquivos iguais Ã  produÃ§Ã£o. `app.js` e `index.html` diferem por fontes B registradas em `wip/mapa-20261025`. Os arquivos de dados operacionais, runtimes Python e assets antigos com hash de build foram excluÃ­dos da comparaÃ§Ã£o de cÃ³digo; permanecem na VPS. Assim, todos os arquivos de cÃ³digo comparÃ¡veis da branch coincidem com a produÃ§Ã£o, exceto esses trÃªs itens B explicitamente listados. Um deploy integral ainda alteraria esses itens B, portanto **nenhum deploy foi executado**.

## Push

As 11 branches `wip/*-20261025` foram enviadas ao `origin`. A branch consolidada serÃ¡ enviada com este relatÃ³rio e a classificaÃ§Ã£o no commit final. `main` nÃ£o foi alterada.

