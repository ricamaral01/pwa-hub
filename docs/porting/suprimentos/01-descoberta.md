# Suprimentos S0.1 — descoberta do Unificado

**Data:** 25/10/2026. **Base lida integralmente:** `docs/porting/suprimentos/00-plano-suprimentos.md` (v2, cópia local ainda não commitada). **Método:** inspeção somente leitura dos arquivos desta árvore; não houve consulta ao catálogo vivo da VPS, alteração de código, migração ou deploy. As conclusões abaixo descrevem o que o repositório comprova, não presumem que toda configuração esteja instalada em produção.

**Fronteira adotada:** Suprimentos nasce em Campinas para solicitação, alçadas, compras, fornecedores, recebimento e almoxarifado geral. O estoque dos insumos da usina pertence ao Laboratório. Nenhuma tabela, proxy ou rotina do ERP antigo faz parte deste módulo.

## 1. Estrutura dos módulos e montagem na casca

**Mão de Obra não é um serviço isolado:** é uma tela do Planejamento/PCP. A API FastAPI concentra as rotas em `unificado/pcp/backend/app/api/routers/pcp.py` (por exemplo, `@router.post("/maodeobra/grupo")`), modelos SQLAlchemy em `.../app/models/producao.py`, schemas de entrada/saída em `.../app/schemas/producao.py`, regras auxiliares em `.../app/services/` e conexão em `.../app/core/database.py`. `unificado/pcp/backend/app/main.py` faz `app.include_router(pcp.router)`. Há migrations Alembic em `unificado/pcp/backend/alembic/versions/` (revisões `20261023_01` e `_02`) e scripts SQL anteriores em `unificado/pcp/backend/migrations/`. O próprio `main.py` ainda contém `Base.metadata.create_all(bind=engine)`; para Suprimentos, a mudança de schema deve ser controlada por Alembic, sem depender desse `create_all`.

No frontend, a tela web está em `unificado/pcp/maodeobra/index.html`, com código compartilhado em `unificado/pcp/static/js/app.js`, `maodeobra-grupos.js` e CSS em `unificado/pcp/static/css/app.css`. A experiência móvel dedicada usa `unificado/m/maodeobra/index.html`, `entry.js`, `entry.css`, `sw.js` e `manifest.webmanifest`, além de `unificado/pcp/static/js/maodeobra-mobile.js`, `maodeobra-core.js` e `unificado/pcp/static/css/maodeobra-mobile.css`.

**GED é um serviço separado:** Express/Node em `infra/ged/app/backend/server.js`, rotas em `.../src/routes/` (`documentRoutes.js`, `rncRoutes.js`, `unifiedRoutes.js`), controladores em `.../src/controllers/`, serviços em `.../src/services/` e SQL versionado em `.../src/db/migrations.sql` e `.../src/db/migrations/`. Não usa modelos SQLAlchemy nem Alembic. Exemplo de montagem: `app.use('/api/documents', documentRoutes)`. O frontend é Next.js em `infra/ged/app/frontend/src/app/(app)/` (dashboard, documents, approvals, tasks, calibrations), componentes em `.../src/components/` e estilos em `.../src/app/globals.css` e Tailwind. `infra/ged/nginx-ged-unificado.conf` publica `/unificado/ged/` e sua API. `unificado/shell/router.js` faz primeiro `fetch(root + 'ged/api/auth/unified-session', {credentials:'same-origin'})` e depois abre `ged/<rota>?embed=1` em iframe.

**Casca:** `unificado/index.html` carrega `unificado/shell/menu.config.js`, `shell.js`, `router.js`, `module-pages.js` e `modelo-a-loader.js`. `MENU_CONFIG` define os destinos; `MENU_ITEMS` os achata. `router.js` resolve `?view=...`, espera `window.UnificadoScreenAccess.ready`, checa módulo/tela e monta a página no host, normalmente por iframe. `unificado/sidebar-modelo-a/src/main.tsx` filtra módulos/itens a partir do snapshot da casca e renderiza `Sidebar.tsx`; o bundle servido é `unificado/shell/modelo-a/menu.js`. Assim, registrar Suprimentos requer atualizar **configuração da casca, catálogo de acesso, fonte do menu A e bundle**, além de criar frontend/API. Alterar só o bundle ou só o `navConfig.ts` deixaria as superfícies divergentes.

## 2. Menu lateral modelo A: registro, cor, ordem e subitens

