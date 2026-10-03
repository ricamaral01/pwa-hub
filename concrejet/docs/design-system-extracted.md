# Design System Extraido - ERP ConcreTrack Legado

Fonte analisada: `./legacy-reference/erp-concretrack/`.

Observacao de escopo: o arquivo `docs/plano-mestre-v2.md` citado no briefing nao existe neste workspace; foram considerados `README.md`, `frontend/package.json`, `frontend/vite.config.ts` e a referencia legada baixada da VPS.

## 0. Sumario executivo

O legado visual e um ERP estatico simples, baseado em Bootstrap 5.3.3 com uma camada custom pequena em `theme.css` e `dashboard.css`. A identidade mais forte esta na combinacao azul marinho Concrefer `#15416F`, vinho/magenta `#A72141`, topbar grafite e cards brancos arredondados. O estilo e contemporaneo leve, com cards elevados, grid responsivo basico, Gotham como fonte pretendida e emojis usados como iconografia. A consistencia e media: os tokens centrais existem, mas ha muitos estilos inline e varios componentes ainda sao placeholders.

## 1. Paleta de cores

### Marca

| Cor (hex normalizado) | Uso semantico inferido | Ocorrencias | Exemplos de arquivo |
|---|---:|---:|---|
| `#15416F` | Marca primaria / azul marinho oficial Concrefer; botao primario, links, graficos, sombra da marca | 1 literal + variavel `--blue` | `static/css/theme.css`, `apps/dashboard/dash.html` |
| `#A72141` | Marca secundaria / vinho oficial Concrefer; badge "Em breve", status parado | 1 literal + variavel `--mag` | `static/css/theme.css` |
| `#0F3355` | Hover do botao primario; variacao escura do azul | 1 | `static/css/theme.css` |

### Neutros

| Cor (hex normalizado) | Uso semantico inferido | Ocorrencias | Exemplos de arquivo |
|---|---:|---:|---|
| `#F6F7FB` | Fundo global | 1 literal + variavel `--bg` | `static/css/theme.css`, `apps/dashboard/dash.html`, `frontend/pages/login.html` |
| `#FFFFFF` | Cards, login card, texto sobre fundos escuros | 4 | `static/css/theme.css`, `frontend/pages/login.html` |
| `#0F172A` | Texto principal | 2 literal + variavel `--ink` | `static/css/theme.css`, `static/css/dashboard.css` |
| `#64748B` | Texto secundario/muted, labels de KPI, footer, subtitulos inline | 14 | `static/css/theme.css`, `static/css/dashboard.css`, `frontend/pages/*.html` |
| `#E2E8F0` | Texto secundario claro no topbar e botao claro | 2 | `static/css/theme.css` |
| `#F8FAFC` | Header de card/tabela de painel | 1 | `static/css/dashboard.css` |
| `#343B43` | Topbar grafite | 1 literal + variavel `--topbar` | `static/css/theme.css` |

### Estados

| Cor (hex normalizado) | Uso semantico inferido | Ocorrencias | Exemplos de arquivo |
|---|---:|---:|---|
| `#10B981` | Sucesso / status normal | 1 literal + variavel `--green` | `static/css/theme.css` |
| `#F59E0B` | Aviso / atencao | 1 literal + variavel `--amber` | `static/css/theme.css` |
| `#A72141` | Erro/parada e badge de indisponivel/em breve | 1 literal + variavel `--mag` | `static/css/theme.css`, `apps/dashboard/dash.html` |
| `#0EA5E9` | Info / apoio; declarado, sem uso direto encontrado | 1 | `static/css/theme.css`, `BRAND_NOTES.md` |
| `#8B5CF6` | Apoio extra; declarado, sem uso direto encontrado | 1 | `static/css/theme.css`, `BRAND_NOTES.md` |

### Superficies e transparencias

