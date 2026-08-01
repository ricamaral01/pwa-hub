# Plano técnico consolidado — Etapa 1 e Fases 2 a 6

**Status:** planejamento técnico. Nenhum código, migration, entidade ou tela foi criado ou
alterado a partir deste documento. É a especificação executável para o agente de
implementação (Codex), no mesmo nível de detalhe de
[fase-1-cadastros.md](fase-1-cadastros.md).

**Branch de origem:** `feature/fase-1-cadastros`.
**Commit-base:** `06ab41f` (Fase 1 implementada + correção de lotes de resina).

Este é o documento **mestre**. Os detalhes que não cabem aqui sem duplicação estão em:

- [design-system-industrial.md](design-system-industrial.md) — Etapa 1 completa.
- [maquinas-de-estado.md](maquinas-de-estado.md) — apontamento e ocorrência.
- [offline-sync.md](offline-sync.md) — Fase 4 completa.
- [calculos-oee.md](calculos-oee.md) — Fase 6 completa (fórmulas, views, jobs).
- [backlog-validacao-fase-6.md](backlog-validacao-fase-6.md) — o que precisa ser
  confirmado pelo processo industrial.

Cada fase abaixo usa exatamente as mesmas 16 subseções.

---

## 0. Diagnóstico do que já existe (leitura direta do repositório)

Levantado por leitura de `backend/src/**`, `frontend/src/**`, as três migrations
existentes e `docs/referencia-ui/**` — não por suposição.

### 0.1 Backend

| Já existe | Onde | Uso nas Fases 2–6 |
|---|---|---|
| `BaseEntity` (`id` uuid, `criadoEm`, `atualizadoEm`, `versao` optimistic lock) | `common/entities/base.entity.ts` | Toda entidade nova estende, sem exceção |
| `GlobalExceptionFilter`, `ValidationPipe` global (`whitelist + forbidNonWhitelisted + transform`), `CorrelationIdMiddleware`, logger pino, `ThrottlerGuard` global | `common/`, `main.ts`, `app.module.ts` | Sem alteração |
| `JwtAuthGuard` + `jwt.strategy.ts` + `@CurrentUser()` | `modules/auth` | Reaproveitado; o login de **operador** (matrícula/PIN) ainda não existe — é criado na Fase 2 |
| `CadastroPermissionsService.assertCan(usuarioId, chave)` | `modules/cadastros/permissions.service.ts` | Resolve permissão **por request** via SQL (`usuario → usuario_perfil → perfil → perfil_permissao → permissao`), aceitando `sistema.administrar` como curinga. É a base do `PermissionsGuard` das fases novas — deve ser **promovido para `common/`**, não copiado |
| `AuditoriaService.registrar()` + tabela `auditoria` imutável por trigger | `modules/auditoria` | Chamado em toda escrita relevante das fases novas |
| `CadastrosModule` genérico dirigido por registry (`CADASTRO_RESOURCES`), controller `/:resource` com `list/get/create/update/inactivate/reactivate` | `modules/cadastros` | **Não é o padrão a seguir para produção.** Apontamento, ocorrência e estoque têm regra de negócio densa e máquina de estados — precisam de módulo/service/DTO dedicados, não do CRUD genérico |
| `maquina`, `dispositivo`, `empresa`, `unidade`, `usuario`, `perfil`, `permissao` | Fase 0 | Referenciados pelas tabelas novas |
| 12 cadastros da Fase 1 (`funcao`, `colaborador`, `operacao`, `tipo_ocorrencia`, `fornecedor`, `resina`, `lote_resina`, `movimento_estoque_lote`, `item`, `molde`, `configuracao_item_molde`, `ordem_producao`) | `modules/cadastros/entities.ts` | Base de tudo. Ver 0.4 para o que precisa ser estendido |
| Extensão `btree_gist` **já habilitada** e `EXCLUDE USING gist` já em uso em `configuracao_item_molde` | `1730500000000-Fase1Cadastros.ts` | O risco 1 da Fase 1 (extensão indisponível) **está resolvido** — o mesmo mecanismo pode ser usado sem nova investigação para `apontamento` e `ocorrencia` |

Nomes de rota atuais: o backend **não usa `setGlobalPrefix`**. Os controllers de
cadastro respondem na raiz (`/functions`, `/resin-lots`, ...) e o frontend chama via
`BASE_URL = '/api'` com rewrite no proxy do Vite (`/api/* → /*`). As fases novas
**mantêm esse contrato** (rota na raiz do backend, `/api` no cliente) — introduzir
`/api/v1` agora quebraria a Fase 1 já entregue sem benefício proporcional.
Slugs de recurso em inglês-kebab (`resin-lots`, `production-orders`) é a convenção já
estabelecida e deve ser seguida (`production-entries`, `occurrences`, `stock-movements`).

### 0.2 Frontend

| Já existe | Onde | Situação |
|---|---|---|
| Máquina de estados de 17 estados (Zustand + `VALID_TRANSITIONS`) | `src/store/session.store.ts` | **Estender**, não recriar — ver [maquinas-de-estado.md](maquinas-de-estado.md) |
| Dexie v2 com 8 stores (`deviceConfig`, `activeSession`, `activeAppointment`, `appointmentQuantities`, `activeStop`, `queue`, `conflicts`, `productionCache`) | `src/db/schema.ts` | Base da Fase 4; falta versionamento/idempotência real, backoff e dependência entre registros |
| `useQueue()` com `enqueue`/`processQueue`/`cleanSynced`/`checkConnectivity` | `src/hooks/useQueue.ts` | `processQueue` ainda é **mock** (`// TODO: chamar API real aqui` + `setTimeout`). A Fase 4 substitui por envio real |
| Padrão de repositório substituível (`ProductionDataRepository` + `getProductionDataRepository()` escolhendo Mock/Api por `isDemoMode`) | `src/features/production/**` | Padrão obrigatório para todo acesso a dados novo |
| `apiClient` Axios central (correlation id por request, `withCredentials`, evento `concretrack:session-expired` no 401) | `src/api/client.ts` | Reaproveitado; a Fase 4 acrescenta header `Idempotency-Key` |
| Guards (`DeviceActivationGuard`, `AuthenticationGuard`, `AdminGuard`, `OperatorGuard`) | `src/router/guards.tsx` | Reaproveitados |
| Tela `/admin/cadastros/:resource` dirigida por `cadastroResources` | `src/features/cadastros/resources.ts`, `src/pages/admin/CadastrosPage.tsx` | Funcional, mas com os defeitos de UI que a Etapa 1 corrige (IDs técnicos como campo digitável, labels sem acento, booleano cru, menu não agrupado) |
| PWA (`vite-plugin-pwa`, `registerType: 'prompt'`, landscape, NetworkFirst para `/api`) | `vite.config.ts` | Base da Fase 4 |
| Identidade visual escura (`--bg-primary: #1F242C`, Inter via Google Fonts) | `src/index.css`, `docs/interface.md` | **Substituída** na Etapa 1 pela paleta clara ISO 3864 de `docs/referencia-ui/estilo.css`, sem webfont externa |

### 0.3 Divergência conhecida entre plano da Fase 1 e Fase 1 implementada

O implementado usa `descricao` onde o plano dizia `nome`, `versaoConfiguracao` onde
dizia `version`, `pesoPecaG` (gramas) onde dizia `pesoPecaGramas`, `cavidades` onde
dizia `numeroCavidades`, e `ordem_producao` tem `numero`/`moldeId`/`quantidadePlanejada`/
`dataInicioPlanejada` em vez de `codigo_interno`/`quantidade_programada`/`data_prevista`.
**As Fases 2–6 devem referenciar os nomes REALMENTE implementados** (`entities.ts`),
não os do plano da Fase 1.

Campos do plano da Fase 1 que **não** foram implementados e que as fases novas exigem:
`configuracao_item_molde.ciclo_custo_segundos`, `configuracao_item_molde.limite_perda_percentual`,
`tipo_ocorrencia.categoria`, `tipo_ocorrencia.exige_acao_corretiva`,
`movimento_estoque_lote.saldo_resultante_kg`, `lote_resina.status = QUARENTENA`.
Isso é tratado como extensão explícita (0.4), não como bug da Fase 1.

### 0.4 Extensões de tabelas da Fase 1 exigidas pelas fases novas

| Tabela | Coluna nova | Fase que exige | Motivo |
|---|---|---|---|
| `configuracao_item_molde` | `limite_perda_percentual numeric(5,2) NOT NULL DEFAULT 100` | 2 | O alerta "acima do limite de perda do item" da tela de apontamento não tem de onde ler o limite hoje |
| `configuracao_item_molde` | `ciclo_custo_segundos numeric(8,2) NULL` | 6 | Performance/custo usa ciclo de custo, distinto do ciclo padrão |
| `tipo_ocorrencia` | `categoria varchar(30) NOT NULL DEFAULT 'OUTRO'` + `CHECK` | 3 | Agrupamento "onde foi" da tela de parada (molde, desumidificador, energia, qualidade, ...) |
| `tipo_ocorrencia` | `planejada boolean NOT NULL DEFAULT false` | 3 e 6 | Disponibilidade separa parada planejada de não planejada |
| `tipo_ocorrencia` | `exige_acao_corretiva boolean NOT NULL DEFAULT false` | 3 | Regra "sem ação corretiva a parada fica pendente" |
| `movimento_estoque_lote` | `saldo_resultante_kg numeric(12,3) NOT NULL` | 5 | Reconstrução do saldo sem recalcular a série inteira |
| `movimento_estoque_lote` | `apontamento_id uuid NULL`, `blenda_id uuid NULL`, `idempotency_key uuid NULL UNIQUE` | 5 | Rastrear a origem do consumo e impedir baixa dupla |
| `colaborador` | `pin_hash varchar(255) NULL`, `pin_atualizado_em timestamptz NULL`, `tentativas_pin integer NOT NULL DEFAULT 0`, `bloqueado_ate timestamptz NULL` | 2 | Login de operador por matrícula + PIN (a coluna `pin_hash` do plano da Fase 1 não chegou a ser criada) |
| `maquina` | `ciclo_teorico_segundos numeric(8,2) NULL` | 6 | Fallback de performance quando não há configuração item/molde |

