# Revisão técnica — Frontend `concrejet/frontend` (pós Fase 0)

**Revisor:** Claude Code (arquiteto de software / engenheiro PostgreSQL — responsável
pela Fase 0 do backend).
**Data:** 2026-07-31.
**Autor do código revisado:** Antigravity (desenvolvedor frontend sênior / especialista
PWA), conforme entrada "2026-07-31 — Antigravity" em [handoff.md](handoff.md).
**Método:** leitura direta do código-fonte em `frontend/src/**`, `frontend/package.json`,
`frontend/vite.config.ts`, `frontend/playwright.config.ts` e da documentação criada
pelo Antigravity (`docs/interface.md`, `docs/fluxo-operador.md`, `docs/offline-sync.md`),
contrastada com o modelo de dados e os endpoints reais do backend Fase 0. Revisão
somente leitura — **nenhum arquivo de frontend ou backend foi alterado** nesta revisão.

## Contexto

O backend (Fase 0, ver [handoff.md](handoff.md)) expõe hoje **apenas**:
`GET /health`, `GET /ready`, `GET /version`, `POST /auth/login`, `POST /auth/logout`,
`GET /auth/me`, `POST /auth/change-password`, sobre um modelo de dados limitado a
`empresa`, `unidade`, `usuario`, `perfil`, `permissao`, `maquina`, `dispositivo`,
`auditoria`. Autenticação é por `email` + `senha` (Argon2id), sessão via JWT em cookie
httpOnly. **Não existe** login por matrícula/PIN, nem qualquer entidade de produção
(item, molde, ordem de produção, apontamento, resina, lote, blenda, ocorrência).

O frontend criado pelo Antigravity ("Fase 1 Sprint 0") avançou além desse escopo,
construindo telas de ativação, login (admin real + operador simulado) e operação,
usando dados de produção 100% mockados. Esta revisão avalia o que foi entregue.

## Classificação de severidade (critério)

- **Crítico**: quebra funcionalidade documentada como pronta, ou risco de segurança
  real explorável hoje. Bloqueia integração com backend real sem correção.
- **Alto**: não quebra nada hoje, mas induz a erro de operação/decisão (ex.: parece
  real e não é) ou cria dívida técnica cara de destravar depois.
- **Médio**: dívida técnica de organização/isolamento que aumenta o custo da Fase 1,
  mas não engana ninguém nem quebra nada.
- **Baixo**: código morto ou inconsistência cosmética sem impacto funcional imediato.

## Achados

### 1. Ausência de proteção e redirecionamento das rotas — **Crítico**

`src/App.tsx` documenta em comentário que o roteamento condicional entre
`/activate` → `/login` → `/` é responsabilidade de cada página via o session store,
mas **nenhum arquivo do projeto usa `useNavigate`/`<Navigate>`** (confirmado por busca
em todo `src/`). Na prática, acessar `/` diretamente sem dispositivo ativado ou sem
operador logado renderiza `OperationPage` normalmente — não há guard de rota nenhum.

**Critério de aceite para correção:**
- Existe um mecanismo de guard (route loader, wrapper de rota, ou redirecionamento
  ativo nas páginas) que impede acessar `/` sem `deviceStatus === 'ACTIVATED'` e sem
  sessão de operador/admin válida.
- Acessar `/` sem dispositivo ativado redireciona para `/activate`.
- Acessar `/` ou `/activate` sem sessão válida (após dispositivo ativado) redireciona
  para `/login`.
- Após login bem-sucedido (operador ou admin), o app navega para `/` sem exigir reload
  manual.
- O teste e2e correspondente (ver item 6) passa contra um servidor Vite real.

### 2. Login de operador simulado sem backend correspondente — **Crítico**

`loginOperador()` em `src/hooks/useSession.ts` aceita **qualquer matrícula com PIN de
4+ dígitos**, sem chamar nenhuma API, gravando a sessão direto no IndexedDB. Não existe
`POST /auth/login-operador` no backend, nem colunas `matricula`/`pin_hash` na tabela
`usuario`. A tela de login apresenta esse fluxo como funcional, sem qualquer indicação
visual de que é simulado — risco real de alguém demonstrar ou operar o sistema
acreditando que há controle de acesso por operador.

