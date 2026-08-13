# Fase 1 — Cadastros: especificação técnica

**Status:** planejamento técnico. Nenhum código, migration, entidade ou tela foi criado
ou alterado a partir deste documento — é a especificação para implementação futura
(Codex ou outro agente de implementação).

**Branch:** `feature/fase-1-cadastros`.
**Commit-base:** `ce15db2` (Fase 0 aprovada — ver [handoff.md](handoff.md)).

Este documento é a fonte da verdade para a Fase 1. [modelo-dados.md](modelo-dados.md),
[regras-negocio.md](regras-negocio.md) e [permissoes.md](permissoes.md) recebem apenas
um resumo com link de volta para cá, para não duplicar (e divergir) a especificação
completa.

---

## 1. Diagnóstico do que já existe

Levantamento feito por leitura direta de `backend/src/**`, `frontend/src/**` e
`backend/src/database/migrations/1730000000000-Fase0Fundacao.ts` — não por suposição.

### 1.1 Backend (NestJS 10 + TypeORM 0.3 + PostgreSQL, `pg` 8)

| Já existe | Onde | Reaproveitável na Fase 1? |
|---|---|---|
| `empresa`, `unidade` | `modules/organizacao` | Sim — todo cadastro novo pendura em `empresa_id` (multi-tenant) e, quando fizer sentido, `unidade_id` |
| `usuario`, `perfil`, `permissao`, `usuario_perfil`, `perfil_permissao` | `modules/usuarios` | Sim — é a base do controle de acesso administrativo. **Não existe ainda** guard de autorização por permissão (só autenticação) |
| `maquina`, `dispositivo` | `modules/producao-base` | `maquina` já existe com `codigo`, `nome`, `unidade_id`, `ativo` — a Fase 1 estende via `ALTER TABLE`, não recria |
| `auditoria` (genérica, imutável por trigger) | `modules/auditoria` | Sim — `AuditoriaService.registrar()` é reaproveitado por todo módulo novo |
| `BaseEntity` (`id` uuid, `criadoEm`, `atualizadoEm`, `versao` optimistic lock) | `common/entities/base.entity.ts` | Sim — toda entidade nova estende `BaseEntity` |
| `GlobalExceptionFilter`, `ValidationPipe` global, `CorrelationIdMiddleware`, logger pino | `common/`, `main.ts` | Sim, sem alteração |
| `JwtAuthGuard` | `modules/auth` | Autentica (cookie httpOnly); **não autoriza por permissão** — precisa de um `PermissionsGuard` novo (ver seção 12) |
| Login por matrícula/PIN (operador) | — | **Não existe.** Fora do escopo desta Fase 1 (é cadastro administrativo, não login de chão de fábrica) — ver seção 23 |

Convenções de banco já estabelecidas e que a Fase 1 **deve seguir sem exceção**:
tabela/coluna em `snake_case` português, entidade/propriedade TypeScript em
`camelCase`; PK `uuid` via `gen_random_uuid()`; `criado_em`/`atualizado_em`
`timestamptz` automáticos; `versao integer` (optimistic lock TypeORM); nenhuma
tabela de negócio permite `DELETE` de aplicação — apenas `ativo = false`; FK
organizacional/estrutural usa `ON DELETE RESTRICT`.

### 1.2 Frontend (Vite + React 18, scaffold)

Não há telas administrativas implementadas. Existe `frontend/src/pages/admin/`
(`AdminHomePage`, `ChangePasswordPage`) como scaffold mínimo pós-login, e
`AdminGuard`/`AdminAuthBootstrap` funcionais (sessão real via `GET /auth/me`). O
padrão de repositório substituível (`ProductionDataRepository` / Mock / Api,
selecionado por `getProductionDataRepository()`) usado na tela operacional é a
referência de arquitetura a seguir para os novos hooks de cadastro (ver seção 18).

### 1.3 Migrations

Existe uma única migration: `1730000000000-Fase0Fundacao.ts`. A Fase 1 adiciona
migrations novas (numeradas após o timestamp acima) — **não foram criadas nesta
tarefa**, apenas especificadas na seção 5.

### 1.4 Contratos de API atuais

Somente `GET /health`, `GET /ready`, `GET /version`, `POST /auth/login`,
`POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`. Nenhum endpoint de
negócio/cadastro existe hoje.

---

## 2. Modelo de dados detalhado

Todas as tabelas abaixo seguem as convenções da seção 1.1: `BaseEntity`
(`id`, `criado_em`, `atualizado_em`, `versao`), `ativo boolean default true` (exceto
onde outro campo de status assume esse papel — sinalizado explicitamente), FK
estrutural `ON DELETE RESTRICT`, extensão `pgcrypto` já habilitada.

### 2.1 `funcao`

Função/cargo do colaborador (ex.: operador de injeção, líder de turno).

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| codigo | varchar(30) | obrigatório |
| nome | varchar(120) | obrigatório |
| descricao | text | opcional |
| ativo | boolean | default `true` |

Único por `(empresa_id, codigo)`.

### 2.2 `colaborador`

Cadastro do trabalhador do chão de fábrica. **Não é o mesmo conceito que `usuario`**
(login administrativo por e-mail/senha). `colaborador` não autentica nesta fase — é
apenas cadastro, referenciável por futuras entidades operacionais (apontamento,
ocorrência) nas fases seguintes.

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| unidade_id | uuid FK → unidade | `ON DELETE RESTRICT`, opcional |
| funcao_id | uuid FK → funcao | `ON DELETE RESTRICT`, obrigatório |
| matricula | varchar(30) | obrigatório |
| nome | varchar(150) | obrigatório |
| pin_hash | varchar(255) | opcional, nulo nesta fase — coluna preparada para login de operador de uma fase futura; **não implementar leitura/gravação de PIN nesta fase** (ver seção 23) |
| ativo | boolean | default `true` |

Único por `(empresa_id, matricula)`. Índice em `funcao_id`, `unidade_id`.

### 2.3 `maquina` (extensão, não recriação)

A tabela já existe (Fase 0: `unidade_id`, `codigo`, `nome`, `ativo`). A Fase 1 adiciona
colunas via `ALTER TABLE` (migration incremental, mesma tabela):

| Coluna nova | Tipo | Regra |
|---|---|---|
| tipo | varchar(40) | opcional — taxonomia a confirmar (seção 23) |
| capacidade_toneladas | numeric(8,2) | opcional, `CHECK (capacidade_toneladas IS NULL OR capacidade_toneladas > 0)` |

Nenhuma constraint ou índice existente é alterado.

### 2.4 `operacao`

Tipo de operação/etapa de processo (ex.: injeção, montagem, retrabalho).

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| codigo | varchar(30) | obrigatório |
| nome | varchar(120) | obrigatório |
| ativo | boolean | default `true` |

Único por `(empresa_id, codigo)`.

### 2.5 `tipo_ocorrencia`

Catálogo de tipos de ocorrência (parada, defeito de qualidade, manutenção). Apenas o
cadastro do tipo — o registro operacional de ocorrências (com ação corretiva
obrigatória) é explicitamente **fora desta fase** (ver seção 23).

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| codigo | varchar(30) | obrigatório |
| nome | varchar(120) | obrigatório |
| categoria | enum `tipo_ocorrencia_categoria` | obrigatório — taxonomia a confirmar (seção 23); valor provisório: `QUALIDADE`, `MANUTENCAO`, `PARADA`, `OUTRO` |
| exige_acao_corretiva | boolean | default `false` — campo de cadastro; a regra de bloqueio em uso real é da fase de ocorrências, não desta |
| ativo | boolean | default `true` |

Único por `(empresa_id, codigo)`.

### 2.6 `fornecedor`

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| razao_social | varchar(200) | obrigatório |
| cnpj | varchar(14) | opcional (fornecedor estrangeiro/pessoa física pode não ter); quando presente, `CHECK` formato `^[0-9]{14}$`, único por `(empresa_id, cnpj)` quando não nulo |
| contato_nome | varchar(120) | opcional |
| contato_telefone | varchar(30) | opcional |
| contato_email | varchar(180) | opcional, `CHECK` formato básico quando presente |
| ativo | boolean | default `true` |

