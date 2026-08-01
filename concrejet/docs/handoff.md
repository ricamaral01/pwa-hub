# Handoff

## 2026-08-01 - Codex - Fases 2, 3 e 4 operacionais sem Fase 5/6

### Objetivo executado

Fechadas as pendencias bloqueantes da Fase 2 e implementadas as entregas operacionais das Fases 3 e 4: autenticacao operacional real, catalogo real para o tablet, apontamento protegido por sessao de operador, ocorrencias/paradas, outbox offline e acesso local em rede. Nao foram implementados consumo de lote, blenda, estoque avancado, paineis ou OEE.

### Principais mudancas

- Backend: adicionados `OperatorSessionGuard`, `OperationalPermissionGuard`, decorator `RequireOperationalPermission`, `ProductionCatalogController/Service` e `OcorrenciasModule`.
- Banco: migration `1730800000000-Fase3Ocorrencias.ts` cria `ocorrencia` e estende `tipo_ocorrencia` com classificacao, programacao, OEE, acao corretiva e aprovacao.
- Frontend tablet: `OperationPage` passou a autenticar operador em `/auth/operator-login`, carregar `/production-catalog` e usar IDs reais internamente; `/stop` registra paradas.
- Offline: `db/schema.ts` inclui outbox/conflitos/catalogos/metadados v3; `useQueue` envia registros reais quando a conexao volta.
- Infra local: API e Vite escutam em `0.0.0.0`; CORS permite origens LAN privadas em desenvolvimento.

### Validacao real

- `backend`: `npm run typecheck`, `npm run test`, `npm run build` OK.
- `frontend`: `npm run typecheck`, `npm run test`, `npm run build` OK.
- Playwright: `npm run test:e2e -- --project=normal-tablet-landscape-1920` OK, 5 specs.
- API manual real OK: login `OP001/2468`, catalogo real, apontamento, ocorrencia, bloqueio 409 com ocorrencia aberta, encerramento da ocorrencia, conclusao do apontamento.
- Lint: executado e falhou por regra Prettier/LF contra arquivos CRLF preexistentes em massa; nao foi normalizado para evitar churn fora do escopo.

### Estado local

- Backend/PostgreSQL via Docker Compose ativos.
- Frontend dev server ativo em `http://localhost:5174`, exposto para LAN; IP detectado: `http://192.168.0.14:5174`.

> Ordem do arquivo: mais recente primeiro. As duas últimas entradas do Codex
> ("Fase 1 Cadastros implementada" e "Correcao isolada de lotes de resina") foram
> anexadas ao **final** do arquivo, fora do padrão — elas são cronologicamente as mais
> recentes antes desta. Quem for editar deste ponto em diante: entrada nova no topo.

## 2026-08-01 — Claude Code (arquiteto de software / engenheiro PostgreSQL) — Planejamento técnico das Fases 2 a 6

### Objetivo executado

Produzir **somente documentação** — o planejamento técnico consolidado da Etapa 1 (Design
System / refatoração visual) e das Fases 2 (Apontamento), 3 (Ocorrências/Paradas),
4 (Offline/Sync), 5 (Estoque/Blendas) e 6 (Painéis/OEE). Nenhum código, migration,
entidade ou tela foi criado ou alterado. Nenhum commit foi feito. A Fase 7 em diante não
foi iniciada nem especificada, por instrução explícita.

Trabalho na branch `feature/fase-1-cadastros`, a partir do commit `06ab41f`.

Leitura prévia completa: `docs/referencia-ui/` (os 5 mockups HTML, `estilo.css`,
`index.html`, `README.md` — o layout foi descrito por inspeção do HTML/CSS, não das
imagens), `README.md`, `CHANGELOG.md`, `docs/arquitetura.md`, `docs/modelo-dados.md`,
`docs/regras-negocio.md`, `docs/permissoes.md`, `docs/handoff.md`,
`docs/fase-1-cadastros.md` (1065 linhas, integral), `docs/offline-sync.md`,
`docs/interface.md`, `docs/fluxo-operador.md`, e a estrutura real de
`backend/src/modules/**`, `backend/src/database/migrations/*` e `frontend/src/**`
(incluindo `session.store.ts`, `db/schema.ts`, `hooks/useQueue.ts`,
`modules/cadastros/entities.ts`, `permissions.service.ts`, `features/cadastros/resources.ts`).

### Arquivos criados

- `docs/plano-fases-2-a-6.md` — documento mestre. Diagnóstico do que existe hoje +
  as 6 fases (Etapa 1, 2, 3, 4, 5, 6) com exatamente 16 subseções cada (dependências,
  banco/migrations, backend, frontend, regras críticas, endpoints, permissões, testes
  unitários, testes de integração, testes Playwright, critérios mínimos, backlog,
  itens não adiáveis, riscos, rollback, ordem para o Codex) + ordem de execução global.
- `docs/design-system-industrial.md` — Etapa 1: tokens portados de
  `referencia-ui/estilo.css`, estados funcionais, layout tablet 1280×800 e desktop
  1440×900, catálogo dos 24 componentes com props, mapeamento mockup → rota,
  refatoração das telas da Fase 1 (12 defeitos e correções), acessibilidade,
  responsividade controlada.
- `docs/maquinas-de-estado.md` — extensão da máquina do posto de 16 para 21 estados
  (sem renomear nenhum estado existente), máquina do apontamento (3 status) e da
  ocorrência (5 status) no backend, diagramas mermaid, transições inválidas e regras do
  cronômetro persistente.
- `docs/calculos-oee.md` — fórmulas de perda com o exemplo de conferência obrigatório,
  Disponibilidade/Performance/Qualidade/OEE, views e materialized views propostas,
  índices, refresh incremental, endpoints agregados e 18 casos de teste canônicos.
- `docs/backlog-validacao-fase-6.md` — Parte A (o que precisa ser confirmado pelo processo
  industrial, com marcação de bloqueio) e Parte B (backlog funcional consolidado das
  seções 12 de cada fase).

### Arquivos alterados

- `docs/offline-sync.md` — preservado integralmente o conteúdo da Fase 0/1 e acrescentada
  a seção "Fase 4 — especificação completa" (schema Dexie v3, UUID/idempotência, versão e
  conflitos, backoff, ordem e dependências, reconexão, recuperação após fechamento,
  service worker, indicadores, limites do offline, segurança, 25 testes).
- `docs/arquitetura.md` — nova seção "Fases 2 a 6 (planejado, não implementado)".
- `docs/modelo-dados.md` — nova seção com as tabelas novas por fase e as extensões de
  tabelas existentes.
- `docs/regras-negocio.md` — nova seção com as regras não adiáveis por fase e o que fica
  explicitamente fora.
- `docs/handoff.md` (este arquivo).
- `CHANGELOG.md` — entrada `0.4.0`.

Nenhum arquivo de `backend/` ou `frontend/` foi criado, alterado ou removido. Nenhuma
migration foi criada.

### Testes executados

**Nenhum.** É uma tarefa exclusivamente de documentação; não há código novo para testar.

### Principais decisões técnicas

1. **Sobreposição de apontamento resolvida no banco**, com o mesmo `EXCLUDE USING gist`
   sobre `tstzrange` já usado em `configuracao_item_molde` — e com um efeito colateral
   desejado: como `tstzrange(inicio, NULL)` é aberto, a constraint também garante no
   máximo um apontamento aberto por máquina, sem índice parcial extra. `btree_gist` já
   está habilitada desde a Fase 1, então o risco 1 do plano da Fase 1 está encerrado.
2. **Fórmula de perda sem galho fixada com denominador ajustado**:
   `(perda total − galho) / (injeção útil + perda total − galho)`, que reproduz os
   10,56 % do mockup aprovado. A leitura ingênua (denominador = injeção + perdas) daria
   10,34 % e estaria errada.
3. **Massas do apontamento como colunas `GENERATED ALWAYS ... STORED`** — o cálculo é do
   banco, não da aplicação, e não pode ser sobrescrito.
4. **Congelamento (snapshot) de peso, cavidades, ciclo, limite, `planejada` e
   `exige_acao_corretiva`** no registro operacional. É o que impede que editar um
   cadastro hoje mude o OEE e a perda do mês passado.
5. **Ação corretiva obrigatória vira `CHECK` de banco**, não validação de aplicação.
6. **A máquina de estados do frontend é estendida, não recriada**: os 16 estados atuais de
   `session.store.ts` mantêm nome e semântica; 5 novos são acrescentados
   (`OPERATOR_IDENTIFYING`, `OPENING`, `STOP_CLOSING`, `SYNC_IN_PROGRESS`,
   `BLOCKED_STALE_SESSION`).
7. **O `CadastrosModule` genérico não é o padrão para produção** — apontamento,
   ocorrência e estoque exigem módulo e service dedicados.
8. **Rotas continuam na raiz do backend** (sem `setGlobalPrefix`), com slug em
   inglês-kebab, seguindo a convenção realmente implementada na Fase 1.
