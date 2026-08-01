# Changelog

## [0.2.4] - 2026-08-01 - Fase 0 aprovada

### Corrigido
- Comentario de `App.tsx` atualizado para refletir o roteamento por guards.
- `Field` agora associa `label` a controles via `htmlFor`/`id`, restaurando
  acessibilidade e seletores `getByLabel`.
- `unlockSession()` passou a respeitar `capabilities.operatorAuthentication`, impedindo
  desbloqueio operacional simulado no modo normal.

### Validado
- Fase 0 formalizada como aprovada, sem iniciar Fase 1 nem adicionar cadastros ou
  novas funcionalidades.
- Lint, typecheck, Vitest, build e Playwright completo executados com sucesso.

## [0.2.3] - 2026-07-31 - Correcao achado 13 frontend Fase 0

### Corrigido
- Sessao administrativa separada da sessao operacional, com `AdminAuthState` em
  memoria e bootstrap por `GET /auth/me`.
- Login admin real agora chama `POST /auth/login`, restaura a sessao via `/auth/me` e
  redireciona para `/admin` ou `/change-password` conforme `deveTrocarSenha`.
- `AdminGuard` nao depende mais de `OperatorData`; `OperatorGuard` permanece separado
  e bloqueia fluxo operacional fora do modo demonstracao.
- Logout administrativo chama o endpoint real e limpa apenas o estado admin local.

### Adicionado
- Rotas minimas `/admin` e `/change-password` para validar a sessao administrativa da
  Fase 0 sem implementar cadastros ou funcionalidades da Fase 1.
- Testes Vitest para bootstrap, 401, login com refresh, redirecionamento por troca de
  senha, independencia de `OperatorData` e logout.
- Teste Playwright normal com backend real para login admin, cookie httpOnly,
  chamada a `/auth/me`, reload com sessao preservada, logout e ausencia de tokens em
  `localStorage`/IndexedDB.

## [0.2.2] - 2026-07-31 - Correcao frontend Fase 0

### Corrigido
- Rotas operacionais protegidas por `DeviceActivationGuard` e `AuthenticationGuard`.
- Login operacional ficticio bloqueado no modo normal; simulacao permitida apenas com
  `VITE_DEMO_MODE=true`.
- `tokenAdmin` removido do modelo IndexedDB, com migration Dexie v2 para limpar dados
  legados.
- Build frontend corrigido separando `vitest.config.ts` do `vite.config.ts`.

### Adicionado
- `VITE_DEMO_MODE=false` como padrao.
- Faixa fixa de modo demonstracao.
- Capabilities centralizadas para diferenciar real, local, demo e indisponivel.
- `ProductionDataRepository` com implementacoes mock/API substituiveis.
- Testes Vitest e Playwright para guards, modo demo, bloqueios e dependencias de mocks.

## [0.2.1] - 2026-07-31 - Validação real da Fase 0 + revisão técnica do frontend

### Corrigido (backend)
- `SEED_ADMIN_PASSWORD` vazio era rejeitado pela validação de ambiente (zod tratava
  string vazia como inválida em vez de ausente).
- `DATABASE_SSL=false` era coagido para `true` de verdade (`z.coerce.boolean()` do Zod
  trata qualquer string não vazia, inclusive `"false"`, como verdadeira).
- JWT de login sempre saía com `perfis: []`, mesmo para usuários com perfis atribuídos
  (query de login não carregava a relação `usuario.perfis`).
- Teste e2e de auth violava a própria regra de "sem exclusão física" (tentava apagar
  fisicamente o usuário de teste, bloqueado pelo trigger de imutabilidade da
  auditoria); corrigido para desativar em vez de apagar.

### Validado
- Migration `1730000000000-Fase0Fundacao.ts` aplicada pela primeira vez contra
  PostgreSQL real (fora de simulação).
- Suíte completa (typecheck, lint, unit, e2e, build, imagem Docker) executada e
  confirmada de fato, incluindo login real de ponta a ponta via `curl`.

### Adicionado
- `docs/revisao-frontend-fase-0.md`: revisão técnica formal do frontend
  (`concrejet/frontend`), com 7 achados classificados por severidade e critérios de
  aceite para correção. Nenhuma alteração foi feita no frontend nesta revisão.

## [0.1.1] - 2026-07-31 - Validacao Docker/Postgres

### Corrigido
- Build Docker do backend agora ignora `*.tsbuildinfo` e remove artefatos incrementais
  antes de compilar, evitando imagem sem `dist/main.js`.
- Jest e2e agora ignora `dist/` e transforma apenas TypeScript, removendo warnings de
  arquivos compilados.