### 2.7 `resina`

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| codigo | varchar(30) | obrigatório |
| nome | varchar(120) | obrigatório |
| tipo | varchar(60) | opcional — família/tipo de resina (ex.: PP, PEAD); taxonomia a confirmar (seção 23) |
| cor | varchar(60) | opcional |
| densidade_g_cm3 | numeric(6,3) | opcional, `CHECK (densidade_g_cm3 IS NULL OR densidade_g_cm3 > 0)` |
| ativo | boolean | default `true` |

Único por `(empresa_id, codigo)`.

### 2.8 `lote_resina`

Cadastro de lote com saldo controlado. **Não permite edição direta do saldo após a
criação** — ver estratégia na seção 2.9 e regras na seção 13.4.

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| resina_id | uuid FK → resina | `ON DELETE RESTRICT`, obrigatório |
| fornecedor_id | uuid FK → fornecedor | `ON DELETE RESTRICT`, opcional (obrigatório quando `origem = 'COMPRA'` — ver seção 13.4) |
| codigo_lote | varchar(60) | obrigatório |
| quantidade_inicial_kg | numeric(12,3) | obrigatório, `CHECK (quantidade_inicial_kg > 0)` |
| saldo_atual_kg | numeric(12,3) | obrigatório, `CHECK (saldo_atual_kg >= 0)`, **não editável diretamente pela aplicação após o INSERT inicial** |
| custo_kg | numeric(12,4) | opcional, `CHECK (custo_kg IS NULL OR custo_kg >= 0)` |
| data_recebimento | date | obrigatório |
| data_validade | date | opcional, `CHECK (data_validade IS NULL OR data_validade >= data_recebimento)` |
| status | enum `lote_resina_status` | obrigatório — `DISPONIVEL`, `BLOQUEADO`, `ESGOTADO`, `QUARENTENA` |
| origem | enum `lote_resina_origem` | obrigatório — `COMPRA`, `ESTOQUE_INICIAL`, `BLENDA`, `AJUSTE`, `DEVOLUCAO` |
| ativo | boolean | default `true` (desativação lógica do cadastro, independente do `status` operacional) |

Único por `(empresa_id, resina_id, codigo_lote)`. Índices em `resina_id`,
`fornecedor_id`, `status`.

### 2.9 `movimento_estoque_lote` (modelo preparatório, sem consumo automático)

Tabela **append-only** que sustenta `lote_resina.saldo_atual_kg`. Nesta fase, o único
movimento gerado pela aplicação é o de abertura do lote (espelhando
`quantidade_inicial_kg`). Nenhuma tela ou regra de consumo/blenda é implementada — a
tabela existe para que o saldo já nasça auditável e para que a Fase 2 (consumo,
blendas) só precise inserir novos movimentos, sem redesenhar o modelo.

| Coluna | Tipo | Regra |
|---|---|---|
| lote_id | uuid FK → lote_resina | `ON DELETE RESTRICT`, obrigatório |
| tipo | enum `movimento_estoque_tipo` | obrigatório — `ENTRADA`, `SAIDA`, `AJUSTE` |
| quantidade_kg | numeric(12,3) | obrigatório, `CHECK (quantidade_kg <> 0)` (positivo em `ENTRADA`/ajuste positivo, negativo em `SAIDA`/ajuste negativo) |
| saldo_resultante_kg | numeric(12,3) | obrigatório, `CHECK (saldo_resultante_kg >= 0)` — snapshot do saldo após o movimento |
| motivo | text | obrigatório |
| usuario_id | uuid FK → usuario | `ON DELETE RESTRICT`, obrigatório (quem registrou) |
| criado_em | timestamptz | `default now()` (sem `atualizado_em`/`versao` — tabela imutável, como `auditoria`) |

Sem `PATCH`/`DELETE` de aplicação. Índice em `lote_id`. Imutabilidade reforçada por
trigger de banco no mesmo padrão de `auditoria` (bloquear `UPDATE`/`DELETE`).

### 2.10 `item`

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| codigo | varchar(30) | obrigatório |
| nome | varchar(150) | obrigatório |
| descricao | text | opcional |
| unidade_medida | varchar(10) | obrigatório — taxonomia a confirmar (seção 23); valor provisório `UN` |
| ativo | boolean | default `true` |

Único por `(empresa_id, codigo)`.

### 2.11 `molde`

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| codigo | varchar(30) | obrigatório |
| nome | varchar(150) | obrigatório |
| fabricante | varchar(150) | opcional |
| ativo | boolean | default `true` |

Único por `(empresa_id, codigo)`. **Não tem** peso/cavidades/ciclo — esses atributos
são exclusivos da combinação item+molde vigente (seção 2.12), nunca do molde isolado
(um mesmo molde físico pode produzir itens diferentes com pesos/ciclos diferentes).

### 2.12 `configuracao_item_molde` — entidade central, versionada por vigência

Implementa a regra obrigatória do briefing: **peso, cavidades, ciclos e limite de
perda não podem ser sobrescritos historicamente**. Nunca existe `UPDATE` desses
campos — apenas `INSERT` de uma nova vigência, com a anterior encerrada.

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| item_id | uuid FK → item | `ON DELETE RESTRICT`, obrigatório |
| molde_id | uuid FK → molde | `ON DELETE RESTRICT`, obrigatório |
| peso_peca_gramas | numeric(10,3) | obrigatório, `CHECK (peso_peca_gramas > 0)` |
| numero_cavidades | integer | obrigatório, `CHECK (numero_cavidades > 0)` |
| ciclo_padrao_segundos | numeric(8,2) | obrigatório, `CHECK (ciclo_padrao_segundos > 0)` |
| ciclo_custo_segundos | numeric(8,2) | obrigatório, `CHECK (ciclo_custo_segundos > 0)` |
| limite_perda_percentual | numeric(5,2) | obrigatório, `CHECK (limite_perda_percentual >= 0 AND limite_perda_percentual <= 100)` |
| vigencia_inicio | timestamptz | obrigatório |
| vigencia_fim | timestamptz | opcional (nulo = vigente até nova alteração) |
| ativo | boolean | obrigatório — `true` somente na configuração vigente; toda configuração histórica tem `ativo = false` |
| version | integer | obrigatório, `default 1` — número sequencial da revisão **desta combinação item+molde**, distinto de `versao` (optimistic lock do `BaseEntity`); começa em `1` e incrementa a cada nova vigência criada para o mesmo `(item_id, molde_id)` |
| motivo_alteracao | text | obrigatório quando `version > 1` (toda alteração precisa de motivo registrado); opcional na primeira versão |
| criado_por_usuario_id | uuid FK → usuario | `ON DELETE RESTRICT`, obrigatório |

**Constraint de não sobreposição** (o mecanismo que impede vigências conflitantes para
o mesmo item+molde):

```
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE configuracao_item_molde
  ADD CONSTRAINT excl_configuracao_item_molde_vigencia
  EXCLUDE USING gist (
    item_id WITH =,
    molde_id WITH =,
    tstzrange(vigencia_inicio, vigencia_fim, '[)') WITH &&
  );
```

Índices: `(item_id, molde_id, ativo)` (para "buscar a configuração vigente" em O(1) via
índice parcial `WHERE ativo`), `(item_id, molde_id, vigencia_inicio)`.

### 2.13 `ordem_producao`

| Coluna | Tipo | Regra |
|---|---|---|
| empresa_id | uuid FK → empresa | `ON DELETE RESTRICT`, obrigatório |
| codigo_interno | varchar(40) | obrigatório |
| codigo_mega | varchar(40) | opcional |
| item_id | uuid FK → item | `ON DELETE RESTRICT`, obrigatório |
| quantidade_programada | numeric(12,3) | obrigatório, `CHECK (quantidade_programada > 0)` |
| data_prevista | date | obrigatório |
| status | enum `ordem_producao_status` | obrigatório — taxonomia provisória `ABERTA`, `EM_PRODUCAO`, `CONCLUIDA`, `CANCELADA` (a confirmar, seção 23) |
| origem | enum `ordem_producao_origem` | obrigatório — `MANUAL`, `IMPORTACAO` |
| ativo | boolean | default `true` |

Único por `(empresa_id, codigo_interno)`. Índice em `item_id`, `status`,
`data_prevista`. **Sem** integração com o Mega nesta fase — `codigo_mega` é só um
campo de texto livre preenchido manualmente, sem validação externa.

---

