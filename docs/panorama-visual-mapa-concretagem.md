# Panorama Visual — Mapa de Concretagem

> Levantamento de 2026-10-02, **somente leitura**: nenhum arquivo do Mapa foi alterado.
> Base: a cópia de trabalho atual de `mapa-concretagem/`, **incluindo as alterações ainda não commitadas** (ver seção 8).
> Objetivo: entender como a parte visual foi construída e como está hoje, antes de mudar qualquer coisa.

---

## 1. Resumo

- **Stack:** HTML + CSS + JavaScript puro, sem framework e sem etapa de build. Tudo roda em uma única página (`index.html`) com 17 telas e 12 modais já presentes no HTML. O JS mostra ou esconde cada tela.
- **Tamanho do visual:**

  | Arquivo | Linhas |
  |---|---|
  | `styles.css` | 7.726 |
  | `dashboard-defeitos-v4.css` | 1.786 |
  | `index.html` | 1.812 |
  | `app.js` (gera boa parte do HTML) | 14.690 |

- **Como foi feito:** de forma incremental, tela a tela, por demanda. São 281 commits no Mapa, 107 deles só no `styles.css`. Cada ajuste virou um bloco novo no fim do CSS, quase sempre com `!important` e escopado pela tela ativa (`body.mode-xxx`).
- **Identidade:** fundo claro, menu lateral azul-marinho (`#0f1e3c`) e laranja (`#e8762a`) como cor de ação. Na prática, porém, **as cores vêm da paleta do Tailwind escritas à mão** (`#f8fafc`, `#e2e8f0`, `#0f172a`, `#2563eb`…), e não das variáveis da marca.
- **O ponto mais organizado** é o Dashboard Defeitos V4: veio de um mockup aprovado e tem CSS próprio.
- **O ponto mais frágil** é a responsividade em tablet (769–1100px), corrigida tela por tela.

---

## 2. Como os arquivos se encaixam

```
index.html
 ├─ <style> inline (títulos de grupo do menu e da tela Início)
 ├─ styles.css?v=v5.27              ← tudo: shell, telas, quiosque, neon, impressão, responsivo
 ├─ dashboard-defeitos-v4.css?v=v5.27 ← só o Dashboard Defeitos (prefixo df-v4-)
 ├─ ../assets/msgbox.css            ← modal global de sucesso (compartilhado com o hub)
 ├─ chart.min.js + chartjs-plugin-datalabels.min.js (cópias locais)
 └─ app.js                          ← troca de telas, render de tabelas/cards via innerHTML, gráficos
sw.js  → cache "mapa-concretagem-v5.27" com todos os arquivos acima
```

- **Versão:** o mesmo número (`v5.27`) é repetido à mão em `index.html`, `sw.js` e `manifest.json`. Toda mudança visual exige subir o número nos três lugares; senão o tablet continua com o CSS antigo em cache. A versão aparece como um badge na barra do topo (`#swVersionBadge`).
- **`mapa-concretagem-teste/`** é uma cópia física completa. Hoje `styles.css` e `dashboard-defeitos-v4.css` estão idênticos aos de produção, e o `app.js` difere em poucas linhas. A “promoção” do teste para produção é feita copiando arquivos (*“feat: promover melhorias do mapa teste para producao”*).

---

## 3. Estrutura da interface (shell)

```
┌────────────┬───────────────────────────────────────────────────┐
│  SIDEBAR   │ TOPBAR (sticky, 64px, branca translúcida)          │
│  240px     │ ☰  Título da tela  [v5.27]   usuário  Sair  ● sync │
│  #0f1e3c   ├───────────────────────────────────────────────────┤
│            │ .page-content (max 1600px, padding 20/32px)        │
│ [MC] Mapa  │                                                    │
│ Início     │   <section id="viewXxx" class="card">  ← tela ativa│
│ Dash…      │                                                    │
│ ─Produção─ │                                                    │
│ P1 P2 …    │                                                    │
│ ─Montagem─ │                                                    │
│ ─Geral──── │                                                    │
│ ↩ Voltar   │                                                    │
└────────────┴───────────────────────────────────────────────────┘
```

