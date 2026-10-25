# B0 — Descoberta da stack do Unificado para o módulo Qualidade

**Executado:** 15/10/2026. **Estado:** evidência para revisão de Ricardo. Levantamento somente leitura do workspace e da VPS `2.25.163.32`; nenhuma instalação, alteração de banco ou publicação.

## Resultado principal

O Unificado em operação **não é uma única aplicação React/FastAPI com um ORM e um banco**. É uma casca web em JavaScript que reúne serviços independentes. Para o módulo Qualidade ser nativo, B1/B2 precisarão escolher explicitamente onde ficará o schema `qualidade`, qual sessão validará a API e como as permissões de ação se ligarão à tela de usuários.

| Parte atual | Frontend/API | Banco e acesso | Migrações |
|---|---|---|---|
| Hub `concrefer.concretrack.com.br` | Nginx + `/opt/concrefer-unificado/hub-api` FastAPI 0.115.6, Python; HTML/JS próprio em `public/` | `psycopg2`; `AUTH_DATABASE_URL` para autenticação e URLs por unidade definidas em `config/units.yaml` | SQL manual em `hub-api/sql/auth_schema.sql`; não foi encontrado Alembic no hub |
| Casca `/unificado/` | `unificado/index.html`, `shell/menu.config.js`, `shell/router.js`, CSS/JS sem framework | Faz chamadas a Mapa/PCP/Lab; não tem ORM próprio | Publicação de arquivos estáticos |
| Mapa e login atual do Unificado | Flask 3.1.1 + Gunicorn, `unificado/mapa/api/app.py` | `psycopg` 3; banco Mapa e conexão PCP para identidade pareada | SQL versionado em `unificado/mapa/database/` |
| PCP / Planejamento | FastAPI 0.115.6, SQLAlchemy 2.0.36, Pydantic, Python; páginas HTML/JS | PostgreSQL próprio via SQLAlchemy/`psycopg2` | `Base.metadata.create_all` em `app/main.py`; não foi encontrado Alembic no PCP |
| Laboratório | FastAPI, SQLAlchemy 2, Python; frontend React 18 + TypeScript + Vite 6 | PostgreSQL próprio; fotos em diretório configurado por `POSTES_UPLOAD_DIR` com metadados no banco | `postes_db.py` invoca Alembic. A pasta de migrations existe no serviço original `/opt/monitor_concreto/migrations`, mas **não foi encontrada** na cópia `unificado/laboratorio/service/`; não tomar essa cópia como template de migrations completo. |

O PostgreSQL do host destino é **16** (`pg_lsclusters`: cluster `16/main`, porta 5432 local). Isso não transforma os bancos existentes em um único banco de aplicação. A base de Qualidade e a estratégia de schema devem ser definidas em B1 sem escrever nos bancos do Mapa/PCP por suposição.

## Menu, navegação e permissões

- `unificado/shell/menu.config.js` agrupa as telas atuais em Planejamento, Produção e Laboratório; **não há grupo GED ou Qualidade**. `shell/router.js` reconhece explicitamente caminhos de PCP, Mapa e Laboratório e usa iframe para módulos. Adicionar um item ao menu, sozinho, não torna a rota navegável nem protegida.
- A tela `unificado/mapa/operacao/users-unificado.js` exibe caixas por **tela**; o catálogo está em `unificado/mapa/api/screen_catalog.json` e as concessões em `unificado_auth.user_screen_permissions`. Para alguns convidados há permissões simples por ação, em `guest_action_permissions`; isso **não equivale** ao conjunto de permissões de negócio `qualidade.nc.*` previsto em B2.
- O backend Flask aplica `screen_access_state` e `screen-authorize` para telas/rotas atuais. O módulo Qualidade precisará verificar permissão na própria API. B1/B2 devem definir tabelas e endpoints de grants por ação, além da ligação com a tela de usuários, sem ampliar permissões de PCP/Mapa.
- O hub também possui autenticação própria com `auth_users`, `auth_user_units`, `auth_sessions` e cookie HTTP-only, definida em `hub-api/sql/auth_schema.sql`. A casca `/unificado/` atualmente faz login por `unificado/mapa/api/unified/login`, usa cookie `mapa_unificado_session` e cria sessão/token PCP quando cabível. **Não assumir que a sessão do hub já autentica quem usa a casca.**

## Dados mestres e integrações

