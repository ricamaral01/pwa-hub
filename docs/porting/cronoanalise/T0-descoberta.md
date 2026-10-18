# T0 · Descoberta e linha de base — 18/10/2026

## Estado

**Pausado antes de T1**, conforme `especificacao/PROMPT_CODEX.md` ("Pare e pergunte"): testes existentes já falhavam antes de qualquer alteração deste trabalho. Nenhuma migração, alteração de código de aplicação ou publicação foi feita. A VPS antiga `31.97.241.84` não foi acessada.

## Arquivos e caminhos reais

| Tema | Caminho / constatação |
| --- | --- |
| Casca, menu e rotas | `unificado/shell/menu.config.js`, `router.js`, `shell.js`, `auth.js`; PWA em `unificado/sw.js` |
| Laboratório | `unificado/laboratorio/service/server/app.py` (FastAPI próprio); `unificado/laboratorio/frontend/src/` (React/Vite); publicado sob `/unificado/laboratorio/` |
| Autenticação e autorização compartilhadas | `unificado/mapa/api/unified_auth.py`, `screen_access.py`, `screen_catalog.json`; caixas de usuários em `unificado/mapa/operacao/users-unificado.js` |
| Usuários | `public.usuarios.id` é `text` no banco do Mapa (`unificado/mapa/database/schema.sql`); o PCP também tem `usuarios`, mas ID `integer` (`unificado/pcp/backend/app/models/usuario.py`) |
| Permissões | `unificado_auth.user_screen_permissions` e `guest_action_permissions` (`unificado/mapa/database/user_lifecycle.sql`); ações de Qualidade em `unificado_auth.user_action_permissions` (`quality_permissions_20261015.sql`) |
| Unidades | Não há tabela única confirmada para todo o Unificado. A Qualidade tem `qualidade.unidade` com `codigo text`; a especificação presume `unidade_id smallint`, a validar antes de T1. |
| Auditoria | `unificado_auth.user_actions` registra ciclo de usuários; `public.mapa_operation_audit` registra operações do Mapa. Não foi encontrada tabela central genérica para toda escrita. |
| Alembic | `unificado/qualidade/migrations/alembic.ini` usa banco dedicado `qualidade`; seu `env.py` não é migração do Laboratório ou de banco compartilhado. |
| Deploy ativo do Unificado | Documentação existente indica `/opt/concrefer-unificado/public/unificado`, `concretrack-unificado.service` e serviços por módulo na VPS nova. `deploy/scripts/deploy.ps1` deste repositório é do projeto Dosagem e usa o alias `vps-antiga`, portanto não serve para esta publicação. |
| PWA | `unificado/sw.js` armazena a casca; o padrão PWA específico deve ser observado antes de incluir coleta offline. |

## Inventário da VPS nova, antes

Arquivo integral: [T0-inventario-antes.txt](T0-inventario-antes.txt). O script `especificacao/deploy/00_inventario.sh` foi executado por SSH somente leitura no alias `vps-staging` (`2.25.163.32`, host `srv1725681`), com fim de linha LF; saída `ssh_exit=0`.

Resumo observado: `concretrack-unificado.service` usa `/opt/concrefer-unificado/hub-api` na porta **8015**. O serviço na porta **18110** é `concretrack-staging-final-api.service`, cujo diretório é `/opt/concretrack-staging-final/current/backend`; a porta **18180** respondeu HTTP 200, e a 18110 respondeu HTTP 404 em `/`. Isso diverge da afirmação da especificação de que 18110/18180 são o Unificado de produção. O script não imprimiu revisão Alembic dos bancos `concretrack_*`; não há `alembic_version` visível nessa saída. É necessário mapear o banco correto e o processo de publicação real antes de T1/T6.

## Testes preexistentes, antes de editar

| Comando | Resultado |
| --- | --- |
| `npm test` na raiz | **Falhou: 63 passaram, 2 falharam** de 65. `tests/dashboard-contracts.test.js:96` compara arquivos do Mapa com divergência em `mapa-concretagem/sw.js`; `tests/mapa-promocao-producao.test.js:12` espera `CACHE_NAME` `v5.31`, mas o arquivo atual tem `v5.31-taxa5`. O repositório já tinha alterações não commitadas no Mapa e em vários módulos antes desta tarefa. |
| `npm test --prefix unificado/laboratorio/frontend` | **Falhou: 1 suíte falhou, 1 passou**. `src/domain/regras.test.ts` não carrega `../../../../ensaio de postes/docs/fixtures/fl-pro-22.json` (fixture ausente). A suíte `catalog-dimensions.test.ts` passou 3 testes. |

## Arquivos alterados nesta tarefa

- `docs/porting/cronoanalise/T0-descoberta.md` — este registro.
- `docs/porting/cronoanalise/T0-inventario-antes.txt` — saída do inventário somente leitura.

A pasta `especificacao/` já existia no destino pedido quando a tarefa começou. O primeiro turno terminou sem commit pela condição explícita de parada; após as decisões do Ricardo, T0 será commitado separadamente de T1.

## Decisões do Ricardo após T0

- As duas falhas do Mapa e a fixture ausente do Laboratório ficam como linha de base; não corrigir. O critério é não acrescentar falhas.
- Preservar todas as alterações não commitadas anteriores e excluí-las dos commits da Cronoanálise.
- Ignorar 18110/18180: são do `staging-final` antigo. O destino é o Unificado real em `/unificado/`, com router no serviço e frontend do Laboratório, sem serviço, porta ou NGINX novos.
- Usuários do `public.usuarios` têm ID `text`; como o banco de autenticação é separado do banco do Laboratório, referências a usuário na Cronoanálise serão `text` sem FK, validadas pela API. Usar `unidade_codigo text NOT NULL DEFAULT 'concrefer'`, auditoria própria, telas no `screen_catalog.json` e ações no catálogo de permissões compartilhado.
- Publicar primeiro em homologação e parar após T6a para aprovação explícita antes de produção.

## Confirmação adicional antes de T1

`laboratorio-homolog.service` usa `/opt/concrefer-unificado/homolog/laboratorio/service` e o banco `concretrack_postes_homolog`; `laboratorio-unificado.service` usa `/opt/concrefer-unificado/laboratorio/service` e o banco `concretrack_postes`. Ambos têm schema `ensaio_postes` e revisão `ensaio_postes.alembic_version = 0005_conicidade_circular`. O código versionado em `unificado/laboratorio/service` **não contém o diretório `migrations/`**, embora o modo isolado em `postes_db.py` mencione Alembic; o modo Unificado abre sessão SQLAlchemy sem executar migrações. Portanto, a migração da Cronoanálise será SQL versionado e idempotente, isolado no schema novo, com teste de aplicação e reversão em banco temporário. Não avançará a revisão Alembic de `ensaio_postes`.