9. **Permissões seguem `recurso.acao` com recurso namespaceado**
   (`producao.apontamento.criar`, `producao.ocorrencia.encerrar`, `estoque.blenda.efetivar`,
   `indicadores.oee.consultar`), compatível com o `CadastroPermissionsService` existente,
   que será promovido para `common/` em vez de duplicado.
10. **Login de operador (matrícula + PIN) entra na Fase 2** — sem ele não existe a
    primeira tela do fluxo. `colaborador.pin_hash` **não existe** no banco atual (a coluna
    prevista no plano da Fase 1 não foi implementada) e precisa ser criada.
11. **Agregado nunca é fonte da verdade** na Fase 6, com endpoint de reconciliação como
    critério de aceite.
12. **Etapa 1 antes da Fase 2**: construir a tela de apontamento antes do design system
    significaria reescrevê-la.

### Divergências encontradas entre o plano da Fase 1 e a Fase 1 implementada

Registradas na seção 0.3 do plano mestre. O implementado usa `descricao` em vez de
`nome`, `versaoConfiguracao` em vez de `version`, `pesoPecaG` em vez de
`pesoPecaGramas`, `cavidades` em vez de `numeroCavidades`, e `ordem_producao` tem
`numero`/`moldeId`/`quantidadePlanejada`/`dataInicioPlanejada`. Além disso, **não** foram
implementados: `configuracao_item_molde.limite_perda_percentual` e `ciclo_custo_segundos`,
`tipo_ocorrencia.categoria`/`planejada`/`exige_acao_corretiva`,
`movimento_estoque_lote.saldo_resultante_kg`, `colaborador.pin_hash`, `codigo_mega`.
As Fases 2–6 referenciam os nomes **realmente implementados** e tratam o que falta como
extensão explícita (seção 0.4 do plano), não como bug.

### Pendências

Nenhuma pendência de código — nada foi implementado por instrução explícita. As pendências
de **processo** (o que precisa ser confirmado por quem opera a fábrica antes de fechar o
design de cada fase) estão consolidadas em
[backlog-validacao-fase-6.md](backlog-validacao-fase-6.md), com marcação de quais
bloqueiam a implementação. Os bloqueios mais duros: turnos reais e definição de "tempo
planejado" (sem eles não há OEE); taxonomia e classificação planejada/não planejada de
`tipo_ocorrencia` (sem elas não há Fase 3); política de PIN do operador (sem ela não há
Fase 2); consumo teórico versus real (sem ele não há Fase 5); perfis operacionais além de
`ADMIN`.

### Ordem de implementação recomendada para o Codex

Etapa 1 (Design System) → Fase 2 (Apontamento) → Fase 3 (Ocorrências) → Fase 4
(Offline/Sync) → Fase 5 (Estoque/Blendas) → Fase 6 (Painéis/OEE). As Fases 4 e 5 podem
ser paralelizadas entre executores diferentes, com um único dono do encerramento de
apontamento (ponto de encontro das duas). Ordem detalhada por fase na subseção 16 de cada
fase e na seção final do plano mestre.

### Confirmação de escopo

Nenhum arquivo de código-fonte (`backend/`, `frontend/`) foi criado, alterado ou removido
nesta sessão. Nenhuma migration foi criada. Nenhum `git add`/`commit`/`push`/`merge` foi
executado. Apenas os 5 documentos criados e os 6 arquivos alterados listados acima foram
tocados.

---

## 2026-08-01 — Claude Code (arquiteto de software / engenheiro PostgreSQL) — Planejamento técnico da Fase 1 — Cadastros

### Objetivo executado

Produzir **somente a especificação técnica** da Fase 1 — Cadastros, sem implementar
código, migrations, entidades ou telas. Escopo: função, colaborador, máquinas
(extensão), operações, tipos de ocorrência, fornecedores, resinas, lotes de resina
(cadastro + saldo inicial controlado), itens, moldes, configuração item-molde
versionada por vigência, ordem de produção, telas administrativas e permissões
consultar/criar/alterar/inativar. Trabalho realizado na branch
`feature/fase-1-cadastros`, a partir do commit-base `ce15db2` (Fase 0 aprovada).

Leitura prévia completa: `README.md`, `CHANGELOG.md`, `docs/arquitetura.md`,
`docs/modelo-dados.md`, `docs/regras-negocio.md`, `docs/permissoes.md`,
`docs/revisao-frontend-fase-0.md`, `docs/handoff.md`, a migration existente
(`1730000000000-Fase0Fundacao.ts`), as entidades/módulos atuais do backend
(`common/entities/base.entity.ts`, `modules/organizacao`, `modules/usuarios`,
`modules/producao-base`, `modules/auditoria`, `modules/auth`) e a estrutura atual do
frontend (`frontend/src/pages/admin`, padrão de repositório substituível de
`features/production`).

### Arquivos criados

- `docs/fase-1-cadastros.md` — especificação técnica completa (23 seções: diagnóstico,
  modelo de dados, relações/cardinalidades, enums, constraints PostgreSQL, índices,
  estratégia de vigência, estratégia de auditoria, contratos de endpoint, DTOs,
  paginação/filtros/ordenação, matriz de permissões, validações, regras de
  inativação, casos de teste unitário/integração/Playwright, critérios de aceite,
  ordem de implementação, dependências entre módulos, riscos técnicos, plano de
  rollback, itens a confirmar com o processo industrial).

### Arquivos alterados

- `docs/modelo-dados.md` — nova seção "Fase 1 — Cadastros (planejado, não
  implementado)", resumo + link para a especificação completa.
- `docs/regras-negocio.md` — idem, com destaque para as duas regras centrais
  (vigência não sobrescrita historicamente; saldo de lote não editável diretamente).
- `docs/permissoes.md` — idem, com a convenção de chave `cadastros.<recurso>.<acao>`
  e o que falta construir (`PermissionsGuard`, hoje inexistente).
- `docs/handoff.md` (este arquivo).

Nenhum arquivo de `backend/` ou `frontend/` foi criado, alterado ou removido. Nenhuma
migration foi criada. Nenhum comando de teste foi executado (não há código novo para
testar).

### Principais decisões técnicas

1. **`configuracao_item_molde` é entidade própria versionada por vigência**, não um
   simples `UPDATE` em `item`/`molde`: `vigencia_inicio`/`vigencia_fim`/`ativo`/
   `version` + `EXCLUDE USING gist` (extensão `btree_gist`, nova) sobre
   `tstzrange(vigencia_inicio, vigencia_fim)` por `(item_id, molde_id)`, garantindo no
   banco — não só na aplicação — que não existem vigências sobrepostas. Nenhum
   `UPDATE`/`DELETE` de peso/cavidades/ciclo/limite é permitido; toda alteração é
   `INSERT` de nova linha + encerramento da anterior, na mesma transação.
2. **`lote_resina.saldo_atual_kg` protegido em duas camadas**: DTO de `PATCH` nunca
   declara o campo (rejeitado pelo `ValidationPipe` global já existente) e um trigger
   de banco bloqueia `UPDATE` direto fora do fluxo interno de
   `movimento_estoque_lote` (tabela append-only nova, preparatória para consumo futuro,
   sem nenhuma automação de consumo nesta fase).
3. **`colaborador` é entidade separada de `usuario`** — cadastro de chão de fábrica,
   sem login nesta fase. Campo `pin_hash` preparado mas não exposto por nenhum DTO;
   login de operador por matrícula/PIN fica fora do escopo desta Fase 1 (sinalizado
   como item a confirmar, seção 25 da especificação, porque o handoff da Fase 0
   mencionava esse endpoint repetidamente como pendência).
4. **`maquina` é estendida, não recriada** — já existe desde a Fase 0; a Fase 1 só
   adiciona colunas opcionais (`tipo`, `capacidade_toneladas`) via `ALTER TABLE`.
5. **Nenhum `DELETE` físico em nenhum dos 12 recursos**, com endpoints `/reativar`
   novos (não existiam na Fase 0) para reverter inativação.
6. **`PermissionsGuard` por permissão é pré-requisito de infraestrutura** desta fase —
   a Fase 0 só tinha autenticação (`JwtAuthGuard`), nunca autorização granular; a
   especificação define a convenção `cadastros.<recurso>.<acao>` e recomenda resolver
   permissões efetivas por request (não via nova claim no JWT), para não herdar o
   problema já documentado de permissão desatualizada até o próximo login.
7. **Endpoints em `/api/v1/cadastros/...`**, introduzindo versionamento de rota
   (inexistente até então) sem afetar `/auth`, `/health`, `/ready`, `/version`.

### Dúvidas que precisam de validação (não bloqueiam o início da implementação dos
cadastros mais simples, mas bloqueiam fechar o design final de alguns itens)