| Cor (hex normalizado) | Uso semantico inferido | Ocorrencias | Exemplos de arquivo |
|---|---:|---:|---|
| `rgba(15, 23, 42, 0.08)` | Bordas suaves / separadores | 2 | `static/css/theme.css`, `static/css/dashboard.css` |
| `rgba(21, 65, 111, 0.08)` | Sombra leve de card | 1 | `static/css/theme.css` |
| `rgba(21, 65, 111, 0.12)` | Sombra/topbar e area do grafico | 2 | `static/css/theme.css`, `apps/dashboard/dash.html` |
| `rgba(21, 65, 111, 0.16)` | Sombra hover de card | 1 | `static/css/theme.css` |
| `rgba(0, 0, 0, 0.08)` | Sombra de login/iframe | 2 | `frontend/pages/login.html`, `apps/dashboard/index.html` |

Nao foram encontradas quase-duplicadas do azul oficial como `#1A3A6C`/`#1B3B6D` dentro da referencia legada. O novo `frontend/vite.config.ts` usa `#1F242C` como `theme_color`, diferente do azul de marca legado; CANDIDATO A REVISAR.

## 2. Tipografia

| Contexto | Family | Size | Weight | Line-height | Letter-spacing |
|---|---|---:|---:|---:|---:|
| `body` | `"Gotham", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` | Bootstrap default, nao definido no CSS custom | 400 | Bootstrap/browser | nao definido |
| `h1` | Gotham + Bootstrap | Bootstrap `h1` | `.fw-bold` em HTML | Bootstrap | nao definido |
| `h2` | Gotham + Bootstrap | Bootstrap `h2` | `.fw-semibold` em HTML | Bootstrap | nao definido |
| `h3` | AMBIGUO - REVISAR; nao encontrado padrao custom | N/A | N/A | N/A | N/A |
| Body copy | Gotham + Bootstrap | Bootstrap default | 400 | Bootstrap | nao definido |
| Label | Gotham + Bootstrap | Bootstrap default; KPI label `14px` | default | Bootstrap | nao definido |
| Botao | Gotham + Bootstrap | Bootstrap/default; `.btn` sem tamanho custom | 600 | Bootstrap/browser | nao definido |
| Tabela | AMBIGUO - REVISAR; nenhuma tabela real encontrada | N/A | N/A | N/A | N/A |
| Breadcrumb | AMBIGUO - REVISAR; nenhum breadcrumb encontrado | N/A | N/A | N/A | N/A |
| KPI valor | Gotham + Bootstrap | `32px`; status especial inline `22px` | 700 | Bootstrap/browser | nao definido |
| Footer | Gotham + Bootstrap | `13px` inline | default | Bootstrap/browser | nao definido |

Fontes web: `@font-face` local para Gotham Book `400` e Gotham Bold `700`, ambos em `static/fonts/*.woff2`. `BRAND_NOTES.md` informa que os arquivos sao placeholders e devem ser substituidos pelos licenciados reais. Nao ha Google Fonts.

Escala detectada: parcial e pequena (`12`, `13`, `14`, `22`, `32`, `2em` para emojis). A maior parte da escala vem do Bootstrap, entao a tipografia custom e ad-hoc/moderada.

## 3. Espacamento

Escala custom detectada: `2`, `8`, `10`, `12`, `14`, `16`, `32`; Bootstrap adiciona classes `p-3`, `p-4`, `mt-3`, `mt-4`, `mb-3`, `mb-4`, `g-2`, `g-3`, `gap-2`, `gap-3`.

| Valor | Uso | Ocorrencias custom |
|---:|---|---:|
| `2px 8px` | Padding de badge | 1 |
| `10px 14px` | Padding de botao custom | 1 |
| `12px 0` | Padding da topbar | 1 |
| `0 16px` | Padding horizontal do container custom | 1 |
| `32px` | Margin-top de paginas e padding do login | 2+ |
| `8px` | Gap interno de botao | 1 |
| `12px` | Gap da marca na topbar | 1 |
| `16px` | Gap do grid custom | 1 |

O padrao predominante e hibrido: Bootstrap para layout/densidade e poucos tokens custom para shell/cards.

## 4. Radius, sombras e bordas

### Radius

