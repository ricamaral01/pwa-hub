# Changelog

## [0.7.2] - 2026-08-01 - Validacao desktop/tablet

### Corrigido
- Entrada desktop em `localhost`/loopback passa a abrir o fluxo administrativo, enquanto acesso por IP de rede local preserva o fluxo operacional do tablet.
- Sessao operacional do tablet deixou de ser limpa por bootstrap administrativo `/auth/me` sem sessao.
- Tela de parada restaura operador/token operacional persistidos na sessao do navegador antes de carregar dados protegidos.
- Layout desktop e tablet recebeu ajustes de rolagem e largura para evitar overflow horizontal nas viewports validadas.
- Erros HTTP previsiveis passaram a exibir mensagens por status; falhas 5xx exibem referencia de correlacao sem expor detalhes internos.

### Validado
- Playwright especifico cobriu entrada desktop e tablet via `http://192.168.0.14:5173` em 1280x800, 1280x720 e 1024x600 sem respostas 5xx.

## [0.7.1] - 2026-08-01 - Validacao tecnica das Fases 5, 6 e 7

### Corrigido
- Endpoints de estoque, blendas, analytics e importacao historica passaram a exigir permissoes administrativas granulares alem do JWT administrativo.
- OEE passou a calcular tempo planejado liquido via `calendario_turno`, com turnos, intervalos excluidos, indisponibilidades planejadas e paradas na memoria de calculo.
- Ausencia de calendario produtivo deixa OEE sem indicador calculado e retorna inconsistencia controlada, sem assumir periodo bruto ou 24h.

### Adicionado
- Parser XLSX real para importacao historica, com suporte a multiplas abas, datas, decimais com virgula, valores armazenados de formulas e fixtures locais.
- Validacao Playwright das rotas administrativas das Fases 5 a 7 contra backend real, sem exposicao de UUID bruto nas telas verificadas.

## [0.7.0] - 2026-08-01 - Fases 5, 6 e 7

### Adicionado
- Modulo de estoque com movimentos append-only, saldo por lote protegido, entrada, ajuste, devolucao, transferencia, estorno e consumo automatico na conclusao do apontamento.
- Modulo de blendas com componentes, calculo, conclusao transacional e rastreabilidade.
- Dashboards e relatorios administrativos para producao, perdas, paradas, OEE, estoque e rastreabilidade.
- Views SQL de analytics e memoria de calculo OEE versionada.
- Framework de importacao historica com staging, lotes, arquivos, abas, linhas, erros, mapeamentos, reconciliacao, rollback e CLI.

### Observacoes
- Nao foram implementadas Fases 8 ou 9.
- Nenhum dado historico real foi importado; apenas fixture CSV local valida o pipeline.

## [0.6.0] - 2026-08-01 - Fases 3 e 4 operacionais

### Adicionado
- Autenticacao operacional real por matricula/PIN com sessao operacional separada da sessao administrativa.
- Catalogo operacional real em `/production-catalog`, usado pela tela tablet para operacoes, ordens, moldes/configuracoes, lotes e tipos de ocorrencia.
- Modulo de ocorrencias/paradas com entidade `Ocorrencia`, migration `Fase3Ocorrencias`, endpoints `/occurrences` e permissoes operacionais.
- Tela tablet `/stop` para iniciar e encerrar parada vinculada ao apontamento em andamento.
- Outbox offline em Dexie v3 para apontamentos e ocorrencias, com idempotencia, retry/backoff e registro de conflitos para supervisao.
- Tela administrativa `/admin/sync-conflicts` para consultar conflitos locais de sincronizacao.
- Backend e frontend preparados para acesso pela rede local (`0.0.0.0`, proxy `/api`, CORS de LAN privada).

### Corrigido
- Endpoints especificos de producao e ocorrencias passaram a ser registrados antes do controller generico de cadastros.
- Sessao operacional passa a armazenar o UUID canonico do dispositivo, mesmo quando o login recebe o identificador fisico `DEV-TABLET-01`.
- `Ocorrencia` foi registrada na configuracao global do TypeORM para eliminar `EntityMetadataNotFoundError`.
- Seed de desenvolvimento deixou de sobrescrever o PIN do operador `OP001` quando ele ja existe.

### Validado
- Backend: typecheck, testes Jest e build passaram.
- Frontend: typecheck, Vitest e build passaram.
- Playwright `normal-tablet-landscape-1920`: 5 specs passaram.
- Teste manual na API real: login `OP001`, catalogo, criacao de apontamento, criacao de ocorrencia, bloqueio 409 de conclusao com ocorrencia aberta, encerramento da ocorrencia e conclusao do apontamento.

## [0.5.0] - 2026-08-01 - Fase 2 Apontamento de Producao

### Adicionado
- Fundacao visual industrial no frontend com tokens CSS, shell tablet, cabecalho de maquina, controles touch, keypad numerico, feedback industrial e componentes desktop.
- Backend `ProducaoModule` com entidade `Apontamento`, migration `Fase2Apontamento`, endpoints `/production-records` e servico de calculo de perdas.
- Login operacional por PIN em `/auth/operator-login`, sessao operacional em memoria e logout/restauracao basicos.
- Seed de desenvolvimento com operador `OP001`, dispositivo `DEV-TABLET-01`, maquina `INJ-01`, item, molde, lote, configuracao item/molde e ordem de producao.
- Permissoes iniciais de apontamento adicionadas ao perfil administrador pelo seed.