**Critério de aceite para correção:**
- Enquanto não existir backend real para login de operador: a UI exibe indicação
  visível (banner/badge, não só comentário no código) de que o modo operador é
  simulado/demonstração.
- Quando o backend Fase 1 implementar `POST /auth/login-operador` (+ `matricula` e
  `pin_hash` em `usuario`, hash comparado sempre no servidor, nunca no client): o
  frontend passa a chamar a API real e o modo simulado é removido, não apenas
  desativado por flag.

### 3. Dados operacionais provenientes de mocks — **Alto**

`OperationPage` e fluxos relacionados dependem inteiramente de
`src/mocks/production.ts` (itens, moldes, ordens de produção, resinas, lotes) — nenhum
dado de produção vem de API real, porque essas entidades não existem no backend ainda.
Isso é esperado dado o estágio do projeto, mas eleva de "esperado" para "risco" pela
ausência de sinalização clara na interface (ver item 7).

**Critério de aceite para correção:**
- Mantido como mock até o backend Fase 1 existir — não é bloqueador por si.
- Ver item 5 (isolamento) e item 7 (rotulagem) para os critérios que tornam esse mock
  aceitável no meio tempo.

### 4. Campo `tokenAdmin` inseguro e sem uso no IndexedDB — **Médio**

`src/db/schema.ts` declara `tokenAdmin?: string` no registro `ActiveSession`,
comentado como "JWT admin (quando logado via email/senha)". Busca em todo o código
confirma que **esse campo nunca é escrito** — é código morto hoje. O risco não é atual,
é de precedente: convida um desenvolvedor futuro a persistir um JWT em IndexedDB sem
criptografia para viabilizar acesso admin offline, o que reintroduziria em outro lugar
exatamente o risco de XSS que o uso de cookie `httpOnly` no backend foi desenhado para
evitar (ver [ADR 0003](adr/0003-autenticacao.md)).

**Critério de aceite para correção:**
- Remover o campo `tokenAdmin` do schema enquanto não houver um desenho explícito
  (com ADR próprio) de como sessão admin deve funcionar offline, se algum dia for
  necessário.
- Se a necessidade for real, a decisão de como armazenar credenciais/tokens offline
  deve passar por revisão de segurança antes de ser implementada, não ser adicionada
  incidentalmente a um schema de dados operacionais.

### 5. Acoplamento dos mocks a `OperationPage.tsx` — **Médio**

`OperationPage.tsx` importa `MOCK_ORDENS`, `MOCK_LOTES` e funções como
`getMoldesByItem`/`getOrdensByMaquina` diretamente, usando-os embutidos em callbacks
do componente. Não existe uma camada de serviço/hook (`useOrdens()`, `useLotes()`, etc.)
que abstraia a origem do dado. Diferente do que ocorre com `/auth/*`, onde
`src/api/services.ts` já centraliza corretamente o que é real.

**Critério de aceite para correção:**
- Todo acesso a dados de produção passa por hooks/serviços dedicados (ex.:
  `useOrdensProducao()`, `useLotesResina()`), hoje implementados sobre os mocks, mas
  com assinatura já compatível com o que uma chamada TanStack Query real usaria.
- `OperationPage.tsx` não importa `src/mocks/production.ts` diretamente.
- Trocar mock por API real na Fase 1 se resume a reimplementar o hook, sem alterar o
  componente de página.

### 6. Testes Playwright incompatíveis com o comportamento real — **Alto**

`e2e/activation-login.spec.ts` contém asserções que dependem exatamente do
redirecionamento descrito no item 1, que não existe no código (ex.: expectativa de
`toHaveURL('/activate')` ao acessar `/` sem dispositivo configurado, e de navegação
`/activate` → `/login` → `/` após ativação/login). O handoff do Antigravity registra
esses testes como "não executados por falta de servidor", o que é tecnicamente
verdadeiro mas incompleto: **mesmo com servidor rodando, esses testes falhariam hoje**,
porque testam um comportamento que não foi implementado.

**Critério de aceite para correção:**
- Após a correção do item 1, `npm run test:e2e` (Playwright) é executado de fato
  contra um `npm run dev` real, com resultado (passou/falhou) registrado em
  documento de handoff — não apenas "não executado".
