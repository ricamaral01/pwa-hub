# Exceções delimitadas do padrão visual

O teste `tests/unificado/visual_style_guard.py` verifica CSS autorado, estilos em HTML/JS/TSX, atribuições `style.cssText`, propriedades diretas de cor/fonte e emojis literais ou escapados. A paleta da interface fica em `shell/tokens.css`.

1. **Login até 1024px:** o usuário exigiu preservação exata. `shell/login-original.css` é carregado somente em `login.html`, com `media="(max-width:1024px)"`. O teste confere o SHA-256 do conteúdo normalizado: `583d6a6bd731032b85fbc1daca2b8ba3afaa0eba6bbae06f91f909608631d355`. Alterar esse arquivo faz o teste falhar. A comparação pixel a pixel está em `login-comparison.json`.
2. **Impressão:** blocos `@media print` conservam o CSS anterior. Estilos inline normalizados recebem identificadores `data-visual-print` e a apresentação anterior é restaurada na impressão por regras específicas em `tokens.css`. Não há transformação de cálculos, dimensões do PDF ou campos de dados. As emissões de armaduras e séries foram relidas e continuam byte a byte iguais às originais.
3. **Bibliotecas e saída de build:** `vendor`, `assets`, `dist`, `dist-tasks` e `shell/modelo-a` não são tratados como CSS autorado. React do menu e do Laboratório foram recompilados; os assets publicados são verificados por manifestos. O CSS da aplicação nativa de Dosagem foi mantido como uma camada estática de apresentação em `frontend/embedded/dosagem-static`, sem alterar o JavaScript compilado da aplicação. Produção Pederneiras/Ribeirão e Noroeste recebem folhas de sobreposição autoradas, normalizadas a partir do CSS publicado, somente em `@media screen`. Os bundles originais continuam intactos. Origem e hashes: `native-production-overlays.json`.
4. **Séries de gráficos:** as cores abaixo identificam séries e canais; não identificam módulos. São mantidas nos dados JavaScript dos gráficos para distinguir e rastrear as séries. Não constituem autorização para acrescentar cores a componentes da interface.

| Origem | Cores de série preservadas |
| --- | --- |
| Monitor térmico, `channelColors`, nas duas entradas estáticas do Laboratório | `#2F6FED`, `#12A5A5`, `#8A5CF6`, `#7A8496` |
| Mapa, `DASHBOARD_DEFEITOS_COLORS_BY_TYPE` | `#0369a1`, `#047857`, `#0891b2`, `#0d9488`, `#0e7490`, `#0f766e`, `#15803d`, `#16a34a`, `#2563eb`, `#4338ca`, `#475569`, `#4f46e5`, `#65a30d`, `#6d28d9`, `#7c3aed`, `#7e22ce`, `#9333ea`, `#9a3412`, `#a16207`, `#a21caf`, `#b45309`, `#b91c1c`, `#be123c`, `#c2410c`, `#d97706`, `#db2777`, `#dc2626` |

Marcas textuais monocromáticas de estado, como `✓`, `×` e `○`, não são emojis pictográficos. Menus e ações continuam usando SVG/ícones de traço. A classificação é coberta por testes negativos, inclusive para escapes Unicode.