Lista completa e justificada em
[docs/fase-1-cadastros.md, seção 25](fase-1-cadastros.md#25-itens-que-precisam-ser-confirmados-com-o-processo-industrial):
taxonomia de `tipo_ocorrencia.categoria`; taxonomia de `resina.tipo`;
`unidade_medida` real de `item`; fluxo completo de `status` de `ordem_producao`
(existe estado "programada" separado de "aberta"? pode voltar de `EM_PRODUCAO` para
`ABERTA`?); formato real de `codigo_mega`; necessidade de endpoint de inativação
dedicado para `lote_resina` além de `status`; se login de operador por matrícula/PIN
deveria estar nesta fase ou numa fase própria; se `capacidade_toneladas`/`tipo` de
`maquina` são realmente necessários agora ou só quando `apontamento` existir; quais
perfis operacionais reais (além de `ADMIN`) existem hoje na operação.

### Ordem de implementação recomendada para o Codex

Detalhada em
[docs/fase-1-cadastros.md, seções 21–22](fase-1-cadastros.md#21-ordem-recomendada-de-implementação):

1. `PermissionsGuard` + decorator + seed de permissões (infraestrutura transversal).
2. Cadastros simples sem dependência entre si: `funcao`, `operacao`,
   `tipo_ocorrencia`, `fornecedor`, `resina`, `item`, `molde`, extensão de `maquina`
   (podem ser paralelizados entre agentes/desenvolvedores diferentes).
3. Cadastros que dependem do grupo 2: `colaborador` (depende de `funcao`, `unidade`),
   `lote_resina` + `movimento_estoque_lote` (depende de `resina`, `fornecedor`).
4. `configuracao_item_molde` (o mais arriscado — `EXCLUDE USING gist` novo no
   projeto; recomenda-se não paralelizar com outra migration ao mesmo tempo).
5. `ordem_producao` (depende só de `item`, mas é o mais "de borda" desta fase).
6. Frontend: só depois que os endpoints do grupo correspondente tiverem e2e passando
   de fato — não construir tela contra contrato ainda instável (lição já registrada
   nos achados 1–13 da revisão de frontend da Fase 0).

### Riscos conhecidos

Ver [docs/fase-1-cadastros.md, seção 23](fase-1-cadastros.md#23-riscos-técnicos):
disponibilidade de `btree_gist` em banco gerenciado de produção; robustez do trigger
de proteção de saldo contra acesso SQL direto (fora do ORM); impacto de latência da
resolução de permissões por request com ~46 chaves novas; ausência de
`apontamento`/uso real ainda para `operacao`/`tipo_ocorrencia`/`maquina` (risco de
redesenho quando a Fase 2 chegar); coordenação entre múltiplos agentes de IA no mesmo
repositório (risco de processo já materializado na Fase 0).

### Pendências

Nenhuma pendência de código — nada foi implementado nesta tarefa por instrução
explícita do usuário ("não implemente código", "não crie migrations", "não avance
para a Fase 2"). A especificação completa está pronta para ser executada pelo Codex
ou outro agente de implementação. Fase 2 (apontamento, OEE, blendas, sincronização
offline, integração Mega) não foi iniciada nem especificada.

### Confirmação de escopo

Nenhum arquivo de código-fonte (`backend/`, `frontend/`) foi criado, alterado ou
removido nesta sessão. Nenhuma migration foi criada. Apenas os 5 arquivos de
documentação listados acima foram tocados.

---

## 2026-08-01 - Codex (finalizacao formal da Fase 0 aprovada)

### Objetivo executado

Finalizar formalmente a Fase 0 aprovada, corrigindo somente os tres achados de baixa
severidade remanescentes: comentario desatualizado em `App.tsx`, labels do `Field` sem
`htmlFor` e `unlockSession()` sem gate de `capabilities`.

### Arquivos criados

- `frontend/src/components/Field.test.tsx`
- `frontend/src/hooks/useSession.test.tsx`

### Arquivos alterados

- `frontend/src/App.tsx`
- `frontend/src/components/Field.tsx`
- `frontend/src/hooks/useSession.ts`
- `frontend/e2e/admin-auth.normal.spec.ts`
- `docs/revisao-frontend-fase-0.md`
- `docs/handoff.md`
- `CHANGELOG.md`

### Comportamento implementado

- `App.tsx` documenta corretamente que o roteamento condicional e feito por
  `router.tsx` e guards.
- `Field` associa `label` a input/select por `htmlFor`/`id`; testes e2e podem voltar a
  usar seletores acessiveis por label.
- `unlockSession()` respeita `capabilities.operatorAuthentication`: em modo normal nao
  desbloqueia sessao operacional simulada; em modo demonstracao permite apenas o fluxo
  simulado. Nenhuma autenticacao falsa foi criada e `AdminSession` nao foi misturada
  com `OperatorSession`.

### Testes executados

| Comando | Resultado |
|---|---|
| `npm run lint` (frontend) | OK |
| `npm run typecheck` (frontend) | OK |
| `npm run test` (frontend) | OK - 48 testes Vitest |
| `npm run build` (frontend) | OK - aviso informativo de bundling ja conhecido |
| `npm run test:e2e` (frontend) | OK - 6/6 testes Playwright |

### Pendencias

Nenhuma pendencia aberta dentro da Fase 0 aprovada. Fase 1 nao foi iniciada.
## 2026-07-31 - Codex (correcao achado 13 frontend Fase 0)

### Objetivo executado

Corrigido somente o achado 13: o frontend agora restaura/popula a sessao
administrativa real via `GET /auth/me` e nao tenta representar administrador como
operador.

### Arquitetura aplicada

- `AdminSession`: `frontend/src/store/admin-auth.store.ts`, em memoria, autenticada
  pelo backend via cookie httpOnly, restaurada por `GET /auth/me`, usada por rotas
  administrativas.
- `OperatorSession`: continua em `useSession`/`session.store.ts`, disponivel apenas
  em modo demonstracao enquanto nao houver backend de operador.
- `ProductionState`: maquina de estados operacional preservada, sem administrador.

### Arquivos criados

- `frontend/src/store/admin-auth.store.ts`
- `frontend/src/store/admin-auth.store.test.ts`
- `frontend/src/auth/AdminAuthBootstrap.tsx`
- `frontend/src/pages/admin/AdminHomePage.tsx`
- `frontend/src/pages/admin/ChangePasswordPage.tsx`
- `frontend/e2e/admin-auth.normal.spec.ts`

### Arquivos alterados

- `frontend/src/App.tsx`
- `frontend/src/router.tsx`
- `frontend/src/router/guards.tsx`
- `frontend/src/router/guards.test.tsx`
- `frontend/src/pages/login/LoginPage.tsx`
- `docs/revisao-frontend-fase-0.md`
- `docs/handoff.md`
- `CHANGELOG.md`

### Comportamento implementado

- Bootstrap global monta `AdminAuthBootstrap`, que chama `GET /auth/me`.
- `unknown` mostra loading e nao redireciona prematuramente.
- `401/403` vira `unauthenticated`; erro de rede vira estado `error` controlado.
- Login admin chama `POST /auth/login` e depois `GET /auth/me`.
- `deveTrocarSenha=true` forca `/change-password`; apos troca, a sessao e recarregada
  e o admin segue para `/admin`.
- `AdminGuard` nao depende de `OperatorData` nem de matricula.
- Logout admin chama `POST /auth/logout` e limpa apenas o estado admin local.
- Nenhum token/cookie/refresh/senha/PIN e persistido em `localStorage` ou IndexedDB.

### Testes executados

| Comando | Resultado |
|---|---|
| `npm run lint` (frontend) | OK |
| `npm run typecheck` (frontend) | OK |
| `npm run test` (frontend) | OK - 46 testes Vitest |
| `npm run build` (frontend) | OK - aviso informativo de bundling ja conhecido |
| `npm run test:e2e -- --project=normal-tablet-landscape-1920` | OK - 4/4, backend e frontend ativos |

### Pendencias

- `Field` ainda nao associa `label` a input via `htmlFor`/`id`; o E2E admin usou
  placeholder/seletores de senha como contorno. Esta pendencia ja era baixa/media e
  nao faz parte do achado 13.
- Backend real de operador e telas/funcionalidades administrativas completas continuam
  fora da Fase 0.

## 2026-07-31 — Codex (correcao frontend Fase 0)

### Objetivo executado

Corrigir o frontend com base no parecer tecnico, mantendo o backend intacto e sem
implementar funcionalidades de Fase 1.

### Arquivos criados

- `frontend/src/config/runtime.ts`
- `frontend/src/components/DemoModeBanner.tsx`
- `frontend/src/router/guards.tsx`
- `frontend/src/features/production/domain/types.ts`
- `frontend/src/features/production/repositories/ProductionDataRepository.ts`
- `frontend/src/features/production/repositories/getProductionDataRepository.ts`
- `frontend/src/features/production/data/ApiProductionDataRepository.ts`
- `frontend/src/features/production/mocks/MockProductionDataRepository.ts`
- `frontend/src/features/production/mocks/production.ts`
- `frontend/vitest.config.ts`
- `frontend/.env.demo`
- Testes Vitest novos para guards, runtime, banner demo, Dexie e OperationPage.
- Testes Playwright normal/demo.

### Arquivos alterados

- `frontend/src/App.tsx`
- `frontend/src/router.tsx`
- `frontend/src/hooks/useSession.ts`
- `frontend/src/db/schema.ts`
- `frontend/src/pages/activation/ActivationPage.tsx`
- `frontend/src/pages/login/LoginPage.tsx`
- `frontend/src/pages/operation/OperationPage.tsx`
- `frontend/src/index.css`
- `frontend/vite.config.ts`
- `frontend/tsconfig.node.json`
- `frontend/.env`
- `frontend/.env.example`
- `frontend/playwright.config.ts`
- `README.md`
- `CHANGELOG.md`
- `docs/interface.md`
- `docs/handoff.md`

### Migrations criadas

Dexie v2: remove campo legado `tokenAdmin` de `activeSession`. Nenhuma migration de
backend foi criada.

### Endpoints criados

Nenhum.

### Testes executados

| Comando | Resultado |
|---|---|
| `npm run typecheck` (frontend) | OK |
| `npm run lint` (frontend) | OK |
| `npm run test` (frontend) | OK — 8 suites, 37 testes |
| `npm run build` (frontend) | OK |
| `npm run test:e2e` (frontend) | OK — 5 testes Playwright |
| Checagem console navegador | OK — sem erros/warnings capturados |

### Resultado dos testes

Frontend validado em modo normal e modo demonstracao. Backend permaneceu saudavel em
Docker durante a execucao.

### Pendencias

- Login operacional real continua nao implementado.
- Dados reais de producao continuam nao implementados.
- Persistencia real de apontamento e sincronizacao offline continuam nao implementadas.
- Playwright emite warning do Workbox em dev porque `dev-dist` nao possui assets para
  precache; nao afeta os testes.

### Proxima tarefa recomendada

Antes da Fase 1, alinhar o contrato real de ativacao de dispositivo com o backend. Em
seguida, implementar entidades/endpoints de producao no backend e substituir
`ApiProductionDataRepository` por chamadas reais.

## 2026-07-31 — Codex

### Objetivo executado

Validar a pendência operacional da Fase 0 em ambiente com Docker disponível: subir
PostgreSQL, aplicar migrations, rodar testes automatizados/e2e e corrigir problema de
build da imagem da API.

### Arquivos criados

Nenhum.

### Arquivos alterados

- `backend/.dockerignore`
- `backend/Dockerfile`
- `backend/test/jest-e2e.config.js`
- `README.md`
- `CHANGELOG.md`
- `docs/handoff.md`

### Migrations criadas

Nenhuma. A migration existente `1730000000000-Fase0Fundacao.ts` foi validada contra o
PostgreSQL local do Docker; o comando reportou "No migrations are pending" porque ela
já estava aplicada no volume local.

### Endpoints criados

Nenhum endpoint novo.

### Testes executados

| Comando | Resultado |
|---|---|
| `docker compose up -d postgres` | OK — Postgres saudável em `localhost:5433` |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run test` | OK — 2 suites, 7 testes |
| `npm run migration:run` | OK — sem migrations pendentes no volume atual |
| `npm run test:e2e` | OK — 2 suites, 7 testes |
| `npm run build` | OK |
| `docker compose build --no-cache api` | OK |
| `docker compose up -d --force-recreate api` | OK |
| `GET /health` | OK — `{"status":"ok"}` |
| `GET /ready` | OK — `{"status":"ok","database":"up"}` |

### Resultado dos testes

Backend validado localmente com Docker e PostgreSQL. A imagem da API ficou saudável
após correção do build incremental. O Jest e2e também foi ajustado para ignorar `dist/`
e não processar JavaScript compilado com `ts-jest`.

### Pendências

- `npm audit` continua reportando vulnerabilidades transitivas: 25 no install completo
  de desenvolvimento e 12 no install de produção dentro da imagem.
- Permissões granulares ainda não foram implementadas; permanece fora do escopo da
  Fase 0.
- A pasta `frontend/` existe como scaffold Vite/React, mas ainda não possui telas.

### Riscos conhecidos

O comando `npm run migration:run` validou conectividade e estado do banco, mas não
recriou o schema do zero porque o volume Docker já tinha a migration aplicada. Para
validação de banco limpo, usar um volume descartável antes de produção.

### Próxima tarefa recomendada

Executar a validação em banco limpo descartável e, depois, iniciar a Fase 1 pelo núcleo
produtivo: item, molde, configuração item-molde, tipo de operação e ordem de produção.

## 2026-07-31 — Claude Code (arquiteto de software / engenheiro PostgreSQL)

### Objetivo executado

Executar **somente a Fase 0 — Fundação técnica** do ConcreTrack Injeção, conforme
escopo detalhado pelo usuário: scaffold do monorepo, backend NestJS + TypeScript,
PostgreSQL via Docker Compose, entidades organizacionais fundamentais (empresa,
unidade, usuário, perfil, permissão, usuário_perfil, máquina, dispositivo,
auditoria básica), autenticação com Argon2id/bloqueio/troca obrigatória de senha,
endpoints `/health`, `/ready`, `/version`, seed seguro do administrador, validação/
erros/logs estruturados/correlation ID, testes mínimos, CI e documentação. Sem telas.

Não existia nenhum código do ConcreTrack Injeção no repositório antes desta entrega —
confirmado por varredura do repositório `pwa-hub` (que contém apenas projetos de
controle de concreto, domínio diferente) e da pasta `concrejet/` (vazia). O usuário
confirmou explicitamente que se trata de um projeto novo antes de qualquer código ser
escrito.

### Arquivos criados

Cerca de 45 arquivos novos. Principais grupos:

- **Config/scaffold**: `backend/package.json`, `tsconfig.json`, `nest-cli.json`,
  `.eslintrc.cjs`, `.prettierrc`, `jest.config.js`, `test/jest-e2e.config.js`,
  `.gitignore`, `.dockerignore`, `Dockerfile`.
- **Infra comum**: `src/main.ts`, `src/app.module.ts`,
  `src/common/entities/base.entity.ts`, `src/common/filters/global-exception.filter.ts`,
  `src/common/middleware/correlation-id.middleware.ts`,
  `src/common/logger/logger.module.ts`, `src/config/env.schema.ts`,
  `src/config/app-config.module.ts`.
- **Banco**: `src/database/data-source.ts`, `src/database/typeorm.config.ts`,
  `src/database/migrations/1730000000000-Fase0Fundacao.ts`,
  `src/database/seeds/seed-admin.ts`.
- **Módulos de domínio**: `src/modules/health/*`, `src/modules/auth/*` (service,
  controller, guard, DTOs, password service), `src/modules/organizacao/*` (entities
  `Empresa`, `Unidade`), `src/modules/usuarios/*` (entities `Usuario`, `Perfil`,
  `Permissao`), `src/modules/producao-base/*` (entities `Maquina`, `Dispositivo`),
  `src/modules/auditoria/*` (entity, service, module).
- **Testes**: `src/modules/auth/password.service.spec.ts`,
  `src/modules/auth/auth.service.spec.ts`, `test/e2e/health.e2e-spec.ts`,
  `test/e2e/auth.e2e-spec.ts`.
- **Infra de deploy local**: `concrejet/docker-compose.yml`, `.env.example` (raiz e
  `backend/`), `.github/workflows/ci.yml`.
- **Documentação**: `README.md`, `CHANGELOG.md`, `docs/arquitetura.md`,
  `docs/modelo-dados.md`, `docs/regras-negocio.md`, `docs/permissoes.md`,
  `docs/implantacao.md`, `docs/handoff.md` (este arquivo), `docs/adr/0001-*.md`,
  `docs/adr/0002-*.md`, `docs/adr/0003-*.md`.

### Arquivos alterados

Nenhum — todo o conteúdo é novo (projeto greenfield dentro de `concrejet/`, que
estava vazio). Nenhum arquivo do restante do repositório `pwa-hub` (projetos de
concreto) foi tocado.

### Migrations criadas

`backend/src/database/migrations/1730000000000-Fase0Fundacao.ts`:
cria `empresa`, `unidade`, `perfil`, `permissao`, `perfil_permissao`, `usuario`,
`usuario_perfil`, `maquina`, `dispositivo`, `auditoria`; extensão `pgcrypto`; índices
de FK; `CHECK` constraints (`cnpj` numérico, `email` com formato básico,
`tentativas_login >= 0`, `acao` em auditoria restrita a `CREATE/UPDATE/DELETE`);
trigger `trg_auditoria_bloquear_update` que impede `UPDATE`/`DELETE` física na tabela
`auditoria`. Método `down()` reverte tudo na ordem inversa de dependência.

**Esta migration não foi aplicada contra um banco real nesta sessão** — ver seção de
testes.

### Decisões técnicas

Registradas como ADRs (justificativa completa em cada arquivo):
- [ADR 0001](adr/0001-stack-backend.md) — Node.js + TypeScript + NestJS + PostgreSQL.
- [ADR 0002](adr/0002-orm-e-migrations.md) — TypeORM com migrations SQL manuais (não
  Prisma, não `synchronize`), por causa dos exclusion constraints/`tstzrange`
  necessários na Fase 1.
- [ADR 0003](adr/0003-autenticacao.md) — JWT em cookie httpOnly (sem refresh token,
  sem revogação ativa de sessão nesta fase) + Argon2id + bloqueio por tentativas.

### Regras validadas

- Senha nunca em texto puro (Argon2id, coluna `select: false`).
- Bloqueio por tentativas inválidas (testado em unit e e2e).
- Troca de senha obrigatória no primeiro acesso (campo `deveTrocarSenha` propagado do
  banco até a resposta de `/auth/login`).
- Mensagem de erro de login genérica (não revela se o e-mail existe).
- Sem exclusão física: todas as tabelas desta fase usam `ativo`; auditoria é imutável
  por trigger de banco (validação de design, não testada em runtime — ver riscos).
- FKs organizacionais com `ON DELETE RESTRICT` (validação de design via migration;
  não exercitada por teste automatizado nesta entrega).
- Segredos: `.env.example` só contém placeholders; `JWT_SECRET` e credenciais de
  banco são obrigatórios via `zod` (a aplicação recusa subir sem eles).

### Testes executados

Executados de fato nesta sessão (ambiente sem Docker disponível — ver "Problemas
encontrados"):

| Comando | Resultado |
|---|---|
| `npm install` | OK — 817 pacotes instalados, 0 erros (25 vulnerabilidades reportadas por `npm audit`, não investigadas nesta fase — ver pendências) |
| `npm run typecheck` | OK, 0 erros (2 erros reais encontrados e corrigidos: tipagem de `genReqId`/`customProps` do pino-http e tipo de `bloqueadoAte` no teste) |
| `npm run lint` | OK, 0 erros (3 erros de formatação encontrados e corrigidos via `eslint --fix`) |
| `npm run test` (unit) | **OK — 2 suites, 7 testes, todos passando** (`PasswordService`: hash/verify Argon2id; `AuthService`: login com sucesso, credenciais inválidas, bloqueio após N tentativas, rejeição de usuário já bloqueado) |
| `npm run build` | OK, build de produção gerado sem erros |
| `npm run migration:run` | **NÃO EXECUTADO** — requer Postgres, indisponível nesta sessão |
| `npm run test:e2e` | **NÃO EXECUTADO** — requer Postgres com migrations aplicadas, indisponível nesta sessão |

### Resultado dos testes

Testes unitários: **7/7 passando**. Lint, typecheck e build: **sem erros**. Testes e2e
e migrations: **escritos mas não executados** por falta de um Postgres acessível no
ambiente desta sessão (`docker ps` falhou com "cannot connect to the Docker API
... o daemon está em execução?"). Isso é reportado explicitamente porque o protocolo
desta tarefa proíbe afirmar sucesso de testes não executados.

### Problemas encontrados

1. Domínio do briefing (injeção plástica) não correspondia a nenhum projeto existente
   no repositório `pwa-hub` (que só continha sistemas de controle de concreto) — a
   pasta `concrejet/` estava vazia. Resolvido perguntando ao usuário, que confirmou
   tratar-se de projeto novo.
2. Dois erros reais de TypeScript no código gerado (tipagem de callbacks do
   `nestjs-pino`/`pino-http` e um tipo `null` estreito demais em um mock de teste) —
   corrigidos e reverificados com `npm run typecheck`.
3. Três violações de formatação Prettier — corrigidas com `eslint --fix` e
   reverificadas com `npm run lint`.
4. Docker Desktop não está em execução no ambiente desta sessão — impediu validar
   migrations e testes e2e contra um Postgres real (ver "Riscos e pendências").

### Riscos conhecidos

- **Migrations e e2e não validados contra Postgres real nesta sessão.** É o maior
  risco desta entrega: o SQL da migration foi revisado manualmente mas não executado.
  Alguém com Docker (ou Postgres) precisa rodar `docker compose up -d postgres`,
  `npm run migration:run` e `npm run test:e2e` antes de considerar a Fase 0 encerrada
  — passo a passo em [docs/implantacao.md](implantacao.md).
- **Sem revogação ativa de sessão** antes do TTL do JWT expirar — documentado e aceito
  conscientemente no [ADR 0003](adr/0003-autenticacao.md), mas é uma lacuna real se um
  usuário for desativado com uma sessão ainda válida.
- **`npm audit` reportou 25 vulnerabilidades** (3 low, 15 moderate, 7 high) nas
  dependências transitivas do scaffold NestJS/Jest/ESLint — não investigadas
  individualmente nesta entrega; recomenda-se rodar `npm audit` e avaliar antes de
  produção.
- Nenhuma autorização granular por permissão está implementada (só autenticação) —
  esperado nesta fase, documentado em [docs/permissoes.md](permissoes.md).

### Pendências

Tudo que o briefing descreve e que **não** foi tocado nesta fase (por escopo
explícito do usuário): item, molde, configuração item-molde, tipo de operação, ordem
de produção, apontamento (com histórico imutável de configuração vigente), tipo de
ocorrência/ocorrência, turno, calendário de produção, fornecedor, resina, lote de
resina, movimento de estoque, blenda/blenda_item, indicadores/views materializadas,
OEE, offline/sincronização, importação da planilha Excel, integração com o Mega,
qualquer frontend/tela. Além disso, dentro do que a Fase 0 cobre:
- Validar migrations/e2e contra Postgres real (bloqueador antes de "Fase 0 pronta").
- Avaliar `npm audit` das dependências.
- Autorização por permissão (guard) — hoje só há autenticação.

### Próxima tarefa recomendada

1. **Antes de tudo**: rodar `docker compose up -d postgres`, `npm run migration:run`
   e `npm run test:e2e` em um ambiente com Docker disponível, e atualizar esta seção
   com o resultado real.
2. Em seguida, iniciar a Fase 1 pelo núcleo produtivo com histórico imutável: `item`,
   `molde`, `configuracao_item_molde` (com vigência e regra de "não recalcular o
   passado"), `tipo_operacao`, `ordem_producao`, `apontamento` — incluindo a
   `EXCLUDE USING gist` com `tstzrange` para impedir apontamentos simultâneos na
   mesma máquina, conforme especificado no briefing.

---

## 2026-07-31 — Antigravity (desenvolvedor frontend sênior / especialista PWA)

### Objetivo executado

Executar a **Fase 1 Sprint 0 — Frontend PWA + Tela Operacional** do ConcreTrack
Injeção, conforme escopo do usuário: scaffold React/Vite/TypeScript + design system
industrial + telas de ativação, login e apontamento + PWA + IndexedDB + fila offline
+ testes Vitest.

### Telas criadas

- `/activate` — `ActivationPage`: ativação do tablet, UUID único, vínculo com máquina.
- `/login` — `LoginPage`: modo operador (matrícula + PIN) e modo admin (e-mail + senha).
- `/` — `OperationPage`: layout 3 colunas landscape, sem scroll vertical.

### Componentes criados

`Button`, `Badge`, `OnlineBadge`, `LossStatusBadge`, `Field`, `Input`, `Select`,
`NumericInput`, `ReadOnlyField`, `TopBar`, `RotateWarning`, `LockOverlay`.

### Arquivos criados/alterados

**Criados** (todos em `concrejet/frontend/`):
`package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`,
`index.html`, `.eslintrc.cjs`, `.prettierrc`, `.env`, `.env.example`,
`playwright.config.ts`,
`src/index.css`, `src/main.tsx`, `src/App.tsx`, `src/router.tsx`,
`src/vite-env.d.ts`,
`src/api/client.ts`, `src/api/services.ts`,
`src/types/api.ts`,
`src/db/schema.ts`,
`src/store/session.store.ts`, `src/store/session.store.test.ts`,
`src/hooks/useDevice.ts`, `src/hooks/useSession.ts`,
`src/hooks/useQueue.ts`, `src/hooks/useOnlineStatus.ts`,
`src/mocks/production.ts`,
`src/components/Button.tsx`, `src/components/Button.test.tsx`,
`src/components/Badge.tsx`, `src/components/Badge.test.tsx`,
`src/components/Field.tsx`, `src/components/TopBar.tsx`,
`src/pages/activation/ActivationPage.tsx`,
`src/pages/login/LoginPage.tsx`,
`src/pages/operation/OperationPage.tsx`,
`src/test/setup.ts`,
`e2e/activation-login.spec.ts`.

**Alterados** (no nível do monorepo):
`docs/interface.md` (criado), `docs/fluxo-operador.md` (criado),
`docs/offline-sync.md` (criado), `CHANGELOG.md`, `docs/handoff.md` (este arquivo).

### Integrações realizadas

- `POST /auth/login` — login administrativo real (axios client).
- `GET /health` — ping de conectividade para monitoramento offline.
- Todos os outros endpoints de produção: **mocks tipados** (backend Fase 1 pendente).

### Estados implementados

17 estados explícitos na máquina de estados (Zustand), com grafo de transições
validadas: `DEVICE_NOT_CONFIGURED`, `NO_OPERATOR`, `SESSION_LOCKED`, `IDLE`,
`FORM_INCOMPLETE`, `PREPARING`, `IN_PROGRESS`, `STOP_ACTIVE`, `AWAITING_CORRECTIVE`,
`READY_TO_COMPLETE`, `SAVING`, `SAVED`, `OFFLINE_QUEUE`, `SYNC_ERROR`, `CONFLICT`,
`NEW_VERSION`.

### Testes executados

| Comando | Resultado |
|---|---|
| `npm install` | OK — 631 pacotes, 0 erros de instalação |
| `npm run typecheck` | **OK — 0 erros TypeScript** |
| `npm run lint` | **OK — 0 erros, 0 avisos** |
| `npm run test` | **OK — 29/29 testes passando** (3 suites: Button, Badge, session.store) |
| `npm run test:e2e` | **NÃO EXECUTADO** — requer servidor Vite rodando |

### Resultado dos testes

TypeScript: **0 erros**. Lint: **0 erros**. Vitest: **29/29 passando**.
E2e: escritos (5 cenários), não executados por falta de servidor em execução
nesta sessão — este é o único teste não-confirmado.

### Pendências

1. **Login de operador por API**: `POST /auth/login-operador` não existe no backend.
   O login operacional é mock nesta sprint. Requer criação de endpoint + coluna
   `matricula` + `pin_hash` na tabela `usuario` (backend Fase 1).
2. **Dados de produção por API**: `item`, `molde`, `ordem_producao`, `resina`, `lote`
   são todos mocks. Requer backend Fase 1.
3. **Testes E2E**: não executados contra servidor real nesta sessão.
4. **Ícones PWA**: usar ícones de placeholder. Devem ser substituídos por arte real.
5. **Tela de conflito**: interface para supervisor revisar conflitos está documentada
   mas não implementada (backend de conflitos também não existe).
6. **`npm audit`**: 8 vulnerabilidades reportadas (5 moderate, 1 high, 2 critical)
   nas dependências transitivas — não investigadas individualmente.

### Riscos conhecidos

- **Backend de produção inexistente**: toda a tela operacional é mock. Quando o
  backend existir, todos os hooks de dados precisam ser substituídos por chamadas
  TanStack Query reais.
- **Login de operador sem segurança**: o mock aceita qualquer matrícula + PIN de
  4 dígitos. Não é adequado para produção sem integração com o backend real.
- **Fila de sincronização**: o processamento é mock (simula sucesso após 200ms).
  Não há garantia de ordem de envio entre tipos diferentes de registro.

### Próxima tarefa recomendada

1. **Backend Fase 1**: implementar entidades e endpoints de produção:
   - `item`, `molde`, `configuracao_item_molde` (com vigência)
   - `tipo_operacao`, `ordem_producao`, `apontamento`
   - `POST /auth/login-operador` (matrícula + PIN)
   - `turno`, `calendario_producao`
2. **Integrar frontend com backend real**: substituir mocks pelos hooks TanStack Query.
3. **Rodar e2e**: iniciar servidor (`npm run dev`) e executar `npm run test:e2e`.
4. **Geração de ícones PWA**: criar ícones 192×192 e 512×512 em PNG com identidade visual.

---

## 2026-07-31 — Claude Code (arquiteto de software / engenheiro PostgreSQL)

### Objetivo executado

Duas frentes nesta sessão:

1. Validar a Fase 0 do backend contra infraestrutura real (Docker Desktop estava
   parado no início da sessão): subir PostgreSQL, aplicar a migration, rodar o seed do
   admin, rodar a suíte completa (typecheck/lint/unit/e2e/build) e a imagem Docker da
   API, e confirmar login real de ponta a ponta via `curl`.
2. Revisar tecnicamente o frontend criado por outro agente ("Antigravity") nesta mesma
   pasta `concrejet/`, sem alterá-lo, e registrar os achados formalmente.

### Arquivos criados

- `docs/revisao-frontend-fase-0.md` (revisão técnica completa do frontend, com
  severidade e critérios de aceite por achado).

### Arquivos alterados

- `backend/src/config/env.schema.ts` — dois bugs reais de validação de ambiente (ver
  "Problemas encontrados").
- `backend/src/modules/auth/auth.service.ts` — bug real: JWT de login sempre com
  `perfis: []` por falta de `leftJoinAndSelect('usuario.perfis', ...)`.
- `backend/src/modules/auth/auth.service.spec.ts` — teste atualizado para cobrir o
  bug acima (perfis não-vazios) e mock da query builder ajustado.
- `backend/test/e2e/auth.e2e-spec.ts` — corrigido para não fazer exclusão física do
  usuário de teste (violava a própria regra de imutabilidade de auditoria — ver
  "Problemas encontrados").
- `backend/tsconfig.json`, `backend/tsconfig.build.json` (criado) — isolamento do
  cache incremental do TypeScript dentro de `dist/` (bug de build, ver abaixo).
- `backend/.gitignore` — adicionado `*.tsbuildinfo`.
- `docker-compose.yml`, `.env.example`, `backend/.env.example` — porta do Postgres
  mudada de 5432 para 5433 (conflito com um PostgreSQL nativo já rodando na máquina).
- `docs/handoff.md` (este arquivo).

Observação: `backend/.dockerignore`, `backend/Dockerfile` e
`backend/test/jest-e2e.config.js` também foram corrigidos para o mesmo problema de
build por outro agente ("Codex") em paralelo nesta sessão — ver a entrada "2026-07-31
— Codex" acima. As duas correções convergiram para o mesmo diagnóstico
independentemente; não houve conflito.

### Migrations criadas

Nenhuma nova. A migration `1730000000000-Fase0Fundacao.ts` foi aplicada de fato pela
primeira vez contra um PostgreSQL real nesta sessão (rodava só localmente antes).

### Decisões técnicas

Nenhuma nova decisão de arquitetura — esta sessão foi de validação/correção de bugs na
Fase 0 já entregue, e de revisão (somente leitura) do frontend de outro agente.

### Regras validadas

Todas as regras já listadas na entrega de Fase 0 (ver entrada anterior neste arquivo)
agora foram **efetivamente exercitadas contra Postgres real**, não apenas revisadas por
design: login com sucesso/falha, bloqueio por tentativas, troca de senha obrigatória,
trigger de imutabilidade de auditoria (inclusive descobrindo, via teste real, que ele
bloqueia corretamente até `UPDATE`s em cascata por `ON DELETE SET NULL` — ver problema
4 abaixo), FKs `ON DELETE RESTRICT`.

### Testes executados

| Comando | Resultado |
|---|---|
| `docker compose up -d postgres` (porta 5433) | OK — saudável |
| `npm run migration:run` | OK — schema criado do zero em banco real |
| `npm run seed:admin` | OK — admin criado, senha impressa uma vez |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run test` (unit) | OK — 2 suites, 7 testes |
| `npm run test:e2e` | OK — 2 suites, 7 testes, contra Postgres real |
| `npm run build` | OK — `dist/main.js` no lugar certo |
| `docker compose build --no-cache api` + `up -d api` | OK — container saudável |
| `curl /health`, `/ready`, `/version` | OK |
| `curl POST /auth/login` (admin do seed) + `GET /auth/me` | OK — cookie de sessão,
  `perfis: ["ADMIN"]` correto após a correção do bug 5 |

### Resultado dos testes

Tudo passou de fato, com execução real contra Postgres e contêiner Docker reais —
substitui a ressalva "não executado" da entrega anterior de Fase 0.

### Problemas encontrados

Validar contra infraestrutura real (não só lint/typecheck) expôs 6 bugs reais que os
testes anteriores (com mocks) não pegavam:

1. **Conflito de porta 5432** com um PostgreSQL nativo do Windows já em execução na
   máquina — corrigido movendo o Postgres do Docker para a porta 5433.
2. **`SEED_ADMIN_PASSWORD=` vazio rejeitado** pela validação de ambiente — o schema
   zod tratava string vazia como inválida em vez de "ausente" (`.optional()` só aceita
   `undefined`, não `""`).
3. **`DATABASE_SSL=false` virava `true` de verdade** — `z.coerce.boolean()` do Zod usa
   `Boolean(valor)` por baixo dos panos, e `Boolean("false")` é `true` em JavaScript.
   Corrigido com um parser explícito que interpreta `"false"/"0"/""` como falso.
4. **Teste e2e violava a própria regra de "sem exclusão física"**: o cleanup tentava
   `DELETE` no usuário de teste; como esse usuário tinha gerado auditoria (login),
   isso disparava um `UPDATE` em cascata (`ON DELETE SET NULL`) na tabela `auditoria`,
   bloqueado pelo trigger de imutabilidade — funcionando exatamente como projetado.
   O bug estava no teste, não no schema; corrigido para desativar (`ativo=false`) em
   vez de apagar.
5. **Imagem Docker sem `dist/main.js`**: um `tsconfig.build.tsbuildinfo` obsoleto (não
   coberto por `.dockerignore`/`.gitignore`) vazava para dentro do build via
   `COPY . .` e corrompia a compilação incremental do TypeScript, fazendo `nest build`
   emitir só parte da árvore de arquivos. Corrigido isolando o buildinfo dentro de
   `dist/`.
6. **JWT de login sempre com `perfis: []`**: a query de login não carregava a relação
   `usuario.perfis`, então nenhum usuário tinha suas permissões refletidas no token,
   mesmo tendo perfis atribuídos (confirmado com o admin do seed, que tem o perfil
   `ADMIN`). Corrigido com `leftJoinAndSelect`.

### Riscos conhecidos

Riscos já listados na entrada anterior de Fase 0 continuam válidos (sem revogação
ativa de sessão, sem autorização granular por permissão, `npm audit` com
vulnerabilidades transitivas não investigadas). Novo risco desta sessão:

- **Três agentes de IA editando o mesmo repositório `concrejet/` sem coordenação**
  nesta sessão (este agente, "Codex" e "Antigravity" — ver entradas anteriores neste
  arquivo). Não causou dano até agora (backend continua íntegro, verificado após cada
  edição concorrente), mas é um risco de processo, não técnico: decisões de escopo
  dadas a um agente (ex.: "sem telas" dado a este agente) não chegaram aos outros. Ver
  também [docs/revisao-frontend-fase-0.md](revisao-frontend-fase-0.md).

### Pendências

- Todas as pendências já listadas na entrega anterior de Fase 0 continuam válidas.
- **Revisão do frontend registrada em [docs/revisao-frontend-fase-0.md](revisao-frontend-fase-0.md)**:
  2 achados críticos (rotas sem proteção/redirecionamento; login de operador simulado
  sem backend correspondente), 3 achados altos (dados mock sem rotulagem visível;
  testes Playwright que testam comportamento inexistente; ausência de distinção visual
  entre real/simulado/pendente), 2 achados médios (campo `tokenAdmin` morto e inseguro
  no IndexedDB; mocks de produção acoplados diretamente a `OperationPage.tsx`). Cada
  achado tem critério de aceite explícito no documento — nenhuma correção foi aplicada
  nesta sessão, por instrução explícita do usuário.

### Próxima tarefa recomendada

1. Alguém com contexto do frontend deve tratar os achados críticos de
   [docs/revisao-frontend-fase-0.md](revisao-frontend-fase-0.md) antes de qualquer
   demonstração do sistema a terceiros (risco de comunicação: partes simuladas podem
   ser confundidas com reais).
2. Definir um dono único de coordenação entre os agentes que estão trabalhando neste
   repositório, para que decisões de escopo (ex.: "Fase 0 sem telas") sejam
   consistentes entre eles.
3. Seguir para a Fase 1 do backend (núcleo produtivo com histórico imutável) apenas
   depois disso, conforme já recomendado na entrada anterior deste arquivo.

---

## 2026-07-31 — Claude Code (arquiteto de software / engenheiro PostgreSQL) — Re-revisão das correções do Codex no frontend

### Objetivo executado

Revisar as correções que o Codex aplicou no frontend (entrada "2026-07-31 — Codex
(correcao frontend Fase 0)" acima) em resposta aos 7 achados de
[docs/revisao-frontend-fase-0.md](revisao-frontend-fase-0.md), verificando
especificamente os 12 pontos pedidos pelo usuário. Não implementei funcionalidades
novas. Não alterei `frontend/` nem `backend/`, com uma única exceção avaliada e
descartada (ver achado 13 no documento de revisão — a correção não era pequena o
suficiente para aplicar sem uma decisão de design).

### Arquivos criados

Nenhum.

### Arquivos alterados

- `docs/revisao-frontend-fase-0.md` — nova seção "Re-revisão — Correções aplicadas
  pelo Codex", com a verificação item a item dos 12 pontos, o achado crítico novo
  (13) e o veredito final.
- `docs/handoff.md` (este arquivo).

Nota: durante a verificação ao vivo, criei um usuário administrativo adicional no
banco real (`revisao@concretrack.local`, via `npm run seed:admin`) exclusivamente
para reproduzir o fluxo de login admin — não removi nem alterei nenhum dado de
produção existente (consistente com a regra de "sem exclusão física"; ver
[modelo-dados.md](modelo-dados.md)).

### Migrations criadas

Nenhuma.

### Testes executados

Todos executados de fato, não apenas inspecionados:

| Comando | Resultado |
|---|---|
| `npm run typecheck` (frontend) | OK |
| `npm run lint` (frontend) | OK |
| `npm run test` (frontend, Vitest) | OK — 8 suites, **37/37 testes passando** |
| `npm run build` (frontend) | OK (1 aviso informativo de bundling, não é erro) |
| `npx playwright test` (frontend) | OK — **5/5 testes passando**, contra dois
  servidores Vite reais (modo normal porta 5173, modo demo porta 5174) |
| Teste manual ao vivo (Playwright avulso, fora do repositório): login admin real | **Falhou** — ver achado 13 |
| `docker ps` / `curl /health` (backend, antes e depois) | OK — backend permaneceu saudável e intocado |

### Resultado dos testes

Os 12 pontos pedidos pelo usuário foram verificados um a um. 11 confirmam correção
completa e correta pelo Codex, com evidência de execução real (não só leitura de
código): rotas protegidas por guards reais, acesso direto a `/` bloqueado (testado),
login fictício bloqueado fora do modo demo (testado), modo demonstração identificado
globalmente (testado), nenhuma persistência simulada aparenta sucesso real, mocks
isolados atrás de um contrato `ProductionDataRepository` substituível, `tokenAdmin`
removido do IndexedDB com migration Dexie de limpeza, nenhuma credencial em
`localStorage`/`sessionStorage`, testes Playwright agora batem com o comportamento
real (5/5 passando de verdade), nenhuma funcionalidade de Fase 1 implementada
antecipadamente. O 12º ponto (documentação vs. código) tem uma ressalva de severidade
baixa (comentário desatualizado em `App.tsx`).

Durante a verificação, fui além dos 12 pontos pedidos e testei manualmente o único
fluxo genuinamente real da aplicação (login administrativo via `POST /auth/login`
real) — e encontrei um bug crítico não coberto pela correção do Codex: **o login
admin autentica de verdade no backend (cookie de sessão confirmado), mas o frontend
nunca chama `/auth/me` para popular o estado do operador, então `AuthenticationGuard`
mantém o admin preso em `/login` mesmo autenticado.** Detalhes completos, evidência
reproduzida ao vivo e por que não corrigi diretamente (a correção exige uma decisão de
design sobre como representar sessão de admin numa máquina de estados feita para
operador) estão no achado 13 de
[docs/revisao-frontend-fase-0.md](revisao-frontend-fase-0.md).

### Problemas encontrados

1. Confirmação de que os 7 achados da revisão original foram genuinamente corrigidos
   (não apenas superficialmente) — nenhum problema aqui, é uma correção sólida.
2. **Achado 13 (novo, crítico)**: login administrativo real não completa a navegação
   até `/`, apesar de autenticar corretamente no backend — ver acima.
3. Achados de baixa severidade adicionais: labels do componente `Field` sem
   `htmlFor`/`id` associado ao input (afeta acessibilidade e testabilidade via
   `getByLabel`); `unlockSession()` sem o mesmo gate de `capabilities` que
   `loginOperador()` tem; comentário desatualizado em `App.tsx` sobre como o
   roteamento funciona.

### Riscos conhecidos

- **O login administrativo real está efetivamente quebrado do ponto de vista do
  usuário final** (autentica mas não navega) — isto bloqueia qualquer demonstração ou
  uso real do único fluxo não-simulado do frontend hoje. Não é um risco teórico, foi
  reproduzido ao vivo.
- Riscos já listados nas entradas anteriores (coordenação entre múltiplos agentes,
  vulnerabilidades transitivas via `npm audit`, ausência de autorização granular)
  continuam válidos.

### Pendências

- Resolver o achado 13 antes de qualquer demonstração do login administrativo real.
- Resolver os achados de baixa severidade listados acima quando houver oportunidade
  (não são bloqueadores).
- Pendências já listadas nas entradas anteriores continuam válidas (login de
  operador real, dados de produção reais, persistência real de apontamento —
  tudo depende do backend Fase 1).

### Próxima tarefa recomendada

1. Alguém com contexto de frontend deve resolver o achado 13 — decidir como
   representar uma sessão administrativa dentro do modelo de estado hoje centrado em
   operador, e então popular o estado a partir de `GET /auth/me` após login bem
   sucedido, com um teste (e2e ou unitário) que comprove a navegação até `/`.
2. Depois disso, seguir para a Fase 1 do backend, conforme já recomendado nas
   entradas anteriores deste arquivo.

---

## 2026-08-01 — Claude Code (arquiteto de software / engenheiro PostgreSQL) — Revalidação exclusiva do achado 13

### Objetivo executado

Revalidar exclusivamente o achado 13 (login administrativo real não concluía a
navegação até `/admin`/`/`) após a correção aplicada pelo Codex (entrada "2026-07-31 -
Codex (correcao achado 13 frontend Fase 0)" acima), sem reavaliar os achados 1-12 e
sem implementar funcionalidades novas. Executei o login administrativo real contra o
backend ativo, de forma independente do teste que o próprio Codex escreveu.

### Arquivos criados

Nenhum permanente. Scripts de verificação avulsos (Playwright fora do repositório)
foram usados e removidos ao final — não fazem parte do código do projeto.

### Arquivos alterados

- `docs/revisao-frontend-fase-0.md` — nova seção "Revalidação exclusiva do achado 13
  — pós-correção do Codex", com verificação dos 8 requisitos pedidos, mais a
  declaração final "Fase 0 aprovada".
- `docs/handoff.md` (este arquivo).

Backend e frontend do repositório não foram alterados. Criei um usuário administrativo
adicional no banco real (`revalidacao@concretrack.local`, via `npm run seed:admin`)
exclusivamente para o teste — não afeta dados existentes, consistente com a regra de
"sem exclusão física".

### Migrations criadas

Nenhuma.

### Testes executados

Todos executados de fato:

| Comando | Resultado |
|---|---|
| `npm run typecheck` (frontend) | OK |
| `npm run lint` (frontend) | OK |
| `npm run test` (frontend, Vitest) | OK — 9 suites, **46/46 testes passando** |
| `npm run build` (frontend) | OK (aviso informativo de bundling já conhecido) |
| `npx playwright test` (frontend, suíte completa) | OK — **6/6 passando** após eu corrigir um ambiente de teste contaminado por um processo `vite` remanescente de uma verificação manual minha anterior (ver detalhe no documento de revisão) — não era uma regressão do código |
| Script Playwright avulso, independente do teste do Codex: login admin real ponta a ponta | **OK, todos os 8 requisitos confirmados** |
| `docker ps` / `curl /health` (backend, antes e depois) | OK — backend permaneceu saudável e intocado |

### Resultado dos testes

Confirmei ao vivo, de forma independente do teste que o próprio autor da correção
escreveu, que: `POST /auth/login` cria a sessão (cookie `httpOnly` presente);
`GET /auth/me` é chamado de fato e restaura a sessão (capturado via interceptação de
requisições); o administrador sai de `/login` (vai para `/change-password` quando
`deveTrocarSenha=true`, depois `/admin`); um `reload` em `/admin` mantém a sessão
(bootstrap re-popula via `/auth/me`); `AdminGuard` não referencia `OperatorData` nem
`matricula` em nenhum lugar do código (`guards.tsx`); `deveTrocarSenha` é respeitado
de ponta a ponta (força troca, libera acesso depois); logout chama `POST /auth/logout`
real e volta para `/login`; `localStorage` fica vazio e o dump completo do IndexedDB
(todas as 8 object stores) não contém nenhum token, JWT, senha ou PIN em lugar nenhum.

### Problemas encontrados

Nenhum no código revisado. O único problema encontrado durante esta revalidação foi
ambiental e causado por mim mesmo: um processo `vite` de uma verificação manual
anterior nesta sessão ficou ocupando a porta 5174, fazendo o Playwright reaproveitar
(`reuseExistingServer`) um servidor no modo errado (normal em vez de demo) na primeira
tentativa de rodar a suíte completa. Identifiquei a causa, encerrei os processos
remanescentes e confirmei 6/6 testes passando com o ambiente limpo — documentado para
transparência, não é uma falha do código do Codex.

### Riscos conhecidos

Nenhum novo relacionado ao achado 13 — está resolvido e verificado. Riscos de baixa
severidade já documentados na revisão original (comentário desatualizado em
`App.tsx`, labels sem `htmlFor`/`id`, `unlockSession()` sem o mesmo gate de
`capabilities` que `loginOperador()` tem) continuam válidos, sem urgência, e não foram
reavaliados nesta revalidação (fora do escopo pedido).

### Pendências

- Achados de baixa severidade remanescentes (não bloqueiam a aprovação da Fase 0).
- Tudo que já dependia do backend Fase 1 continua pendente: login de operador real,
  dados de produção reais, persistência real de apontamento, sincronização offline.

### Declaração de Fase 0

**Fase 0 aprovada.** Não há bloqueio ativo. O achado 13 — único item que impedia uma
aprovação plena na revisão anterior — está resolvido e verificado com evidência real
e independente. Detalhes completos em
[docs/revisao-frontend-fase-0.md](revisao-frontend-fase-0.md).

### Próxima tarefa recomendada

Seguir para a Fase 1 do backend (núcleo produtivo com histórico imutável: `item`,
`molde`, `configuracao_item_molde`, `tipo_operacao`, `ordem_producao`, `apontamento`,
incluindo `EXCLUDE USING gist` com `tstzrange` para impedir apontamentos simultâneos
na mesma máquina), conforme já recomendado nas entradas anteriores deste arquivo. Os
achados de baixa severidade remanescentes do frontend podem ser resolvidos em paralelo,
sem bloquear o início da Fase 1.

## 2026-08-01 - Fase 1 Cadastros implementada

- Implementa��o realizada no clone isolado `C:\Users\Admin\Documents\pwa-hub-fase1\concrejet`, branch `feature/fase-1-cadastros`.
- Backend: m�dulo `CadastrosModule`, CRUD administrativo autenticado por cookie/httpOnly via `JwtAuthGuard`, permiss�es `recurso.acao`, auditoria em create/update/inativa��o/reativa��o/cancelamento.
- Banco: migration `1730500000000-Fase1Cadastros` cria tabelas de cadastros, constraints de unicidade por empresa/unidade, FKs `RESTRICT`, trigger contra edi��o direta de saldo de lote, movimentos imut�veis e exclus�o de vig�ncia sobreposta para configura��o item/molde.
- Frontend: rota `/admin/cadastros/:resource` sob `AdminGuard`, sem uso de `OperatorData` e sem mocks; formul�rios/tabelas usam endpoints reais.
- Verifica��o: migration aplicada no Postgres local, seed executado, API Docker rebuildada e saud�vel, Playwright normal aprovado com cria��o real de item.
- Observa��o: lint completo ainda falha por CRLF pr�-existente em todo o reposit�rio; arquivos alterados foram validados com ESLint seletivo sem warnings.

## 2026-08-01 - Correcao isolada de lotes de resina

- Escopo restrito ao modulo `resin-lots` da Fase 1.
- Causa raiz confirmada em logs reais da API: a tela enviava `resinaId` e `fornecedorId` digitados livremente, como `teste` e `ricardo`, e o backend tentava persistir esses valores em colunas UUID, gerando `invalid input syntax for type uuid`. Durante a validacao real tambem foi corrigido o mapeamento de `MovimentoEstoqueLote.quantidadeKg`, que apontava para `quantidadeKg` em vez de `quantidade_kg`.
- Frontend: `resinaId` e `fornecedorId` passaram a ser seletores carregados da API real; as opcoes exibem codigo/descricao da resina e documento/nome do fornecedor, mas o POST envia somente os IDs reais. O formulario inclui origem, quantidade inicial, recebimento, validade, custo por kg, status e ativo; saldo atual nao e editavel e aparece apenas na listagem.
- Backend: criacao de lote valida UUIDs, existencia/atividade de resina e fornecedor, origem/status, duplicidade de codigo e quantidade inicial; `saldoAtualKg` e calculado a partir de `quantidadeInicialKg`; POST/PATCH com saldo direto e rejeitado; erros de PostgreSQL sao convertidos para respostas controladas.
- Banco: migration `1730600000000-CorrigeLotesResina` adiciona `origem`, `validade`, `custo_por_kg`, `status`, permite fornecedor opcional fora de compra e cria checks de dominio.
- Verificacao executada: backend typecheck/test/build, frontend typecheck/Vitest/build, migration real, rebuild da API Docker, teste manual HTTP real e Playwright especifico `e2e/resin-lots.normal.spec.ts`.
- Resultado: lote criado com sucesso via API e UI real, com saldo inicial igual a quantidade inicial; UUID invalido e tentativa de alterar saldo retornaram 400 em vez de 500.
# Handoff - Atualizacao Fase 2 - 2026-08-01

Implementado nesta branch: fundacao visual industrial em `frontend/src/ui`; refatoracao visual inicial de `/operation` e `/admin/cadastros`; entidade/migration/servicos/controller de apontamento de producao; calculo de perdas com testes unitarios; login operacional por PIN e seed de massa de desenvolvimento.

Validacoes executadas: typecheck backend/frontend, Jest backend, Vitest frontend, builds backend/frontend, migration e seed contra Postgres local, health/ready/version da API.

Pendencias conhecidas: Playwright completo ainda precisa ser revalidado no fluxo real; frontend tablet precisa carregar IDs reais da API; guards/permissoes operacionais ainda nao estao fechados; offline/sync e ocorrencias nao fazem parte desta entrega.