## 3. Relações e cardinalidades

```
empresa (1) ──< funcao (N)
empresa (1) ──< colaborador (N) >── funcao (1)
unidade (1) ──< colaborador (N, opcional)
empresa (1) ──< operacao (N)
empresa (1) ──< tipo_ocorrencia (N)
empresa (1) ──< fornecedor (N)
empresa (1) ──< resina (N)
resina (1) ──< lote_resina (N)
fornecedor (1) ──< lote_resina (N, opcional)
lote_resina (1) ──< movimento_estoque_lote (N)
usuario (1) ──< movimento_estoque_lote (N)
empresa (1) ──< item (N)
empresa (1) ──< molde (N)
item (1) ──< configuracao_item_molde (N)
molde (1) ──< configuracao_item_molde (N)
usuario (1) ──< configuracao_item_molde (N, criado_por)
empresa (1) ──< ordem_producao (N)
item (1) ──< ordem_producao (N)
maquina (1) ──< [reservado para apontamento — Fase 2, não referenciado por nada nesta fase]
```

`configuracao_item_molde` é a única tabela N:N "com atributos" (item × molde), e é
tratada como entidade própria (não tabela de associação pura) justamente por carregar
peso/cavidades/ciclo/limite/vigência.

---

## 4. Enums

Implementados como `CHECK ... IN (...)` (mesmo padrão já usado em `auditoria.acao` na
Fase 0 — não `ENUM` nativo do Postgres, para manter consistência e facilitar `ALTER`
futuro sem `ALTER TYPE`):

| Enum | Valores | Tabela |
|---|---|---|
| `tipo_ocorrencia_categoria` | `QUALIDADE`, `MANUTENCAO`, `PARADA`, `OUTRO` | `tipo_ocorrencia.categoria` |
| `lote_resina_status` | `DISPONIVEL`, `BLOQUEADO`, `ESGOTADO`, `QUARENTENA` | `lote_resina.status` |
| `lote_resina_origem` | `COMPRA`, `ESTOQUE_INICIAL`, `BLENDA`, `AJUSTE`, `DEVOLUCAO` | `lote_resina.origem` |
| `movimento_estoque_tipo` | `ENTRADA`, `SAIDA`, `AJUSTE` | `movimento_estoque_lote.tipo` |
| `ordem_producao_status` | `ABERTA`, `EM_PRODUCAO`, `CONCLUIDA`, `CANCELADA` | `ordem_producao.status` |
| `ordem_producao_origem` | `MANUAL`, `IMPORTACAO` | `ordem_producao.origem` |

Todos marcados como "taxonomia provisória, a confirmar com o processo industrial" na
seção 23, exceto `movimento_estoque_tipo` e `lote_resina_origem`/`status`, que vieram
literalmente do enunciado do usuário.

---

## 5. Constraints PostgreSQL (resumo consolidado)

- `pgcrypto` (já habilitada na Fase 0) e `btree_gist` (nova, exigida pelo `EXCLUDE
  USING gist` de `configuracao_item_molde`).
- `UNIQUE` por empresa em todo código de cadastro (`funcao.codigo`,
  `colaborador.matricula`, `operacao.codigo`, `tipo_ocorrencia.codigo`,
  `fornecedor.cnpj` quando não nulo, `resina.codigo`, `item.codigo`, `molde.codigo`,
  `ordem_producao.codigo_interno`), sempre `(empresa_id, coluna)` — nunca globalmente
  único, seguindo o precedente de `usuario.email` na Fase 0.
- `UNIQUE (empresa_id, resina_id, codigo_lote)` em `lote_resina`.
- `CHECK` de valores positivos/faixas em todos os campos numéricos listados na seção 2
  (peso, cavidades, ciclos, limite de perda, quantidades, saldo, custo, densidade,
  capacidade).
- `EXCLUDE USING gist` em `configuracao_item_molde` (seção 2.12) — o mecanismo que
  garante "impedir períodos de vigência sobrepostos para o mesmo item e molde".
- `CHECK (data_validade IS NULL OR data_validade >= data_recebimento)` em
  `lote_resina`.
- `CHECK (vigencia_fim IS NULL OR vigencia_fim > vigencia_inicio)` em
  `configuracao_item_molde`.
- Todas as FKs estruturais com `ON DELETE RESTRICT` (nenhuma `CASCADE` em dado de
  negócio, seguindo o precedente da Fase 0).
- Trigger de imutabilidade em `movimento_estoque_lote`, réplica do padrão já existente
  em `auditoria` (`trg_auditoria_bloquear_update`).
- Trigger de defesa em profundidade em `lote_resina` para `saldo_atual_kg` (ver seção
  13.4 — impede `UPDATE` direto desse campo fora do fluxo de movimento).

---

## 6. Índices

Além dos índices implícitos das `UNIQUE`/`PRIMARY KEY`:

| Tabela | Índice | Motivo |
|---|---|---|
| `colaborador` | `(funcao_id)`, `(unidade_id)` | filtro em telas administrativas e listagens |
| `lote_resina` | `(resina_id)`, `(fornecedor_id)`, `(status)` | busca por resina, fornecedor e status operacional |
| `movimento_estoque_lote` | `(lote_id)` | extrato de movimentos por lote |
| `configuracao_item_molde` | `(item_id, molde_id, ativo)` parcial `WHERE ativo`, `(item_id, molde_id, vigencia_inicio)` | busca da configuração vigente e histórico ordenado |
| `ordem_producao` | `(item_id)`, `(status)`, `(data_prevista)` | listagem/filtro por item, status e data |
| Todas as tabelas com `empresa_id` | `(empresa_id)` | escopo multi-tenant em toda query administrativa |

---

## 7. Estratégia de vigência (`configuracao_item_molde`)

Fluxo de alteração de peso/cavidades/ciclo/limite de perda (a única forma permitida
de "editar" esses valores):

1. Serviço recebe a intenção de alteração (novos valores + `motivo_alteracao`
   obrigatório) para um `(item_id, molde_id)`.
2. Em uma transação:
   a. Busca a configuração `ativo = true` vigente para o par (se não houver, é a
      primeira versão — `vigencia_inicio` pode ser imediata).
   b. `UPDATE` **apenas** `vigencia_fim = now()` e `ativo = false` na configuração
      anterior (os campos de negócio — peso, cavidades, ciclos, limite — nunca são
      tocados nesse `UPDATE`).
   c. `INSERT` de uma nova linha com os novos valores, `vigencia_inicio = now()`,
      `vigencia_fim = null`, `ativo = true`, `version = version_anterior + 1`,
      `motivo_alteracao` preenchido, `criado_por_usuario_id` do usuário autenticado.
   d. Chama `AuditoriaService.registrar()` com `acao = 'UPDATE'`,
      `entidade = 'configuracao_item_molde'`, `entidade_id` da nova linha,
      `dados_antes` = snapshot da configuração encerrada, `dados_depois` = snapshot da
      nova.
3. O `EXCLUDE USING gist` (seção 2.12) garante, no nível do banco, que não é possível
   a transação committar se por algum motivo (concorrência, bug) duas vigências do
   mesmo item+molde se sobrepuserem — mesmo que a lógica de aplicação falhe em
   encerrar a anterior corretamente.
4. Não existe endpoint de `DELETE` para `configuracao_item_molde`, nem de `UPDATE`
   direto dos campos de negócio — apenas o endpoint de "nova vigência" descrito acima
   (ver seção 9.6).
5. Consulta "qual é a configuração vigente de item X + molde Y" é sempre
   `WHERE item_id = X AND molde_id = Y AND ativo = true` (no máximo uma linha, garantido
   pelo `EXCLUDE`). Consulta "qual era a configuração vigente em uma data D no
   passado" (necessária para cálculos retroativos em fases futuras) é
   `WHERE item_id = X AND molde_id = Y AND vigencia_inicio <= D AND (vigencia_fim IS
   NULL OR vigencia_fim > D)`.

---

## 8. Estratégia de auditoria

- Reaproveita `AuditoriaService`/tabela `auditoria` da Fase 0, sem alterar o schema
  dessa tabela.