| Tipo | Valor | Evidencia |
|---|---:|---|
| Card generico | `18px` | `.card`, login card, iframe |
| Logo no topbar | `12px` | `.app-topbar .logo` |
| Botao | `10px` | `.btn` |
| Badge | `8px` | `.badge-soon` |
| Status dot | `50%` | `.status-dot` |

### Sombras

| Profundidade | Valor | Uso |
|---|---|---|
| Topbar/marca | `0 10px 30px rgba(21, 65, 111, 0.12)` | `--shadow` |
| Card leve | `0 2px 12px rgba(21, 65, 111, 0.08)` | `.card` |
| Card hover | `0 8px 24px rgba(21, 65, 111, 0.16)` | `.card:hover` |
| Login/modal-like | `0 12px 32px rgba(0,0,0,0.08)` | `.login-card` |
| Iframe dashboard | `0 8px 30px rgba(0,0,0,0.08)` | `apps/dashboard/index.html` |

### Bordas

| Tipo | Valor | Uso |
|---|---|---|
| Card | `1px solid rgba(15, 23, 42, 0.08)` | `.card` |
| Card header | `1px solid rgba(15, 23, 42, 0.08)` | `.card-header` |
| Iframe dashboard | `none` | `apps/dashboard/index.html` |

## 5. Componentes visuais recorrentes

### Botoes

Ha uma classe custom `.btn` sobreposta ao Bootstrap: inline-flex, centro, gap `8px`, sem borda, radius `10px`, padding `10px 14px`, cursor pointer e weight `600`. Variantes reais encontradas: `.btn-primary` em azul `#15416F` com hover `#0F3355`; `.btn-light` em `#E2E8F0` com texto `#0F172A`. Estado disabled aparece em botoes "Em breve", mas depende do comportamento nativo/Bootstrap; nao ha estilo custom de loading ou active.

### Inputs e formularios

Somente login real foi encontrado: `input type=text`, `input type=password`, labels Bootstrap `.form-label`, inputs `.form-control`, autocomplete correto e required. Mensagem de erro usa `#error` com `.text-danger mt-3` e `display:none` inline. Nao foram encontrados select, date, checkbox, radio ou textarea com padrao visual proprio. Placeholder nao aparece no login.

### Tabelas

Nenhuma tabela real foi encontrada na referencia baixada. AMBIGUO - REVISAR para zebra striping, densidade, cabecalho fixo, ordenacao visual e paginacao.

### Cards, paineis, modais, dropdowns, tooltips, tabs, badges, alerts

Cards sao o componente central: fundo branco, radius `18px`, borda clara, sombra leve e elevacao no hover com translateY(-2px). Paineis do dashboard reutilizam `.card` e `.card-header` com fundo `#F8FAFC`. Login usa `login-card`, visualmente equivalente a modal/card central. Badges existem apenas como `.badge-soon`, vinho com texto branco, peso 700, radius `8px` e tamanho `12px`. Nao foram encontrados dropdowns, tooltips, tabs, alerts customizados ou modais reais.

### Navegacao

Nao ha sidebar. O shell usa topbar fixa no topo visual, mas nao CSS `position: fixed`: `.app-topbar` com fundo grafite `#343B43`, logo, status dot, titulo/subtitulo e botao de voltar a home. A home funciona como hub de modulos em cards: Dashboard, Cadastros, Gerenciador, Cimento e CEC. Navegacao e feita com botoes `onclick` e `window.location.href` por subpath `/concretrack`.

### Loading / empty / error / skeleton

Loading estrutural nao foi encontrado. O dashboard usa valores placeholder `—` antes de aplicar mock data. Estados empty sao principalmente cards/paginas "Em breve". Erro aparece no login como texto simples `.text-danger`; nao ha skeleton.

## 6. Layout / Shell

Estrutura de pagina: `header` carregado como fragmento, `main` implicito via `.container` ou `.container-fluid`, e `footer` carregado como fragmento. Header contem logo/status/titulo/botao; paginas de hub usam grid de cards; dashboard usa cards KPI e grafico em canvas via Chart.js.

