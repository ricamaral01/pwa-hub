# Sincronização Offline — ConcreTrack Injeção

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