- **Sidebar:** fundo navy; item ativo com fundo laranja translúcido e borda esquerda laranja. Os ícones são **monogramas de 2 letras** (`PL`, `P1`, `MB`, `RE`…) misturados com **emojis** (📊 📈 🛠️ 📋 👤). Alguns ícones têm cor fixa inline (`DF` vermelho, 🛠️ amarelo, 📋 rosa).
- **Topbar:** botão ☰, título da tela, badge de versão, usuário logado, botão Sair e pílula de status da sincronização com a planilha (verde, amarelo, vermelho ou azul).
- **Navegação:** `setMode("NOME")` em [app.js:8532-8716](../mapa-concretagem/app.js#L8532-L8716):
  1. esconde todas as `<section>` e mostra a da tela pedida (`.hidden`);
  2. troca a classe do `<body>` (`mode-hub`, `mode-liberacao`, `mode-dashboard-defeitos`…);
  3. marca o item ativo no menu e atualiza o título da topbar (mapa `navTitles`).
- **Login próprio:** `#loginScreen` em tela cheia, com card branco, cabeçalho em gradiente navy→azul, logo “MC” laranja e círculo decorativo laranja. Esse login é diferente do login do hub (`/auth`), que também é carregado na página.

---

## 4. Inventário das telas

| Tela (`id`) | Menu | Padrão de cabeçalho | Visual |
|---|---|---|---|
| Início (`viewHub`) | Início | — | 3 grupos (Produção, Montagem, Geral) com botões redondos coloridos (cor inline em cada um: azul, laranja, verde, teal, roxo, rosa, amarelo…) + painel “Formas em manutenção” por setor |
| Produção / Liberação (`viewLiberacao`) | P1–P4, PL | `section-title-row` **ou** `kiosk-header` | Grade de “cards de forma” por setor (S1 90, S2 80, S3 52, S4 86 formas), com contador por setor. É o coração operacional |
| Mandril Circular (`viewMandrilCircular`) | MC | `section-title-row` | Tabela de 7 colunas; vários estilos inline |
| Inspeção Setor 3 e 4 (`viewInspecao`) + Detalhe | MB | `section-title-row` | Filtros em grade, tabela “planilha” (`sheet-table`), checklist por defeito com ícones, barra flutuante “💾 Salvar Inspeções” |
| Montagem Postes (`viewMontagemPostes`) + Detalhe | MP | `section-title-row` | Tabela + KPIs aprovado/retrabalho/reprovado, badges “premium” de status |
| Sequência Setor 3 (`viewSequenciaS3`) | S3 | `section-title-row` | Lista em flex-row responsiva |
| Dashboard Montagem (`viewMontagemIndicadores`) | 📊 | `mi-topbar` | KPIs, gráficos Chart.js, guia “memória dos indicadores”, filtros fixos + gaveta |
| Dashboard Defeitos (`viewDashboardDefeitos`) | DF | `df-v4-topbar` | Layout V4 (mockup aprovado): marca, abas de escopo, cards “hero”, mini-KPIs, painéis por setor, **modo apresentação 4:3** em slides |
| Produtividade (`viewProdAnalise`) | 📈 | `mi-topbar` (`pa-`) | Filtros em gaveta lateral com presets (Hoje / 7 dias…), KPIs, gráficos, glossário |
| Relatório Enc. Produção (`viewRelatorio`) | RE | `section-title-row` | Filtro *sticky* + split desktop; layout especial de **impressão/PDF** e envio por WhatsApp |
| Histórico (`viewHistorico`) | HI | `section-title-row` | Mesmo padrão do Relatório |
| Acmp. Concretagem (`viewAcmpConcretagem`) | CC | `section-title-row` | Barra de filtros + botões salvar/imprimir |
| Manutenção Formas (`viewRelatorioManutencao`) | 🛠️ | `mi-topbar` | Listagem + filtros; tema amarelo; impressão |
| Tratativa Defeitos (`viewTratativaDefeitos`) | 📋 | `mi-topbar` | KPIs com bordas coloridas inline + tabela; impressão |
| Usuários (`viewUsuarios`) | 👤 | `section-title-row` | Formulário + lista |

**Três gerações de cabeçalho convivem:**
1. **`section-title-row`** (original): `h2` + botão “Voltar” branco, dentro de um `.card` branco com raio de 18px.
2. **`mi-topbar`** (dashboards de 2026): título com resumo do filtro e botões-ícone “Filtros / Atualizar / Voltar”, com filtros em gaveta.
3. **`df-v4-topbar`** (Dashboard Defeitos V4): bloco de marca, abas e status.

Há ainda o **`kiosk-header`**, exclusivo da Produção em modo quiosque.

**12 modais** (`.modal-overlay` > `.modal-box`): carregando, resultado da inspeção, montagem salva, tipo de concreto (botões grandes com ícone), concreto vibrado, correção de apontamento, visualizar checklist, primeiro acesso, inativar forma, liberar forma, tratativa de defeito e nova ocorrência. O padrão base é uma caixa branca centralizada, com ícone emoji grande e animação de entrada. Vários modais sobrescrevem o padrão com `style="..."` inline (largura, alinhamento, borda superior colorida).

---

## 5. Produção / Quiosque e os “modos neon”

É a tela usada nos tablets do chão de fábrica e a que tem mais personalidade visual.

**Card de forma** (`.forma-card`, gerado em JS): botão de pelo menos 54px com o número da forma. Cada estado tem sua cor:

| Estado | Borda / fundo |
|---|---|
| ocioso | cinza `#94a3b8` / `#f8fafc` (azul claro no hover) |
| salvando | lilás `#818cf8` / `#eef2ff` |
| salvo | verde `#16a34a` / `#dcfce7` |
| liberada | azul `#2563eb` / `#dbeafe` |
| programada | destaque próprio |
| em manutenção | marcação específica (`::after`) |
| erro | vermelho `#dc2626` / `#fef2f2` |

Ao toque o card encolhe (`scale(.91)`). No Setor 4 o card mostra o modelo do poste em fonte menor.

**Modo quiosque** (`body.kiosk-active`, 32 regras):
- esconde o menu e o cabeçalho normal;
- mostra um cabeçalho grande em gradiente navy→azul com título de 2.2rem;
- mostra os toggles (Programar Formas, Modo Liberação, Modo Manutenção);
- mostra os botões Sincronizar, Tela Cheia e Sair;
- mostra os campos Data e Operador e o contador “Progresso X / Y” em verde.

**Temas “neon”**, aplicados por cima do layout claro, todos com `!important`:

| Modo | Classe | Visual |
|---|---|---|
| Liberação | `body.liberation-active` | Cabeçalho marrom-laranja, borda e glow `#ff4500` nos cards e no badge de versão |
| ODIN (correção de apontamento) | `body.odin-active` | Cabeçalho vinho, borda e glow vermelho `#ff0000` |
| Programar | toggle ativo | Neon amarelo |
| Manutenção | toggle ativo | Amarelo `#f1c40f` |

> Observação: o JS escuta um `#kioskOdinToggleField` que **não existe** no HTML (o checkbox do ODIN fica escondido). Hoje o ODIN só é ativado pelo botão “Refazer apontamento errado”.

---

## 6. Linguagem visual na prática (números)

### Cores
- `:root` tem só 13 variáveis (`--accent #e8762a`, `--primary #1a3a5c`, `--text`, `--muted`, `--line`…). Elas aparecem em cerca de 86 usos, quase todos `--line` (39) e `--accent` (13).
- Existem **155 cores hex distintas** no `styles.css`. As mais usadas são cinzas e azuis do Tailwind: `#f8fafc`, `#e2e8f0`, `#0f172a`, `#cbd5e1`, `#64748b`, `#475569`, `#1d4ed8`, `#2563eb`; mais verdes e vermelhos de estado (`#dcfce7`/`#166534`, `#fee2e2`/`#991b1b`).
- **Três azuis “de marca” convivem:** `#0f1e3c` (sidebar), `#1a3a5c` (`--primary`) e `#15416F`/`#173653` (Dashboard Defeitos V4, que segue a marca Concrefer).
- **Gráficos:** 14 instâncias de Chart.js, cada uma com cores escritas no próprio gráfico, sem paleta central.
- **Ícones da tela Início:** cada um com cor inline própria. São cerca de 10 cores diferentes, sem relação com setor ou tipo.

### Tipografia
- Fonte única: **Segoe UI / system-ui** (sem fonte web).
- **99 tamanhos de fonte distintos**, quase todos em `rem` (0.7, 0.72, 0.75, 0.78, 0.8, 0.82, 0.85, 0.88, 0.9, 0.95…), sem escala definida.
- Pesos variados: 500, 600, 650, 700, 750, 800, 850, 900, 950.

### Forma e profundidade
- 31 valores de `border-radius` diferentes (cards com 18px, inputs e botões com 12px, cards de forma com 10px, pílulas com 999px…).
- 69 sombras (`box-shadow`) diferentes.
- `z-index` sem escala: 1, 20, 50, 99, 100, 200, 999, 1500, 9999, 10000.

### Componentes base
- `.btn` branco com borda; `.btn.primary` em gradiente laranja.
- `input`/`select` com borda de 2px, raio de 12px e foco com borda laranja.
- `.card` branco com raio de 18px e sombra suave.
- `.hidden { display:none !important }` controla toda a navegação.

### Dívida de CSS
| Indicador | Valor |
|---|---|
| `!important` em `styles.css` | **585** |
| `!important` em `dashboard-defeitos-v4.css` | 39 |
| `style="..."` no `index.html` | 197 |
| Manipulações de `style` no `app.js` | ~290 |
| `innerHTML` no `app.js` (HTML montado em string) | 111 |
| Regras escopadas por tela | `mode-montagem-indicadores` 56, `mode-dashboard-defeitos` 37, `kiosk-active` 32, `sidebar-hidden` 9, `odin-active` 7, `liberation-active` 7… |
| Breakpoints distintos | ~30 (340, 380, 420, 480, 500, 520, 600, 640, 700, 720, 768, 769, 900, 920, 1024, 1100, 1180, 1280, 1366, 1600, 1920 e faixas combinadas) |
| Blocos `@media print` | 5 + 1 (relatório de produção, manutenção, tratativa, defeitos) |

### Como o CSS cresceu
O arquivo não é organizado por componente, e sim **pela ordem cronológica das demandas**. Exemplos de seções no fim do arquivo, cada uma corrigindo regras definidas milhares de linhas antes:

- `/* Ajuste tablet - Dashboard Montagem e Dashboard Defeitos */` (l. 6383)
- `/* Dashboard Montagem v1.76: leitura ampliada e memoria dos indicadores */` (l. 6707)
- `/* Dashboards: ocupar toda a area util, inclusive em monitores largos. */` (l. 6923)
- `/* Telas do Mapa: manter o conteúdo dentro da largura do celular. */` (l. 6963)
- `/* Filtros dos dashboards no celular */` (l. 7290)
- `/* Alinhamento dos filtros de Montagem e Defeitos em tablet e desktop. */` (l. 7555)

O histórico de commits mostra o mesmo padrão, por exemplo: *“Refatora dashboard montagem mobile-first”*, *“padroniza cores com o resto da aplicação (tema claro)”* (a Produtividade chegou a ter glassmorphism escuro antes de voltar para o tema claro) e *“deixa os efeitos neon ultra vibrantes e com sombra no tablet”*.

---

## 7. Responsividade

| Faixa | Comportamento atual |
|---|---|
| ≤ 768px (celular) | Menu vira gaveta com fundo escurecido; bloco final “manter dentro da largura do celular” força `width:100%` em tudo; filtros dos dashboards em 2 colunas |
| **769–1024px (tablet)** | **Conflito, ver abaixo** |
| 769–1100px | Correções específicas para Mandril, Produtividade, Dashboard Montagem e Defeitos, que escondem o menu à força com `!important` |
| ≥ 1025px | Menu fixo de 240px, recolhível pelo ☰ (preferência salva em `localStorage`) |
| Quiosque | Menu escondido, padding de 40px, cards ampliados |

**O conflito do tablet (confirmado em navegador headless):**
- o CSS em `@media (max-width:1024px)` (l. 502) esconde o menu;
- mas o bloco `@media (min-width:769px)` (l. 4191), que vem depois no arquivo, mostra o menu fixo e empurra o conteúdo 240px.

Resultado medido:

| Largura | Menu | Margem do conteúdo |
|---|---|---|
| 600px | escondido (−240px) | 0 |
| 800px, 1000px | **fixo, visível** | **240px** |

Enquanto isso, o JS (`window.innerWidth <= 1024`) trata essa faixa como celular: o ☰ abre o fundo escurecido de gaveta, mas o menu já estava visível e não recolhe. É por isso que várias telas ganharam correções próprias para tablet (`body.mode-xxx .sidebar:not(.sidebar-open) { transform: translateX(-100%) !important }`).

Outros pontos:
- Zoom bloqueado na viewport (`maximum-scale=1, user-scalable=no`).
- Sem modo escuro (o tema é sempre claro, com exceção dos neons do quiosque).

---

## 8. Problemas concretos encontrados

| # | Problema | Onde | Efeito |
|---|---|---|---|
| 1 | Conflito de breakpoints 768 × 1024 no menu | [styles.css:502](../mapa-concretagem/styles.css#L502) × [styles.css:4191](../mapa-concretagem/styles.css#L4191), JS em [app.js:8794](../mapa-concretagem/app.js#L8794) | Menu sempre visível em tablet de 769 a 1024px; o ☰ só escurece a tela. Origem das correções por tela |
| 2 | A classe `mode-mandril-circular` nunca é adicionada ao body | [app.js:8641](../mapa-concretagem/app.js#L8641) só faz `remove` | As regras de tablet do Mandril ([styles.css:1280](../mapa-concretagem/styles.css#L1280)) **nunca são aplicadas** |
| 3 | `navTitles` incompleto | [app.js:8689](../mapa-concretagem/app.js#L8689) | Em Mandril, Sequência S3, Manutenção e Tratativa o título da topbar fica com o nome da tela anterior e nenhum item do menu fica ativo |
| 4 | Texto com acentuação corrompida | [index.html:292](../mapa-concretagem/index.html#L292) | A tela Início mostra “Formas atualmente em manutenÃ§Ã£o” |
| 5 | Toggle do ODIN aponta para um elemento inexistente | `kioskOdinToggleField` em [app.js:9387](../mapa-concretagem/app.js#L9387) | Código morto (o ODIN funciona pelo botão de correção) |
| 6 | Código de inicialização do menu duplicado | [app.js:8776](../mapa-concretagem/app.js#L8776) e [app.js:9865](../mapa-concretagem/app.js#L9865) | Duas cópias da mesma lógica, protegidas por uma flag |
| 7 | Seletor de layout legado sem uso | `.header { display:none }` | Sobra de layout antigo |

**Atenção ao estado do repositório:** `mapa-concretagem/` tem cerca de **5.500 linhas alteradas e ainda não commitadas** desde o último commit (2026-08-21):

| Arquivo | Linhas alteradas |
|---|---|
| `app.js` | +3.040 |
| `dashboard-defeitos-v4.css` | +1.359 |
| `styles.css` | +1.229 |
| `index.html` | +268 |

Antes de qualquer refatoração visual, vale **commitar esse estado** para ter um ponto de retorno.

---

## 9. O que pesa na decisão antes de mudar

1. **Definir os tokens primeiro:** cor da marca (navy `#0f1e3c`, `#1a3a5c` ou o `#15416F` do Dashboard V4?), escala de cinzas, cores de estado, escala tipográfica (hoje são 99 tamanhos), raios, sombras e z-index. Sem isso, cada tela nova cria mais valores.
2. **Começar pelo shell e pela responsividade de tablet**, já que o tablet é o dispositivo principal. Corrigir o conflito 768 × 1024 no lugar certo permite apagar as correções por tela.
3. **Usar o Dashboard Defeitos V4 como referência:** é o único trecho que veio de mockup aprovado, com CSS isolado e prefixado.
4. **Unificar os três padrões de cabeçalho** (`section-title-row`, `mi-topbar`, `df-v4-topbar`) e o padrão de modal (tirar os estilos inline).
5. **Preservar o que funciona no chão de fábrica:** as cores de estado do card de forma, o quiosque e os neons de Liberação e ODIN, que servem de alerta visual de “modo perigoso”. Revisar só a implementação (menos `!important`).
6. **Sempre fazer no `mapa-concretagem-teste` primeiro**, lembrando que é uma cópia física: toda mudança aprovada precisa ser copiada para produção, com bump da versão em `index.html`, `sw.js` e `manifest.json`.
7. **Correções pequenas e seguras para aquecer:** itens 2, 3 e 4 da seção 8.

---

## 10. Arquivos-chave

| Assunto | Local |
|---|---|
| Estrutura das telas e modais | [index.html](../mapa-concretagem/index.html) |
| Tokens (`:root`) | [styles.css:1-14](../mapa-concretagem/styles.css#L1-L14) |
| Shell (sidebar/topbar) | [styles.css:223-520](../mapa-concretagem/styles.css#L223-L520) e [styles.css:4178-4230](../mapa-concretagem/styles.css#L4178-L4230) |
| Componentes base (`.card`, `.btn`, inputs, modais) | [styles.css:525-1030](../mapa-concretagem/styles.css#L525-L1030), [styles.css:1401](../mapa-concretagem/styles.css#L1401) |
| Card de forma | [styles.css:2145](../mapa-concretagem/styles.css#L2145) |
| Quiosque e neon | [styles.css:4230-4640](../mapa-concretagem/styles.css#L4230-L4640), [styles.css:5811-5905](../mapa-concretagem/styles.css#L5811-L5905) |
| Dashboard Defeitos V4 | [dashboard-defeitos-v4.css](../mapa-concretagem/dashboard-defeitos-v4.css), mockup em [mockups/dashboard-defeitos-v4.html](../mockups/dashboard-defeitos-v4.html) |
| Troca de telas | [app.js:8532](../mapa-concretagem/app.js#L8532) (`setMode`) |
| Cache/versão | [sw.js](../mapa-concretagem/sw.js) |
| Documentação técnica existente | [HANDOFF_TECNICO.md](../mapa-concretagem/HANDOFF_TECNICO.md) |