- Nenhum teste e2e afirma sucesso de um comportamento não verificado.

### 7. Diferença entre funcionalidades reais, simuladas e ainda não implementadas — **Alto**

Não há, hoje, nenhum sinal na própria interface (fora de comentários de código e
documentação) que distinga para quem está testando o sistema o que é real
(`/auth/login` admin) do que é simulado (login operador, dados de produção) do que
ainda não existe (tela de resolução de conflito, ícones PWA definitivos). Isso é
coerente com um protótipo em desenvolvimento, mas é um risco de comunicação: alguém
pode demonstrar, avaliar ou tomar decisão de negócio sobre o sistema achando que fluxos
simulados são reais.

**Critério de aceite para correção:**
- Existe uma indicação visual consistente (ex.: badge "DEMO"/"MOCK" no `TopBar` ou na
  própria tela) sempre que a página estiver operando sobre dados/login simulados.
- `docs/interface.md` ou documento equivalente mantém uma tabela viva "Real vs.
  Simulado vs. Pendente" por funcionalidade, atualizada a cada handoff subsequente.

## Resumo por severidade

| Severidade | Itens |
|---|---|
| Crítico | 1 (rotas sem proteção), 2 (login operador fantasia) |
| Alto | 3 (dados mock sem rotulagem), 6 (e2e incompatível), 7 (real vs. simulado indistinguível) |
| Médio | 4 (`tokenAdmin` morto e inseguro), 5 (mocks acoplados ao componente) |
| Baixo | — nenhum achado classificado como baixo nesta revisão |

## Fora de escopo desta revisão

Esta revisão não implementa nenhuma correção, não modifica `frontend/` nem `backend/`,
e não avança funcionalidades de Fase 1. É um parecer para orientar o próximo agente/dev
que for mexer no frontend — os critérios de aceite acima devem ser usados para validar
essa correção quando ela for feita, não são uma prescrição de como implementá-la.

---

# Re-revisão — Correções aplicadas pelo Codex

**Revisor:** Claude Code (arquiteto de software / engenheiro PostgreSQL).
**Data:** 2026-07-31.
**Autor das correções revisadas:** Codex, conforme entrada "2026-07-31 — Codex
(correcao frontend Fase 0)" em [handoff.md](handoff.md).
**Método:** leitura direta do código corrigido, execução real de `typecheck`, `lint`,
`vitest`, `build` e `Playwright` (não apenas inspeção), e um teste manual adicional ao
vivo (navegador automatizado) do fluxo de login administrativo real, fora do escopo
dos 12 pontos pedidos, que revelou um novo problema crítico — ver achado 13.
Nenhuma alteração de código foi feita nesta revisão, à exceção avaliada e descartada
no achado 13 (justificativa abaixo). O backend permaneceu intacto e saudável durante
toda a verificação (confirmado antes e depois via `docker ps` e `curl /health`).

## Verificação item a item