- Todo `CREATE`, `UPDATE` (inclusive inativação, que é um `UPDATE` de `ativo`) e a
  criação de nova vigência em `configuracao_item_molde` chamam
  `AuditoriaService.registrar()` com `dados_antes`/`dados_depois` (snapshot serializado
  da entidade antes/depois), `usuario_id` do usuário autenticado e `correlation_id` do
  request (já propagado pelo `CorrelationIdMiddleware` existente).
- Para `configuracao_item_molde` especificamente, a auditoria é **complementar**, não
  substituta do histórico: o histórico "de verdade" é a própria tabela (todas as
  vigências permanecem lá, nunca apagadas). A auditoria registra o evento de mudança
  (quem, quando, motivo, correlation id); a tabela registra o estado.
- Para `movimento_estoque_lote`, o registro em si já é o log imutável (mesmo padrão de
  `auditoria`) — não gera também uma linha em `auditoria`, para não duplicar a mesma
  informação em dois lugares com potencial de divergência. `AuditoriaService` é
  chamado apenas para o `CREATE` do `lote_resina` (a abertura do lote), não para cada
  movimento.
- Nenhuma tabela desta fase permite `DELETE` de aplicação — logo `acao = 'DELETE'`
  nunca é usado pelos módulos de cadastro (segue o padrão de Fase 0).

---

## 9. Contratos dos endpoints

Prefixo comum: `/api/v1/cadastros/...` (introduz versionamento de API, inexistente na
Fase 0 — `auth`/`health` continuam sem prefixo por retrocompatibilidade). Todos exigem
`JwtAuthGuard` + `PermissionsGuard` (seção 12). Todos os endpoints de listagem seguem a
seção 11 (paginação/filtros/ordenação). Todos os endpoints de escrita respondem `201`
(criação) ou `200` (alteração/inativação) com o recurso serializado; erros de
validação `400`, permissão insuficiente `403`, não encontrado `404`, conflito de
unicidade `409`.

| Recurso | Endpoints |
|---|---|
| Função | `GET /cadastros/funcoes`, `GET /cadastros/funcoes/:id`, `POST /cadastros/funcoes`, `PATCH /cadastros/funcoes/:id`, `PATCH /cadastros/funcoes/:id/inativar`, `PATCH /cadastros/funcoes/:id/reativar` |
| Colaborador | `GET /cadastros/colaboradores`, `GET /cadastros/colaboradores/:id`, `POST /cadastros/colaboradores`, `PATCH /cadastros/colaboradores/:id`, `PATCH /cadastros/colaboradores/:id/inativar`, `PATCH /cadastros/colaboradores/:id/reativar` |
| Máquina | `GET /cadastros/maquinas`, `GET /cadastros/maquinas/:id`, `POST /cadastros/maquinas`, `PATCH /cadastros/maquinas/:id`, `PATCH /cadastros/maquinas/:id/inativar`, `PATCH /cadastros/maquinas/:id/reativar` (endpoints novos; a entidade já existia, os endpoints não) |
| Operação | `GET /cadastros/operacoes`, `GET /cadastros/operacoes/:id`, `POST /cadastros/operacoes`, `PATCH /cadastros/operacoes/:id`, `PATCH /cadastros/operacoes/:id/inativar`, `PATCH /cadastros/operacoes/:id/reativar` |
| Tipo de ocorrência | `GET /cadastros/tipos-ocorrencia`, `GET /cadastros/tipos-ocorrencia/:id`, `POST /cadastros/tipos-ocorrencia`, `PATCH /cadastros/tipos-ocorrencia/:id`, `PATCH /cadastros/tipos-ocorrencia/:id/inativar`, `PATCH /cadastros/tipos-ocorrencia/:id/reativar` |
| Fornecedor | `GET /cadastros/fornecedores`, `GET /cadastros/fornecedores/:id`, `POST /cadastros/fornecedores`, `PATCH /cadastros/fornecedores/:id`, `PATCH /cadastros/fornecedores/:id/inativar`, `PATCH /cadastros/fornecedores/:id/reativar` |
| Resina | `GET /cadastros/resinas`, `GET /cadastros/resinas/:id`, `POST /cadastros/resinas`, `PATCH /cadastros/resinas/:id`, `PATCH /cadastros/resinas/:id/inativar`, `PATCH /cadastros/resinas/:id/reativar` |
| Lote de resina | `GET /cadastros/lotes-resina`, `GET /cadastros/lotes-resina/:id`, `POST /cadastros/lotes-resina`, `PATCH /cadastros/lotes-resina/:id` (só campos não-saldo, ver 9.5), `PATCH /cadastros/lotes-resina/:id/status` (transição de `status`), `GET /cadastros/lotes-resina/:id/movimentos` |
| Item | `GET /cadastros/itens`, `GET /cadastros/itens/:id`, `POST /cadastros/itens`, `PATCH /cadastros/itens/:id`, `PATCH /cadastros/itens/:id/inativar`, `PATCH /cadastros/itens/:id/reativar` |
| Molde | `GET /cadastros/moldes`, `GET /cadastros/moldes/:id`, `POST /cadastros/moldes`, `PATCH /cadastros/moldes/:id`, `PATCH /cadastros/moldes/:id/inativar`, `PATCH /cadastros/moldes/:id/reativar` |
| Configuração item-molde | `GET /cadastros/itens/:itemId/moldes/:moldeId/configuracoes` (histórico completo), `GET /cadastros/itens/:itemId/moldes/:moldeId/configuracao-vigente`, `POST /cadastros/itens/:itemId/moldes/:moldeId/configuracoes` (nova vigência — nunca `PATCH`/`PUT`) |
| Ordem de produção | `GET /cadastros/ordens-producao`, `GET /cadastros/ordens-producao/:id`, `POST /cadastros/ordens-producao`, `PATCH /cadastros/ordens-producao/:id`, `PATCH /cadastros/ordens-producao/:id/cancelar` |

Observações de contrato:

- **Nenhum recurso tem `DELETE`** — inativação lógica sempre.
- `lote_resina` não tem `PATCH .../inativar` — a "desativação" operacional de um lote
  é expressa por `status` (`BLOQUEADO`/`ESGOTADO`/`QUARENTENA`), não por `ativo`; o
  campo `ativo` existe só para o caso administrativo de "cadastro criado por engano" e
  não tem endpoint dedicado nesta fase (a confirmar necessidade real, seção 23).
- `configuracao_item_molde` nunca tem `PATCH`/`PUT`/`DELETE` — reforça a seção 7.

### 9.5 Regra de contrato — `lote_resina`

`PATCH /cadastros/lotes-resina/:id` aceita **apenas** `codigo_lote`, `custo_kg`,
`data_validade`, `fornecedor_id` (correção cadastral). O DTO de entrada **não declara**
`saldo_atual_kg` nem `quantidade_inicial_kg` — com `ValidationPipe`
(`forbidNonWhitelisted: true`, já configurado globalmente na Fase 0), qualquer
tentativa de enviar esses campos é rejeitada com `400`, não silenciosamente ignorada.

### 9.6 Regra de contrato — `configuracao_item_molde`

`POST /cadastros/itens/:itemId/moldes/:moldeId/configuracoes` é o único endpoint de
escrita. Body: `pesoPecaGramas`, `numeroCavidades`, `cicloPadraoSegundos`,
`cicloCustoSegundos`, `limitePerdaPercentual`, `motivoAlteracao` (obrigatório quando já
existe vigência anterior para o par). O serviço executa o fluxo da seção 7
inteiramente no backend — o cliente nunca envia `vigenciaInicio`/`vigenciaFim`/
`version`.

---

## 10. DTOs de entrada e saída

Padrão: DTO de entrada com `class-validator` (mesmo padrão de `LoginDto`/
`ChangePasswordDto` da Fase 0), DTO de saída = entidade serializada em `camelCase`
(TypeORM já expõe as colunas assim via `@Column({ name: '...' })`), nunca a entidade
crua do banco.

Exemplo representativo (`configuracao_item_molde`, o caso mais complexo):