`unificado/sidebar-modelo-a/src/components/sidebar/navConfig.ts` declara `MODULE_COLORS` e o array ordenado `NAV_MODULES`. A ordem é a ordem do array: Planejamento, Produção, Qualidade, Laboratório, Usinas, GED. Cada objeto traz `id`, `label`, `color`, `icon` e `sections`; cada `section(...)` traz título e itens `[id, label, route, icon]`. Trecho: `const view = (route: string) => '/unificado/?view=' + encodeURIComponent(route)`. O menu usa `style={{ '--mod': mod.color }}` em `Sidebar.tsx`, e `sidebar.css` usa `var(--mod)` para o marcador do módulo ativo. Para Suprimentos: `MODULE_COLORS.suprimentos = '#2DD4BF'`; inserir seu objeto após GED, com Painel, Solicitações, Cotações e pedidos, Recebimento, Almoxarifado, Inventário, Fornecedores, Cadastros e alçadas.

Há um **segundo registro** em `unificado/shell/menu.config.js`: `MENU_CONFIG` gera `MENU_ITEMS` e as URLs. A casca usa essa lista para navegação e filtro. O fallback do menu compartilhado está em `unificado/shell/shell.js` e `unificado/shell/shared-menu.css` (por exemplo `.shared-module-dot` e cores por `data-short`). A cor teal precisa aparecer também nesse fallback; o CSS atual fixa cores de alguns módulos. `unificado/shell/modelo-a-loader.js` importa o bundle de `modelo-a/menu.js`, que precisa ser recompilado da fonte.

## 3. Permissões, caixas de marcar e novos papéis

O catálogo servido pelo backend é `unificado/mapa/api/screen_catalog.json`, carregado em `unificado/mapa/api/screen_access.py` como `CATALOG`/`BY_ID`. `role_allows(...)` aplica o teto do perfil; `allowed_screens(...)` combina esse teto com exceções guardadas em `unificado_auth.user_screen_permissions`. A tela `unificado/mapa/operacao/users-unificado.js` cria checkboxes por módulo: `input.type = 'checkbox'; input.value = screen.id; input.disabled = !screen.profile_allowed`. Ela também oferece marcar todas/limpar, presets para Qualidade e caixas de ações. O salvamento passa por `PUT /unified/users/<user_id>/screens` em `unificado/mapa/api/app.py`, que valida IDs contra `SCREENS_BY_ID` e rejeita concessões fora do perfil. `unificado/shell/shell.js` lê `/unified/screen-access/me`, monta `grantedScreens` e só exibe itens concedidos; isso é filtro visual, não substitui checagem de API.

Exemplo de checagem de backend atual: `unificado/pcp/backend/app/api/routers/pcp.py` usa `usuario: Usuario = Depends(require_roles(*_ESCRITA_PROD))`; em Qualidade, `unificado/qualidade/service/quality/api.py` usa `user: Actor = Depends(require("qualidade.nc.abrir"))`, definido em `.../quality/auth.py`. O gateway do Mapa usa `screen_access_state(...)` e `screen_data_allowed(...)` em `unificado/mapa/api/app.py` para vincular dados à tela permitida. Suprimentos precisará de **ambos**: concessão de tela na casca e autorização de ação/unidade/centro de custo no seu serviço em toda rota, inclusive PWA e arquivos.

Os papéis propostos no plano (Solicitante, Aprovador por nível, Almoxarife, Comprador, Qualidade, Admin Suprimentos) **não existem** nos perfis atuais do Mapa (`GERENCIA`, `GESTOR`, `MONTADOR`, `APONTADOR`, `CONVIDADO`) nem nos níveis PCP (`ADMIN`, `PCP`, `PRODUCAO`, `CONSULTA`). Proposta para a fase seguinte: criar papéis e concessões específicos de Suprimentos, associados ao ID de usuário IAM, `unidade_id` e, quando necessário, centro de custo; definir matriz `papel × ação`, sem converter esses papéis em perfis globais existentes. Acrescentar as telas ao catálogo/checkboxes e testes de negação no backend. A alçada monetária fica em `sup_alcada`, separada da permissão genérica de “aprovar”.

## 4. Sessão e autenticação no backend e no PWA