| # | Item pedido | Veredito | Evidência |
|---|---|---|---|
| 1 | Rotas realmente protegidas | **Corrigido** | `src/router.tsx` envolve `/login` e `/` com `DeviceActivationGuard`; `/` também com `AuthenticationGuard` (`src/router/guards.tsx`). Testado ao vivo com Playwright. |
| 2 | Acesso direto a `/` bloqueado | **Corrigido** | `e2e/activation-login.normal.spec.ts:12-17` acessa `/` sem dispositivo ativado e confirma redirecionamento para `/activate`. Executado de verdade, passou. |
| 3 | Login fictício não funciona no modo normal | **Corrigido** | `useSession.ts:76-78` lança erro se `capabilities.operatorAuthentication !== 'demo'`; UI desabilita matrícula/PIN (`LoginPage.tsx:269,274`). Confirmado por `e2e/activation-login.normal.spec.ts:27-35`, executado de verdade. |
| 4 | Modo demonstração claramente identificado | **Corrigido** | `DemoModeBanner` renderizado globalmente em `App.tsx:43`, visível em toda rota quando `VITE_DEMO_MODE=true`. Confirmado por `e2e/activation-login.demo.spec.ts:12-19`, executado de verdade. |
| 5 | Nenhum dado simulado aparenta ter sido salvo | **Corrigido** | Tela de sucesso em modo demo exibe literalmente "Nenhum dado foi persistido no backend" (`OperationPage.tsx:410`); `canStart` exige `isDemoMode` (`OperationPage.tsx:325`); fora do modo demo, `onSubmit` lança erro antes de enfileirar (`OperationPage.tsx:272-274`). |
| 6 | Mocks removidos da `OperationPage` | **Corrigido** | `OperationPage.tsx` não importa mais `src/mocks/production.ts` — usa `getProductionDataRepository()` (linha 17). Mocks foram movidos para `src/features/production/mocks/`, atrás da interface do repositório. |
| 7 | Contrato substituível entre mock e API | **Corrigido** | `ProductionDataRepository` (interface) + `MockProductionDataRepository` + `ApiProductionDataRepository`, selecionados por `getProductionDataRepository()` conforme `isDemoMode`. `ApiProductionDataRepository` hoje rejeita com mensagem clara (endpoints não existem no backend) em vez de simular sucesso. |
| 8 | `tokenAdmin` removido do IndexedDB | **Corrigido** | Campo removido da interface `ActiveSession` (`db/schema.ts:19-26`). Migration Dexie v2 (`db/schema.ts:140-158`) remove o campo de registros legados existentes. |
| 9 | Nenhuma credencial armazenada no navegador | **Confirmado (já estava correto)** | `sessionStorage` só persiste `device` e `queueCount` (`session.store.ts:193-196`, `partialize`); senha do formulário admin é estado local de componente, nunca persistido; sessão admin depende só do cookie `httpOnly` do backend. |
| 10 | Testes Playwright correspondem ao comportamento real | **Corrigido e executado nesta revisão** | `npx playwright test` rodado de verdade contra os dois servidores Vite (modo normal porta 5173, modo demo porta 5174): **5/5 passaram**. Os specs antigos que testavam um redirecionamento inexistente foram substituídos por `activation-login.normal.spec.ts` e `activation-login.demo.spec.ts`, coerentes com o código atual. |
| 11 | Documentação corresponde ao código | **Majoritariamente corrigido, 1 ressalva baixa** | `docs/interface.md:65-80` tem uma tabela "Estado real vs. simulado" que bate exatamente com o código verificado. Ressalva: o comentário em `src/App.tsx:21-29` ainda descreve uma arquitetura antiga ("o roteamento é feito dentro de cada página... cada página chama `useNavigate()` diretamente") que não corresponde ao código atual (roteamento agora é via guards em `router.tsx`). É um comentário interno do código, não um documento externo — severidade **Baixa**, não bloqueia nada, mas confunde quem for ler o código depois. |
| 12 | Nenhuma funcionalidade de Fase 1 implementada antecipadamente | **Confirmado** | `ApiProductionDataRepository` só rejeita (nenhum endpoint real chamado); `useQueue.processQueue` continua com `TODO` e simulação de sucesso via `setTimeout`; persistência de apontamento só ocorre com `isDemoMode`. Nada de produção real foi implementado. |

## Achado 13 (novo, fora dos 12 pedidos) — Login administrativo real não conclui a navegação — **Crítico**

**Status em 2026-07-31:** **Corrigido e verificado.**

A correção separou explicitamente `AdminSession`, `OperatorSession` e
`ProductionState`: `frontend/src/store/admin-auth.store.ts` mantém a sessão
administrativa em memória, baseada no cookie httpOnly do backend; `useSession` e
`session.store.ts` continuam restritos ao operador/estado operacional; a máquina de
estados de apontamento não recebeu nenhum conceito de administrador.

Evidências da correção:

- O bootstrap global (`frontend/src/auth/AdminAuthBootstrap.tsx`, montado em
  `App.tsx`) executa `GET /auth/me` no carregamento inicial e mantém status
  `unknown` até a resposta chegar.
- `POST /auth/login` agora é seguido de `GET /auth/me`; a sessão admin é preenchida
  sem `window.location.reload()` e sem `OperatorData` fictício.
- `AdminGuard` usa somente `AdminAuthState`: `unknown` mostra loading,
  `unauthenticated` redireciona para `/login`, `authenticated` libera, e
  `deveTrocarSenha=true` força `/change-password`.
