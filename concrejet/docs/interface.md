# Interface — ConcreTrack Injeção (Fase 1 Sprint 0)

## Stack frontend

| Tecnologia | Versão | Função |
|---|---|---|
| React | 18 | UI declarativa |
| TypeScript | 5 (strict) | Tipagem estrita |
| Vite | 6 | Build e dev server |
| React Router | 6 | Roteamento SPA |
| TanStack Query | 5 | Cache de dados do servidor |
| React Hook Form | 7 | Formulários com validação |
| Zod | 3 | Schema de validação |
| Dexie | 4 | IndexedDB tipado |
| Zustand | 5 | Estado global + máquina de estados |
| Axios | 1 | HTTP client centralizado |
| vite-plugin-pwa | 0.21 | Service worker + manifest |

## Identidade visual

Paleta industrial escura, implementada como CSS custom properties (não Tailwind):

```css
--bg-primary:   #1F242C  /* Fundo principal */
--bg-surface:   #262C35  /* Superfícies elevadas */
--bg-card:      #2F3640  /* Cards */
--color-green:  #16A34A  /* Ações primárias, estado OK */
--color-amber:  #F59E0B  /* Atenção, paradas planejadas */
--color-red:    #EF4444  /* Crítico, paradas não-planejadas */
--text-primary: #FFFFFF  /* Texto principal */
```

Fonte: **Inter** (Google Fonts, Open Font License — distribuição livre). Inter Tight para números e títulos.

## Layout da tela operacional

Implementado com CSS Grid, sem scroll vertical:

```
┌─────────────────── TopBar (56px) ──────────────────────┐
│ Logo | Máquina | Operador | Online/Offline | Hora | ⏸ 🔁 │
├──────────────┬──────────────────────┬──────────────────┤
│ Identificação│  Resina e Produção   │ Tempo e Resultados│
│  (340px)     │       (flex: 1)      │     (340px)      │
│              │                      │                  │
│ OP           │ Lote (select)        │ ⏱ 00:00:00       │
│ Item (auto)  │ Resina (auto)        │ Ciclo Real       │
│ Molde        │ Fornecedor (auto)    │ ────             │
│ Cavidades    │ Tipo (auto)          │ Peças Boas       │
│ Ciclo Padrão │ Saldo (auto)         │ Perda Total      │
│ Peso Aplicado│ ────                 │ Perda s/ Galho   │
│              │ Peças Boas           │ % Perda          │
│              │ Refugo               │ ────             │
│              │ Falha Preenchimento  │ [StatusBadge]    │
│              │ Borra                │                  │
│              │ Galho                │                  │
│              │ Outras Perdas        │                  │
├──────────────┴──────────────────────┴──────────────────┤
│ Ocorrências (68px): Estado | Cronômetro | [Reg. parada] │
├────────────────────────────────────────────────────────┤
│ Ações (64px): [INICIAR/CONCLUIR/SALVAR] | [Rascunho] [✕]│
└────────────────────────────────────────────────────────┘
```

## Estado real vs. simulado

| Funcionalidade | Estado atual |
|---|---|
| Login administrativo | Real |
| Sessao administrativa | Cookie httpOnly |
| Ativacao do dispositivo | Local no IndexedDB nesta fase |
| Login de operador | Nao implementado / demonstracao |
| Itens, moldes, lotes e O.P. | Mock em modo demonstracao |
| Persistencia de apontamento | Nao implementada |
| Sincronizacao operacional offline | Nao implementada |

O modo normal (`VITE_DEMO_MODE=false`) nao cria sessao operacional ficticia, nao usa
mocks silenciosamente e bloqueia a operacao sem backend real. O modo demonstracao
(`VITE_DEMO_MODE=true`) exibe uma faixa fixa informando que nenhum dado sera enviado ao
servidor.

## Telas implementadas

### `/activate` — ActivationPage
- Geração automática de UUID do dispositivo (IndexedDB)
- Formulário para informar código/nome/ID da máquina
- Botão de cópia do identificador

### `/login` — LoginPage
- Modo operador: matrícula + PIN (teclado grande, usável com luvas)
- Modo admin: e-mail + senha (chama `POST /auth/login` real)
- Exibe máquina vinculada, relógio e status de rede
- Auto-submit ao digitar 4 ou 6 dígitos no PIN

### `/` — OperationPage
- Layout 3 colunas + topbar + faixas de ocorrências e ações
- Formulário com Zod + React Hook Form
- Cálculo de perdas em tempo real
- Cronômetro persistido via IndexedDB (não depende de setInterval para o valor base)
- Confirmação com justificativa para cancelamento
- Overlay de sucesso com animação

## Orientação landscape

Três camadas de proteção:
1. `manifest.json`: `"orientation": "landscape"`
2. `main.tsx`: `screen.orientation.lock('landscape')` após primeiro gesto
3. `index.css`: `@media (orientation: portrait)` mostra aviso e oculta a interface

## Acessibilidade

- Alvos de toque: mínimo 44px (botões operacionais 52–72px)
- Texto principal: 18px (campos e valores), 20–30px (números de destaque)
- Estados de perda: ícone + texto + cor + borda (não apenas cor)
- `aria-label` em todos os botões de ícone
- `role="alert"` e `aria-live` em mensagens de erro e status
- `role="timer"` no cronômetro
- Foco visível via `:focus-visible`

## Máquina de estados (17 estados)

```
DEVICE_NOT_CONFIGURED → NO_OPERATOR → IDLE → FORM_INCOMPLETE → PREPARING
→ IN_PROGRESS → STOP_ACTIVE → AWAITING_CORRECTIVE → READY_TO_COMPLETE
→ SAVING → SAVED → OFFLINE_QUEUE → SYNC_ERROR → CONFLICT → SESSION_LOCKED
NEW_VERSION (superposto — não bloqueia)
```

Transições inválidas são rejeitadas com erro de console (não alteram o estado).