```ts
// CriarConfiguracaoItemMoldeDto
class CriarConfiguracaoItemMoldeDto {
  @IsNumber() @IsPositive() pesoPecaGramas!: number;
  @IsInt() @IsPositive() numeroCavidades!: number;
  @IsNumber() @IsPositive() cicloPadraoSegundos!: number;
  @IsNumber() @IsPositive() cicloCustoSegundos!: number;
  @IsNumber() @Min(0) @Max(100) limitePerdaPercentual!: number;
  @ValidateIf((o) => o.__jaExisteVigenciaAnterior) // preenchido pelo serviço, não pelo cliente
  @IsString() @IsNotEmpty()
  motivoAlteracao?: string;
}

// ConfiguracaoItemMoldeResponseDto
class ConfiguracaoItemMoldeResponseDto {
  id!: string;
  itemId!: string;
  moldeId!: string;
  pesoPecaGramas!: number;
  numeroCavidades!: number;
  cicloPadraoSegundos!: number;
  cicloCustoSegundos!: number;
  limitePerdaPercentual!: number;
  vigenciaInicio!: string; // ISO 8601
  vigenciaFim!: string | null;
  ativo!: boolean;
  version!: number;
  motivoAlteracao!: string | null;
  criadoPorUsuarioId!: string;
  criadoEm!: string;
}
```

Os demais recursos seguem o mesmo padrão mecânico: um `Criar<Recurso>Dto`, um
`Atualizar<Recurso>Dto` (`PartialType` do de criação, excluindo campos imutáveis como
`codigo` quando aplicável — a confirmar por recurso, seção 23), e um
`<Recurso>ResponseDto`. Não há necessidade de detalhar os 11 recursos restantes
campo a campo aqui — são reflexo direto das tabelas da seção 2, sem lógica adicional
equivalente à de `configuracao_item_molde` ou `lote_resina`.

---

## 11. Paginação, filtros e ordenação

Padrão único para todo `GET` de listagem (`/cadastros/*`), como querystring:

| Parâmetro | Tipo | Regra |
|---|---|---|
| `pagina` | integer | default `1`, `min 1` |
| `tamanhoPagina` | integer | default `20`, `min 1`, `max 100` |
| `busca` | string | opcional — busca textual (`ILIKE`) em `codigo`/`nome` (ou equivalente do recurso) |
| `ativo` | boolean | opcional — default **sem filtro** (retorna ativos e inativos); `true`/`false` filtra |
| `ordenarPor` | string | opcional — whitelist por recurso (nunca aceitar coluna arbitrária, para não expor `ORDER BY` livre); default `nome` ou `codigo` conforme recurso |
| `direcao` | `ASC`\|`DESC` | default `ASC` |

Resposta padrão:

```json
{
  "dados": [ /* array de ResponseDto */ ],
  "paginacao": { "pagina": 1, "tamanhoPagina": 20, "total": 137, "totalPaginas": 7 }
}
```

Filtros adicionais específicos por recurso (além dos genéricos acima):

- `lote_resina`: `resinaId`, `fornecedorId`, `status`.
- `ordem_producao`: `itemId`, `status`, `origem`, `dataPrevistaDe`, `dataPrevistaAte`.
- `colaborador`: `funcaoId`, `unidadeId`.
- `configuracao_item_molde` (histórico): sem paginação — é uma lista limitada por
  item+molde, ordenada por `version DESC`.

---

## 12. Matriz de permissões

### 12.1 O que precisa ser construído (não existe hoje)

A Fase 0 só tem `JwtAuthGuard` (autenticação). A Fase 1 precisa de:

1. Um `PermissionsGuard` que lê `request.user` (já populado pelo `JwtAuthGuard` a
   partir do JWT) e compara com um decorator `@RequirePermission('chave')` aplicado a
   cada rota.
2. Um jeito de obter as permissões **efetivas** do usuário no momento do request — a
   Fase 0 documenta que o JWT carrega só `perfis: string[]` (códigos de perfil), não
   as permissões resolvidas; então o guard precisa consultar
   `perfil_permissao`/`permissao` a partir dos perfis do JWT (uma query com cache
   por request, não uma nova claim no JWT — evita o problema já documentado em
   [permissoes.md](permissoes.md) de permissões desatualizadas até o próximo login).
3. Seed de novas linhas em `permissao` para cada chave da tabela abaixo (mesmo
   mecanismo do seed `ADMIN`/`sistema.administrar` já existente).

### 12.2 Convenção de chave

`cadastros.<recurso>.<acao>`, `acao ∈ {consultar, criar, alterar, inativar}`.
`configuracao_item_molde` usa `alterar` para "criar nova vigência" (não existe ação
"editar o passado"). `lote_resina` usa `alterar` para o `PATCH` de campos cadastrais e
uma chave própria `cadastros.lote_resina.alterar_status` para a transição de `status`
(operação mais sensível que corrigir um campo de texto).

### 12.3 Matriz

| Recurso | consultar | criar | alterar | inativar |
|---|---|---|---|---|
| Função | `cadastros.funcao.consultar` | `cadastros.funcao.criar` | `cadastros.funcao.alterar` | `cadastros.funcao.inativar` |
| Colaborador | `cadastros.colaborador.consultar` | `cadastros.colaborador.criar` | `cadastros.colaborador.alterar` | `cadastros.colaborador.inativar` |
| Máquina | `cadastros.maquina.consultar` | `cadastros.maquina.criar` | `cadastros.maquina.alterar` | `cadastros.maquina.inativar` |
| Operação | `cadastros.operacao.consultar` | `cadastros.operacao.criar` | `cadastros.operacao.alterar` | `cadastros.operacao.inativar` |
| Tipo de ocorrência | `cadastros.tipo_ocorrencia.consultar` | `cadastros.tipo_ocorrencia.criar` | `cadastros.tipo_ocorrencia.alterar` | `cadastros.tipo_ocorrencia.inativar` |
| Fornecedor | `cadastros.fornecedor.consultar` | `cadastros.fornecedor.criar` | `cadastros.fornecedor.alterar` | `cadastros.fornecedor.inativar` |
| Resina | `cadastros.resina.consultar` | `cadastros.resina.criar` | `cadastros.resina.alterar` | `cadastros.resina.inativar` |
| Lote de resina | `cadastros.lote_resina.consultar` | `cadastros.lote_resina.criar` | `cadastros.lote_resina.alterar` + `cadastros.lote_resina.alterar_status` | — (sem inativação nesta fase, seção 9) |
| Item | `cadastros.item.consultar` | `cadastros.item.criar` | `cadastros.item.alterar` | `cadastros.item.inativar` |
| Molde | `cadastros.molde.consultar` | `cadastros.molde.criar` | `cadastros.molde.alterar` | `cadastros.molde.inativar` |
| Configuração item-molde | `cadastros.configuracao_item_molde.consultar` | `cadastros.configuracao_item_molde.alterar` (criação = nova vigência) | — | — |
| Ordem de produção | `cadastros.ordem_producao.consultar` | `cadastros.ordem_producao.criar` | `cadastros.ordem_producao.alterar` | `cadastros.ordem_producao.alterar` (cancelamento usa a mesma chave de alterar — cancelar é uma transição de status, não uma inativação de cadastro) |

O perfil `ADMIN` (seed existente) recebe todas as chaves acima automaticamente
(mesmo padrão do seed atual). Perfis operacionais/supervisores adicionais ficam para
quando o RH/operação definir os papéis reais (seção 23).

---

## 13. Validações de cada cadastro

Validações genéricas (aplicam-se a todos os 12 recursos, além das `CHECK` de banco da
seção 5 — a API valida **antes** de chegar no banco, o banco é a última linha de
defesa, não a primeira):

- Todo `codigo`/`matricula` é normalizado (trim, sem alterar case — segue o padrão de
  `cnpj`/`email` da Fase 0, que também não fazem uppercase automático) e validado como
  não-vazio.
- Toda FK referenciada (`funcao_id`, `unidade_id`, `resina_id`, `fornecedor_id`,
  `item_id`, `molde_id`) é validada como existente **e ativa** antes de aceitar o
  `POST`/`PATCH` — não basta existir, se estiver inativa a criação é rejeitada com
  `400` (não faz sentido cadastrar um novo lote apontando para uma resina inativa).
- Toda tentativa de duplicar um código único por empresa retorna `409 Conflict` com
  mensagem específica (não o genérico do `GlobalExceptionFilter`), igual ao padrão já
  usado para erros de negócio esperados.

Validações específicas:

### 13.1 `colaborador`
- `matricula` obrigatória, única por empresa.
- `funcao_id` obrigatório e deve estar ativa.
- `pin_hash` nunca aceito via API nesta fase (coluna existe mas não tem DTO de
  entrada — só será usada quando o login de operador for especificado, seção 23).