- `OperatorGuard` permaneceu separado e bloqueia a rota operacional no modo normal
  enquanto o backend de operador não existir.
- O logout admin chama `POST /auth/logout` e limpa apenas o estado administrativo
  local, sem apagar configuração do dispositivo nem dados operacionais.
- Não há JWT, cookie, refresh token, senha ou PIN persistido em `localStorage` ou
  IndexedDB.

Verificação executada após a correção:

- `npm run lint` — OK.
- `npm run typecheck` — OK.
- `npm run test` — OK, 46 testes Vitest passando.
- `npm run build` — OK, com aviso informativo de bundling já conhecido.
- `npm run test:e2e -- --project=normal-tablet-landscape-1920` — OK, 4/4 testes
  passando com backend e frontend ativos. O novo spec confirma rota admin sem sessão
  -> `/login`, login admin real, cookie `concretrack_session` httpOnly, chamada a
  `/auth/me`, saída de `/login`, reload mantendo sessão, acesso a `/admin`, logout e
  ausência de tokens em storage. O fluxo `deveTrocarSenha` foi validado com usuário
  seedado pelo backend, que nasce com troca obrigatória.

Ao testar manualmente o único fluxo genuinamente real da aplicação (login admin via
`POST /auth/login`), com um usuário criado especificamente para este teste
(`revisao@concretrack.local`, via `npm run seed:admin` no backend — não afeta os dados
de produção existentes) e um navegador automatizado real (Chromium via Playwright,
fora dos specs do repositório):

1. O login é aceito pelo backend de verdade — o cookie `concretrack_session` é
   definido no navegador (confirmado inspecionando os cookies da página).
2. `AdminLoginForm` (`LoginPage.tsx:373-374`) então faz `window.location.reload()`,
   com o comentário "Reload para o App detectar a sessão via `/auth/me`".
3. **Nada no código chama `/auth/me` de fato.** `authApi.me()` está definido em
   `src/api/services.ts:15` mas não é invocado em nenhum outro arquivo do projeto
   (confirmado por busca em todo `src/`, fora de testes). `setOperator()` só é chamado
   em dois lugares, ambos exclusivos do fluxo mock de operador
   (`useSession.ts:32` restaurando do IndexedDB, `useSession.ts:100` dentro do próprio
   `loginOperador()` mock) — nunca a partir de uma resposta de `/auth/login` ou
   `/auth/me` real.
4. Resultado observado ao vivo: após o reload, a URL permanece em `/login` —
   `AuthenticationGuard` continua vendo `operator === null` e redireciona de volta,
   mesmo com uma sessão administrativa válida no backend. **O admin nunca consegue
   chegar a `/` pelo login real.**

**Por que não corrigi isso diretamente**, apesar da instrução permitir correção de
falha crítica pequena e comprovada: a falha é crítica e está comprovada (reproduzida
ao vivo), mas a correção **não é pequena**. `OperatorData` (`session.store.ts:35-41`)
exige `matricula: string` — campo que não existe para um usuário administrativo (que
tem `email`, não matrícula). Popular `operator` corretamente a partir de `/auth/me`
exige decidir como uma sessão de admin se representa dentro de uma máquina de estados
de 17 estados desenhada em torno do conceito de operador — uma decisão de design,
não um ajuste local. Documentando aqui para que quem tiver esse contexto decida.

**Critério de aceite para correção:**
- Após um login administrativo bem-sucedido, o app efetivamente chama `GET /auth/me`
  (ou equivalente) e popula o estado de sessão de forma que `AuthenticationGuard`
  reconheça o admin como autenticado, sem depender de `window.location.reload()` como
  mecanismo de sincronização de estado.
- A modelagem de "sessão administrativa" vs. "sessão de operador" fica explícita no
  tipo de dados (não é forçada dentro de `OperatorData.matricula`).
- Existe um teste (unitário ou e2e) que login administrativo real leva de fato a `/`,
  não apenas que o cookie foi definido.

## Achados adicionais de baixa severidade (observados durante a re-revisão)