`unificado/mapa/api/app.py` é o ponto de sessão principal: `COOKIE_NAME = "mapa_unificado_session"`, `COOKIE_PATH = "/unificado/"`, `SESSION_SECONDS = 36 * 60 * 60`. `session_response(...)` assina `scope`, `id` e `updated_at` com `itsdangerous` e emite cookie `HttpOnly`, `Secure`, `SameSite=Lax`. `authenticated_user()` verifica assinatura/idade, usuário ativo e compara o `updated_at` da conta com o claim; troca de senha ou desativação invalida a sessão. `GET /me` renova o cookie ao usar o sistema; `GET /unified/screen-access/me` também emite cookie renovado. A validação de rota protegida pelo nginx aparece em `/unified/screen-authorize`, que cruza URI, tela e permissões.

O PWA de Mão de Obra reaproveita login do Unificado: `unificado/m/maodeobra/login.html` carrega `unificado/shell/auth.js`; `entry.js` chama `window.unificadoRecoverPcpSession()`. `unificado/pcp/unificado-bridge.js` chama `/unificado/mapa/api/unified/pcp-session`, refaz a requisição após `401` e guarda `pcp_token`/`pcp_user` em `localStorage`. Há cookie de renovação do PCP com `PCP_REFRESH_SECONDS = 30 * 24 * 60 * 60`, limitado ao caminho `/unificado/mapa/api/unified/pcp-session` (`app.py`); **isso não é um cookie longo geral para qualquer novo PWA**. O desenho do plano cita ADR-014, mas nenhum arquivo desse ADR foi localizado nesta árvore. Antes de implementar, definir mecanismo de renovação próprio de Suprimentos no IAM, com sessão revogável, sem copiar o token PCP para o novo módulo.

## 5. PWA de Mão de Obra e replicação proposta

`unificado/m/maodeobra/manifest.webmanifest` usa `id`, `start_url` e `scope` exclusivos em `/unificado/m/maodeobra/`, `display: standalone`, ícones 192/512/maskable. `index.html` inclui `apple-touch-icon` e metadados Apple. `entry.js` registra `sw.js` com `{scope: dedicated}` e usa `beforeinstallprompt` no Android; a tela instrui instalar pelo menu do navegador. No iPhone, instrui Safari → Compartilhar → Adicionar à Tela de Início. `sw.js` guarda apenas a shell/arquivos estáticos em cache versionado (`maodeobra-shell-...`), ignora requisições que não sejam GET da lista permitida e não coloca respostas da API em cache.

**Limite encontrado:** `unificado/pcp/static/js/maodeobra-mobile.js` salva apenas o rascunho de um dia/grupo em `localStorage` (`maodeobra-draft-v1:...`); em falha de envio mantém `pendingPayload` em memória e oferece retry após consulta ao servidor. Não há IndexedDB nem fila persistente de solicitações a copiar. Para `/unificado/suprimentos/pwa/`, criar `index.html`, `login.html` dentro do escopo se necessário, `manifest.webmanifest`, `sw.js`, `entry.js`, estilos e ícones próprios. Manter o SW restrito à shell; guardar catálogo, “minhas solicitações” e fila em IndexedDB por usuário/unidade; criar `client_uuid` antes de enfileirar e só retirar após confirmação idempotente do servidor. A sessão expirada deve interromper a sincronização e preservar a fila até novo login. Foto comprimida, QR e teste em aparelhos reais são novos trabalhos de S1.3, não recursos existentes do PWA referência.

## 6. Banco, migrations, unidades, setores, centros de custo e IDs

Há **bancos/padrões separados**. PCP usa `settings.DATABASE_URL` e SQLAlchemy em `unificado/pcp/backend/app/core/database.py`; `unificado/pcp/backend/alembic/env.py` exige `DATABASE_URL` e executa DDL transacional. A revisão `20261023_01_producao_unidade_expand.py` cria `producao.unidade(id smallint, codigo, nome, ativo)` com Campinas `id=1` e Pederneiras `id=2`, e tabelas de produção com `bigint GENERATED BY DEFAULT AS IDENTITY` e `unidade_id`. A revisão `20261023_02_producao_acesso.py` cria `producao.usuario_unidade(usuario_id integer, unidade_id smallint, papel)`. `app/models/usuario.py` e `setor.py` mostram usuários e setores PCP com `id` inteiro. `unificado/qualidade/service/quality/db.py` aponta para banco dedicado Qualidade e schema `qualidade`; `unificado/qualidade/migrations/schema.sql` contém sua própria `qualidade.unidade` com `codigo` textual e PKs UUID. `.../quality/api.py` tenta `uuid7()` e recua para `uuid4()` em Python sem esse suporte. GED usa `DATABASE_URL` com `pg.Pool` em `infra/ged/app/backend/src/config/database.js` e IDs UUID com `gen_random_uuid()` em `.../src/db/migrations.sql`. Não existe padrão único de ID entre os serviços.