| Elemento | Valor detectado |
|---|---|
| Sidebar | Nao existe |
| Header/topbar | Padding vertical `12px`; altura final depende de logo `42px` + padding |
| Container custom | `max-width: 1180px`, `padding: 0 16px`, centralizado |
| Container dashboard | Bootstrap `.container-fluid py-3` |
| Margem superior de paginas | `32px` inline ou Bootstrap `mt-4` |
| Grid custom | `display:grid`, `gap:16px` |
| Breakpoint custom | `@media (min-width: 768px)` |
| Colunas custom | `.cards-3` e `.cards-4` com `repeat(n, minmax(0, 1fr))` |
| Breakpoints Bootstrap usados | `col-md-6`, `col-xl-3`, `container`, `container-fluid` |

Responsividade: basica e dependente do Bootstrap. O grid custom so muda em `768px`; nao ha tratamentos especificos para tablet industrial ou TV alem do dashboard com `container-fluid` e colunas Bootstrap.

## 7. Iconografia

Bibliotecas: Bootstrap CSS esta presente, mas nao foi encontrado Bootstrap Icons. Chart.js e usado para grafico no dashboard. A iconografia de modulos na home e em cadastros usa emojis inline com `font-size:2em`. Logo usa `static/img/logo-128.png` e SVG/PNG placeholders. O briefing do novo menciona Material Symbols para checklist de defeitos, mas isso nao aparece no legado baixado.

## 8. Efeitos e microinteracoes

| Efeito | Valor | Uso |
|---|---|---|
| Hover de card | `transform: translateY(-2px)` | `.card:hover` |
| Transicao de card | `transform .15s ease, box-shadow .15s ease` | `.card` |
| Hover de botao primario | troca para `#0F3355` | `.btn-primary:hover` |
| Fade-in | `animation: fadein .3s ease` | `.fade-in` |
| Keyframes fadein | opacity 0 -> 1, translateY(6px) -> 0 | `theme.css` |
| Atualizacao dashboard | `setInterval` 120000 ms | `apps/dashboard/dash.html` |

Nao foram encontradas animacoes complexas, loading spinners ou easing custom alem de `ease`.

## 9. Acessibilidade

### Contraste amostrado

| Par texto/fundo | Ratio | WCAG AA |
|---|---:|---|
| `#0F172A` sobre `#FFFFFF` | 17.85 | Passa |
| `#64748B` sobre `#FFFFFF` | 4.76 | Passa para texto normal |
| `#FFFFFF` sobre `#15416F` | 10.41 | Passa |
| `#FFFFFF` sobre `#A72141` | 7.15 | Passa |
| `#E2E8F0` sobre `#343B43` | 9.19 | Passa |
| `#64748B` sobre `#F6F7FB` | 4.45 | Limite; falha por pouco para texto normal AA se exigir 4.5 |

Foco visivel: depende do Bootstrap/navegador; `.btn` custom remove borda mas nao define `:focus-visible`. `aria-*`: nao foram encontrados atributos ARIA na referencia baixada. Imagens de logo possuem `alt` em header, login e dashboard. Formularios possuem `label`, mas sem `for`; a associacao direta label-input nao esta explicita.

Problemas: botoes com emojis/icone visual nao tem texto alternativo alem do contexto do card; `onclick` inline reduz semantica; paginas carregam fragmentos dinamicamente sem marco `main`; status dot comunica estado por cor sem texto alternativo proprio.

## 10. Inconsistencias e duvida visual