- **Labels sem associação `htmlFor`/`id` com os inputs** (`src/components/Field.tsx:28-37`):
  o `<label>` é apenas texto irmão do input, não conectado via `htmlFor`. Isso quebra
  `getByLabel()` em testes e prejudica leitores de tela (a associação programática é
  requisito de acessibilidade, não só conveniência de teste). Confirmado ao tentar
  localizar os campos de e-mail/senha por label durante a verificação do achado 13 —
  foi necessário usar seletor por `type` como contorno. Severidade **Baixa/Média**
  (não impede uso visual/manual, mas é uma lacuna de acessibilidade real).
- **Aviso de build do Vite** ("dynamically imported... but also statically imported")
  sobre `session.store.ts` sendo importado de forma mista (estática e dinâmica) — não
  é erro, não impede o build, é apenas uma oportunidade de otimização de bundling.
  Severidade **Baixa**, informativa.
- **`unlockSession(pin)` em `useSession.ts:107-112`** aceita qualquer PIN de 4+ dígitos
  para desbloquear a tela de trava por inatividade, sem checar `capabilities` como
  `loginOperador` faz. Hoje é inofensivo porque, no modo normal, nunca existe um
  operador logado para chegar a esse estado — mas é uma inconsistência de gate que vale
  corrigir junto do achado 13, quando a sessão de admin também puder chegar à tela
  operacional. Severidade **Baixa**, latente.

## Resumo da re-revisão

| Severidade | Itens |
|---|---|
| Crítico | achado 13 (login admin real não conclui a navegação) |
| Alto | nenhum remanescente dos 7 achados originais |
| Médio | nenhum remanescente dos 7 achados originais |
| Baixo | item 11 (comentário desatualizado em `App.tsx`), labels sem `htmlFor`, aviso de bundling, `unlockSession` sem gate |

Dos 7 achados críticos/altos/médios da revisão original, **todos os 7 foram
corrigidos e verificados com evidência real** (não apenas inspeção de código — testes
executados de fato). A correção do Codex é sólida tecnicamente. A ressalva que impede
uma aprovação plena é o achado 13, descoberto nesta re-revisão, fora do escopo dos 12
pontos pedidos, mas que compromete o único fluxo de autenticação genuinamente real da
aplicação hoje.

## Veredito

**Aprovado com ressalvas.**

Os 12 pontos solicitados foram verificados: 11 confirmam a correção correta e completa
do Codex (com testes reais executados, não apenas lidos), e o 12º (documentação vs.
código) tem apenas uma ressalva de severidade baixa. A ressalva que impede a aprovação
plena é o achado 13 — crítico, comprovado ao vivo, fora do escopo original dos 12
pontos — que precisa ser resolvido antes de qualquer demonstração ou uso do login
administrativo real, mas cuja correção envolve uma decisão de design que não coube
fazer unilateralmente nesta revisão.

---

# Revalidação exclusiva do achado 13 — pós-correção do Codex

**Revisor:** Claude Code (arquiteto de software / engenheiro PostgreSQL).
**Data:** 2026-08-01.
**Autor da correção revisada:** Codex, entrada "2026-07-31 - Codex (correcao achado 13
frontend Fase 0)" em [handoff.md](handoff.md).
**Escopo:** exclusivamente o achado 13 (login administrativo real não concluía a
navegação). Não reavaliei os achados 1-12 aqui — permanecem no estado "Corrigido"
registrado na seção anterior. Não implementei nenhuma funcionalidade nova.

## O que o Codex mudou

Arquitetura nova: uma store de sessão administrativa própria
(`src/store/admin-auth.store.ts`, Zustand, **sem** middleware `persist`), populada por
`GET /auth/me` via um componente de bootstrap montado globalmente
(`src/auth/AdminAuthBootstrap.tsx`, chamado em `App.tsx`). O `AdminGuard`
(`src/router/guards.tsx`) passou a depender só dessa store — nunca de `OperatorData`
nem de `matricula`. Duas rotas novas: `/admin` (`AdminHomePage`) e `/change-password`
(`ChangePasswordPage`), ambas atrás do `AdminGuard`. O login administrativo
(`LoginPage.tsx`, `AdminLoginForm`) não usa mais `window.location.reload()` — navega
via `useNavigate()` real, depois que a store confirma a sessão.

## Verificação item a item (execução real, não apenas leitura)