Toda extensão acima é `ALTER TABLE ... ADD COLUMN` com `DEFAULT` seguro — nenhuma
recriação de tabela, nenhum `DROP` de coluna existente.

---

# Etapa 1 — Design System industrial e refatoração visual

Especificação completa em [design-system-industrial.md](design-system-industrial.md).
Aqui fica só o resumo executivo nas 16 subseções.

### 1. Dependências

- Fase 1 entregue e funcional (é ela que será refatorada visualmente).
- `docs/referencia-ui/*` aprovada como especificação visual obrigatória.
- **Nenhuma dependência de backend.** Esta etapa não toca em nenhum contrato de API.

### 2. Banco e migrations

**Nenhuma.** Zero migrations, zero alteração de schema. Se esta etapa exigir uma
migration, algo foi feito errado.

### 3. Backend

**Nenhuma alteração.** Nem controller, nem DTO, nem permissão. Único ponto de atenção:
o frontend passa a exibir rótulos amigáveis e selects de relacionamento, o que aumenta a
quantidade de `GET` de listas auxiliares (ex.: carregar funções para o select de
colaborador) — isso usa endpoints que **já existem**, sem contrato novo.

### 4. Frontend

- `src/styles/tokens.css` — tokens portados de `docs/referencia-ui/estilo.css`
  (cor, tipografia, espaço, raio, sombra, `--toque: 56px`).
- Duas cascas: `TabletShell` (1280×800 paisagem, sem scroll) e `DesktopShell`
  (1440×900, sidebar escura + conteúdo claro).
