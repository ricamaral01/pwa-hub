# Sincronização Offline — ConcreTrack Injeção

> **Como ler este documento.** As seções 1 a 9 descrevem o que foi **decidido e
> parcialmente implementado** na Fase 0/1 (schema Dexie v2, estados da fila, service
> worker). A partir de "[Fase 4 — especificação completa](#fase-4--especificação-completa)"
> está a especificação da Fase 4, que **estende** essas decisões sem contradizê-las.
> Onde a Fase 4 muda algo já implementado, isso é dito explicitamente.
> Estado atual do código: `frontend/src/db/schema.ts` (Dexie v2) e
> `frontend/src/hooks/useQueue.ts`, onde `processQueue` ainda é um mock
> (`// TODO: chamar API real aqui`).

## Estratégia geral

O frontend opera com **offline-first**: todos os dados operacionais críticos
são persistidos no IndexedDB antes de qualquer chamada de API. A rede é uma
otimização, não um requisito para registrar um apontamento.

## Fila de saída (Queue)

Cada registro criado offline (ou quando a API falha) é adicionado à tabela
`queue` do IndexedDB com os seguintes campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | auto-int | Chave primária local |
| `uuid` | string | UUID definitivo do registro |
| `type` | enum | `apontamento`, `ocorrencia`, `operador_login` |
| `payload` | string (JSON) | Dados completos do registro |
| `idempotencyKey` | string | = `uuid` — impede duplicação em retries |
| `criadoEm` | ISO 8601 | Timestamp de criação local |
| `tentativas` | number | Contador de tentativas de envio |
| `ultimaTentativaEm` | ISO 8601 OU null | Quando foi a última tentativa |
| `ultimoErro` | string OU null | Mensagem do último erro |
| `state` | enum | `pendente`, `enviando`, `sincronizado`, `erro`, `conflito` |
| `versao` | number | Versão do registro (para conflito otimista) |

## Estados de um item na fila

```
pendente → enviando → sincronizado
                   ↘ erro → pendente (retry)
                   ↘ conflito (aguarda supervisor)
```

## Processamento da fila

- A fila é processada automaticamente quando a rede retorna (`window.online`).
- Polling leve a cada 30 segundos para detectar reconexão em redes instáveis.
- Cada item é enviado com o `idempotencyKey` no header ou no payload.
- Em caso de erro não-conflito: incrementa `tentativas` e volta para `pendente`.
- Em caso de HTTP 409 (conflito de versão): marca como `conflito` e registra na
  tabela `conflicts` para revisão do supervisor.

## Conflitos

Quando o servidor retorna 409:

1. O item da fila é marcado como `conflito`.
2. Um registro é criado na tabela `conflicts` com:
   - Versão local (payload da fila)
   - Versão do servidor (extraída do corpo do erro 409)
   - Lista de campos diferentes
3. O operador NÃO pode resolver o conflito — ele vê apenas a mensagem.
4. O supervisor acessa a tela de conflitos e decide:
   - Manter a versão do servidor (descartar local)
   - Enviar a versão local forçando a versão
   - Escalar para suporte

## O que NÃO é cacheado

- Respostas de autenticação (`/auth/*`)
- Dados sensíveis (senha, hash)
- Respostas de API marcadas como `Cache-Control: no-store`

## Estratégia do Service Worker (Workbox)

| Rota | Estratégia | TTL | Descrição |
|---|---|---|---|
| `/api/*` | NetworkFirst | 5 min | API — tenta rede, fallback em cache |
| Assets estáticos | CacheFirst | Indefinido | JS, CSS, fontes |
| `index.html` | NetworkFirst | — | Garante versão atualizada |

## Atualização de versão

Quando o service worker detecta uma nova versão:

1. O store é notificado via `setNewVersionAvailable(true)`.
2. Um banner discreto aparece na TopBar: "Nova versão disponível — Atualizar".
3. O operador pode escolher quando atualizar.
4. Se houver apontamento em andamento: o sistema avisa sobre o risco de perda
   e solicita salvar rascunho antes de atualizar.
5. A atualização NUNCA ocorre automaticamente sem confirmação do usuário.

## Persistência de cronômetro (paradas)

O cronômetro de parada usa o **horário de início persistido** no IndexedDB
como referência, não apenas `setInterval`. Isso garante que:

- Se o tablet for recarregado durante uma parada, o cronômetro exibe o tempo
  correto (calculado como `agora - inicioEm`).