Método: revalidei de forma independente do teste que o próprio Codex escreveu — usei
um usuário administrativo criado exclusivamente para este teste
(`revalidacao@concretrack.local`, via `npm run seed:admin` no backend real, não afeta
dados existentes) e um script Playwright avulso, fora do repositório, controlado por
mim. Também rodei o spec que o Codex adicionou (`e2e/admin-auth.normal.spec.ts`) como
segunda fonte de evidência.

| # | Requisito | Resultado | Evidência |
|---|---|---|---|
| 1 | `POST /auth/login` cria sessão | **Confirmado** | Cookie `concretrack_session` (`httpOnly: true`) presente no navegador logo após o login, verificado via `context.cookies()`. |
| 2 | `GET /auth/me` restaura a sessão | **Confirmado** | Requisição a `/auth/me` capturada de fato (`page.on('request', ...)`) tanto no bootstrap inicial quanto após o login. |
| 3 | O administrador sai de `/login` | **Confirmado** | URL após login: `/change-password` (pois `deveTrocarSenha=true` no usuário de teste) e, após trocar a senha, `/admin`. Em nenhum momento voltou a `/login`. |
| 4 | Reload mantém a sessão | **Confirmado** | Após `page.reload()` em `/admin`, a URL permaneceu `/admin` (o `AdminAuthBootstrap` repopula a store via `/auth/me` a cada carregamento). |
| 5 | `AdminGuard` não depende de matrícula nem de `OperatorData` | **Confirmado por leitura de código** | `guards.tsx:46-88` usa exclusivamente `useAdminAuthStore` (`status`, `user`, `error`); nenhuma referência a `OperatorData`, `matricula` ou `session.store.ts` nesse guard. |
| 6 | `deveTrocarSenha` é respeitado | **Confirmado** | Usuário de teste criado com `deveTrocarSenha=true` foi redirecionado a `/change-password` antes de `/admin`; após `POST /auth/change-password` + `refreshSession()`, a store atualizou e o acesso a `/admin` foi liberado. |
| 7 | Logout funciona | **Confirmado** | `AdminHomePage` chama `logout()` (que chama `POST /auth/logout` real) e navega para `/login`; cookie de sessão deixou de estar presente/válido depois. |
| 8 | Nenhum token no navegador | **Confirmado** | `localStorage` vazio (`{}`) após todo o fluxo; dump completo do IndexedDB (`ConcreTrackInjecao`, todas as 8 object stores) sem nenhum registro em `activeSession` ou qualquer outra tabela — nenhuma ocorrência de token/jwt/senha/pin em lugar nenhum. `admin-auth.store.ts` não usa `persist`, confirmando por que isso funciona (o estado é só em memória, perdido de propósito a cada reload — por isso o bootstrap via `/auth/me` é o mecanismo real de continuidade, não armazenamento local). |
| 9 | Vitest passa | **Confirmado, executado de fato** | `npm run test` (frontend): **46/46 testes passando** (9 suites), incluindo `src/store/admin-auth.store.test.ts` (5 testes novos). |
| 10 | Build passa | **Confirmado, executado de fato** | `npm run build`: sucesso, mesmo aviso informativo de bundling já conhecido (não é erro). |
| 11 | Playwright passa | **Confirmado, executado de fato, com uma ressalva ambiental** | Ver nota abaixo. |

### Nota sobre a primeira tentativa de Playwright

Na primeira execução da suíte completa (`npx playwright test`), os 2 testes do projeto
`demo-tablet-landscape-1280` falharam. Investigando, a causa **não foi uma regressão
de código do Codex**: um processo `vite` remanescente de uma verificação manual minha
anterior nesta mesma sessão estava ocupando a porta 5174 em modo normal (não demo), e
a opção `reuseExistingServer: true` do Playwright reaproveitou esse processo errado em
vez de subir um servidor novo em modo demo. Confirmei isso manualmente (o servidor
naquela porta não exibia o banner de demonstração) e via `vite --mode demo` isolado
(que carrega `.env.demo` corretamente, `VITE_DEMO_MODE=true`). Depois de encerrar os
processos `vite` remanescentes e rodar `npx playwright test` do zero, **6/6 testes
passaram**, incluindo `admin-auth.normal.spec.ts` (o spec do Codex para o achado 13) e
os dois specs de modo demonstração. Registro isso para transparência — foi um artefato
do meu próprio processo de verificação, não um problema no código revisado.