### 13.2 `resina` / `fornecedor` / `item` / `molde` / `operacao` / `tipo_ocorrencia` /
`funcao`
- Cadastro simples: código único por empresa + nome obrigatório + validações de
  formato descritas na seção 2. Sem regra de negócio adicional além disso.

### 13.3 `configuracao_item_molde`
- `item_id` e `molde_id` devem existir e estar ativos.
- Todos os 5 campos numéricos obrigatórios e dentro das faixas da seção 2.12.
- `motivoAlteracao` obrigatório sempre que já existir uma configuração vigente para o
  par (a primeira vigência de um par item+molde pode não ter motivo, pois não há o
  que justificar mudança).
- Rejeita a operação (com `409`, não `500`) se a `EXCLUDE` constraint disparar — a API
  precisa capturar esse erro específico do Postgres e traduzir para uma mensagem de
  negócio ("já existe configuração vigente para este item e molde"), não vazar o erro
  cru do driver (segue o precedente do `GlobalExceptionFilter` da Fase 0: nunca vazar
  detalhe interno).

### 13.4 `lote_resina`
- `resina_id` obrigatório e ativo.
- `fornecedor_id` **obrigatório quando `origem = 'COMPRA'`**; para as demais origens
  (`ESTOQUE_INICIAL`, `BLENDA`, `AJUSTE`, `DEVOLUCAO`) é opcional — regra de negócio
  aplicada no serviço, não apenas no banco (o banco permite `fornecedor_id` nulo
  sempre; a obrigatoriedade condicional é validação de aplicação).
- `quantidade_inicial_kg > 0` obrigatório.
- `saldo_atual_kg` **nunca é campo de entrada** — o serviço de criação de lote sempre
  define `saldo_atual_kg = quantidade_inicial_kg` e insere, na mesma transação, o
  primeiro `movimento_estoque_lote` (`tipo = 'ENTRADA'`, `quantidade_kg =
  quantidade_inicial_kg`, `saldo_resultante_kg = quantidade_inicial_kg`, `motivo =
  'Abertura de lote'`).
- **Impedir edição direta do saldo** é garantido em duas camadas:
  1. Camada de API: nenhum DTO de `PATCH` declara `saldo_atual_kg` (seção 9.5).
  2. Camada de banco (defesa em profundidade): trigger `BEFORE UPDATE ON
     lote_resina` que compara `OLD.saldo_atual_kg` com `NEW.saldo_atual_kg` e levanta
     exceção se forem diferentes **a menos que** a sessão tenha marcado
     `SET LOCAL app.permitir_atualizacao_saldo = 'on'` — flag setada apenas pela
     função interna que processa um `movimento_estoque_lote` (que nesta fase só roda
     uma vez, na criação do lote, dentro da mesma transação). Isso replica o padrão de
     "regra garantida pelo banco, não só pela aplicação" já usado em `auditoria` na
     Fase 0.
- Transição de `status` (`PATCH .../status`) validada por uma máquina de estados
  simples: `DISPONIVEL → BLOQUEADO`, `DISPONIVEL → QUARENTENA`,
  `BLOQUEADO → DISPONIVEL`, `QUARENTENA → DISPONIVEL`, `DISPONIVEL → ESGOTADO`
  (automático quando `saldo_atual_kg` chega a zero via movimento — fora do escopo
  desta fase pois não há consumo; nesta fase `ESGOTADO` só é atingível manualmente,
  com confirmação). Transições não listadas retornam `400`.

### 13.5 `ordem_producao`
- `item_id` obrigatório e ativo.
- `quantidade_programada > 0`.
- `codigo_interno` único por empresa.
- `codigo_mega`: texto livre, sem validação de formato (integração real é fora de
  escopo — seção 23 sinaliza que a taxonomia/máscara real do Mega precisa ser
  confirmada antes de qualquer validação de formato ser adicionada).
- Transições de `status`: a confirmar com o processo industrial (seção 23) — proposta
  provisória `ABERTA → EM_PRODUCAO → CONCLUIDA`, e `ABERTA|EM_PRODUCAO → CANCELADA`.

---

## 14. Regras de inativação

- Inativação é sempre `ativo: true → false`, nunca `DELETE`. Reversível via endpoint
  `/reativar` explícito (decisão nova desta fase — a Fase 0 não tinha endpoint de
  reativação para nenhuma entidade; ele é necessário aqui porque cadastros
  administrativos erram e precisam ser corrigidos sem reescrever histórico).
- Inativar um registro **não** inativa em cascata registros que o referenciam (ex.:
  inativar uma `resina` não inativa os `lote_resina` existentes) — é responsabilidade
  da validação de criação (seção 13) impedir que **novos** registros referenciem algo
  inativo; registros já existentes continuam válidos como estavam.
- `configuracao_item_molde` não tem inativação própria — encerrar uma vigência
  (`ativo = false` na linha antiga) só acontece como efeito colateral de criar uma
  nova vigência (seção 7), nunca como ação direta do usuário.
- `item`/`molde` só podem ser inativados se não houver `configuracao_item_molde` ativa
  vigente que os referencie **com uso operacional futuro implícito** — nesta fase, sem
  apontamento ainda existindo, a regra é apenas informativa (a API avisa mas não
  bloqueia, dado que não há dependente operacional real ainda); reavaliar quando
  `apontamento` existir (Fase 2).
- `ordem_producao` não usa `ativo`/inativação — usa `status = 'CANCELADA'`.

---

## 15. Casos de teste unitário

Por serviço (padrão Jest, mesmo estilo de `password.service.spec.ts`/
`auth.service.spec.ts` da Fase 0):

- **CRUD genérico** (repetido por recurso simples — função, operação, tipo de
  ocorrência, fornecedor, resina, item, molde, máquina): cria com sucesso; rejeita
  código duplicado na mesma empresa; permite código repetido em empresas diferentes;
  inativa; reativa; rejeita alteração de campo não whitelisted.
- **`ColaboradorService`**: rejeita `funcao_id` inexistente; rejeita `funcao_id`
  inativa; rejeita matrícula duplicada na empresa; aceita matrícula repetida em
  empresa diferente.
- **`ConfiguracaoItemMoldeService`**:
  - Primeira vigência de um par item+molde: `version = 1`, `motivoAlteracao` opcional,
    `vigenciaFim = null`, `ativo = true`.
  - Segunda vigência: encerra a primeira (`vigenciaFim` preenchido, `ativo = false`),
    cria a segunda com `version = 2`, exige `motivoAlteracao`.
  - Rejeita nova vigência sem `motivoAlteracao` quando já existe uma anterior.
  - Rejeita `pesoPecaGramas <= 0`, `numeroCavidades <= 0`, `cicloPadraoSegundos <= 0`,
    `cicloCustoSegundos <= 0`, `limitePerdaPercentual` fora de `[0, 100]`.
  - Consulta de configuração vigente retorna exatamente a linha `ativo = true`.
  - Consulta de configuração "vigente em data X no passado" retorna a linha correta
    do histórico (teste com 3 vigências sequenciais).
- **`LoteResinaService`**:
  - Criação gera `saldo_atual_kg = quantidade_inicial_kg` e um `movimento_estoque_lote`
    de abertura com o mesmo valor.
  - Rejeita criação com `origem = 'COMPRA'` sem `fornecedor_id`.
  - Aceita criação com `origem = 'ESTOQUE_INICIAL'` sem `fornecedor_id`.
  - `PATCH` de campos cadastrais não altera `saldo_atual_kg`.
  - Tentativa de enviar `saldoAtualKg` no `PATCH` é rejeitada pelo `ValidationPipe`
    (`400`, campo não whitelisted).
  - Transição de status válida (`DISPONIVEL → BLOQUEADO`) é aceita; transição inválida
    (`ESGOTADO → DISPONIVEL`) é rejeitada com `400`.
- **`OrdemProducaoService`**: rejeita `item_id` inativo; rejeita `quantidade_programada
  <= 0`; código interno único por empresa; cancelamento de ordem `CONCLUIDA` é
  rejeitado (regra provisória, a confirmar seção 23).
- **`PermissionsGuard`**: nega acesso sem a permissão exigida (`403`); permite com a
  permissão; nega quando usuário tem perfil mas o perfil não tem a permissão
  específica (só outra chave do mesmo módulo).