Nos arquivos de migration inspecionados **não há RLS/policies** para PCP, Qualidade ou GED; o controle observado é na API/gateway e por `unidade_id`/`unidade_codigo`. Isso não comprova a configuração viva do banco. Há cadastro de unidades e setores, mas em serviços diferentes. Não foi localizada tabela reutilizável de **centros de custo** nem cadastro corporativo de **colaboradores** nesses schemas; `public.usuarios`/vínculos de identidade são usuários de acesso, e não equivalem automaticamente a colaboradores para ficha de EPI. Proposta: usar código estável `campinas` na borda da API e definir um mapeamento explícito para `suprimentos.unidade_id` (ou FK para uma tabela de unidades no **mesmo banco**, se disponível), sem FK entre bancos PCP/Qualidade/GED. Criar centros de custo próprios de Suprimentos até existir cadastro corporativo confirmado. Escolher UUIDv7 para documentos de negócio e `bigint` para o livro de movimentos, conforme o plano, gerando UUIDv7 no serviço; registrar a identidade IAM como chave externa sem presumir que Mapa, PCP e GED compartilhem tipo de ID.

## 7. Jobs em background

A busca em código/requirements de PCP, Mapa, Qualidade e GED não encontrou `procrastinate`, Celery, RQ ou Redis instalados; `ADR-011` aparece apenas como referência no plano v2, sem arquivo de decisão localizado. O que existe: `unificado/qualidade/service/quality/api.py` grava `notificacao_outbox` na mesma transação; `.../quality/outbox.py` consome com `FOR UPDATE SKIP LOCKED`, acionado a cada cinco minutos por `unificado/qualidade/infra/systemd/qualidade-outbox.timer`/`.service`. No GED, `infra/ged/app/backend/server.js` chama `setInterval(...checkExpiringDocuments..., 24h)`, que não é uma fila persistida. A leitura de NF por IA deve ganhar `sup_nf_job` persistido e worker próprio; decidir em S3 se instala `procrastinate` ou usa padrão de outbox/worker transacional, sem declarar ADR-011 como já implantado.

## 8. Upload de arquivos do GED

`infra/ged/app/backend/src/services/storageService.js` usa `GED_UPLOAD_DIR` (fallback `backend/uploads`) e grava o buffer em subpastas. Documentos usam `versions.drive_file_id` no SQL de `infra/ged/app/backend/src/db/migrations.sql`; tarefas/NC usam `storage_path`. `infra/ged/app/backend/server.js` expõe `/uploads/*` via `serveUpload`; `.../src/controllers/uploadController.js` valida pasta, caminho real, cookie e vínculo/permissão antes de servir o arquivo. A lista de pastas permitidas é `vigentes`, `em_revisao`, `obsoletos`, `modelos`, `tasks`, `rnc`, `calibrations`; **Suprimentos ainda não é permitido**. `infra/ged/nginx-ged-unificado.conf` publica `/unificado/ged/uploads/` por proxy.

Reutilizar o contrato de armazenamento protegido, metadados, limites, hash e download autorizado; não gravar diretamente na pasta GED nem criar URL pública de foto/NF. É necessário um contrato autenticado de upload/download entre serviços ou armazenamento próprio com as mesmas garantias. Validar retenção e permissões dos anexos de fornecedores/NF antes de escolher o mecanismo.

## 9. Abertura de Não Conformidade por outro módulo

Existe API nativa de Qualidade em `unificado/qualidade/service/quality/api.py`: `POST /api/nc/rascunhos` (`DraftIn`) e `POST /api/nc/{nc_id}/registrar` (`RegistrationIn`), sob `router = APIRouter(prefix="/api")`. A primeira exige `Depends(require("qualidade.nc.abrir"))`; `.../quality/auth.py` aceita apenas uma assertion assinada de curta duração, vinda do gateway local. `infra/nginx/qualidade-unificado.conf` faz `auth_request` e encaminha `X-Qualidade-Assertion`. Não foi encontrada função pública específica “abrir NC de outro módulo” ou endpoint de integração serviço a serviço. Para reprovação no recebimento, Suprimentos precisará de contrato explícito com Qualidade para identidade, unidade, origem, idempotência e vínculo `nc_id`; invocar a rota atual com privilégio implícito seria inadequado. O GED também possui `infra/ged/app/backend/src/routes/rncRoutes.js`, mas o fluxo nativo atual do Unificado é o da Qualidade, e as duas APIs não devem ser confundidas.