## Achados de baixa severidade da revisão anterior — não fazem parte do achado 13

Não reavaliados nesta revalidação (fora do escopo pedido: "revalide exclusivamente o
achado 13"): comentário desatualizado em `App.tsx` sobre roteamento, labels do
`Field` sem `htmlFor`/`id`, `unlockSession()` sem o mesmo gate de `capabilities` que
`loginOperador()` tem. Continuam válidos e pendentes, sem urgência.

## Veredito da revalidação

**Achado 13: Resolvido.** Todos os 8 requisitos específicos do achado foram
confirmados com execução real e verificação independente (não apenas o teste que o
próprio autor da correção escreveu), mais Vitest (46/46), build e Playwright (6/6)
passando de fato.

# Fase 0 — Declaração final

**Fase 0 aprovada.**

Com a resolução comprovada do achado 13 — o único item que impedia uma aprovação
plena na revisão anterior — não há mais nenhum achado crítico ou alto em aberto nos
13 pontos avaliados ao longo desta revisão (7 achados originais + achado 13, todos
corrigidos e verificados com evidência real de execução). Backend e frontend da Fase 0
estão ambos funcionalmente corretos nos fluxos que se propõem a implementar de verdade
(saúde/prontidão da API, autenticação administrativa completa ponta a ponta — login,
restauração de sessão, troca obrigatória de senha, logout — sem vazamento de
credenciais para o navegador). Os achados de baixa severidade remanescentes (comentário
desatualizado, labels sem `htmlFor`, gate ausente em `unlockSession`) não bloqueiam a
aprovação — são dívida técnica menor a resolver quando conveniente, não riscos ativos.

Fora do escopo desta aprovação, por não fazerem parte do que a Fase 0 se propôs a
entregar: login de operador real, dados de produção reais, persistência real de
apontamento, sincronização offline — todos aguardando o backend de Fase 1, conforme já
documentado nas entradas anteriores deste arquivo e em
[docs/handoff.md](handoff.md).

---

# Finalizacao formal da Fase 0 - baixa severidade

**Data:** 2026-08-01.
**Escopo:** somente os tres achados de baixa severidade remanescentes. Nenhuma
alteracao de arquitetura, backend, cadastros ou funcionalidade de Fase 1 foi feita.

## Correcoes aplicadas

- Comentario de `frontend/src/App.tsx` atualizado para refletir o roteamento real por
  `router.tsx` e guards.
- `frontend/src/components/Field.tsx` agora associa `label` ao controle filho via
  `htmlFor`/`id`, preservando ID explicito quando fornecido e gerando ID estavel quando
  necessario.
- `unlockSession()` em `frontend/src/hooks/useSession.ts` agora aplica o mesmo gate de
  `capabilities.operatorAuthentication` usado no login de operador: no modo normal nao
  desbloqueia sessao operacional simulada; no modo demonstracao permite apenas o fluxo
  operacional explicitamente simulado. `AdminSession` e `OperatorSession` permanecem
  separados.

## Verificacao

- `npm run lint` - OK.
- `npm run typecheck` - OK.
- `npm run test` - OK, 48 testes Vitest passando.
- `npm run build` - OK, com aviso informativo de bundling ja conhecido.
- `npm run test:e2e` - OK, 6/6 testes Playwright passando; aviso Workbox em dev-dist permanece informativo.

## Veredito

**Fase 0 aprovada formalmente.** Nao ha achados criticos, altos, medios ou baixos em
aberto dentro do escopo avaliado da Fase 0. O que depende de backend operacional real
permanece fora do escopo e deve aguardar a Fase 1.

## Fase 1 - Cadastros implementada

A Fase 1 foi implementada sem misturar `AdminSession` com `OperatorSession` e sem avan�ar para apontamento operacional. O frontend de cadastros fica sob `/admin/cadastros/:resource` e consome endpoints reais protegidos por autentica��o administrativa.

Valida��o realizada: typecheck backend/frontend, Jest, Vitest, build backend/frontend, migration local, seed local, Docker API rebuildado e Playwright normal com cria��o real de item.
