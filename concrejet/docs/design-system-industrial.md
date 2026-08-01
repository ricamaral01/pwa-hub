# Design System industrial — Etapa 1

**Status:** planejamento técnico. Nenhum código foi criado a partir deste documento.

Fonte visual obrigatória: `docs/referencia-ui/estilo.css` e os cinco mockups HTML dessa
pasta. Este documento traduz aquele CSS estático em um design system React, e define a
refatoração visual das telas da Fase 1 **sem alterar nenhum contrato de backend**.

Escopo executivo (dependências, testes, riscos, ordem) em
[plano-fases-2-a-6.md](plano-fases-2-a-6.md#etapa-1--design-system-industrial-e-refatoração-visual).

---

## 1. Princípios (extraídos do próprio mockup, não inventados)

1. **Uma paleta, duas densidades.** Tablet: alvo 56 px, fonte base 15 px, valor 26 px.
   Desktop: alvo 34 px, fonte base 14 px, tabela densa. Os tokens são os mesmos; o que
   muda é `--toque` e a escala tipográfica.
2. **Cor é sinalização, não decoração** (ISO 3864 — a mesma sinalização já pintada nas
   máquinas): verde = rodando, amarelo = atenção, vermelho = parada, azul = ação
   obrigatória. Nenhuma cor aparece sem significar estado, e nenhum estado é comunicado
   só por cor (sempre cor + ícone + texto).
3. **Todo número é tabular** (`.num`: monoespaçada + `tabular-nums`), para a coluna de
   valores não dançar enquanto o operador digita.
4. **Nenhuma fonte externa.** O tablet opera offline em galpão; webfont é ponto de falha
   sem contrapartida. Isso **revoga** a decisão de usar Inter via Google Fonts registrada
   em [interface.md](interface.md).
5. **No tablet não existe** `<select>` nativo, teclado nativo do sistema, rolagem
   vertical na tela principal, nem layout retrato. Lista curta vira grade de blocos
   tocáveis.
6. **Campo calculado nunca é editável** e aparece em tipografia maior que a do campo
   digitado.
7. **Nenhum identificador técnico (UUID) é visível** para o usuário — nem como campo
   digitável, nem como coluna de tabela.

---

## 2. Tokens

Arquivo único: `frontend/src/styles/tokens.css`. Nenhum valor hexadecimal literal pode
existir fora dele.

### 2.1 Cor

| Token | Valor | Uso |
|---|---|---|
| `--tinta` | `#14181C` | texto principal, sidebar do desktop |
| `--tinta-2` | `#4A545C` | texto secundário, rótulo de campo |
| `--tinta-3` | `#7B8792` | texto terciário, rótulo de tabela, estado ocioso |
| `--papel` | `#FFFFFF` | superfície de cartão/tabela |
| `--fundo` | `#E7ECF0` | fundo da aplicação |
| `--superficie` | `#F4F6F8` | campo de entrada, cabeçalho de tabela |
| `--superficie-2` | `#EDF1F4` | tecla auxiliar, etiqueta neutra, barra de medidor |
| `--linha` | `#D2DAE1` | borda padrão |
| `--linha-forte` | `#A9B5BF` | borda de elemento tocável/acionável |

Sinalização (cada estado tem trinca `cor` / `bg` / `linha`):

| Estado | `--*` | `--*-bg` | `--*-linha` | Significado |
|---|---|---|---|---|
| Ação | `--acao` `#0B5FA5` | `#E3EEF8` | `#7FAFD6` | ação obrigatória, foco, botão primário, seleção |
| OK | `--ok` `#17703A` | `#E1F0E7` | `#86BE9F` | rodando, dentro do limite, sincronizado |
| Atenção | `--atencao` `#8E5300` | `#FBEEDA` | `#DCB472` | acima do esperado, pendência de sincronização, setup longo |
| Parada | `--parada` `#AC2A21` | `#F9E5E3` | `#DE9A94` | parada, acima do limite crítico, erro |

Sidebar do desktop (superfície escura sobre fundo claro): fundo `var(--tinta)`, texto
`#C9D3DB`, divisor `#2A3138`, item ativo `#232A31` com marca `inset 3px 0 0 var(--acao)`,
rótulo de grupo `#5D6973`.

### 2.2 Tipografia

```
--fonte: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
--num:   ui-monospace, "Roboto Mono", "Cascadia Mono", Consolas, monospace;
```

| Papel | Tablet | Desktop |
|---|---|---|
| base do documento | 15 px | 14 px |
| rótulo de campo | 16 px / `--tinta-2` | 13 px |
| valor digitado | 26 px / 600 | — |
| valor calculado | 26 px / 700 | — |
| número de placa da máquina | 34 px / 700 | — |
| KPI | — | 30 px / 700 |
| título de seção | 12 px, `letter-spacing .09em`, caixa alta, `--tinta-3` | idem |
| cabeçalho de tabela | — | 11 px, `.07em`, caixa alta, `--tinta-3` |
| célula de tabela | — | 13 px |

### 2.3 Espaço, raio, sombra, toque

| Token | Valor | Uso |
|---|---|---|
| `--esp-1` … `--esp-6` | 4, 8, 10, 12, 16, 24 px | grid de espaçamento |
| `--raio` | 6 px | todo elemento retangular |
| `--raio-pilula` | 999 px | lâmpada de estado, etiqueta |
| `--sombra-tela` | `0 2px 16px rgba(20,24,28,.18)` | apenas sobreposições (modal, overlay) |
| `--toque` | 56 px | alvo mínimo tocável no tablet |
| `--toque-desk` | 34 px | alvo mínimo no desktop |
| `--bloco-alt` | 84 px | `TouchCard` |
| `--botao-alt` | 64 px | `TabletActionBar` |
| `--botao-alt-grande` | 84 px | ação primária de abertura |

A superfície industrial **não usa sombra** em cartão, tabela ou campo — separação é por
borda (`--linha`). Sombra só existe em algo que flutua sobre a tela.

### 2.4 Estados funcionais

| Estado | Cor | Fundo | Ícone | Texto obrigatório |
|---|---|---|---|---|
| Normal / rodando | `--ok` | `--ok-bg` | ● | `Rodando · 3h12` |
| Atenção | `--atencao` | `--atencao-bg` | ▲ | `Acima do limite de perda do item` |
| Erro | `--parada` | `--parada-bg` | ✕ | mensagem de negócio, nunca erro técnico |
| Parada | `--parada` | `--parada-bg` | ■ | `Parada · 00:07:41` |
| Ocioso | `--tinta-3` | `--superficie-2` | ○ | `Ociosa · sem apontamento aberto` |
| Offline | `--atencao` | `--atencao-bg` | ▲ | `Offline · N pendentes` |
| Sincronizando | `--acao` | `--acao-bg` | ↻ | `Enviando N de M` |
| Sincronizado | `--tinta-2` | `--superficie-2` | ✓ | `Sincronizado 10:19` |
| Conflito | `--parada` | `--parada-bg` | ‼ | `Conflito — aguardando supervisor` |

Regra: nunca exibir apenas o ícone, nunca exibir apenas a cor. As três dimensões
(cor + ícone + texto) sempre juntas — é o que torna o estado legível para daltônico e
sob luz de galpão.

---

## 3. Layout tablet (posto) — 1280 × 800, paisagem travada

```
┌──────────────────────────────────────────────────────────── 12px padding ──┐
│ MachineHeader (64px)                                                        │
│  [placa 05 · Sandretto 220t] [StatusLamp] [contexto O.P.]  ⟶ [SyncIndicator]│
│                                            [relógio] [OperatorHeader]       │
├─────────────────────────────────────────────────────────────────────────────┤
│ corpo — grid de 3 colunas, min-height 0, gap 12px                           │
│  320px            │  1fr                    │  300px                        │
│  contexto (RO)    │  campos digitáveis      │  NumericKeypad                │
├─────────────────────────────────────────────────────────────────────────────┤
│ faixa de resultado calculado — grid 4×1fr + 300px (medidor)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ IndustrialAlert (condicional)                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ TabletActionBar (64px) — grid 1fr 1.2fr 1fr 1.3fr                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Container: `display:flex; flex-direction:column; height:100%; padding:12px; gap:12px`.
- O corpo é `flex: 1 1 auto` com `min-height: 0` — é isso que impede scroll: o conteúdo
  se comprime, a tela não cresce.
- Colunas do corpo variam por tela: apontamento `320px 1fr 300px`; identificação
  `1fr 380px`; abertura `1fr 1fr 1fr`; parada `300px 1fr`.
- Teclado numérico **próprio** (`NumericKeypad`), grid 3 colunas, teclas de altura
  mínima `--toque`: `1..9`, `,`, `0`, `Apagar` (e `Entrar` na tela de PIN).
- Nenhum `<input>` recebe foco de teclado nativo: os campos são botões que abrem o
  teclado interno; a entrada é controlada pelo estado da aplicação.
- Orientação: as três camadas já existentes (manifest `landscape`,
  `screen.orientation.lock`, media query de retrato) permanecem.

---

## 4. Layout desktop (gestão) — 1440 × 900

```
┌──────────┬──────────────────────────────────────────────────────────────────┐
│ Sidebar  │ DesktopHeader (60px): h1 + FilterBar compacta + ações à direita   │
│ 208px    ├──────────────────────────────────────────────────────────────────┤
│ escura   │ conteúdo (padding 20px 24px, gap 16px, overflow hidden)          │
│          │  ├ KpiCard × 4 (grid)                                            │
│ marca    │  ├ bloco (cabeçalho 42px + corpo)                                │
│ menu     │  └ DataTable com overflow-y próprio + Pagination                 │
│ agrupado │                                                                  │
│ rodapé   │                                                                  │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

- Sidebar escura (`--tinta`) sobre conteúdo claro (`--fundo`) — o contraste é o que
  separa navegação de trabalho.
- Grupos de menu com rótulo de 10 px em caixa alta (`--tinta-3` escurecido) e itens de
  9×18 px de padding. Item ativo com marca azul à esquerda.
- Filtros são **pílulas compactas de 34 px** na barra de título, não um painel lateral.
- Tabela: cabeçalho `--superficie`, 11 px caixa alta; célula 13 px; separador
  `--linha`; coluna numérica alinhada à direita com `.num`.
- Somente o corpo da tabela rola; a página **nunca** rola horizontalmente — conteúdo
  largo rola dentro do próprio contêiner `overflow-x: auto`.

### 4.1 Menu do desktop — agrupamento definitivo

Extraído de `04-desktop-painel.html` e estendido com o que o sistema já tem:

```
(sem grupo)  Painel do dia            /gestao
             Apontamentos             /gestao/apontamentos
             Ocorrências              /gestao/ocorrencias
Resina       Lotes                    /gestao/resina/lotes
             Blendas                  /gestao/resina/blendas
             Inventário               /gestao/resina/inventario
Relatórios   Perda % por item         /gestao/relatorios/perda-item
             Perda R$ por item        /gestao/relatorios/perda-valor
             Histórico geral          /gestao/relatorios/historico
             Efetivo                  /gestao/relatorios/efetivo
             Ocupação de máquina      /gestao/relatorios/ocupacao-maquina
             Ciclo real × padrão      /gestao/relatorios/ciclo-real-padrao
Cadastros    Itens                    /admin/cadastros/items
             Moldes                   /admin/cadastros/molds
             Configurações item/molde /admin/cadastros/item-mold-configurations
             Máquinas                 /admin/cadastros/machines
             Turnos                   /admin/cadastros/shifts
             Colaboradores            /admin/cadastros/collaborators
             Funções                  /admin/cadastros/functions
             Operações                /admin/cadastros/operations
             Tipos de ocorrência      /admin/cadastros/occurrence-types
             Resinas                  /admin/cadastros/resins
             Lotes de resina          /admin/cadastros/resin-lots
             Fornecedores             /admin/cadastros/suppliers
             Ordens de produção       /admin/cadastros/production-orders
```

Itens de Resina, Relatórios e das fases 2/3 aparecem **desabilitados com tooltip
"disponível na Fase N"** enquanto a fase não existir — nunca como link quebrado.
Cada item só é renderizado se o usuário tiver a permissão `<recurso>.consultar`.

---

## 5. Catálogo de componentes

Local: `frontend/src/design-system/`. Todos tipados em TypeScript estrito, sem `any`,
sem dependência de biblioteca de UI externa.

### 5.1 Casca e navegação — tablet

| Componente | Props essenciais | Onde é usado |
|---|---|---|
| `TabletShell` | `header: ReactNode`, `children`, `footer?: ReactNode`, `alert?: ReactNode`, `colunas?: string` (template do grid do corpo) | `/posto`, `/posto/abertura`, `/posto/apontamento`, `/posto/parada` |
| `MachineHeader` | `numero: string`, `nome: string`, `status: StatusVariant`, `statusTexto: string`, `contexto?: ReactNode`, `direita?: ReactNode` | topo de todas as telas de posto |
| `OperatorHeader` | `nome: string`, `detalhe: string` (matrícula ou "desde 07:10"), `onTrocar?: () => void` | canto direito do `MachineHeader` |
| `StatusLamp` | `variant: 'ok' \| 'atencao' \| 'parada' \| 'ocioso'`, `children: string` | estado da máquina, estado do apontamento |
| `TabletActionBar` | `acoes: Array<{ rotulo, onClick, variante?: 'primario'\|'parada'\|'neutro', disabled?, tamanho?: 'normal'\|'grande' }>`, `template?: string` | rodapé de todas as telas de posto |

### 5.2 Entrada — tablet

| Componente | Props essenciais | Onde é usado |
|---|---|---|
| `TouchCard` | `titulo: string`, `descricao?: string`, `selecionado?: boolean`, `disabled?: boolean`, `onClick` | seleção de operador, operação, O.P., lote, tipo e categoria de parada |
| `TouchSelect` | `label: string`, `opcoes: Array<{id, titulo, descricao?}>`, `valor: string \| null`, `onChange(id)`, `colunas?: number`, `verTodos?: () => void` | substitui `<select>` no tablet; renderiza grade de `TouchCard` |
| `NumericField` | `label: string`, `valor: string`, `unidade?: string`, `casasDecimais?: number`, `focado: boolean`, `onFocus()`, `erro?: string` | 5 campos da tela de apontamento |
| `NumericKeypad` | `onDigito(d: string)`, `onApagar()`, `onConfirmar?()`, `permiteDecimal: boolean`, `rotuloConfirmar?: string` | apontamento e PIN de 4 dígitos |
| `IndustrialAlert` | `variante: 'atencao' \| 'parada' \| 'info'`, `children`, `icone?` | aviso de perda acima do limite, parada sem ação corretiva, tablet vinculado à máquina |

### 5.3 Indicadores de conectividade

| Componente | Props essenciais | Onde é usado |
|---|---|---|
| `OfflineIndicator` | `online: boolean`, `pendentes: number` | `MachineHeader` (posto) e `DesktopHeader` |
| `SyncIndicator` | `estado: 'sincronizado' \| 'pendente' \| 'enviando' \| 'erro' \| 'conflito'`, `pendentes: number`, `ultimaSincronizacao?: string`, `onDetalhes?()` | idem; ligado ao `SyncEngine` da Fase 4 |

### 5.4 Casca e navegação — desktop

| Componente | Props essenciais | Onde é usado |
|---|---|---|
| `DesktopShell` | `titulo: string`, `filtros?: ReactNode`, `acoes?: ReactNode`, `children` | todas as telas de `/admin/*` e `/gestao/*` |
| `DesktopSidebar` | `grupos: Array<{ rotulo?: string, itens: Array<{ rotulo, rota, permissao?, desabilitado?, motivoDesabilitado? }> }>`, `rotaAtiva`, `rodape: ReactNode` | `DesktopShell` |
| `DesktopHeader` | `titulo`, `filtros?`, `acoes?` | `DesktopShell` |
| `DesktopToolbar` | `esquerda?: ReactNode`, `direita?: ReactNode` | barra secundária acima de tabela (contagem, seleção, ações em massa) |
| `FilterBar` | `campos: FilterField[]`, `valores: Record<string,unknown>`, `onChange`, `onLimpar` | listagens e relatórios; renderiza pílulas de 34 px |

### 5.5 Dados — desktop

| Componente | Props essenciais | Onde é usado |
|---|---|---|
| `DataTable<T>` | `colunas: Array<{ chave, cabecalho, alinhamento?, largura?, formato?: 'texto'\|'numero'\|'data'\|'booleano'\|'etiqueta', render?(linha) }>`, `linhas: T[]`, `ordenarPor?`, `direcao?`, `onOrdenar?`, `estado: 'ok'\|'vazio'\|'carregando'\|'erro'`, `acoes?(linha)` | todas as listagens |
| `Pagination` | `pagina`, `tamanhoPagina`, `total`, `onPagina`, `onTamanhoPagina` | rodapé de `DataTable` |
| `KpiCard` | `rotulo: string`, `valor: string`, `unidade?: string`, `nota?: string`, `variante?: 'neutro'\|'ok'\|'atencao'\|'parada'` | painel do dia, relatórios |
| `EmptyState` | `titulo`, `descricao?`, `acao?` | tabela vazia, sem resultado de filtro |
| `LoadingState` | `descricao?` | carregamento de lista/detalhe |
| `ErrorState` | `titulo`, `descricao`, `onTentarNovamente?` | falha de rede/permissão; nunca exibe stack nem erro do Postgres |
| `ConfirmationDialog` | `titulo`, `descricao`, `confirmarRotulo`, `variante: 'neutro'\|'perigo'`, `exigeJustificativa?: boolean`, `onConfirmar(justificativa?)`, `onCancelar` | inativar, reativar, cancelar O.P., cancelar apontamento, efetivar blenda |

`ConfirmationDialog` com `exigeJustificativa` é o componente que sustenta as regras de
"cancelamento exige justificativa" das Fases 2, 3 e 5 — não deve ser reimplementado em
cada tela.

---

## 6. Mapeamento mockup → rota do sistema

| Mockup | Rota | Fase que a implementa | Componentes principais |
|---|---|---|---|
| `02-tablet-identificacao.html` (quadro 1) | `/posto` | 2 | `TabletShell`, `MachineHeader`, `TouchSelect` (operadores), `NumericKeypad` (PIN 4 dígitos), `IndustrialAlert` (tablet vinculado à máquina) |
| `02-tablet-identificacao.html` (quadro 2) | `/posto/abertura` | 2 | `TabletShell` (3 colunas), 3 × `TouchSelect` (operação, O.P., lote), `TabletActionBar` com botão grande |
| `01-tablet-apontamento.html` | `/posto/apontamento` | 2 | `TabletShell`, contexto somente leitura, 5 × `NumericField`, `NumericKeypad`, faixa de resultado + medidor de perda, `IndustrialAlert`, `TabletActionBar` |
| `03-tablet-parada.html` | `/posto/parada` | 3 | `TabletShell` (2 colunas), `TouchSelect` (programada/não programada), `TouchSelect` 3×3 (categoria), campos de descrição e ação corretiva, `IndustrialAlert`, `TabletActionBar` |
| `04-desktop-painel.html` | `/gestao` | 6 | `DesktopShell`, 4 × `KpiCard`, mosaico de máquinas, `DataTable` (apontamentos do turno), lista de alertas |
| `05-desktop-perdas.html` | `/gestao/relatorios/perda-item` | 6 | `DesktopShell`, `FilterBar`, 4 × `KpiCard`, `DataTable` com colunas por mês + tendência, faixa de leitura interpretativa |
| (sem mockup) | `/admin/cadastros/:resource` | Etapa 1 (refatoração) | `DesktopShell`, `FilterBar`, `DataTable`, `Pagination`, `ConfirmationDialog` |

Componentes que aparecem no mosaico e no medidor de perda (`.maq`, `.medidor`,
`.barra-mini`) só são necessários na Fase 6 — não devem ser criados na Etapa 1.

---

## 7. Refatoração das telas da Fase 1 (`/admin/cadastros/:resource`)

**Restrição absoluta:** `frontend/src/features/cadastros/api.ts` e todos os contratos do
backend permanecem intactos. Muda apenas a camada de apresentação e o metadado de
`resources.ts`.

### 7.1 Defeitos atuais e correção exigida

| # | Defeito hoje | Correção |
|---|---|---|
| 1 | Menu não agrupado, todos os recursos em lista plana | `DesktopSidebar` com os grupos da seção 4.1 |
| 2 | Rótulos sem acentuação (`Funcoes`, `Codigo`, `Maquinas`, `Descricao`, `Numero de serie`) | Todos os rótulos e títulos em português correto: `Funções`, `Código`, `Máquinas`, `Descrição`, `Número de série`, `Operações`, `Configurações item/molde`, `Ordens de produção` |
| 3 | Labels sem `htmlFor` em parte dos campos | Todo par label/controle com `htmlFor`/`id` (regressão já corrigida uma vez em 0.2.4 — não pode voltar) |
| 4 | Cabeçalho de tabela usa o nome técnico do campo (`quantidadeInicialKg`, `dataInicioPlanejada`) | Cabeçalho amigável declarado no metadado: `Quantidade inicial (kg)`, `Início planejado` |
| 5 | Booleano renderizado como `true`/`false` | `Ativo` / `Inativo` como etiqueta (`--ok-bg` / `--superficie-2`) |
| 6 | Relacionamento como campo de texto de UUID (`funcaoId`, `itemId`, `moldeId`, `unidadeId`) | `<select>` real carregado da API, exibindo `código · descrição`, enviando só o ID — **exatamente o padrão já aplicado em `resin-lots` na correção 0.3.1, generalizado** |
| 7 | Formulário genérico idêntico para os 12 recursos | Formulário específico por recurso: agrupamento de campos, ordem lógica, campos calculados/somente leitura marcados (ex.: `saldoAtualKg` nunca editável) |
| 8 | UUID visível em coluna de tabela | Nenhuma coluna de ID; a tabela mostra código/descrição do relacionamento |
| 9 | Mensagem de erro crua da API | `ErrorState` / alerta com mensagem de negócio; campo inválido destacado com texto explicativo |
| 10 | Listagem fixa em `limit=50`, sem total nem paginação | `DataTable` + `Pagination` usando `meta.total` que a API já devolve |
| 11 | Ações de editar/inativar/reativar inconsistentes | Coluna de ações padronizada; inativar/reativar sempre via `ConfirmationDialog`; cancelamento de O.P. com justificativa obrigatória |
| 12 | Sem estado vazio/carregando/erro | `EmptyState`, `LoadingState`, `ErrorState` |

### 7.2 Metadado estendido (`features/cadastros/resources.ts`)

O tipo `CadastroField` ganha, sem quebrar o existente:

```ts
type CadastroField = {
  name: string;
  label: string;                 // já acentuado
  type?: FieldType;
  required?: boolean;
  readonly?: boolean;
  hint?: string;                 // texto de apoio abaixo do campo
  grupo?: string;                // agrupamento visual no formulário
  ocultarNaTabela?: boolean;
  options?: { value: string; label: string }[];
  optionsFrom?: CadastroSlug;    // hoje limitado a 'resins' | 'suppliers'
  optionLabel?: (registro) => string;  // ex.: `${codigo} · ${descricao}`
  formato?: 'texto' | 'numero' | 'data' | 'booleano' | 'etiqueta';
};
```

`optionsFrom` passa a aceitar qualquer slug de cadastro, o que resolve o defeito 6 para
`funcaoId` (`functions`), `itemId` (`items`), `moldeId` (`molds`),
`unidadeId` (unidades — endpoint a expor se ainda não existir; caso não exista, o campo
vira somente leitura preenchido pela empresa/unidade da sessão, **nunca** um input de
UUID).

### 7.3 O que **não** muda

- Slugs de rota (`/admin/cadastros/functions` continua).
- Payload enviado (mesmas chaves, mesmos tipos).
- Regras de validação do backend.
- Nomes de permissão.
- `AdminGuard` e o fluxo de sessão administrativa.

---

## 8. Acessibilidade

- Alvo mínimo: 56 px (tablet) / 34 px (desktop). Nenhum controle abaixo disso.
- Contraste: texto principal sobre `--papel` e sobre cada `*-bg` de sinalização deve
  atingir no mínimo 4,5:1 (verificar `--atencao` `#8E5300` sobre `#FBEEDA` e `--ok`
  `#17703A` sobre `#E1F0E7` — ambos passam; qualquer token novo precisa ser verificado).
- Estado nunca só por cor: sempre cor + ícone + texto.
- `htmlFor`/`id` em todo par label/controle.
- `aria-label` em todo botão só com ícone.
- `role="alert"` + `aria-live="assertive"` em `IndustrialAlert` de erro/parada;
  `aria-live="polite"` em atenção e em `SyncIndicator`.
- `role="timer"` + `aria-live="off"` no cronômetro (atualização por segundo não deve ser
  anunciada).
- Foco visível por `:focus-visible` com anel `--acao` de 2 px — inclusive nos
  `TouchCard`, que são botões.
- Navegação por teclado completa no desktop; no tablet o teclado físico não é premissa,
  mas nada pode ser inacessível por teclado.
- `prefers-reduced-motion`: sem animação de piscar; o estado crítico usa borda espessa em
  vez de pulsar.

---

## 9. Responsividade controlada

Não é um sistema "responsivo até o celular" — é um sistema de **dois alvos fixos**.

| Faixa | Comportamento |
|---|---|
| ≥ 1280 px, paisagem, rota `/posto/*` | Layout de tablet exatamente como especificado. Sem scroll. |
| < 1280 px ou retrato, rota `/posto/*` | Tela de aviso "Gire o tablet" / "Resolução não suportada". Nenhuma degradação silenciosa. |
| ≥ 1280 px, rotas `/admin/*` e `/gestao/*` | Layout de desktop. Sidebar fixa. |
| 1024–1279 px, `/admin/*` e `/gestao/*` | Sidebar colapsa para ícones; tabela ganha `overflow-x` interno. |
| < 1024 px, `/admin/*` e `/gestao/*` | Suportado em modo degradado (uma coluna, filtros empilhados); **não** é alvo de teste. |

O corpo da página nunca rola horizontalmente; conteúdo largo rola dentro do próprio
contêiner.

---

## 10. Regras para quem implementa

1. Um componente só é criado quando aparece em pelo menos duas telas de referência — o
   resto é composição local.
2. Nenhum componente conhece o domínio: `DataTable` não sabe o que é um lote de resina.
   Domínio vive nas páginas e nos repositórios.
3. Nenhuma cor hexadecimal fora de `tokens.css`.
4. Nenhum texto de interface em inglês.
5. Nenhum `useEffect` de layout para forçar altura — o layout é resolvido por grid/flex.
6. Todo componente novo entra com teste de render dos seus estados no mesmo commit.

# Atualizacao Fase 2 - 2026-08-01

A primeira camada executavel do design system foi criada em `frontend/src/ui/tokens/tokens.css`, `frontend/src/ui/industrial.css`, `frontend/src/ui/tablet/index.tsx`, `frontend/src/ui/desktop/index.tsx` e `frontend/src/ui/feedback/index.tsx`.

Ela cobre shell tablet, cabecalho de maquina, cards touch, seletores industriais, campos numericos, keypad, barra de acoes, shell desktop, sidebar, toolbar, filtros, tabela, paginacao, KPIs e estados de feedback.