## 10. Deploy na VPS nova e feature flags

O nginx de homologação versionado em `infra/nginx/unificado-homolog.conf` escuta `:18446` e serve `/opt/concrefer-unificado/homolog/public`, com alguns serviços por proxy e somente leitura como fallback. O vhost HTTPS em `infra/nginx/concrefer-unificado-test.conf` serve `/opt/concrefer-unificado/public`, encaminha `/unificado/mapa/api/` ao `:13052`, PCP ao `:13054` e `/api/` ao hub `:8015`. `infra/nginx/qualidade-unificado.conf` é exemplo de módulo isolado com `auth_request` e API em loopback `:13066`; `unificado/qualidade/infra/systemd/qualidade-api.service` roda com usuário próprio, env fora do repositório e escrita restrita. `infra/systemd/concretrack-unificado.service` usa `www-data` no hub. Um novo `/api/suprimentos` exigirá localização nginx **mais específica** que o `/api/` geral e endpoint de autenticação no gateway; `/unificado/suprimentos/` e `/unificado/suprimentos/pwa/` exigirão regras de arquivos, fallback, escopo de SW e acesso.

O histórico em `docs/navegacao/relatorio-execucao.md` registra homologação antes de produção, backup e snapshot de permissões, `nginx -t`, leitura por `www-data`, smoke/gate 7/7 e retorno automático. Entretanto, os scripts ali citados `deploy/navigation_shell.sh`, `deploy/navigation_rollback.sh` e `tests/navegacao/production_release.py` **não estão nesta árvore local**; `deploy/scripts/deploy.sh` e `remote-release.sh` são da Dosagem, não um deploy genérico para Suprimentos. Portanto, o procedimento reproduzível do novo módulo ainda precisa ser criado/confirmado na fase de implementação; este documento não afirma um deploy executado.

Não foi localizada uma feature flag genérica por unidade no catálogo de telas, shell ou migrations inspecionadas. `preview_modules` em `unificado/mapa/api/app.py` é uma condição por usuário de prévia, não a flag operacional pedida no plano. Proposta: configuração persistida `modulo='suprimentos', unidade_id, fase, habilitado` consultada **no gateway, API e shell**, iniciando Campinas desligada até o gate de cada fase. A falta de flag atual impede tratar “esconder menu” como controle suficiente.

## O que reutilizar × o que criar

| Tema | Reutilizar | Criar para Suprimentos |
|---|---|---|
| Casca/menu | `menu.config.js`, `router.js`, `navConfig.ts`, contrato `?view=` | Registro teal, 8 subitens, rota, bundle e fallback coerentes |
| Identidade | Cookie/sessão e verificação de usuário ativo do gateway | Assertion/contrato de autorização do serviço, papéis por unidade e CC, ações e flag |
| Dados | Padrão Alembic transacional do PCP/Qualidade; código `campinas` | Schema `suprimentos`, tabelas S0, mapeamento de unidade/usuário, centros de custo |
| PWA | Manifest, instalador, SW de escopo próprio da Mão de Obra | IndexedDB e fila persistente idempotente, catálogo offline, foto/QR, renovação adequada |
| Anexos | Padrão de armazenamento protegido do GED | Contrato seguro para fotos/NFs, metadados e política de retenção |
| NC | API nativa de Qualidade `/api/nc/rascunhos` | Integração autorizada e idempotente por inspeção reprovada |
| Jobs | Outbox transacional + timer da Qualidade como referência | Fila persistida de extração de NF e worker monitorado |
| Deploy | Layout `:18446`, nginx, systemd, gate documentado | Serviço/porta/configuração próprios, scripts auditáveis de release/retorno, flag Campinas |

## Riscos e conflitos concretos