| Dado | Fonte observada | Consequência para Qualidade |
|---|---|---|
| Unidade | `hub-api/config/units.yaml` define `pederneiras`, `ribeirao`, `noroeste`; o hub tem grants `auth_user_units`. Mapa/PCP usam seus próprios usuários e setor. | B1 deve fixar chaves estáveis de unidade, vínculo de usuário e regra para unidade ativa antes de impor `unidade_id` nas NCs. |
| Setor | PCP tem tabela/modelo `setores` e `GET /api/setores`; Mapa também tem setor/perfil. | Escolher fonte canônica e guardar snapshot textual/código para histórico. |
| Produto | PCP tem modelo `produtos` (`id`, `nome`, `codigo`, `setor_id`) e `GET /api/produtos`, filtrável por setor. | Integração de leitura existe, mas exige autenticação do PCP; especificar credencial/ponte em B4. |
| Lote | Há operações de lote na programação PCP e referências no Mapa; não foi identificada API mestre única de lotes no levantamento. | B4 deve definir fonte por unidade e contrato antes do preenchimento automático pelo QR. Texto livre deve continuar possível. |
| Ensaios | Laboratório oferece `/api/ensaios` e registros com `veredito`; API do Lab usa sua sessão/autorização. | O botão “Abrir NC” poderá partir do ensaio, mas o contrato de evento/URL e a identidade da sessão precisam ser definidos em B4. |
| Documento GED | API GED separada, JWT próprio nesta fase. | Busca autenticada por código depende de uma ponte/credencial explicitamente projetada; o fallback de código + link do plano é adequado até lá. |

## Arquivos, notificações e testes

- **Arquivos:** não há um serviço comum de anexos no shell/hub. O Laboratório grava fotos em `POSTES_UPLOAD_DIR`, valida tipo/tamanho, guarda metadados no PostgreSQL e faz download por endpoint autenticado. O Mapa usa proxy de fotos com checagem de sessão e tela. Qualidade precisará de armazenamento próprio persistente e download autenticado, seguindo o padrão de proteção, sem reutilizar `/uploads` público do GED.
- **E-mail/notificações:** não foi identificado serviço SMTP ou fila de notificações compartilhado nos fontes do Unificado examinados. O `LISTEN/NOTIFY` do Mapa é para eventos em tempo real, não substitui avisos de NC. B2.6 requer mecanismo novo ou adaptação comprovada de um serviço existente, com segredos externos ao Git.
- **Testes:** há contratos e testes de navegação/integração em `tests/unificado/`, `tests/auth/`, `tests/mapa/`, `tests/pcp/`; Laboratório usa Vitest no frontend. B2 deve testar regras de estado/permissão na API, além de ensaio de browser para painel, abertura móvel e tratativa.
- **Mockups lidos:** `Main.dc.html` (painel), `Abertura.dc.html` (3 blocos), `Tratativa.dc.html` (fluxo e 5W2H) e `Mobile.dc.html` (abertura rápida). São referências de comportamento/layout para B3; não foram copiados como código. O pacote local contém somente os quatro `.dc.html`; **os `.png` citados no plano não estão em `docs/qualidade/mockups/`**. B3 precisará desses arquivos ou exportá-los dos HTML antes da conferência visual.

## Proposta técnica para B1/B2 e pontos que exigem decisão

1. **Proposta:** serviço Qualidade isolado no host destino, em Python/FastAPI + SQLAlchemy 2 + Alembic, aproveitando o padrão mais completo do Laboratório, mas com schema PostgreSQL `qualidade` e ciclo de deploy próprio. Frontend React + TypeScript + Vite montado sob `/unificado/qualidade/` e integrado ao menu modelo A. Isso é uma **proposta de implementação**, não stack já existente do módulo.
2. **Decisão necessária em B1:** banco exato do schema `qualidade`. O plano v2 diz “PostgreSQL do Unificado”, mas a VPS tem bancos separados e o hub usa `AUTH_DATABASE_URL` mais bases por unidade. Escolher um banco dedicado no PostgreSQL 16 do host (schema `qualidade`) evita alteração acidental de PCP/Mapa; definir propriedade, backup e grants.
3. **Decisão necessária em B1/B2:** fonte da identidade usada pela Qualidade nesta fase. A casca usa sessão Mapa pareada com PCP, enquanto o hub tem cookie próprio. Uma ponte validada pela API Mapa e grants `qualidade.nc.*` por usuário é a opção que preserva o login atual, mas precisa de contrato de autorização e teste de conta só PCP / só Mapa.
4. **Compatibilidade visual:** o shell precisa reconhecer módulo/rota novos; o menu sozinho não basta. B3 deve usar o design do menu modelo A e preservar as telas existentes.

## Fontes e limites

Fontes: arquivos locais `unificado/shell/*`, `unificado/mapa/api/*`, `unificado/mapa/database/*`, `unificado/pcp/backend/*`, `unificado/laboratorio/{service,frontend}/*`, `tests/*`; na VPS, `/opt/concrefer-unificado/hub-api/{api,sql,config}`, Nginx e `pg_lsclusters`. A busca por notificações foi limitada a fontes Python/JS legíveis; ausência de resultado **não prova** inexistência de qualquer serviço externo. Não foram lidos segredos, registros de pessoas, nem conteúdo de ensaios/NCs.

B0 é evidência de descoberta. O modelo B1 depende das decisões de banco e identidade acima e do gate previsto no plano v2.