## 16. Casos de teste de integração (e2e, contra Postgres real)

Mesmo padrão de `test/e2e/*.e2e-spec.ts` da Fase 0 (Postgres real, não mock):

- Fluxo completo de `configuracao_item_molde`: `POST` cria primeira vigência → `GET
  configuracao-vigente` retorna ela → `POST` cria segunda vigência com motivo → `GET
  configuracao-vigente` retorna a segunda → `GET configuracoes` (histórico) retorna as
  duas, ordenadas, com a primeira tendo `vigenciaFim` preenchido e `ativo = false`.
- Concorrência de vigência: duas requisições `POST` concorrentes para o mesmo
  item+molde — exatamente uma deve suceder e a outra deve falhar com `409` traduzido
  do `EXCLUDE` constraint (teste de fato dispara duas transações em paralelo, não
  simula).
- Fluxo completo de `lote_resina`: `POST` cria lote → verifica no banco que
  `movimento_estoque_lote` tem exatamente 1 linha com o saldo correto → tenta `PATCH`
  com `saldoAtualKg` no body → recebe `400` → `PATCH .../status` para `BLOQUEADO` →
  `GET` reflete o novo status.
- Autorização ponta a ponta: usuário sem nenhum perfil com `cadastros.item.criar`
  recebe `403` ao tentar `POST /cadastros/itens`; após atribuir o perfil com a
  permissão (via seed/fixture de teste) e novo login, a mesma requisição sucede.
- Todas as `UNIQUE (empresa_id, codigo)`: criar em empresa A, tentar duplicar em
  empresa A (`409`), duplicar em empresa B (sucesso) — para pelo menos `item`,
  `resina`, `colaborador.matricula`.
- Regra "sem exclusão física": nenhum teste e2e desta fase usa `DELETE` nem apaga
  fisicamente um registro de fixture — segue a correção já aplicada na Fase 0 (ver
  handoff, entrada 2026-07-31, problema 4) para não violar a própria regra do sistema
  durante o cleanup do teste.

## 17. Casos Playwright

Aplicam-se somente depois que as telas administrativas (seção 18) existirem — nesta
fase de planejamento, ficam especificados, não implementados:

- Login admin (fluxo já existente) → navega para a área de cadastros → cria uma
  `função` nova → item aparece na listagem paginada.
- Criar `item` e `molde` → criar a primeira `configuração item-molde` → tela exibe os
  valores vigentes → criar uma segunda vigência com motivo → tela mostra a nova
  vigência como atual e a anterior no histórico (com data de encerramento visível).
- Criar `resina` → criar `lote de resina` com origem `COMPRA` sem selecionar
  fornecedor → formulário bloqueia o envio com mensagem de campo obrigatório
  (validação client-side espelhando a regra da seção 13.4).
- Tentar acessar uma tela de cadastro (ex.: fornecedores) logado com um usuário sem a
  permissão `cadastros.fornecedor.consultar` → UI oculta o item de menu e/ou bloqueia
  a rota com mensagem de acesso negado (não apenas API retornando 403 silenciosamente).
- Inativar um `colaborador` → listagem por padrão continua mostrando (filtro `ativo`
  não aplicado) com indicador visual de inativo → filtrar por `ativo = true` remove da
  lista → reativar → volta a aparecer no filtro de ativos.

---

## 18. Telas administrativas

Escopo desta fase: CRUD + listagem para os 12 recursos, dentro de `/admin`, atrás do
`AdminGuard` já existente. Segue o padrão de arquitetura já validado na tela
operacional (repositório substituível mock/API, hooks dedicados por recurso — ver
achado 5 de [revisao-frontend-fase-0.md](revisao-frontend-fase-0.md), que recomenda
exatamente esse padrão para evitar acoplamento a mocks).

Estrutura de rotas proposta (`frontend/src/pages/admin/cadastros/*`):

```
/admin/cadastros/funcoes
/admin/cadastros/colaboradores
/admin/cadastros/maquinas
/admin/cadastros/operacoes
/admin/cadastros/tipos-ocorrencia
/admin/cadastros/fornecedores
/admin/cadastros/resinas
/admin/cadastros/lotes-resina
/admin/cadastros/itens
/admin/cadastros/moldes
/admin/cadastros/itens/:itemId/moldes/:moldeId/configuracoes
/admin/cadastros/ordens-producao
```

Cada rota: tela de listagem (tabela paginada + busca + filtro `ativo` + ordenação,
seção 11) e formulário de criação/edição (modal ou rota dedicada — decisão de UI, não
técnica, fica para quem implementar). Item de menu de cada rota só aparece se o
usuário tiver a permissão `...consultar` correspondente (seção 12) — não depende só do
backend recusar, a UI já filtra.

Um hook por recurso (`useFuncoes()`, `useColaboradores()`, ... `useConfiguracoesItemMolde()`),
implementado sobre TanStack Query (já é dependência do padrão de repositório existente
implicitamente — a confirmar se já está no `package.json` do frontend, seção 23),
chamando os endpoints reais da seção 9 — **sem mocks nesta fase**, porque o backend
passa a existir de fato (diferente da tela operacional, que mockava por o backend
ainda não existir).

---

## 19. Permissões de consultar, criar, alterar e inativar

Coberto integralmente na seção 12 (matriz) e seção 12.1 (mecanismo de guard a
construir). Resumo do que muda no backend:

- Novo decorator `@RequirePermission(chave: string)`.
- Novo `PermissionsGuard` aplicado globalmente ou por controller (decisão de
  implementação: `APP_GUARD` global após o `JwtAuthGuard`, para não exigir repetir em
  toda rota).
- Seed estendido com as ~46 novas chaves de permissão da matriz (seção 12.3),
  associadas ao perfil `ADMIN`.

---

## 20. Critérios de aceite

Por módulo (aplica-se aos 12 recursos, ajustado para as particularidades já descritas):

- Todo endpoint de escrita rejeita campos não declarados no DTO (`400`).
- Todo endpoint de escrita chama `AuditoriaService.registrar()` com `dados_antes`/
  `dados_depois` corretos (verificável no banco por teste e2e).
- Toda listagem pagina, filtra por `ativo`/`busca` e ordena conforme seção 11.
- Toda tentativa de acesso sem a permissão exigida retorna `403`, testada por e2e.
- `configuracao_item_molde`: impossível, mesmo por acesso direto ao banco fora da API,
  ter duas linhas com vigência sobreposta para o mesmo item+molde (garantido pela
  `EXCLUDE`, não apenas pela aplicação) — critério verificado tentando o `INSERT`
  conflitante diretamente via SQL em teste.
- `lote_resina`: impossível alterar `saldo_atual_kg` via API; tentativa de `UPDATE`
  direto via SQL fora do fluxo de movimento é bloqueada pelo trigger (mesmo critério
  de verificação direta em SQL).
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run
  build` (backend) executados e passando de fato — não apenas escritos (segue o padrão
  de rigor já estabelecido nas entradas de handoff da Fase 0, que penaliza
  explicitamente "testes escritos mas não executados" como pendência não fechada).
- Frontend: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`,
  `npm run test:e2e` (Playwright) do frontend executados e passando, cobrindo pelo
  menos os cenários da seção 17.

---

## 21. Ordem recomendada de implementação

1. **Infra transversal primeiro** (tudo abaixo depende disso): `PermissionsGuard` +
   decorator + seed de permissões (seção 12); prefixo de API `/api/v1` se adotado.
2. **Cadastros simples sem dependência entre si** (podem ser paralelos entre agentes
   diferentes sem conflito): `funcao`, `operacao`, `tipo_ocorrencia`, `fornecedor`,
   `resina`, `item`, `molde`. Extensão de `maquina` (novas colunas + endpoints) também
   entra aqui.
3. **Cadastros que dependem do grupo 2**: `colaborador` (depende de `funcao`,
   `unidade`), `lote_resina` + `movimento_estoque_lote` (depende de `resina`,
   `fornecedor`).
4. **Núcleo com vigência** (o mais arriscado tecnicamente, fazer com o time mais
   experiente disponível e sozinho, não em paralelo com outra migration): a extensão
   `btree_gist` + `configuracao_item_molde` (depende de `item`, `molde`).