1. **Dois cadastros de navegação e um bundle:** `menu.config.js` e `navConfig.ts` podem divergir; atualizar ambos e recompilar `modelo-a/menu.js`.
2. **IDs e bancos não compartilhados:** PCP usa usuário inteiro e unidade smallint; Mapa usa login textual; GED/Qualidade usam UUID. Não criar FK cruzada sem contrato de identidade. `qualidade.unidade` e `producao.unidade` são homônimas em bancos/esquemas diferentes.
3. **Schema do plano versus “todas com `unidade_id`”:** `sup_unidade_medida`, `sup_material`, `sup_fornecedor` e outras linhas do rascunho não mostram `unidade_id`. Decidir escopo global versus por unidade e regras únicas compostas antes da migration S0.2.
4. **Prefixos:** `/api/` já é roteado ao hub; `/unificado/qualidade/api/`, `/unificado/ged/api/` e `/unificado/pcp/api/` têm serviços próprios. Não há implementação de `/api/suprimentos` ou `/unificado/suprimentos` nos arquivos examinados, mas o nginx precisa de location explícita. O SW raiz `unificado/sw.js` e o SW dedicado precisam de escopos sem sobreposição funcional.
5. **PWA:** a referência não satisfaz os requisitos offline/IndexedDB do plano; copiá-la literalmente perderia solicitações ou duplicaria envios.
6. **Anexos/NC:** GED não aceita pasta Suprimentos hoje; Qualidade não oferece integração pronta com credencial de serviço. Exigem contratos antes de S3.
7. **Segurança multiunidade:** não há RLS demonstrado nesses serviços nem flag por unidade já pronta. Filtrar por unidade/CC no backend, inclusive listas e anexos; depois confirmar grants do banco vivo.
8. **Deploy:** o relatório de navegação cita scripts ausentes da árvore local; localizar o procedimento vigente antes de qualquer publicação. Não usar scripts de Dosagem como se fossem genéricos.

## Estrutura e prefixos propostos (ainda não criados)

```text
unificado/suprimentos/
  frontend/                 # fonte das telas web e estilos
  pwa/                      # index, login de retorno, manifest, sw, entry, ícones
  service/suprimentos/
    main.py                 # API FastAPI; rotas /api/suprimentos/...
    auth.py                 # assertion IAM, papéis, alçada e unidade
    db.py  models.py  schemas.py
    api/                    # cadastros, solicitações, compras, recebimento, estoque
    services/               # regras de estado, custo, reserva, integração
    jobs/                   # processamento persistido da NF
  migrations/               # Alembic, schema suprimentos; revisões S0 em diante
  infra/                    # nginx/systemd e procedimento de release/retorno
```

Rotas públicas previstas: `/unificado/?view=suprimentos/...` na casca; arquivos web em `/unificado/suprimentos/`; instalador e SW exclusivos em `/unificado/suprimentos/pwa/`; API em `/api/suprimentos/...`. Banco: schema `suprimentos`, nomes de tabela `sup_*`, começando Campinas. Uma location nginx específica roteará a API para serviço em loopback; a flag por unidade deve ser checada pelo serviço antes de qualquer escrita. Esses são **prefixos reservados em proposta**, não infraestrutura já instalada.

## Perguntas em aberto para Ricardo

1. Alçadas reais de Campinas: valores, níveis, aprovadores e centros de custo abrangidos (os números entre colchetes no plano ainda são parâmetros).
2. Almoxarife e comprador responsáveis; compras centralizadas ou por unidade?
3. Insumos da usina entram no fluxo de compras já em S1 ou apenas na integração S4? Como tratar contratos/pedidos recorrentes?
4. Permitir descrição livre fora do catálogo no PWA? Quem classifica depois?
5. Quem fará o inventário inicial e em qual data?
6. Confirmar prazos/limites: 48 h para fechamento, R$ 200 para ajuste, R$ 1.000 para três cotações, 10% de variação de pedido.
7. Contabilidade: fórmula de custo médio, tratamento de ICMS/IPI/frete para uso e consumo.
8. Qual cadastro será a fonte oficial de colaboradores para ficha de EPI e de centros de custo? Há serviço corporativo além dos arquivos examinados?
9. Para fornecedor e catálogo de materiais, o código é global ou por unidade? Essa resposta define as chaves únicas e resolve a contradição de `unidade_id` no rascunho.
10. Qual serviço/banco deve hospedar o schema `suprimentos` e qual política de retenção/compartilhamento de anexos com GED? Validar a integração de NC entre serviços com a equipe da Qualidade.

**Encerramento S0.1:** descoberta concluída. Nenhuma fase posterior foi iniciada.