### Validado
- `npm run migration:run` executado contra PostgreSQL do Docker.
- `npm run test:e2e` executado com sucesso contra PostgreSQL do Docker.
- `docker compose up -d api` validado com container saudavel e respostas OK em
  `/health` e `/ready`.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [0.2.0] - 2026-07-31 - Fase 1 Sprint 0: Frontend PWA + Tela Operacional

### Adicionado
- Scaffold frontend (`concrejet/frontend`): Vite + React 18 + TypeScript estrito.
- Design system industrial: paleta escura, tokens CSS, Inter font, touch targets 52–56px.
- PWA: `manifest.json` (landscape, standalone), service worker Workbox (NetworkFirst
  para API, CacheFirst para assets), lock de orientação landscape, aviso em modo retrato.
- IndexedDB com Dexie: schema tipado para configuração de dispositivo, sessão do
  operador, apontamento ativo, parada ativa, fila de sincronização e conflitos.
- Máquina de estados explícita (Zustand): 17 estados com transições validadas.
- Fila offline: enfileiramento com idempotency key, processamento automático ao
  reconectar, detecção de conflito (HTTP 409), registro para supervisor.
- Cliente Axios centralizado: correlation ID, interceptor 401 via CustomEvent.
- Tela de ativação do dispositivo (`/activate`): UUID único, cópia para área de
  transferência, formulário de vínculo com máquina.
- Tela de login (`/login`): modo operador (matrícula + PIN, teclado grande usable com
  luvas, auto-submit em 4/6 dígitos); modo admin (e-mail + senha, API real).
- Tela operacional (`/`): layout 3 colunas landscape sem scroll vertical, seleção
  encadeada (OP → item → molde), lote com preenchimento automático de resina,
  cálculo de perdas em tempo real, cronômetro persistido, estados visuais de perda
  (normal/atenção/acima do limite/crítico) com ícone + texto + cor + borda.
- Tela de bloqueio por inatividade (5 min): PIN, sem perder o apontamento ativo.
- Componentes: Button, Badge, OnlineBadge, LossStatusBadge, Field, Input, Select,
  NumericInput, ReadOnlyField, TopBar, RotateWarning, LockOverlay.
- Hooks: useDevice, useSession, useQueue, useOnlineStatus.
- Testes unitários: 29 testes (Vitest) — Button, Badge, máquina de estados.
- Testes e2e (Playwright): configuração em 1920×1200 e 1280×800 landscape.
- Documentação: `docs/interface.md`, `docs/fluxo-operador.md`, `docs/offline-sync.md`.
- Mocks tipados (`src/mocks/production.ts`) para desenvolvimento sem backend de produção.

### Não incluído nesta versão (scope explícito)
Dashboards, OEE, blendas, integração Mega, cadastros administrativos, login
de operador por API real (backend Fase 1 pendente), telas de conflict resolution.

## [0.1.0] - 2026-07-31 - Fase 0: Fundação técnica

### Adicionado
- Scaffold do backend NestJS + TypeScript (`concrejet/backend`).
- PostgreSQL via Docker Compose, com healthcheck, Dockerfile multi-stage e healthcheck
  de container.
- Entidades e migration inicial: `empresa`, `unidade`, `usuario`, `perfil`,
  `permissao`, `usuario_perfil`, `perfil_permissao`, `maquina`, `dispositivo`,
  `auditoria` (imutável via trigger de banco).
- Autenticação: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`,
  `POST /auth/change-password`; Argon2id; bloqueio por tentativas; troca de senha
  obrigatória no primeiro acesso; JWT em cookie httpOnly.
- Endpoints `GET /health`, `GET /ready`, `GET /version`.
- Seed idempotente do usuário administrador (`npm run seed:admin`), sem senha real
  fixada em código.
- Validação global de entrada (`class-validator`), filtro global de exceções sem
  vazamento de detalhes internos, logs estruturados (pino) com correlation ID e
  redação de campos sensíveis.
- Testes unitários (`PasswordService`, `AuthService`) e testes e2e (health, fluxo de
  login/lockout) — e2e requer Postgres acessível para rodar.
- CI (GitHub Actions): lint, typecheck, migrations, testes, build.
- Documentação: arquitetura, modelo de dados, regras de negócio, permissões,
  implantação, handoff e ADRs 0001–0003.

### Não incluído nesta versão
item, molde, configuração item-molde, ordem de produção, apontamento, ocorrências,
resinas/lotes/estoque, blendas, OEE/indicadores, importação da planilha Excel,
integração com o Mega, sincronização offline, frontend/telas.