5. **Ordem de produção**: depende só de `item` (grupo 2), mas faz sentido vir por
   último porque é o cadastro mais "de borda" (prepara o terreno para apontamento na
   Fase 2, sem nenhuma outra dependência real desta fase).
6. **Frontend**: só começa depois que os endpoints do grupo correspondente estiverem
   com e2e passando — não construir tela contra contrato ainda instável (lição já
   registrada no achado 1-13 da revisão de frontend da Fase 0: telas construídas antes
   do backend real geraram retrabalho e risco de confusão real-vs-mock).

---

## 22. Dependências entre módulos

```
PermissionsGuard/seed permissões
  └─ todos os módulos de cadastro (todo endpoint exige permissão)

funcao ──────────────┐
unidade (Fase 0) ─────┼─> colaborador
                      ┘

resina ───────────────┐
fornecedor ────────────┼─> lote_resina ─> movimento_estoque_lote
                      ┘

item ─────────────────┐
molde ─────────────────┼─> configuracao_item_molde
                      ┘

item ─────────────────────> ordem_producao

maquina (Fase 0, estendida) ── sem dependente nesta fase (reservada para apontamento, Fase 2)
operacao, tipo_ocorrencia ── sem dependente nesta fase (reservados para apontamento/ocorrência, Fase 2)
```

Nenhum módulo desta fase depende de outro módulo desta mesma fase que não esteja
listado acima — a ordem da seção 21 é derivada diretamente deste grafo.

---

## 23. Riscos técnicos

1. **`btree_gist` pode não estar disponível** no ambiente de banco gerenciado de
   produção (algumas plataformas restringem `CREATE EXTENSION`). Mitigação: validar
   com quem administra o Postgres de produção antes de escrever a migration; se
   indisponível, alternativa é impor a não-sobreposição só via lock de aplicação
   (transação + `SELECT ... FOR UPDATE` na configuração vigente antes de encerrar/criar),
   perdendo a garantia de banco — degradação aceitável mas deve ser decisão explícita,
   não descoberta em produção.
2. **Trigger de `saldo_atual_kg` com `SET LOCAL` de sessão** (seção 13.4) é um padrão
   menos comum que o trigger simples de `auditoria` — precisa de teste de integração
   específico simulando um `UPDATE` direto via SQL cru (não só via ORM) para garantir
   que a defesa realmente funciona contra acesso fora da aplicação, não só contra o
   TypeORM.
3. **Volume de permissões novas (~46 chaves)** aumenta a superfície do seed e do JWT
   indiretamente (perfis carregados no JWT continuam sendo só códigos, mas a resolução
   de permissões por request agora faz mais joins) — medir impacto de latência antes de
   assumir que uma query por request é aceitável; cache por request (não por processo,
   para não servir permissão desatualizada) é o mínimo recomendado.
4. **Ausência de `apontamento`/`maquina` como dependente real nesta fase** significa
   que `operacao`, `tipo_ocorrencia` e a extensão de `maquina` não têm nenhum teste de
   integração "de ponta a ponta com uso real" possível ainda — o risco é essas tabelas
   serem desenhadas com um formato que precise mudar quando `apontamento` (Fase 2)
   existir de verdade. Mitigado parcialmente por serem cadastros simples (baixo custo
   de `ALTER TABLE` se necessário).
5. **Múltiplos agentes de IA trabalhando no mesmo repositório sem coordenação** já foi
   um risco de processo real na Fase 0 (ver handoff, entrada 2026-07-31 "Riscos
   conhecidos" do Claude Code) — reforçar que qualquer agente que implementar este
   plano deve atualizar `docs/handoff.md` ao final com o que de fato foi feito, para
   não repetir decisões de escopo perdidas entre agentes.

---

## 24. Plano de rollback

- Toda migration desta fase deve ter `down()` completo e simétrico, seguindo o padrão
  já usado em `1730000000000-Fase0Fundacao.ts` (`DROP` na ordem inversa de
  dependência, incluindo `DROP TRIGGER`/`DROP FUNCTION` antes de `DROP TABLE`, e
  `DROP EXTENSION IF EXISTS btree_gist` apenas se nenhuma outra tabela do sistema
  passar a depender dela por outro motivo).
- Recomenda-se **uma migration por grupo da seção 21** (não uma migration monolítica
  para as 12 tabelas), para permitir reverter parcialmente se um grupo específico
  falhar em produção sem precisar reverter tudo.
- Nenhuma migration desta fase deve popular dados de produção reais (nenhuma migração
  de dados da planilha Excel está no escopo — ver seção 25) — rollback de schema nunca
  perde dado histórico real por engano, porque não há dado real ainda além do que os
  próprios usuários cadastrarem depois do deploy.
- Antes de aplicar em produção: aplicar em banco descartável (mesma recomendação já
  registrada no handoff da Fase 0 — "riscos conhecidos", nunca validada em banco
  limpo do zero até o momento) e rodar a suíte e2e completa contra ele.
- Se `EXCLUDE USING gist` causar rejeição inesperada de dados legítimos em produção
  (ex.: fuso horário mal interpretado na fronteira de vigência), o rollback de emergência
  é reverter só a constraint (`ALTER TABLE ... DROP CONSTRAINT`), não a tabela inteira —
  documentar esse comando junto da migration correspondente como "rollback parcial".

---

## 25. Itens que precisam ser confirmados com o processo industrial

Nenhum destes bloqueia o início da implementação dos cadastros mais simples (grupo 2
da seção 21), mas bloqueiam fechar o design final antes de codar os itens marcados:

1. **Taxonomia de `tipo_ocorrencia.categoria`** — os 4 valores provisórios
   (`QUALIDADE`, `MANUTENCAO`, `PARADA`, `OUTRO`) são um chute razoável, não uma lista
   validada com quem opera o chão de fábrica hoje.
2. **Taxonomia de `resina.tipo`** (família de resina: PP, PEAD, etc.) — ficou como
   `varchar` livre por não ter a lista fechada real; se o processo industrial tiver uma
   lista fixa, vale trocar para `CHECK IN (...)` antes de implementar.
3. **`unidade_medida` de `item`** — hoje só um placeholder `UN`; confirmar se existe
   mais de uma unidade de medida real em uso (kg, peça, caixa) antes de fixar o
   `CHECK`.
4. **Fluxo de `status` de `ordem_producao`** — os 4 status propostos
   (`ABERTA`/`EM_PRODUCAO`/`CONCLUIDA`/`CANCELADA`) e as transições da seção 13.5 são
   uma modelagem mínima razoável, não confirmada com quem hoje controla ordens de
   produção na planilha. Em particular: existe estado intermediário como "programada"
   vs. "aberta"? Uma ordem pode voltar de `EM_PRODUCAO` para `ABERTA`?
5. **Formato real de `codigo_mega`** — nesta fase é texto livre sem validação; se a
   integração futura com o Mega (fora de escopo) já tiver um formato conhecido hoje,
   vale validar o formato desde já para evitar re-trabalho de dados sujos depois.
6. **Se `lote_resina` precisa de endpoint de inativação além de `status`** — a seção 9
   deixou de fora por não haver um caso de uso claro ("lote cadastrado por engano" já é
   coberto por `status`?), mas vale confirmar com quem for usar a tela.
7. **Login de operador por matrícula/PIN** — o campo `pin_hash` foi preparado em
   `colaborador` (seção 2.2) mas a implementação do login em si **não está no escopo
   desta Fase 1** (é cadastro administrativo, não autenticação de chão de fábrica).
   Confirmar se isso deveria estar nesta fase ou continua para uma fase própria — o
   handoff da Fase 0 menciona esse endpoint como pendência repetidamente, então há
   risco de expectativa desalinhada.
8. **Capacidade/tipo de `maquina`** (seção 2.3) — campos adicionados como
   "opcional, taxonomia a confirmar"; confirmar se são realmente necessários nesta
   fase ou se podem esperar por `apontamento` (Fase 2), que é quem de fato consome
   esses dados operacionalmente.
9. **Perfis operacionais além de `ADMIN`** — a matriz de permissões (seção 12) define
   as chaves, mas não cria novos perfis (ex.: "Supervisor de Produção", "Almoxarife")
   com subconjuntos dessas permissões; confirmar quais perfis reais existem na
   operação antes de decidir se o seed cria mais perfis além de `ADMIN`.