- `BRAND_NOTES.md` informa que paleta/logos/fontes sao fallback/placeholders; portanto a extracao e factual do codigo, mas precisa validacao humana contra marca oficial.
- O briefing cita azul aproximado `#1A3A6C`, mas o legado usa `#15416F`; CANDIDATO A REVISAR com marca oficial.
- O novo `frontend/vite.config.ts` usa `theme_color` e `background_color` `#1F242C`, diferente do azul/vinho legado; CANDIDATO A CONSOLIDAR/REVISAR.
- Iconografia por emoji e inconsistente com o requisito futuro de Material Symbols.
- Ha estilos inline recorrentes (`margin-top:32px`, `color:#64748b`, `font-size:2em`, iframe shadow/radius), o que enfraquece o design system.
- Topbar nao tem responsividade explicita para textos longos; usa `min-width:0`, mas sem ellipsis.
- Login card e iframe usam sombras pretas, enquanto cards comuns usam sombras azuladas.
- Muitas telas sao placeholders "Em breve"; os padroes de tabela, formulario completo, modais, dropdowns e tabs estao ausentes ou ambiguos.

## 11. Recomendacoes para o novo

### IDENTIDADE - preservar

Preservar o par `#15416F` e `#A72141` como identidade reconhecivel ate validacao contra material oficial. Preservar topbar escura com logo/status/titulo para telas operacionais e dashboards, mas adaptar para shell React responsivo. Preservar cards brancos sobre fundo frio `#F6F7FB`, pois isso da continuidade visual clara com o ERP existente.

### MODERNIZAR

Substituir emojis por Material Symbols/lucide conforme contexto do novo sistema. Reduzir radius para uma escala mais operacional e menos "landing" nos componentes densos: cards administrativos podem usar 8px, enquanto modais/login podem manter 12px. Remover estilos inline e transformar em tokens/classes. Definir foco visivel, estados disabled/loading/error, tabelas densas e componentes de formulario completos.

### MAPEAMENTO PARA shadcn/ui

| Legado | shadcn/ui sugerido | Observacao |
|---|---|---|
| `.btn`, `.btn-primary`, `.btn-light` | `Button` variants `default`, `secondary`, `ghost` | Customizar tokens de cor para azul/vinho |
| `.card`, `.card-header` | `Card`, `CardHeader`, `CardContent` | Ajustar radius/sombra para densidade ERP |
| `.badge-soon` | `Badge` | Criar variant `brand-secondary` ou `soon` |
| Login form Bootstrap | `Form`, `Input`, `Label`, `Button`, `Alert` | Adicionar mensagens e foco acessivel |
| Topbar fragment | Componente `AppHeader` custom | Nao e primitivo shadcn; usar tokens |
| Dashboard KPI cards | `Card` custom + `Chart` wrapper | Preservar KPI value/label |
| Status dot | `Badge`/indicador custom | Precisa texto acessivel |

### TOKENS PROPOSTOS

Proposta inicial baseada somente nas cores existentes no CSS legado:

| Token | Valor | Origem |
|---|---|---|
| `--color-brand-primary` | `#15416F` | `--blue` |
| `--color-brand-primary-hover` | `#0F3355` | `.btn-primary:hover` |
| `--color-brand-secondary` | `#A72141` | `--mag` |
| `--color-info` | `#0EA5E9` | `--cyan` |
| `--color-success` | `#10B981` | `--green` |
| `--color-warning` | `#F59E0B` | `--amber` |
| `--color-accent-purple` | `#8B5CF6` | `--purple` |
| `--color-surface-page` | `#F6F7FB` | `--bg` |
| `--color-surface-card` | `#FFFFFF` | `--card` |
| `--color-surface-muted` | `#F8FAFC` | `.card-header` |
| `--color-text-primary` | `#0F172A` | `--ink` |
| `--color-text-muted` | `#64748B` | `--muted` |
| `--color-shell-topbar` | `#343B43` | `--topbar` |
| `--color-border-subtle` | `rgba(15, 23, 42, 0.08)` | `--line` |
| `--shadow-card` | `0 2px 12px rgba(21, 65, 111, 0.08)` | `.card` |
| `--shadow-card-hover` | `0 8px 24px rgba(21, 65, 111, 0.16)` | `.card:hover` |
| `--shadow-shell` | `0 10px 30px rgba(21, 65, 111, 0.12)` | `--shadow` |
| `--radius-card-legacy` | `18px` | `.card` |
| `--radius-control` | `10px` | `.btn` |
| `--radius-badge` | `8px` | `.badge-soon` |