- O `setInterval` é apenas para atualizar a exibição a cada segundo.
- O dado de referência é sempre o timestamp absoluto.

Regras completas do cronômetro (incluindo prevalência do timestamp do servidor após
reconexão) em [maquinas-de-estado.md, seção 4](maquinas-de-estado.md#4-cronômetro-persistente-regra-transversal).

---

# Fase 4 — especificação completa

**Status:** planejamento técnico. Nada abaixo foi implementado.
Escopo executivo (dependências, critérios, riscos, ordem) em
[plano-fases-2-a-6.md](plano-fases-2-a-6.md#fase-4--offline-e-sincronização).

Pré-requisito: Fases 2 e 3 entregues. Não faz sentido construir a fila antes de existirem
operações reais e idempotentes para transportar — antecipá-la produz uma fila que
transporta mocks.

## F4.1 O que muda em relação ao que já existe

| Hoje (Fase 0/1) | Fase 4 |
|---|---|
| Dexie v2, 8 stores | Dexie **v3**, com `outbox`, `outboxDependencia`, `cadastroLocal`, `syncMeta`; `queue` é migrada para `outbox`, `conflicts` para `conflitos` |
| `processQueue` mock com `setTimeout` | envio real com `Idempotency-Key`, backoff e ordenação topológica |
| `versaoServidor: '{}' // TODO` no conflito | corpo de conflito real, devolvido pelo backend no `409` |
| Ativação do dispositivo só local no IndexedDB | vínculo real `dispositivo → maquina` validado pelo servidor |
| Nenhum controle de idempotência no backend | tabela `idempotencia_requisicao` + interceptor |
| Fila sem ordem entre registros | dependências explícitas (abrir → parada → encerrar) |

## F4.2 Schema Dexie v3

A migração v2 → v3 **preserva** os dados existentes: `deviceConfig`, `activeSession`,
`activeAppointment`, `appointmentQuantities` e `activeStop` mantêm nome e formato; `queue`
é copiada para `outbox` acrescentando os campos novos com valor padrão.

### `deviceConfig` (existente, estendido)

Acrescenta `maquinaValidadaEm: string | null`, `vinculoConfirmadoPeloServidor: boolean`,
`versaoContratoSync: number`. Um dispositivo cujo vínculo nunca foi confirmado pelo
servidor **não** pode abrir apontamento (revoga a permissividade atual, em que a ativação
é puramente local).

### `activeSession` (existente, estendido)

Acrescenta `expiraEm: string`, `permissoesEscopo: string[]`, `maquinaId: string`.
Sessão expirada offline leva a `BLOCKED_STALE_SESSION`
([maquinas-de-estado.md](maquinas-de-estado.md)) — nunca a uma sessão inventada.

### `activeAppointment` (existente, estendido)

Acrescenta `servidorId: string | null` (preenchido quando o servidor aceita a abertura),
`versao: number`, `sincronizado: boolean`, `origemInicio: 'servidor' | 'local'`.
`localUuid` continua sendo o UUID definitivo e a `Idempotency-Key` da abertura.

### `activeStop` (existente, estendido)

Acrescenta `servidorId`, `versao`, `sincronizado`, `apontamentoLocalUuid`
(dependência explícita), `descricao`, `status` (espelho do status do servidor).

### `outbox` (nova — substitui `queue`)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `++number` | chave local |
| `uuid` | string | UUID definitivo do registro/operação; gerado no cliente |
| `idempotencyKey` | string | **igual ao `uuid`**, imutável entre tentativas |
| `operacao` | enum | `apontamento.abrir`, `apontamento.quantidades`, `apontamento.encerrar`, `apontamento.cancelar`, `ocorrencia.abrir`, `ocorrencia.descrever`, `ocorrencia.acao_corretiva`, `ocorrencia.encerrar`, `ocorrencia.cancelar`, `operador.login` |
| `metodo`, `rota` | string | destino HTTP resolvido no enfileiramento |
| `payload` | string (JSON) | corpo serializado |
| `hashPayload` | string | SHA-256 do payload — detecta reuso indevido da chave |
| `entidadeUuid` | string | UUID do agregado (apontamento ou ocorrência) a que a operação pertence |
| `dependeDe` | string[] | UUIDs de itens que precisam estar `sincronizado` antes |
| `versao` | number | versão local do registro (controle otimista) |
| `state` | enum | `pendente`, `enviando`, `sincronizado`, `erro`, `conflito` |
| `tentativas` | number | contador |
| `proximaTentativaEm` | ISO 8601 | calculado pelo backoff |
| `ultimaTentativaEm`, `ultimoErro`, `ultimoStatusHttp` | | diagnóstico |
| `criadoEm` | ISO 8601 | ordem de criação (desempate) |
| `expiraEm` | ISO 8601 \| null | limite após o qual vira `erro` permanente e exige supervisor |

Índices: `++id, uuid, operacao, state, entidadeUuid, criadoEm, proximaTentativaEm`.

### `outboxDependencia` (nova)

`[itemUuid+dependeDeUuid]` — aresta explícita do grafo. Mantida como store própria (e não
só como array em `outbox`) para permitir consulta reversa "o que está bloqueado por este
item" sem varrer a fila.

### `cadastroLocal` (nova — substitui `productionCache`)

Cadastros essenciais para operar offline, baixados pelo `GET /sync/bootstrap`:

| Campo | Descrição |
|---|---|
| `id` | `tipo:uuid` |
| `tipo` | `operacao`, `item`, `molde`, `configuracao_item_molde`, `ordem_producao`, `lote_resina`, `tipo_ocorrencia`, `colaborador`, `turno`, `maquina` |
| `dados` | JSON do registro |
| `versao` | versão do servidor |
| `baixadoEm`, `expiraEm` | validade |
| `escopoMaquinaId` | máquina para a qual o pacote foi baixado |

`colaborador` traz **apenas** matrícula, nome e função — nunca `pin_hash`. A verificação
de PIN offline usa um verificador derivado de escopo curto entregue pelo servidor no
bootstrap, com validade explícita; expirado, o tablet exige rede para autenticar.

### `conflitos` (nova — substitui `conflicts`)

`outboxUuid`, `operacao`, `versaoLocal` (JSON), `versaoServidor` (JSON real do `409`),
`camposDiferentes: string[]`, `registradoEm`, `resolvidoEm`, `resolucao`
(`servidor` \| `local` \| `descartado`), `resolvidoPorUsuarioId`.

### `syncMeta` (nova)

Singleton: `ultimoBootstrapEm`, `ultimoDeltaEm`, `ultimaSincronizacaoOkEm`,
`versaoApp`, `versaoSchema`, `armazenamentoPersistente: boolean`,
`relogioDivergenciaMs` (diferença medida entre relógio local e `Date` do servidor).

## F4.3 UUID definitivo e idempotency key

1. O UUID é gerado **no cliente**, no instante em que o operador confirma a ação — antes
   de qualquer tentativa de rede. Ele é o `id` definitivo do registro; o servidor o aceita
   como chave, não gera outro.
2. `idempotencyKey === uuid`. A chave **nunca** muda entre tentativas: é isso que torna o
   retry seguro.
3. A chave viaja no header `Idempotency-Key` (a Fase 2 já exige o header nos endpoints de
   escrita).
4. O backend guarda `chave → (hash do payload, status, corpo da resposta)` em
   `idempotencia_requisicao`:
   - chave nova → processa e grava;
   - chave repetida com **mesmo** `hashPayload` → devolve a resposta original (mesmo
     status, mesmo corpo), sem reprocessar;
   - chave repetida com payload **diferente** → `409` explícito ("chave de idempotência
     reutilizada com conteúdo diferente"), nunca devolve a resposta antiga silenciosamente.
5. Retenção de `idempotencia_requisicao`: mínimo 30 dias (precisa cobrir um tablet que
   ficou offline por semanas). Expurgo é `DELETE` por `expira_em` — é a única tabela do
   sistema em que apagar é permitido, porque não é dado de negócio.

## F4.4 Versão e resolução de conflitos

- Toda entidade de negócio já tem `versao` (optimistic lock do `BaseEntity`, decisão da
  Fase 0 tomada exatamente para isto).
- Operações de **alteração** (`quantidades`, `descrever`, `acao_corretiva`, `encerrar`)
  enviam a `versao` conhecida pelo cliente. Se divergir, o servidor responde `409` com:

```json
{
  "erro": "CONFLITO_VERSAO",
  "mensagem": "Este registro foi alterado por outra origem.",
  "versaoEnviada": 3,
  "versaoServidor": 5,
  "registroServidor": { "...": "estado atual serializado" },
  "camposDiferentes": ["pecasBoas", "borraKg"]
}
```

- O item da fila vai para `conflito`, um registro é criado em `conflitos`, e **nenhum
  dado local é sobrescrito**.
- O operador **nunca** resolve conflito: vê a mensagem e continua trabalhando. Resolver é
  ação do supervisor, em `/gestao/conflitos`, com as permissões
  `sincronizacao.conflito.consultar` / `.resolver`.
- Resoluções possíveis: manter o servidor (descarta o local, registrando o descarte);
  reenviar o local sobre a versão atual (novo `Idempotency-Key`, justificativa
  obrigatória); escalar. Toda resolução gera auditoria.
- Operações de **criação** (`abrir`) não conflitam por versão — conflitam por
  idempotência (F4.3) ou por regra de negócio (`EXCLUDE` de sobreposição), que retornam
  `409` com código distinto (`APONTAMENTO_JA_ABERTO`), tratado como erro de negócio e não
  como conflito de versão.

## F4.5 Tentativas, retry e backoff

```
proximaTentativaEm = agora + min(base × 2^(tentativas-1), teto) ± jitter
base = 5 s      teto = 5 min      jitter = ±20 %
```

- Tentativas 1..8 com backoff; a partir da 9ª o item continua `erro` e só é reenviado por
  ação explícita (botão do supervisor) ou por um novo evento de reconexão.
- `429` e `503` respeitam `Retry-After` quando presente, em vez do backoff calculado.
- `4xx` que não seja `408`/`409`/`429` é **erro permanente**: não adianta repetir um
  payload inválido. O item vai para `erro` com o motivo, e a UI mostra a mensagem de
  negócio.
- `5xx` e falha de rede são erros transitórios: seguem o backoff.
- Um item nunca é enviado enquanto `proximaTentativaEm > agora`.
- O envio é **serializado por `entidadeUuid`**: dois itens do mesmo apontamento nunca vão
  em paralelo. Entidades diferentes podem ir em paralelo (limite de 3 requisições
  simultâneas).

## F4.6 Ordem de operações e dependências

Grafo mínimo obrigatório:

```
operador.login
      └─► apontamento.abrir (uuid A)
             ├─► apontamento.quantidades (depende de A)
             ├─► ocorrencia.abrir (uuid O, depende de A)
             │        ├─► ocorrencia.descrever      (depende de O)
             │        ├─► ocorrencia.acao_corretiva (depende de O)
             │        └─► ocorrencia.encerrar       (depende de O)
             └─► apontamento.encerrar (depende de A e de TODAS as ocorrencia.encerrar de A)
```

Regras:

1. O `SyncEngine` faz **ordenação topológica** da fila; empate é resolvido por `criadoEm`.
2. Um item cuja dependência está em `erro` ou `conflito` **não é enviado** — fica
   `pendente` e bloqueado, com motivo visível.
3. Um item cuja dependência foi sincronizada tem os IDs locais **remapeados** para os IDs
   do servidor antes do envio (o servidor pode aceitar o UUID do cliente como id, o que
   torna o remapeamento trivial — mas o engine não pode assumir isso, precisa ler o id
   retornado).
4. Operações do mesmo agregado são idempotentes e **comutativas apenas dentro do mesmo
   tipo**: duas atualizações de quantidade podem ser colapsadas em uma (a última vence),
   e o engine deve fazer esse colapso antes de enviar, para não gastar a fila com estados
   intermediários. Abrir/encerrar/cancelar **nunca** são colapsados.
5. Ciclo no grafo é bug: detectado, o engine para, registra e alerta — nunca entra em
   laço.

## F4.7 Reconexão

1. Gatilhos de reconexão: evento `online` do navegador, polling leve a cada 30 s (já
   existe), retorno do app ao primeiro plano (`visibilitychange`), e sucesso de qualquer
   requisição.
2. `online` do navegador é insuficiente (Wi-Fi de galpão conecta sem internet): a
   confirmação real é `POST /sync/heartbeat` (ou `GET /api/health`, como o
   `checkConnectivity` atual já faz).
3. Ao confirmar rede: `syncMeta.relogioDivergenciaMs` é atualizado a partir do `Date` da
   resposta do servidor; divergência acima de 2 minutos gera alerta visível (é o risco de
   `inicio` errado das Fases 2 e 3).
4. Em seguida: `GET /sync/delta?desde=ultimoDeltaEm` para atualizar cadastros locais e,
   só então, o esvaziamento da fila (enviar sobre cadastro velho é o que produz erro de
   FK inexistente).
5. Debounce de 3 s entre reconexões para não disparar rajadas em rede instável.

## F4.8 Recuperação após fechamento do app

1. No boot: abrir Dexie (aplicando a migração v3 se necessário), ler `syncMeta`,
   `deviceConfig`, `activeSession`, `activeAppointment`, `activeStop`.
2. O estado da máquina do posto é **reconstruído do IndexedDB**, nunca do
   `sessionStorage` (que persiste apenas `device` e `queueCount`).
3. Apontamento aberto encontrado → `IDLE → IN_PROGRESS`, com cronômetro recalculado de
   `inicio`. Parada aberta encontrada → `STOP_ACTIVE` ou `AWAITING_CORRECTIVE` conforme o
   status persistido.
4. Itens que ficaram em `enviando` quando o app morreu voltam para `pendente` — o reenvio
   é seguro por causa da idempotência (F4.3). Este é o caso que justifica a idempotência
   existir.
5. `navigator.storage.persist()` é solicitado na ativação do dispositivo; se negado, o
   sistema exibe alerta permanente ao administrador (o IndexedDB pode ser limpo pelo
   Android sob pressão de armazenamento, e isso significa perder fila).
6. Se a fila tiver itens com `expiraEm` vencido, eles são marcados `erro` e listados para
   o supervisor — nunca descartados em silêncio.

## F4.9 Atualização do service worker / nova versão

Mantém o que já está decidido (`registerType: 'prompt'`, banner, nunca automático) e
acrescenta:

1. Com apontamento ou parada **aberta**, a atualização é bloqueada com explicação
   ("Encerre o apontamento para atualizar"), e o botão fica desabilitado — não é só um
   aviso.
2. Com a fila não vazia, a atualização exige confirmação com o número de pendências.
3. Antes de aplicar (`skipWaiting` + reload), o app faz flush de tudo que estiver em
   memória para o IndexedDB.
4. `syncMeta.versaoSchema` e `versaoApp` são gravados após a atualização; se o bundle
   carregado exigir um schema Dexie maior que o presente, a migração roda antes de
   qualquer leitura.
5. O servidor expõe `versaoContratoSync`; se o cliente estiver abaixo do mínimo aceito, os
   endpoints de escrita respondem `426 Upgrade Required` e o app força a atualização —
   é a única situação em que a atualização não é opcional.

## F4.10 Indicadores visuais

Componentes `OfflineIndicator` e `SyncIndicator` do design system
([design-system-industrial.md](design-system-industrial.md#53-indicadores-de-conectividade)).

| Situação | Componente | Aparência |
|---|---|---|
| Online, fila vazia | `SyncIndicator` | neutro, `✓ Sincronizado 10:19` |
| Online, enviando | `SyncIndicator` | azul (`--acao`), `↻ Enviando 2 de 5` |
| Online, pendências paradas | `SyncIndicator` | atenção, `▲ 3 pendentes` |
| Offline | `OfflineIndicator` | atenção, `▲ Offline · 3 pendentes` |
| Erro de sincronização | `SyncIndicator` | parada, `✕ Erro ao sincronizar` + detalhe |
| Conflito | `SyncIndicator` | parada, `‼ Conflito — chame o líder` |
| Saldo de lote desatualizado | `IndustrialAlert` atenção | `Saldo do lote pode estar desatualizado (offline desde 09:14)` |
| Sessão local expirada | tela cheia | bloqueio com `Conecte à rede para entrar` |

O indicador é sempre clicável e abre um detalhamento com a lista de pendências, o motivo
do último erro e o horário da última sincronização bem-sucedida.

## F4.11 Limites do modo offline

**Permitido offline:**
- Continuar um apontamento **iniciado localmente** e digitar quantidades.
- Abrir, descrever e encerrar paradas.
- Encerrar apontamento (vai para a fila).
- Consultar cadastros que estejam em `cadastroLocal`.

**Permitido com aviso explícito:**
- Ver saldo de lote — sempre rotulado como possivelmente desatualizado, com o horário da
  última atualização. O sistema **não** bloqueia a produção por saldo, mas nunca apresenta
  o número como verdade atual.
- Selecionar O.P./lote a partir do pacote local — se o registro tiver sido alterado no
  servidor, o conflito aparece na sincronização.

**Bloqueado offline, sem exceção:**
- Qualquer cadastro administrativo (criar/editar/inativar/reativar).
- Alteração de permissão, perfil, usuário ou dispositivo.
- Cancelamento de apontamento ou de ocorrência (operação sensível, exige servidor).
- Efetivação de blenda e ajuste de inventário (Fase 5).
- Resolução de conflito.
- Primeiro login de um operador que nunca autenticou naquele tablet.

**Nunca, em hipótese alguma:**
- Criar sessão de operador sem credencial verificável (`BLOCKED_STALE_SESSION` em vez
  disso).
- Sobrescrever um conflito automaticamente.
- Descartar item da fila sem registro.
- Apresentar dado em cache como se fosse ao vivo.

## F4.12 Segurança

1. Nenhum token JWT é gravado em IndexedDB ou `localStorage` — a sessão continua em
   cookie `httpOnly` (decisão da Fase 0; a limpeza de `tokenAdmin` do IndexedDB na
   migração Dexie v2 é precedente explícito e não pode ser revertida).
2. `pin_hash` nunca sai do servidor. O verificador de PIN offline é derivado, de escopo
   restrito ao dispositivo, com validade curta e revogável no próximo bootstrap.
3. O pacote de bootstrap é escopado ao dispositivo/máquina: um tablet não recebe dados de
   outra unidade.
4. Payloads da fila não contêm dados pessoais além do necessário (matrícula e nome do
   operador).
5. Nenhuma resposta de `/auth/*` é cacheada pelo service worker (já vigente).
6. Uma requisição de escrita vinda de sessão de operador é rejeitada em qualquer rota
   administrativa, mesmo que a fila tente enviá-la.
7. Ao desativar um dispositivo no servidor, o próximo `heartbeat`/`delta` retorna
   revogação e o app limpa `cadastroLocal` e `activeSession`, preservando a `outbox` para
   que nada apontado se perca.

## F4.13 Testes obrigatórios

**Unitários (Vitest) — `SyncEngine`:**
1. Ordenação topológica respeita `dependeDe`; empate por `criadoEm`.
2. Item com dependência em `erro` não é enviado.
3. Backoff cresce exponencialmente, respeita o teto e aplica jitter.
4. `Retry-After` prevalece sobre o backoff calculado.
5. `4xx` não retryável não incrementa tentativa infinitamente.
6. `409` de versão vira `conflito` e cria registro em `conflitos`.
7. `409` de idempotência com payload diferente é distinguido do conflito de versão.
8. Colapso de múltiplos `apontamento.quantidades` do mesmo agregado.
9. Serialização por `entidadeUuid` (dois itens do mesmo apontamento nunca em paralelo).
10. Itens em `enviando` no boot voltam para `pendente`.
11. Migração Dexie v2 → v3 preserva fila e apontamento ativo.

**Integração (backend, Postgres real):**
12. Mesma `Idempotency-Key`, mesmo payload, duas vezes → um registro, respostas idênticas.
13. Mesma chave, payload diferente → `409` com código próprio.
14. `sync/bootstrap` só devolve dados da máquina do dispositivo.
15. `sync/delta` devolve exatamente o que mudou desde o timestamp.
16. Escrita administrativa com sessão de operador → `403`.
17. Dispositivo desativado → revogação no `heartbeat`.

**Playwright (contexto offline do browser):**
18. Perda de conexão durante apontamento: operador continua digitando; indicador vira
    offline; nada é perdido.
19. Reload com o tablet offline: apontamento e cronômetro restaurados.
20. Reconexão: fila esvazia sozinha; indicador volta a `Sincronizado`.
21. Idempotência: forçar duplo envio da mesma abertura resulta em **um** apontamento na
    listagem administrativa.
22. Conflito: alterar o registro pelo backend e sincronizar → mensagem de conflito ao
    operador, registro na tela do supervisor, dado local intacto.
23. Falha parcial: em uma fila de 5 itens, o 3º falha permanentemente — os dois primeiros
    sincronizam, o 4º e o 5º que dependiam dele ficam bloqueados com motivo visível.
24. Nova versão do service worker com apontamento aberto: atualização bloqueada com
    explicação; após encerrar, atualização liberada.
25. Operação administrativa offline: bloqueada com mensagem, nunca enfileirada.