- 24 componentes mínimos (lista completa e props em
  [design-system-industrial.md](design-system-industrial.md#5-catálogo-de-componentes)).
- Refatoração de `/admin/cadastros/:resource` para `DesktopShell` + `DataTable` +
  `FilterBar` + formulário específico por recurso, sem mudar `features/cadastros/api.ts`.
- Remoção da webfont externa (Inter/Google Fonts) — pilha de fonte do sistema.

### 5. Regras críticas

1. **Nenhum contrato de backend muda.** `features/cadastros/api.ts` e os DTOs continuam
   idênticos; o que muda é a camada de apresentação.
2. **No tablet não existe** `<select>` nativo, teclado nativo, scroll vertical na tela
   principal nem layout retrato. Lista curta vira grade de `TouchCard`.
3. **Cor é sinalização, não decoração** (ISO 3864). Nenhuma cor aparece sem significar
   estado, e nenhum estado é comunicado só por cor (sempre cor + ícone + texto).
4. **Campo calculado nunca é editável** e é exibido em tipografia maior que o campo
   digitado.
5. Todo número usa `.num` (monoespaçada, `tabular-nums`) para a coluna não dançar
   enquanto o operador digita.
6. Nenhum ID técnico (UUID) aparece como campo digitável ou coluna de tabela.

### 6. Endpoints

Nenhum novo. Nenhum alterado.

### 7. Permissões

Nenhuma chave nova. O menu lateral passa a **ocultar** o item cuja permissão
`<recurso>.consultar` o usuário não tem (hoje a rota é acessível e só o backend recusa).

### 8. Testes unitários (Vitest)

- Render de cada componente novo nos seus estados (`StatusLamp` nos 4 estados,
  `NumericField` com/sem foco, `IndustrialAlert` nos 3 níveis).
- `NumericKeypad`: dígito, vírgula decimal única, apagar, limite de casas decimais.
- `DataTable`: ordenação, estado vazio, estado de carregamento, estado de erro.
- Formatadores: número pt-BR com separador de milhar, booleano → `Ativo`/`Inativo`,
  data ISO → `dd/MM/aaaa`, UUID → rótulo humano do relacionamento.
- `FilterBar`: debounce da busca, limpar filtros.

### 9. Testes de integração

Não se aplica (não há backend novo). Substituído por testes de composição em Vitest:
`CadastrosPage` renderizada com repositório mockado exibe cabeçalhos amigáveis,
`Ativo`/`Inativo` em vez de `true`/`false`, e selects populados em vez de campos de UUID.

### 10. Testes Playwright

- `/admin/cadastros/collaborators`: o campo Função é um `<select>` com rótulos legíveis;
  nenhum input de UUID visível; salvar envia só o ID.
- Tabela mostra total de registros e paginação; ações Editar/Inativar/Reativar presentes
  e rotuladas.
- Menu lateral agrupado por categoria, com acentuação correta (`Máquinas`, `Funções`,
  `Ordens de produção`).
- Viewport 1280×800: nenhuma tela do posto tem scroll vertical
  (`document.body.scrollHeight <= 800`).
- Cada `<label>` tem `htmlFor` apontando para um controle existente (`getByLabel`
  funciona em todos os campos do formulário).

### 11. Critérios mínimos para avançar

- `npm run lint`, `typecheck`, `test`, `build`, `test:e2e` do frontend passando **de
  fato** (executados, não apenas escritos).
- Nenhum arquivo de `backend/` modificado no diff da etapa.
- As 12 telas de cadastro renderizam sem nenhum campo de UUID digitável.
- Tokens vivem em um único arquivo; nenhum valor hexadecimal literal fora dele.

### 12. Itens que podem ir para backlog

- Tema escuro opcional para o desktop.
- Animações/transições além de foco e estado.
- Componente de gráfico (só é necessário na Fase 6).
- Modo alto contraste e ajuste de tamanho de fonte pelo usuário.
- Internacionalização (o sistema é pt-BR only por decisão).

### 13. Itens que não podem ser adiados

- Alvo de toque mínimo de 56px no tablet e 34px no desktop.
- Ausência total de `<select>` nativo e de scroll vertical nas telas de posto.
- `htmlFor`/`id` em todo par label/controle (regressão já corrigida uma vez na Fase 0 —
  ver `CHANGELOG` 0.2.4; não pode voltar).
- Estado nunca comunicado só por cor.
- Remoção da webfont externa (o tablet opera offline em galpão).

### 14. Riscos

1. Refatoração visual ampla sem teste de regressão suficiente pode quebrar fluxos da
   Fase 1 já validados (mitigação: Playwright da Fase 1 deve continuar verde **antes** de
   qualquer merge).
2. Trocar paleta escura por clara invalida `docs/interface.md`, que ficará desatualizado
   se não for editado junto.
3. Componentizar cedo demais gera abstrações erradas: só criar componente que aparece em
   pelo menos duas telas de referência.

### 15. Rollback

Etapa puramente de frontend: rollback é `git revert` dos commits da etapa. Nenhum dado,
nenhuma migration, nenhum contrato afetado. Recomenda-se um commit por bloco
(tokens → componentes → shells → refatoração de cadastros) para permitir reverter só o
bloco defeituoso.

### 16. Ordem exata para o Codex

1. `src/styles/tokens.css` + remoção da webfont + reset — sem tocar em nenhuma tela.
2. Primitivos sem dependência: `StatusLamp`, `TouchCard`, `IndustrialAlert`,
   `EmptyState`, `LoadingState`, `ErrorState`, `KpiCard`.
3. Entrada: `NumericKeypad`, `NumericField`, `TouchSelect`, `ConfirmationDialog`.
4. Cascas de tablet: `TabletShell`, `MachineHeader`, `OperatorHeader`,
   `TabletActionBar`, `OfflineIndicator`, `SyncIndicator`.
5. Cascas de desktop: `DesktopShell`, `DesktopSidebar` (menu agrupado), `DesktopHeader`,
   `DesktopToolbar`, `FilterBar`, `DataTable`, `Pagination`.
6. Refatorar `/admin/cadastros/:resource` sobre as cascas de desktop, um recurso por vez,
   começando por `functions` (o mais simples) e terminando por `resin-lots` (o mais
   complexo, já com selects reais — generalizar o padrão dele para os demais).
7. Atualizar `docs/interface.md` com a paleta e o layout novos.
8. Rodar a suíte completa do frontend e o Playwright da Fase 1 sem alteração de asserções
   de negócio.

---

# Fase 2 — Apontamento de produção

A fase mais crítica do sistema. Telas de referência:
`02-tablet-identificacao.html` e `01-tablet-apontamento.html`.

### 1. Dependências

- Etapa 1 concluída (a tela de apontamento é construída direto sobre o design system —
  construí-la antes significa refazê-la).
- Fase 1: `maquina`, `dispositivo`, `colaborador`, `operacao`, `item`, `molde`,
  `configuracao_item_molde`, `ordem_producao`, `lote_resina`.
- Extensões de 0.4: `configuracao_item_molde.limite_perda_percentual`,
  `colaborador.pin_hash` e correlatos, `maquina.ciclo_teorico_segundos`.
- `PermissionsGuard` promovido de `CadastroPermissionsService` para `common/`.

### 2. Banco e migrations

Migration `17307xxxxxxxx-Fase2Apontamento`.

**Tabelas novas:**

`turno` — `empresa_id`, `codigo`, `nome`, `hora_inicio time`, `hora_fim time`,
`cruza_meia_noite boolean`, `ativo`. Único `(empresa_id, codigo)`.

`apontamento` — tabela central:

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id, unidade_id | uuid FK | `RESTRICT`, obrigatórias |
| maquina_id | uuid FK → maquina | `RESTRICT`, obrigatória |
| dispositivo_id | uuid FK → dispositivo | `RESTRICT`, opcional (nulo em lançamento web) |
| operacao_id | uuid FK → operacao | `RESTRICT`, obrigatória |
| colaborador_id | uuid FK → colaborador | `RESTRICT`, obrigatória |
| turno_id | uuid FK → turno | `RESTRICT`, opcional |
| ordem_producao_id | uuid FK → ordem_producao | `RESTRICT`, **opcional** (a tela prevê "Sem O.P. — produção avulsa") |
| item_id, molde_id | uuid FK | `RESTRICT`, obrigatórios em operação de injeção |
| configuracao_item_molde_id | uuid FK | `RESTRICT`, obrigatório em injeção — **snapshot da vigência aplicada** |
| lote_resina_id | uuid FK → lote_resina | `RESTRICT`, obrigatório em injeção, nulo nas demais operações |
| inicio | timestamptz | obrigatório |
| fim | timestamptz | nulo enquanto aberto |
| peso_peca_kg_aplicado | numeric(12,6) | obrigatório em injeção — cópia congelada da configuração |
| cavidades_aplicadas | integer | idem |
| ciclo_padrao_segundos_aplicado | numeric(8,2) | idem |
| limite_perda_percentual_aplicado | numeric(5,2) | idem |
| pecas_boas, pecas_refugo | integer | `DEFAULT 0`, `CHECK >= 0` |
| borra_kg, galho_kg, falha_preenchimento_kg, outras_perdas_kg | numeric(12,3) | `DEFAULT 0`, `CHECK >= 0` |
| status | varchar(20) | `EM_ANDAMENTO`, `ENCERRADO`, `CANCELADO` (`CHECK IN`) |
| origem | varchar(20) | `TABLET`, `WEB`, `AJUSTE` |
| idempotency_key | uuid | **`UNIQUE` global**, obrigatório |
| justificativa_cancelamento | text | obrigatório quando `CANCELADO` |
| observacao | text | opcional |
| criado_por_usuario_id / colaborador de abertura | uuid FK | `RESTRICT` |

**Colunas geradas (garantem que o cálculo é do banco, não da aplicação):**

```sql
massa_injetada_util_kg numeric GENERATED ALWAYS AS
  (pecas_boas * peso_peca_kg_aplicado) STORED,
perda_total_kg numeric GENERATED ALWAYS AS
  (pecas_refugo * peso_peca_kg_aplicado + borra_kg + galho_kg
   + falha_preenchimento_kg + outras_perdas_kg) STORED,
perda_sem_galho_kg numeric GENERATED ALWAYS AS
  (pecas_refugo * peso_peca_kg_aplicado + borra_kg
   + falha_preenchimento_kg + outras_perdas_kg) STORED
```

O percentual **não** é coluna gerada (divisão com denominador possivelmente zero);
é calculado em view/serviço com `NULLIF` — ver regra crítica 5.4 e
[calculos-oee.md](calculos-oee.md#2-fórmulas-de-perda-fase-2).

**Constraint mais importante da fase inteira** — impede dois apontamentos
sobrepostos na mesma máquina, no banco e não só na aplicação:

```sql
ALTER TABLE apontamento
  ADD CONSTRAINT excl_apontamento_maquina_periodo
  EXCLUDE USING gist (
    maquina_id WITH =,
    tstzrange(inicio, fim, '[)') WITH &&
  ) WHERE (status <> 'CANCELADO');
```

Como `tstzrange(inicio, NULL)` é `[inicio, ∞)`, a constraint também garante
**no máximo um apontamento aberto por máquina** — sem índice parcial adicional.
`btree_gist` já está habilitada desde a Fase 1.

Demais constraints: `CHECK (fim IS NULL OR fim > inicio)`;
`CHECK (status <> 'ENCERRADO' OR fim IS NOT NULL)`;
`CHECK (status <> 'CANCELADO' OR justificativa_cancelamento IS NOT NULL)`.

`apontamento_evento` — append-only, imutável por trigger (mesmo padrão de `auditoria`):
`apontamento_id`, `evento` (`ABERTO`, `QUANTIDADE_ATUALIZADA`, `PARADA_INICIADA`,
`PARADA_ENCERRADA`, `ENCERRADO`, `CANCELADO`, `REABERTO`), `estado_anterior`,
`estado_novo`, `payload jsonb`, `colaborador_id`, `usuario_id`, `origem`,
`correlation_id`, `criado_em`. Sem `ativo`, sem `versao`, sem `UPDATE`/`DELETE`.

### 3. Backend

- `common/guards/permissions.guard.ts` + `@RequirePermission()` — promoção do
  `CadastroPermissionsService` (mover, não duplicar; o módulo de cadastros passa a
  consumir o guard comum).
- `modules/producao/` novo:
  - `apontamento.controller.ts`, `apontamento.service.ts` (transacional),
  - `apontamento-state.machine.ts` — transições válidas no servidor, espelhando
    [maquinas-de-estado.md](maquinas-de-estado.md),
  - `apontamento-calculo.service.ts` — fórmulas de perda, **fonte única**,
  - `dto/` — `AbrirApontamentoDto`, `AtualizarQuantidadesDto`,
    `EncerrarApontamentoDto`, `CancelarApontamentoDto`, `ListarApontamentosQueryDto`.
- `modules/auth` estendido: `operador-auth.service.ts` (matrícula + PIN Argon2id,
  lockout igual ao do usuário administrativo), `OperadorJwtGuard`, cookie httpOnly
  separado do administrativo (nome distinto — sessão de operador nunca é sessão admin).
- `modules/cadastros`: `turno` adicionado ao registry (é cadastro simples).
- `IdempotencyInterceptor` (compartilhado com a Fase 4): lê `Idempotency-Key`, e se a
  chave já foi processada devolve a resposta original — ver
  [offline-sync.md](offline-sync.md).

### 4. Frontend

Rotas: `/posto` (identificação), `/posto/abertura`, `/posto/apontamento`.

- `TabletShell` + `MachineHeader` + `OperatorHeader` (Etapa 1).
- `/posto`: grade de `TouchCard` de operadores + `NumericKeypad` de 4 dígitos
  (`02-tablet-identificacao.html`, quadro superior).
- `/posto/abertura`: três colunas de `TouchCard` — Operação, Ordem de produção,
  Lote de resina (`02-tablet-identificacao.html`, quadro inferior). Botão único
  `Iniciar apontamento · HH:MM`.
- `/posto/apontamento`: três colunas (contexto somente leitura | 5 `NumericField` |
  `NumericKeypad`) + faixa de resultado calculado + `IndustrialAlert` + `TabletActionBar`
  com `Trocar item`, `Registrar parada`, `Salvar parcial`, `Encerrar apontamento`.
- `features/production/repositories/ApontamentoRepository.ts` (interface) +
  `ApiApontamentoRepository` / `MockApontamentoRepository` +
  `getApontamentoRepository()` — mesmo padrão de `getProductionDataRepository()`.
- `useApontamento()` — hook que orquestra store + Dexie + repositório.
- Extensão de `session.store.ts` conforme [maquinas-de-estado.md](maquinas-de-estado.md).
- Cálculo no cliente **espelha** o do servidor, mas o valor persistido é sempre o do
  servidor (o cliente recalcula só para feedback imediato).

### 5. Regras críticas

**5.1 — Não pode haver dois apontamentos sobrepostos na mesma máquina.** Garantido por
`EXCLUDE USING gist` (seção 2), não por validação de aplicação. A API traduz a violação
para `409` com mensagem de negócio ("já existe apontamento em andamento nesta máquina"),
nunca vaza o erro do Postgres.

**5.2 — Peso, cavidades, ciclo e limite são congelados na abertura.** O apontamento
grava `configuracao_item_molde_id` **e** cópia dos valores. Alterar a configuração depois
não altera nenhum apontamento passado. Se não existir configuração vigente para
`(item, molde)` na abertura, a abertura é rejeitada com `400`.

**5.3 — Refugo, borra, galho, falha e outras perdas nunca são negativos**; peças boas e
refugo são inteiros `>= 0`. Validado no DTO e no `CHECK`.

**5.4 — Fórmulas de perda (valores de conferência obrigatórios).** Com peso 0,1522 kg,
618 boas, 19 refugo, borra 7,085, galho 2,315, falha 1,135, outras 0:

| Grandeza | Fórmula | Valor esperado |
|---|---|---|
| Injeção útil | `boas × peso` | 94,06 kg |
| Perda total | `refugo × peso + borra + galho + falha + outras` | 13,43 kg |
| Injeção + perdas | `injeção útil + perda total` | 107,49 kg |
| Perda sem galho (kg) | `perda total − galho` | 11,11 kg |
| **Perda sem galho (%)** | `(perda total − galho) / (injeção útil + perda total − galho) × 100` | **10,56 %** |

Se a implementação não reproduzir exatamente esses números, a fórmula está errada.
Detalhamento e casos de borda em
[calculos-oee.md](calculos-oee.md#2-fórmulas-de-perda-fase-2).

**5.5 — Idempotência obrigatória na abertura e no encerramento.** `idempotency_key`
(UUID gerado no tablet) é `UNIQUE`; reenvio da mesma chave devolve o registro existente
com `200`, nunca cria um segundo apontamento.

**5.6 — Encerramento exige quantidades preenchidas e nenhuma ocorrência pendente**
(a regra de ocorrência entra em vigor na Fase 3; na Fase 2 o gancho já existe e retorna
sempre "nenhuma pendência").

**5.7 — Apontamento encerrado nunca é editado nem apagado.** Correção posterior só via
apontamento de ajuste (`origem = 'AJUSTE'`) com referência ao original e justificativa —
mecanismo especificado, implementação no backlog da Fase 6.

**5.8 — Lote de resina obrigatório apenas em operação de injeção.** Operações do tipo
"só quantidade" (montagem, solda, montagem de postes) não exigem lote, item de resina,
nem campos de massa. A distinção vem de `operacao` — ver backlog: o campo que marca a
operação como "consome resina" **precisa ser criado** (`operacao.consome_resina boolean`).

**5.9 — Sessão de operador nunca é sessão administrativa.** Cookie, guard e store
separados. Um operador autenticado por PIN não acessa `/admin/*` em hipótese alguma.

### 6. Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/operador/login` | matrícula + PIN → cookie httpOnly de operador; lockout por tentativas |
| POST | `/auth/operador/logout` | encerra sessão de operador |
| GET | `/auth/operador/me` | operador da sessão + máquina vinculada |
| GET | `/production-entries/open?maquinaId=` | apontamento aberto da máquina (0 ou 1) |
| POST | `/production-entries` | abre apontamento (exige `Idempotency-Key`) |
| PATCH | `/production-entries/:id/quantities` | salva parcial das quantidades |
| POST | `/production-entries/:id/close` | encerra (exige `Idempotency-Key`) |
| POST | `/production-entries/:id/cancel` | cancela com justificativa obrigatória |
| GET | `/production-entries` | lista paginada/filtrada (admin) |
| GET | `/production-entries/:id` | detalhe + eventos |
| GET | `/production-entries/:id/events` | trilha append-only |
| GET | `/shifts` … | CRUD de `turno` pelo registry de cadastros |

Padrão de listagem idêntico ao da Fase 1 (`page`, `limit`, `q`, `ativo`) mais filtros
`maquinaId`, `colaboradorId`, `itemId`, `status`, `turnoId`, `de`, `ate`.

### 7. Permissões

Convenção: `producao.apontamento.<acao>` (o formato efetivo continua sendo
`recurso.acao`, com o recurso namespaceado).

| Chave | Uso |
|---|---|
| `producao.apontamento.consultar` | listagem/detalhe administrativo |
| `producao.apontamento.criar` | abrir apontamento |
| `producao.apontamento.editar` | salvar parcial |
| `producao.apontamento.encerrar` | encerrar |
| `producao.apontamento.cancelar` | cancelar (mais sensível que editar) |
| `turnos.consultar` / `.criar` / `.editar` / `.inativar` / `.reativar` | cadastro de turno |

O operador autenticado por PIN **não** carrega perfis do modelo administrativo: sua
autorização é implícita e restrita às rotas `/production-entries` da própria máquina
vinculada ao dispositivo. Isso deve ser um guard próprio (`OperadorScopeGuard`), não
uma permissão de perfil.

### 8. Testes unitários

- `apontamento-calculo.service`: reproduz exatamente a tabela de 5.4; perda 0 quando
  tudo é 0; percentual `null` (não `NaN`, não divisão por zero) quando denominador é 0;
  arredondamento em 2 casas só na apresentação, nunca no armazenamento.
- Máquina de estados: toda transição válida da tabela de
  [maquinas-de-estado.md](maquinas-de-estado.md) aceita; toda inválida rejeitada com erro
  de negócio (não exceção genérica).
- Abertura rejeitada sem configuração vigente para `(item, molde)`.
- Abertura rejeitada com lote de resina inativo/`BLOQUEADO`/`ESGOTADO`.
- Abertura de operação sem resina não exige lote.
- Encerramento rejeitado com `fim <= inicio`.
- Cancelamento sem justificativa rejeitado.
- Idempotência: duas chamadas com a mesma `Idempotency-Key` produzem um registro.
- `OperadorAuthService`: PIN correto autentica; PIN errado incrementa tentativas;
  n tentativas bloqueiam; colaborador inativo nunca autentica; PIN nunca retorna no
  payload.

### 9. Testes de integração (Postgres real)

- **Sobreposição**: abrir apontamento na máquina M; tentar abrir um segundo na mesma
  máquina → `409`. Encerrar o primeiro e abrir o segundo → sucesso.
- **Sobreposição retroativa**: com um apontamento encerrado de 08:00–10:00, tentar criar
  outro de 09:00–11:00 na mesma máquina → `409`.
- **Constraint no banco, não só na API**: `INSERT` direto via SQL de um período
  sobreposto → erro do Postgres (prova de que a regra sobrevive a bug de aplicação).
- Colunas geradas: após `INSERT`, `SELECT` retorna os valores de 5.4 sem a aplicação
  ter escrito esses campos.
- `apontamento_evento`: `UPDATE`/`DELETE` direto via SQL é bloqueado pelo trigger.
- Encerramento grava `fim`, muda status e gera evento `ENCERRADO`.
- Autorização: usuário sem `producao.apontamento.criar` recebe `403`.
- Operador da máquina 05 não consegue abrir apontamento na máquina 06 → `403`.

### 10. Testes Playwright

- 1280×800: `/posto` → seleciona operador → digita PIN → chega em `/posto/abertura`
  sem scroll vertical em nenhuma das telas.
- Abertura: escolhe operação Injeção, O.P. e lote → `Iniciar apontamento` → tela de
  apontamento mostra contexto correto (item, molde, cavidades, peso, lote, ciclo).
- Digitação pelo teclado próprio: 618 boas, 19 refugo, 7,085 borra, 2,315 galho,
  1,135 falha → faixa de resultado exibe 94,06 / 13,43 / 107,49 e 10,6 %
  (uma casa) com alerta de "acima do limite" quando o limite do item for 7,0 %.
- Teclado nativo do sistema **não** abre ao tocar em um campo numérico.
- Encerrar apontamento → volta ao estado ocioso, sem apontamento aberto.
- Recarregar a página no meio do apontamento restaura os valores digitados.

### 11. Critérios mínimos para avançar

- Impossível ter dois apontamentos sobrepostos na mesma máquina, provado por SQL direto.
- Números de 5.4 reproduzidos exatamente em unit + integração + Playwright.
- Login de operador real (sem mock, sem `VITE_DEMO_MODE`) funcionando ponta a ponta.
- Apontamento sobrevive a reload do tablet.
- Suítes de backend e frontend executadas e verdes.

### 12. Itens que podem ir para backlog

- Apontamento de ajuste/estorno (`origem = 'AJUSTE'`) e reabertura de apontamento.
- Troca de item sem encerrar (o botão `Trocar item` pode, na v1, encerrar e abrir um
  novo apontamento em sequência).
- Múltiplos operadores simultâneos no mesmo apontamento.
- Assinatura/conferência do líder no encerramento.
- Cálculo de ciclo real automático a partir de sinal da máquina (hoje é derivado do
  tempo e das peças).
- Importação histórica da planilha.

### 13. Itens que não podem ser adiados

- `EXCLUDE USING gist` de sobreposição.
- Congelamento de peso/cavidades/ciclo/limite no apontamento.
- `idempotency_key` `UNIQUE`.
- Não negatividade de todas as quantidades.
- `apontamento_evento` append-only imutável.
- Separação entre sessão de operador e sessão administrativa.
- Fórmula de perda sem galho exatamente como em 5.4.

### 14. Riscos

1. **Fuso horário na fronteira de vigência/turno.** Tudo em `timestamptz`; o servidor
   é a fonte de `now()`. Relógio do tablet **não** define `inicio` quando online; quando
   offline, o `inicio` local é enviado e o servidor registra também `recebido_em`
   (divergência auditável). Risco real de o operador ter o relógio errado.
2. Apontamento aberto "esquecido" por dias trava a máquina para novos apontamentos
   (consequência direta do `EXCLUDE`). Mitigação: alerta no painel a partir de N horas +
   encerramento administrativo com justificativa.
3. Colunas geradas exigem PostgreSQL ≥ 12 (o projeto usa 16 — sem risco real), mas
   `GENERATED ALWAYS` impede `UPDATE` desses campos: qualquer código que tente escrevê-los
   quebra (o que é o comportamento desejado, mas precisa estar claro para quem implementa).
4. `numeric` chega ao TypeORM como `string` (já é assim em `lote_resina`) — somar sem
   converter gera concatenação silenciosa. Toda leitura numérica precisa de conversão
   explícita e teste.
5. Escopo do operador por dispositivo depende de `dispositivo.maquina_id` estar
   corretamente vinculado — hoje a ativação é local no IndexedDB, não validada pelo
   servidor. **Precisa virar vínculo real no backend nesta fase.**

### 15. Rollback

- Migration com `down()` simétrico: `DROP` de `apontamento_evento`, trigger, função,
  `apontamento`, `turno`, e reversão dos `ADD COLUMN` de 0.4.
- Rollback parcial de emergência: `ALTER TABLE apontamento DROP CONSTRAINT
  excl_apontamento_maquina_periodo` (documentar o comando junto da migration) se a
  constraint rejeitar dado legítimo em produção — perde-se a garantia, mas não o dado.
- Frontend: as rotas `/posto/*` são novas; desabilitá-las não afeta `/admin/*`.
- **Nunca** fazer rollback que apague `apontamento` com dado real — se a fase precisar
  ser revertida depois de uso em produção, exportar antes.

### 16. Ordem exata para o Codex

1. Promover `CadastroPermissionsService` → `common/guards/permissions.guard.ts` +
   `@RequirePermission()`; cadastros passam a usar o guard comum (sem mudança de
   comportamento, teste de regressão da Fase 1 verde).
2. Migration de extensão (0.4) — colunas em `configuracao_item_molde`,
   `tipo_ocorrencia`, `colaborador`, `maquina`, `operacao.consome_resina`.
3. Cadastro de `turno` no registry + seed mínimo.
4. Login de operador (backend): `pin_hash`, `operador-auth.service`, guards, cookie,
   endpoint de definição de PIN pelo admin.
5. Migration de `apontamento` + `apontamento_evento` + colunas geradas + `EXCLUDE`.
6. `apontamento-calculo.service` + testes unitários das fórmulas **antes** do controller.
7. `apontamento.service` + máquina de estados no servidor + auditoria + idempotência.
8. Controller + DTOs + permissões + e2e de integração.
9. Frontend: repositório + hook + store estendida.
10. Telas `/posto`, `/posto/abertura`, `/posto/apontamento` sobre o design system.
11. Playwright em 1280×800.
12. Atualizar `docs/fluxo-operador.md` e `docs/interface.md`.

---

# Fase 3 — Ocorrências e paradas

Tela de referência: `03-tablet-parada.html`.

### 1. Dependências

- Fase 2 (uma parada pertence a um apontamento e/ou a uma máquina).
- Extensões de `tipo_ocorrencia` (0.4): `categoria`, `planejada`,
  `exige_acao_corretiva`.

### 2. Banco e migrations

Migration `17308xxxxxxxx-Fase3Ocorrencias`.

`ocorrencia`:

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id, unidade_id | uuid FK | `RESTRICT` |
| maquina_id | uuid FK | `RESTRICT`, obrigatória |
| apontamento_id | uuid FK → apontamento | `RESTRICT`, **opcional** (máquina pode parar sem apontamento aberto — ex.: setup antes de iniciar) |
| tipo_ocorrencia_id | uuid FK | `RESTRICT`, obrigatória |
| colaborador_id | uuid FK | `RESTRICT`, quem registrou |
| planejada | boolean | copiado do tipo na abertura (congelado, como o peso na Fase 2) |
| inicio | timestamptz | obrigatório |
| fim | timestamptz | nulo enquanto não encerrada |
| descricao | text | obrigatória ("3 · O que aconteceu") |
| acao_corretiva | text | obrigatória para encerrar quando `exige_acao_corretiva_aplicado` |
| exige_acao_corretiva_aplicado | boolean | congelado do tipo na abertura |
| status | varchar(30) | `ABERTA`, `EM_ANDAMENTO`, `AGUARDANDO_ACAO_CORRETIVA`, `ENCERRADA`, `CANCELADA` |
| idempotency_key | uuid | `UNIQUE` |
| justificativa_cancelamento | text | obrigatória quando `CANCELADA` |

Constraints:

```sql
ALTER TABLE ocorrencia
  ADD CONSTRAINT excl_ocorrencia_maquina_periodo
  EXCLUDE USING gist (
    maquina_id WITH =,
    tstzrange(inicio, fim, '[)') WITH &&
  ) WHERE (status <> 'CANCELADA');

CHECK (fim IS NULL OR fim > inicio)
CHECK (status <> 'ENCERRADA' OR fim IS NOT NULL)
CHECK (status <> 'ENCERRADA'
       OR exige_acao_corretiva_aplicado = false
       OR (acao_corretiva IS NOT NULL AND length(btrim(acao_corretiva)) > 0))
```

O terceiro `CHECK` é o que torna "sem ação corretiva não encerra" uma regra de banco,
não de aplicação.

`ocorrencia_evento` — append-only imutável, mesmo padrão de `apontamento_evento`.

Índices: `(maquina_id, inicio)`, `(apontamento_id)`, `(tipo_ocorrencia_id)`,
`(status)` parcial `WHERE status <> 'ENCERRADA'`.

### 3. Backend

- `modules/producao/ocorrencia.controller.ts` / `ocorrencia.service.ts` /
  `ocorrencia-state.machine.ts`.
- Gancho no encerramento de apontamento (Fase 2, regra 5.6) passa a consultar
  ocorrências pendentes de verdade.
- `TempoParadaService` — soma de tempo parado por apontamento/máquina/turno, consumida
  pela Fase 6.

### 4. Frontend

- Rota `/posto/parada`, sobre `TabletShell`.
- Layout de `03-tablet-parada.html`: coluna 1 = tipo (Programada / Não programada),
  coluna 2 = grade 3×3 de `TouchCard` com a categoria ("onde foi"), faixa inferior com
  os campos de descrição e ação corretiva, `IndustrialAlert` de pendência, barra de ações
  `Voltar` / `Salvar e continuar parada` / `Retomar produção`.
- `StatusLamp` no `MachineHeader` passa a `Parada · HH:MM:SS`, com cronômetro derivado de
  `inicio` persistido (nunca de `setInterval` acumulado).
- `useOcorrencia()` + `OcorrenciaRepository` (mesmo padrão de repositório).

### 5. Regras críticas

**5.1** Duas ocorrências não podem se sobrepor na mesma máquina (`EXCLUDE`).
**5.2** Ocorrência que exige ação corretiva não encerra sem ela — no banco.
**5.3** Apontamento não encerra com ocorrência não encerrada vinculada (`409`).
**5.4** Turno não é fechado com ocorrência pendente de ação corretiva (regra de painel,
Fase 6, mas o dado que a sustenta nasce aqui).
**5.5** Cronômetro é sempre `agora − inicio` a partir do timestamp persistido; sobrevive
a reload, troca de operador e fechamento do app.
**5.6** `planejada` e `exige_acao_corretiva` são congelados na abertura — mudar o
cadastro do tipo depois não reclassifica paradas históricas (mesma lógica de 5.2 da
Fase 2). Isso é o que impede o OEE do passado de mudar sozinho.
**5.7** Ocorrência encerrada não é editada nem apagada; correção é nova ocorrência de
ajuste com justificativa (backlog).

### 6. Endpoints

| Método | Rota |
|---|---|
| GET | `/occurrences/open?maquinaId=` |
| POST | `/occurrences` (abre; `Idempotency-Key`) |
| PATCH | `/occurrences/:id` (descrição, tipo, categoria enquanto não encerrada) |
| POST | `/occurrences/:id/corrective-action` (registra ação corretiva) |
| POST | `/occurrences/:id/close` |
| POST | `/occurrences/:id/cancel` |
| GET | `/occurrences` (lista admin, filtros `maquinaId`, `tipoOcorrenciaId`, `planejada`, `status`, `de`, `ate`, `semAcaoCorretiva=true`) |
| GET | `/occurrences/:id/events` |

### 7. Permissões

`producao.ocorrencia.consultar` / `.criar` / `.editar` / `.encerrar` / `.cancelar`.
Operador em posto usa o mesmo `OperadorScopeGuard` da Fase 2 (restrito à máquina do
dispositivo).

### 8. Testes unitários

- Máquina de estados da ocorrência: todas as transições de
  [maquinas-de-estado.md](maquinas-de-estado.md).
- Encerrar sem ação corretiva quando exigida → erro de negócio (`409`), não `500`.
- Encerrar sem ação corretiva quando **não** exigida → sucesso.
- `fim <= inicio` rejeitado.
- Duração calculada corretamente atravessando meia-noite e horário de verão.
- Congelamento de `planejada`: alterar o tipo depois não muda a ocorrência.

### 9. Testes de integração

- Abrir duas ocorrências sobrepostas na mesma máquina → `409`.
- `UPDATE` direto via SQL colocando `status = 'ENCERRADA'` sem `acao_corretiva` em tipo
  que exige → bloqueado pelo `CHECK`.
- Encerrar apontamento com ocorrência aberta → `409` com mensagem controlada.
- Fluxo completo: abrir apontamento → abrir parada → salvar descrição → tentar encerrar
  parada (bloqueado) → registrar ação corretiva → encerrar parada → encerrar apontamento.
- `ocorrencia_evento` imutável.

### 10. Testes Playwright

- Tela de parada em 1280×800 sem scroll; cronômetro visível no cabeçalho.
- Encerrar sem ação corretiva: botão `Retomar produção` bloqueado + alerta vermelho
  "Sem ação corretiva a parada fica pendente".
- Preencher ação corretiva → `Retomar produção` habilita → apontamento volta a
  `Rodando`.
- Reload com parada aberta: cronômetro continua do tempo correto (não zera).
- Fechar e reabrir o app: parada continua aberta com o tempo correto.

### 11. Critérios mínimos para avançar

- Impossível encerrar ocorrência que exige ação corretiva sem ela, provado por SQL direto.
- Impossível encerrar apontamento com parada aberta.
- Cronômetro correto após reload e após fechamento do app.
- Suítes verdes.

### 12. Itens que podem ir para backlog

- Ocorrência sem máquina (ocorrência de processo/qualidade geral).
- Anexo de foto na ocorrência.
- Escalonamento automático (notificar líder após N minutos).
- Fluxo de aprovação da ação corretiva pelo líder.
- Ocorrência multi-máquina (queda de energia geral).
- Vínculo com ordem de manutenção.

### 13. Itens que não podem ser adiados

- `EXCLUDE` de sobreposição por máquina.
- `CHECK` de ação corretiva obrigatória.
- Bloqueio do encerramento de apontamento com parada aberta.
- Congelamento de `planejada`/`exige_acao_corretiva`.
- Cronômetro persistente baseado em timestamp absoluto.
- `ocorrencia_evento` append-only.

### 14. Riscos

1. Uma parada pode começar antes do apontamento existir (setup) — `apontamento_id`
   opcional resolve, mas a atribuição de tempo para OEE fica ambígua: **precisa de
   confirmação do processo industrial** (ver backlog).
2. Sobreposição parada × apontamento **não** é proibida — é o caso normal (a máquina
   está parada durante o apontamento). Não confundir com a sobreposição parada × parada,
   que é proibida.
3. Categorias da tela ("Molde", "Desumidificador", "Energia", "Qualidade", "Ajuste de
   processo", "Manutenção", "Falta de material", "Setup", "Outros") são de mockup, não
   validadas com a operação.
4. Horário de verão / mudança de fuso pode gerar duração negativa se algum cálculo usar
   hora local em vez de `timestamptz`.

### 15. Rollback

`down()` simétrico (`ocorrencia_evento` → trigger/função → `ocorrencia`), mais reversão
dos `ADD COLUMN` em `tipo_ocorrencia` se a Fase 2 não os tiver criado antes. Rollback
parcial: `DROP CONSTRAINT` do `EXCLUDE` ou do `CHECK` de ação corretiva, mantendo a
tabela e os dados.

### 16. Ordem exata para o Codex

1. Migration de `ocorrencia` + `ocorrencia_evento` + constraints.
2. `ocorrencia-state.machine.ts` + testes unitários da máquina, antes do service.
3. `ocorrencia.service` (transacional, auditoria, idempotência) + controller + DTOs.
4. Ligar o gancho de encerramento de apontamento (Fase 2, 5.6) à verificação real.
5. e2e de integração incluindo os testes de SQL direto.
6. Frontend: repositório, hook, store (estados `STOP_ACTIVE`/`AWAITING_CORRECTIVE` já
   existem — só passam a ser alimentados por dados reais).
7. Tela `/posto/parada` + cronômetro persistente.
8. Playwright.
9. Atualizar `docs/fluxo-operador.md`.

---

# Fase 4 — Offline e sincronização

Especificação completa em [offline-sync.md](offline-sync.md) (seção "Fase 4"). Resumo:

### 1. Dependências

- Fases 2 e 3 (não há o que sincronizar antes de existir apontamento e ocorrência).
- `Idempotency-Key` já aceito pelos endpoints de escrita das Fases 2 e 3.
- Etapa 1 (`OfflineIndicator`, `SyncIndicator` fazem parte do design system).

### 2. Banco e migrations

Migration `17309xxxxxxxx-Fase4Sincronizacao`.

`idempotencia_requisicao` — `chave uuid PRIMARY KEY`, `rota varchar`, `metodo varchar`,
`usuario_id`/`colaborador_id`, `hash_payload varchar(64)`, `status_resposta integer`,
`corpo_resposta jsonb`, `criado_em`, `expira_em`. Append-only.
Mesma chave com payload diferente (`hash_payload` divergente) → `409` (não devolve a
resposta antiga silenciosamente).

`dispositivo` estendido: `ultima_sincronizacao_em timestamptz`, `versao_app varchar(20)`,
`ativado_em`, `ativado_por_usuario_id` — a ativação deixa de ser só local no IndexedDB.

Nenhuma tabela de negócio nova: a fila vive no cliente.

### 3. Backend

- `IdempotencyInterceptor` global nas rotas de escrita de produção.
- `SyncController`: `GET /sync/bootstrap` (pacote de cadastros essenciais da máquina),
  `GET /sync/delta?desde=` (mudanças desde um timestamp), `POST /sync/heartbeat`.
- Resposta padronizada de conflito `409` incluindo `versaoServidor` e `registroServidor`
  (hoje o cliente não tem o que mostrar no conflito — ver `useQueue.ts`, `versaoServidor:
  '{}' // TODO`).
- Rejeição de operação administrativa vinda de sessão de operador.

### 4. Frontend

- Dexie **v3**: `outbox` (substitui/estende `queue`), `outboxDependencia`,
  `cadastroLocal`, `conflitos`, `syncMeta`. Migration Dexie preservando dados de v2.
- `SyncEngine` — worker lógico único: ordenação topológica da fila, backoff exponencial
  com jitter, limite de tentativas, transição de estados
  `pendente → enviando → sincronizado | erro | conflito`.
- `processQueue` real substituindo o mock atual.
- `OfflineIndicator` / `SyncIndicator` ligados ao contador real.
- Fluxo de nova versão do service worker: nunca atualiza durante apontamento aberto sem
  confirmação.

### 5. Regras críticas

**5.1** Nada é enviado sem `Idempotency-Key` estável (o mesmo UUID em todas as
tentativas). **5.2** Ordem e dependência: `apontamento.abrir` antes de
`ocorrencia.abrir` do mesmo apontamento, antes de `apontamento.encerrar`. Um item cuja
dependência falhou nunca é enviado. **5.3** Conflito (`409`) nunca é resolvido
silenciosamente — vira registro para o supervisor. **5.4** Sessão offline nunca é
falsificada: sem credencial válida em cache verificável, o app não deixa apontar.
**5.5** Operação administrativa (cadastro, permissão, cancelamento) é **bloqueada**
offline. **5.6** Saldo de lote lido offline é exibido como "desatualizado", nunca como
verdade. **5.7** Fila é persistida antes de qualquer tentativa de rede.

### 6. Endpoints

`GET /sync/bootstrap`, `GET /sync/delta`, `POST /sync/heartbeat`,
`GET /conflicts` e `POST /conflicts/:id/resolve` (supervisor).
Todos os demais são os das Fases 2/3 com `Idempotency-Key`.

### 7. Permissões

`sincronizacao.conflito.consultar`, `sincronizacao.conflito.resolver`,
`dispositivos.ativar`. O `bootstrap`/`delta` usa o escopo do dispositivo/operador.

### 8. Testes unitários

Fila: enfileira, ordena por dependência, backoff cresce, para no limite de tentativas,
marca conflito no `409`, marca erro em `5xx`, não reenvia item `sincronizado`.
Hash de payload detecta reuso indevido de chave.

### 9. Testes de integração

Mesma `Idempotency-Key` duas vezes → um registro, duas respostas idênticas.
Mesma chave com payload diferente → `409`. Envio fora de ordem (encerrar antes de abrir)
→ erro tratado. `bootstrap` devolve só os cadastros da máquina do dispositivo.

### 10. Testes Playwright

Perda de conexão durante apontamento (context offline), reload offline, reconexão com
esvaziamento da fila, duplicidade após retry, conflito 409, versão desatualizada,
falha parcial de lote (um item falha, os outros passam), atualização de service worker
durante apontamento aberto.

### 11. Critérios mínimos para avançar

Zero duplicidade sob retry; zero perda de apontamento após kill do app; conflito sempre
visível e nunca auto-resolvido; nenhuma operação administrativa possível offline.

### 12. Itens que podem ir para backlog

Sincronização em lote (multi-registro por request); compressão de payload; sincronização
peer-to-peer entre tablets; resolução de conflito pelo próprio operador; fila
priorizada por criticidade; telemetria de qualidade de rede.

### 13. Itens que não podem ser adiados

Idempotência ponta a ponta; ordem/dependência da fila; conflito nunca silencioso;
proibição de sessão falsa offline; persistência antes da rede; aviso de saldo
desatualizado.

### 14. Riscos

1. IndexedDB pode ser limpo pelo sistema (Android sob pressão de armazenamento) — perda
   de fila. Mitigação: `navigator.storage.persist()` + alerta quando negado.
2. Relógio do tablet errado gera `inicio` inconsistente (mesmo risco da Fase 2).
3. Migration Dexie v2→v3 com dado real em campo pode falhar e travar o app.
4. Service worker servindo bundle antigo com schema Dexie novo (versão cruzada).
5. Fila grande após dias offline → `bootstrap` pesado e envio lento.

### 15. Rollback

Cliente: publicar bundle anterior; Dexie **não** faz downgrade — a v3 deve ser
retrocompatível em leitura, e a v2 não deve ser reintroduzida.
Backend: `idempotencia_requisicao` pode ser dropada sem perda de dado de negócio; sem
ela o sistema volta a aceitar duplicidade (regressão consciente, nunca silenciosa).

### 16. Ordem exata para o Codex

1. Backend: `idempotencia_requisicao` + interceptor + corpo de conflito padronizado.
2. Backend: `sync/bootstrap`, `sync/delta`, `heartbeat`, vínculo real do dispositivo.
3. Cliente: Dexie v3 + migração de dados.
4. Cliente: `SyncEngine` (ordenação, backoff, estados) com testes unitários antes da UI.
5. Substituir o mock de `useQueue.processQueue`.
6. Indicadores visuais + tela de conflitos do supervisor.
7. Playwright dos 8 cenários de rede.
8. Atualizar [offline-sync.md](offline-sync.md) com o que de fato ficou implementado.

---

# Fase 5 — Estoque de resinas e blendas

### 1. Dependências

- Fase 2 (o consumo é baixado a partir do apontamento encerrado).
- Fase 1: `resina`, `lote_resina`, `movimento_estoque_lote`, `fornecedor`.
- Extensões de 0.4 em `movimento_estoque_lote`.

### 2. Banco e migrations

Migration `17310xxxxxxxx-Fase5Estoque`.

- `movimento_estoque_lote` estendido: `saldo_resultante_kg`, `apontamento_id`,
  `blenda_id`, `idempotency_key uuid UNIQUE`, `usuario_id`/`colaborador_id`, `motivo`.
  Continua **append-only e imutável por trigger**.
- `blenda` — cabeçalho da mistura: `empresa_id`, `codigo`, `lote_resultante_id`
  (FK → `lote_resina`, o lote novo gerado), `quantidade_total_kg`,
  `custo_medio_kg`, `maquina_id`/`operacao_id` opcionais, `colaborador_id`,
  `status` (`RASCUNHO`, `EFETIVADA`, `CANCELADA`), `idempotency_key UNIQUE`,
  `observacao`.
- `blenda_componente` — `blenda_id`, `lote_origem_id`, `quantidade_kg CHECK > 0`,
  `percentual numeric(5,2)`, `custo_kg_aplicado`. Único `(blenda_id, lote_origem_id)`.
- `inventario` + `inventario_contagem` — contagem física e ajuste:
  `inventario(empresa_id, data_referencia, status, responsavel_id)`,
  `inventario_contagem(inventario_id, lote_id, saldo_sistema_kg, saldo_contado_kg,
  diferenca_kg, justificativa)`.

Constraints e mecanismo de saldo:

- `lote_resina.saldo_atual_kg` continua protegido por trigger contra `UPDATE` direto;
  a **única** forma de alterá-lo é a função interna que insere um
  `movimento_estoque_lote` na mesma transação (padrão já estabelecido na Fase 1).
- `CHECK (saldo_atual_kg >= 0)` — estoque nunca negativo.
- `saldo_resultante_kg` do movimento é o snapshot pós-movimento; o saldo do lote deve
  sempre ser igual ao `saldo_resultante_kg` do último movimento (verificável por query
  de reconciliação — critério de aceite).
- Transição automática para `status = 'ESGOTADO'` quando o saldo chega a zero.

### 3. Backend

- `modules/estoque/`: `movimento-estoque.service.ts` (**única** porta de entrada para
  qualquer alteração de saldo), `blenda.service.ts`, `inventario.service.ts`.
- `ConsumoApontamentoListener` — ao encerrar um apontamento de injeção, gera o
  movimento de `SAIDA` de `injeção + perdas` kg do lote, com
  `idempotency_key = apontamento_id` (baixa dupla impossível).
- `estoque-reconciliacao.service.ts` — recalcula o saldo a partir da série de movimentos
  e compara com o armazenado (job + endpoint de auditoria).

### 4. Frontend

Rotas administrativas (desktop):
`/gestao/resina/lotes`, `/gestao/resina/blendas`, `/gestao/resina/inventario`,
`/gestao/resina/lotes/:id/movimentos` (extrato).

- `DataTable` + `FilterBar` + `KpiCard` (Etapa 1).
- Formulário de blenda: componentes com percentual, total e custo médio calculados em
  tempo real (campo calculado nunca editável).
- No tablet, a operação "Mistura de resinas" da tela de abertura
  (`02-tablet-identificacao.html`) leva a um fluxo simplificado de blenda — pode ficar
  no backlog se o processo confirmar que a mistura é feita fora do posto.

### 5. Regras críticas

**5.1** Saldo nunca negativo — `CHECK` no banco. Tentativa de consumir mais que o saldo
retorna `409` com mensagem de negócio.
**5.2** Saldo só muda por movimento; nenhum `UPDATE` direto (trigger).
**5.3** Baixa por apontamento é idempotente (`idempotency_key = apontamento_id`);
reencerrar/reprocessar não baixa duas vezes.
**5.4** Quantidade baixada = `injeção útil + perda total` (o material que saiu do lote),
não apenas as peças boas. Ver [calculos-oee.md](calculos-oee.md#2-fórmulas-de-perda-fase-2).
**5.5** Blenda efetivada é atômica: baixa de todos os componentes + criação do lote
resultante + movimento de entrada, tudo na mesma transação. Falha em qualquer
componente aborta tudo.
**5.6** `soma(componentes.quantidade_kg) = blenda.quantidade_total_kg` (tolerância
explícita de arredondamento a definir, ver backlog).
**5.7** Custo do lote de blenda = média ponderada por kg dos custos dos componentes.
**5.8** Lote `BLOQUEADO`/`QUARENTENA`/`ESGOTADO`/inativo não pode ser consumido nem
entrar em blenda.
**5.9** Movimento nunca é editado ou apagado; correção é um movimento de `AJUSTE` com
justificativa obrigatória.
**5.10** Ajuste de inventário exige justificativa e permissão própria (mais sensível que
consumo).

### 6. Endpoints

| Método | Rota |
|---|---|
| GET | `/stock-movements?loteId=&tipo=&de=&ate=` |
| POST | `/stock-movements/adjustments` (ajuste manual com justificativa) |
| GET | `/resin-lots/:id/balance` (saldo + último movimento) |
| GET | `/blends`, `GET /blends/:id` |
| POST | `/blends` (rascunho) |
| POST | `/blends/:id/effectuate` (`Idempotency-Key`) |
| POST | `/blends/:id/cancel` |
| GET/POST | `/inventories`, `POST /inventories/:id/close` |
| GET | `/stock/reconciliation` (divergência saldo × soma de movimentos) |

### 7. Permissões

`estoque.movimento.consultar`, `estoque.movimento.ajustar`,
`estoque.blenda.consultar` / `.criar` / `.efetivar` / `.cancelar`,
`estoque.inventario.consultar` / `.criar` / `.encerrar`.
Consumo automático por apontamento **não** exige permissão de usuário (é efeito do
sistema, registrado com o colaborador do apontamento).

### 8. Testes unitários

- Consumo maior que o saldo → erro de negócio.
- Consumo exato do saldo → `saldo = 0` e status `ESGOTADO`.
- Baixa idempotente: chamar duas vezes com a mesma chave gera um movimento.
- Custo médio ponderado com 2 e 3 componentes (incluindo componente sem custo).
- Blenda com soma de componentes divergente do total → rejeitada.
- Blenda com componente bloqueado → rejeitada.
- Reconciliação detecta divergência artificial.

### 9. Testes de integração

- `UPDATE lote_resina SET saldo_atual_kg = ...` direto via SQL → bloqueado pelo trigger.
- `UPDATE`/`DELETE` em `movimento_estoque_lote` → bloqueado.
- Encerrar apontamento gera exatamente um movimento de saída com a massa correta.
- Reencerrar/reprocessar o mesmo apontamento não gera segundo movimento.
- Blenda efetivada: N movimentos de saída + 1 lote novo + 1 movimento de entrada, em uma
  transação; forçar falha no último componente deixa todos os saldos intactos.
- `saldo_atual_kg` sempre igual ao `saldo_resultante_kg` do último movimento, após 50
  movimentos aleatórios.

### 10. Testes Playwright

- Criar blenda com dois lotes, ver total e custo médio calculados, efetivar, e conferir
  saldo reduzido nos componentes e lote novo criado com o saldo somado.
- Tentar efetivar blenda com quantidade maior que o saldo → mensagem de negócio legível
  (nunca erro cru).
- Extrato de movimentos do lote mostra a saída gerada por um apontamento, com link para
  o apontamento.
- Ajuste de inventário sem justificativa é bloqueado.

### 11. Critérios mínimos para avançar

- Saldo nunca negativo, provado por SQL direto.
- Reconciliação sem divergência após bateria de movimentos.
- Baixa por apontamento idempotente comprovada.
- Suítes verdes.

### 12. Itens que podem ir para backlog

- Reserva de lote para O.P.
- FIFO/FEFO automático na seleção de lote.
- Custo médio móvel do estoque global (hoje custo é por lote).
- Devolução de sobra ao lote de origem.
- Rastreabilidade reversa (de qual lote saiu a peça X).
- Blenda pelo tablet no posto.
- Integração de compras/entrada automática de nota fiscal.
- Moagem/reaproveitamento de galho como lote de resina moída.

### 13. Itens que não podem ser adiados

- Saldo não negativo (banco).
- Saldo só por movimento (trigger).
- Movimento imutável.
- Idempotência da baixa por apontamento.
- Atomicidade da blenda.
- Justificativa obrigatória em ajuste.
- Reconciliação saldo × movimentos disponível como endpoint.

### 14. Riscos

1. Consumo teórico (peso × peças) diverge do consumo real pesado na balança; a diferença
   se acumula no saldo. **Precisa de decisão do processo:** o sistema baixa teórico e
   corrige por inventário, ou aceita entrada de consumo real?
2. Arredondamento em `numeric(12,3)` acumulado em milhares de movimentos.
3. Concorrência de dois apontamentos consumindo o mesmo lote — exige `SELECT ... FOR
   UPDATE` do lote dentro da transação, ou o saldo pode ficar inconsistente sob carga.
4. Baixa retroativa de apontamento sincronizado dias depois (Fase 4) pode tornar o saldo
   negativo em relação ao momento presente.
5. Galho reaproveitado não é modelado — hoje ele só sai do saldo e some.

### 15. Rollback

`down()` simétrico. Atenção: reverter esta fase depois de consumo real **perde o
histórico de movimentos**, que é a única fonte da verdade do saldo. Rollback só é seguro
antes do primeiro apontamento encerrado em produção; depois disso, corrigir para a frente
(migration nova), nunca reverter.

### 16. Ordem exata para o Codex

1. Migration de extensão de `movimento_estoque_lote` + backfill de
   `saldo_resultante_kg` para os movimentos existentes.
2. `movimento-estoque.service` como porta única + testes (incluindo SQL direto).
3. `ConsumoApontamentoListener` + idempotência + `FOR UPDATE` do lote.
4. `blenda` + `blenda_componente` + efetivação transacional.
5. `inventario` + ajuste com justificativa.
6. Endpoint e job de reconciliação.
7. Telas de gestão (lotes, extrato, blendas, inventário).
8. Playwright.

---

# Fase 6 — Painéis, relatórios e OEE

Telas de referência: `04-desktop-painel.html` e `05-desktop-perdas.html`.
Fórmulas, views e jobs em [calculos-oee.md](calculos-oee.md).

### 1. Dependências

- Fases 2, 3 e 5 (sem apontamento, parada e consumo não há indicador).
- `turno` (Fase 2) e `calendario_producao` (criado nesta fase).
- Extensão `configuracao_item_molde.ciclo_custo_segundos` (0.4).

### 2. Banco e migrations

Migration `17311xxxxxxxx-Fase6Indicadores`.

- `calendario_producao` — `empresa_id`, `unidade_id`, `data date`, `turno_id`,
  `maquina_id` (nulo = todas), `minutos_planejados integer`, `tipo`
  (`PRODUTIVO`, `NAO_PRODUTIVO`, `FERIADO`, `MANUTENCAO_PROGRAMADA`), `observacao`.
  Único `(empresa_id, data, turno_id, maquina_id)`.
- `meta_producao` (opcional, alimenta "meta do dia" do painel) — `empresa_id`, `data`,
  `maquina_id`/`item_id` opcionais, `meta_pecas`, `meta_oee_percentual`.
- Views: `vw_apontamento_calculado`, `vw_parada_por_apontamento`,
  `vw_oee_maquina_turno`, `vw_perda_item_mes`.
- Materialized views: `mvw_oee_maquina_dia`, `mvw_perda_item_mes` com
  `UNIQUE INDEX` para permitir `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
- Índices de suporte: `apontamento(maquina_id, inicio)`,
  `apontamento(item_id, inicio)`, `apontamento(turno_id, inicio)`,
  `ocorrencia(maquina_id, inicio)`, todos com `WHERE status <> 'CANCELADO'`.

**Nenhum agregado é fonte da verdade.** Toda materialized view precisa ser
reconstruível a partir de `apontamento` + `ocorrencia` + `movimento_estoque_lote` com
um único comando, e existe um endpoint de reconciliação que compara agregado × bruto.

### 3. Backend

- `modules/indicadores/`: `oee.service.ts`, `painel.service.ts`,
  `relatorio-perda.service.ts`, `exportacao.service.ts` (CSV + layout da planilha).
- `RefreshIndicadoresJob` — refresh incremental (só as partições de data afetadas desde
  o último refresh), agendado; e endpoint manual de refresh para o administrador.
- Cache de resposta curto (30–60 s) nos endpoints de painel, com `Cache-Control:
  no-store` mantido para dados sensíveis.

### 4. Frontend

Rotas (desktop, `DesktopShell`): `/gestao` (painel do dia),
`/gestao/apontamentos`, `/gestao/ocorrencias`,
`/gestao/relatorios/perda-item`, `/gestao/relatorios/perda-valor`,
`/gestao/relatorios/historico`, `/gestao/relatorios/efetivo`,
`/gestao/relatorios/ocupacao-maquina`, `/gestao/relatorios/ciclo-real-padrao`.

- Painel do dia: 4 `KpiCard` (peças boas, injetado, perda sem galho, parada não
  programada), mosaico de máquinas (`maq ok/atencao/parada/ocioso`), tabela de
  apontamentos do turno e painel lateral "Precisa de você".
- Relatório de perda por item: `FilterBar` (período, máquina, grupo, só acima do
  limite), 4 KPIs, `DataTable` com colunas por mês, média, massa perdida e tendência,
  além do rodapé de leitura interpretativa.
- Exportação CSV e "no layout da planilha".

### 5. Regras críticas

**5.1** Agregado nunca é fonte da verdade — sempre reconstruível do bruto.
**5.2** OEE = Disponibilidade × Performance × Qualidade, com as definições exatas de
[calculos-oee.md](calculos-oee.md).
**5.3** Parada planejada reduz o tempo planejado (não entra como indisponibilidade);
parada não planejada reduz a disponibilidade. A classificação usada é a **congelada na
ocorrência** (Fase 3, regra 5.6).
**5.4** Performance usa o ciclo padrão **aplicado no apontamento**, nunca o vigente hoje.
**5.5** Performance > 100 % é sinal de inconsistência: o valor é exibido, marcado como
inconsistente e **não** é truncado silenciosamente.
**5.6** Qualidade = peças boas / (peças boas + refugo). Falha de preenchimento e borra
entram na perda de massa, não na contagem de peças (são kg, não peças).
**5.7** Períodos sem tempo planejado (`minutos_planejados = 0`) produzem indicador
`null`, nunca `0` nem divisão por zero.
**5.8** Todo indicador exibido informa o período e o momento do último refresh.
**5.9** Nenhum relatório expõe UUID; sempre código + descrição.

### 6. Endpoints

| Método | Rota |
|---|---|
| GET | `/dashboard/day?data=&turnoId=` |
| GET | `/dashboard/machines` (estado ao vivo das máquinas) |
| GET | `/dashboard/alerts` ("Precisa de você") |
| GET | `/indicators/oee?de=&ate=&maquinaId=&turnoId=&granularidade=` |
| GET | `/reports/loss-by-item?de=&ate=&maquinaId=&acimaDoLimite=` |
| GET | `/reports/loss-by-value?...` |
| GET | `/reports/machine-occupancy`, `/reports/cycle-actual-vs-standard`, `/reports/headcount`, `/reports/history` |
| GET | `/reports/*/export?formato=csv\|planilha` |
| POST | `/indicators/refresh` (admin) |
| GET | `/indicators/reconciliation?de=&ate=` (agregado × bruto) |

### 7. Permissões

`indicadores.painel.consultar`, `indicadores.oee.consultar`,
`relatorios.perda.consultar`, `relatorios.perda_valor.consultar` (separada — expõe
custo), `relatorios.ocupacao.consultar`, `relatorios.ciclo.consultar`,
`relatorios.efetivo.consultar`, `relatorios.exportar`,
`indicadores.refresh.executar`.

### 8. Testes unitários

- Disponibilidade, Performance, Qualidade e OEE com o conjunto de casos canônicos de
  [calculos-oee.md](calculos-oee.md#7-casos-de-teste-canônicos).
- Denominador zero → `null` em todos os três fatores.
- Performance > 100 % marcada como inconsistente.
- Parada planejada versus não planejada afetando os fatores corretos.
- Apontamento atravessando turnos e meia-noite atribuído corretamente.
- Perda ponderada por kg (não média simples de percentuais) no relatório por item.
- Tendência (melhorando/estável/piorando) com regra determinística documentada.

### 9. Testes de integração

- Agregado da view igual à soma calculada direto de `apontamento` para o mesmo período
  (teste de reconciliação com dados sintéticos).
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` não bloqueia leitura.
- Refresh incremental após inserir um apontamento retroativo recalcula a data afetada.
- Endpoint de painel com 13 máquinas e ~500 apontamentos responde dentro do orçamento de
  tempo definido (limite explícito a fixar, ver backlog).
- Usuário sem `relatorios.perda_valor.consultar` não vê custo em nenhuma resposta.

### 10. Testes Playwright

- 1440×900: painel do dia com 4 KPIs, mosaico das 13 injetoras com as cores corretas por
  estado, tabela do turno e lista de alertas.
- Filtro de data/turno altera os números.
- Relatório de perda por item: filtro "só acima do limite" reduz as linhas; ordenação por
  massa perdida; exportação CSV baixa arquivo.
- Nenhum UUID visível em nenhuma tabela de relatório.
- Máquina com parada não programada aparece em vermelho no mosaico **e** na lista de
  alertas.

### 11. Critérios mínimos para avançar

- Reconciliação agregado × bruto sem divergência.
- Números do painel batendo com consulta manual em SQL sobre os mesmos dados.
- Nenhum indicador com divisão por zero, `NaN` ou `Infinity`.
- Suítes verdes.

### 12. Itens que podem ir para backlog

- Análise de Pareto e drill-down interativo.
- Alertas ativos (e-mail/push) além do painel.
- Comparativo entre turnos/equipes.
- Previsão/tendência estatística além da regra simples.
- OEE por operador (sensível — decisão de RH).
- Exportação em PDF.
- Histórico importado da planilha (necessário para o gráfico "Jan–Jul" da referência).
- Custo real por item (depende de rateio de mão de obra e energia, fora do modelo atual).

### 13. Itens que não podem ser adiados

- Reconstrutibilidade do agregado a partir do bruto.
- Uso do ciclo/limite congelados no apontamento, não os vigentes.
- Tratamento explícito de denominador zero e de Performance > 100 %.
- Classificação planejada/não planejada congelada na ocorrência.
- Permissão separada para relatórios que expõem valor financeiro.

### 14. Riscos

1. Sem histórico importado da planilha, os relatórios comparativos por mês ficam vazios
   nos primeiros meses — expectativa a alinhar com o usuário.
2. Materialized view pode divergir silenciosamente se o refresh falhar; precisa de
   monitoramento e do endpoint de reconciliação (por isso ele é obrigatório).
3. Definição de "tempo planejado" é a decisão que mais muda o OEE e é justamente a menos
   definida hoje (calendário/turno não existe em nenhum dado real ainda).
4. Performance depende de ciclo padrão bem cadastrado; ciclo errado gera indicador
   absurdo e desmoralizante para o time.
5. Custo de query em volume: 13 máquinas × 3 turnos × 365 dias cresce rápido; sem os
   índices e o refresh incremental o painel fica lento em meses.

### 15. Rollback

Views e materialized views são descartáveis (`DROP` + `CREATE`) — não guardam dado
próprio. `calendario_producao` e `meta_producao` guardam dado inserido por usuário:
exportar antes de qualquer `DROP`. Rollback desta fase não afeta apontamento, ocorrência
nem estoque.

### 16. Ordem exata para o Codex

1. `calendario_producao` (+ `meta_producao`) e seu cadastro administrativo.
2. Views simples (`vw_apontamento_calculado`, `vw_parada_por_apontamento`) e testes de
   reconciliação contra o bruto.
3. `oee.service` com as fórmulas + testes unitários canônicos, antes de qualquer tela.
4. Materialized views + índices únicos + job de refresh incremental + endpoint manual.
5. Endpoints de painel e de indicadores.
6. Endpoints de relatório + exportação.
7. Tela `/gestao` (painel do dia).
8. Tela `/gestao/relatorios/perda-item` como padrão dos demais relatórios.
9. Demais relatórios reaproveitando o padrão.
10. Playwright em 1440×900.
11. Atualizar [calculos-oee.md](calculos-oee.md) com o que ficou implementado.

---

## Ordem de execução global recomendada

```
Etapa 1 (Design System)
   │  não depende de backend; habilita todas as telas seguintes
   ▼
Fase 2 (Apontamento)  ── depende de: Fase 1 + extensões 0.4 + PermissionsGuard comum
   │                     entrega: apontamento, login de operador, turno
   ▼
Fase 3 (Ocorrências)  ── depende de: Fase 2 (apontamento, máquina, operador)
   │                     entrega: parada com ação corretiva e cronômetro persistente
   ▼
Fase 4 (Offline/Sync) ── depende de: Fases 2 e 3 (só faz sentido sincronizar o que existe)
   │                     entrega: fila real, idempotência ponta a ponta, conflitos
   ▼
Fase 5 (Estoque/Blendas) ── depende de: Fase 2 (consumo por apontamento) e Fase 1 (lotes)
   │                        pode começar em paralelo à Fase 4 se houver dois executores:
   │                        não há sobreposição de arquivos entre elas, exceto o
   │                        listener de encerramento de apontamento
   ▼
Fase 6 (Painéis/OEE)  ── depende de: Fases 2, 3 e 5 (indicador precisa dos três dados)
```

Regras de sequenciamento que **não** devem ser violadas:

1. **Etapa 1 antes da Fase 2.** Construir a tela de apontamento antes do design system
   significa reescrevê-la — é a lição já registrada nos achados da revisão de frontend da
   Fase 0 (tela construída antes do contrato estável gerou retrabalho).
2. **Fase 3 depois da Fase 2**, porque a regra "não encerra apontamento com parada
   aberta" precisa do apontamento existindo.
3. **Fase 4 depois de 2 e 3**, porque a fila precisa de operações reais e idempotentes
   para transportar; antecipá-la produz uma fila que transporta mocks.
4. **Fase 6 por último**, porque todo indicador é derivado — e o critério de aceite dela
   (reconciliação agregado × bruto) exige dado bruto real das fases anteriores.
5. Apenas as Fases 4 e 5 podem ser paralelizadas entre executores diferentes, e mesmo
   assim com um único dono do encerramento de apontamento (ponto de encontro das duas).
6. Cada fase só é considerada concluída quando os critérios da sua subseção 11 estiverem
   verificados **de fato executando** os comandos, nunca apenas escritos — padrão de rigor
   já estabelecido nas entradas de [handoff.md](handoff.md).

## Estado implementado em 2026-08-01

Fase 2 ajustada para uso real do backend operacional, Fase 3 implementada para
ocorrencias/paradas e Fase 4 implementada no escopo offline/outbox do tablet. Fases 5 e 6
continuam nao iniciadas.