### Alterado
- Tela operacional passou a usar layout tablet industrial e fluxo basico login/abertura/execucao.
- Tela de cadastros passou a usar shell desktop, sidebar, toolbar, tabela e paginacao industriais.

### Observacoes
- A API de apontamento usa autenticacao administrativa por JWT para endpoints administrativos; a sessao operacional ainda nao substitui integralmente a autorizacao por guard.
- O fluxo tablet ainda precisa consumir listas reais de OP/item/molde/lote/configuracao antes de ser considerado ponta a ponta completo.

## [0.4.0] - 2026-08-01 - Planejamento tecnico das Fases 2 a 6

Entrada **somente de documentacao**. Nenhuma funcionalidade nova, nenhum codigo,
nenhuma migration, nenhuma mudanca de comportamento. Nada em `backend/` ou `frontend/`
foi tocado.

### Adicionado
- `docs/plano-fases-2-a-6.md`: plano tecnico mestre da Etapa 1 (Design System) e das
  Fases 2 (Apontamento), 3 (Ocorrencias/Paradas), 4 (Offline/Sync), 5 (Estoque/Blendas)
  e 6 (Paineis/OEE), com 16 subsecoes por fase e ordem de execucao global.
- `docs/design-system-industrial.md`: tokens, estados funcionais, layout tablet
  1280x800 e desktop 1440x900, catalogo de 24 componentes React e refatoracao visual
  das telas de cadastro da Fase 1 sem alterar contrato de backend.
- `docs/maquinas-de-estado.md`: extensao da maquina de estados do posto de 16 para 21
  estados (sem renomear os existentes) e maquinas de apontamento e ocorrencia no
  backend, com diagramas e transicoes invalidas.
- `docs/calculos-oee.md`: formulas de perda com exemplo de conferencia obrigatorio,
  Disponibilidade/Performance/Qualidade/OEE, views e materialized views propostas,
  refresh incremental e 18 casos de teste canonicos.
- `docs/backlog-validacao-fase-6.md`: itens que precisam de confirmacao do processo
  industrial (com marcacao de bloqueio) e backlog funcional consolidado.

### Alterado
- `docs/offline-sync.md`: preservado o conteudo da Fase 0/1 e acrescentada a
  especificacao completa da Fase 4 (Dexie v3, outbox, idempotencia, conflitos, backoff,
  dependencias, reconexao, service worker, limites do offline, seguranca).
- `docs/arquitetura.md`, `docs/modelo-dados.md`, `docs/regras-negocio.md`: nova secao
  "Fases 2 a 6 (planejado, nao implementado)".
- `docs/handoff.md`: entrada de planejamento no topo do arquivo.

### Observacoes
- Divergencias entre o plano da Fase 1 e a Fase 1 implementada foram documentadas; as
  fases novas referenciam os nomes realmente implementados.
- Formula de perda sem galho fixada como
  `(perda total - galho) / (injecao util + perda total - galho)`, unica que reproduz os
  10,56% do mockup aprovado.
- Fase 7 em diante nao foi iniciada nem especificada.

## [0.3.1] - 2026-08-01 - Correcao lotes de resina

### Corrigido
- Cadastro de lotes de resina agora usa seletores reais de resina e fornecedor, exibindo codigo/descricao ou documento/nome e enviando apenas IDs reais.
- Backend valida UUIDs, relacionamentos, duplicidade de codigo, quantidade inicial e bloqueia alteracao direta de saldo de lote.
- Criacao de lote define `saldoAtualKg` a partir de `quantidadeInicialKg` e registra o movimento inicial com o mapeamento correto de `quantidade_kg`.
- Erros de lote deixam de cair em 500 para IDs invalidos/inexistentes e retornam mensagens controladas.

### Validado
- Teste manual contra API real criou fornecedor, resina e lote; UUID invalido e edicao direta de saldo retornaram 400.
- Playwright especifico criou fornecedor, resina e lote usando os seletores reais.
## [0.3.0] - 2026-08-01 - Fase 1 Cadastros

- Implementado m�dulo backend de Cadastros com endpoints administrativos reais para fun��es, colaboradores, m�quinas, opera��es, tipos de ocorr�ncia, fornecedores, resinas, lotes de resina, itens, moldes, configura��es item/molde e ordens de produ��o.
- Adicionada migration da Fase 1 com constraints, FKs `RESTRICT`, prote��o de saldo de lote, movimentos imut�veis e exclus�o de vig�ncia sobreposta em configura��o item/molde.
- Adicionada tela administrativa `/admin/cadastros/:resource` consumindo API real, protegida por `AdminGuard` e sem depend�ncia de `OperatorSession`.
- Seed administrativo passou a criar permiss�es `recurso.acao` e dados m�nimos de desenvolvimento de forma idempotente.
- Cobertura adicionada em Jest, Vitest e Playwright para cria��o administrativa de item com backend real.
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

