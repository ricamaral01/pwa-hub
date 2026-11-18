# Prompt para o Codex: padrão visual único do Unificado

Cole tudo abaixo da linha no Codex, na raiz do repositório `pwa-hub-fase1`.

---

## Objetivo

Aplicar no Unificado o padrão visual definido em `docs/revisao-visual-unificado/`. O objetivo é tirar a aparência de interface gerada por IA e fazer todos os módulos usarem a mesma fonte, as mesmas cores e os mesmos componentes.

**Todo o trabalho acontece no ambiente de teste** (homologação, `https://concrefer.concretrack.com.br:18446/unificado/`). Leve **todas as fases** até o fim lá e deixe tudo 100% funcionando e validado. O teste definitivo é feito por mim no ambiente de teste. A **produção** (`https://concrefer.concretrack.com.br/unificado/`) não é tocada em nenhum momento deste trabalho; ela só recebe a entrega numa etapa separada, depois que eu der meu aval por escrito.

Esta é uma mudança **apenas visual e de texto**. Não altere regras de negócio, APIs, bancos, permissões, rotas, nomes de campos de formulário nem o formato dos dados enviados.

## Material de referência (leia antes de começar)

- `docs/revisao-visual-unificado/index.html`: diagnóstico. Lista os padrões a remover, a matriz de inconsistência por módulo, os tokens propostos e a ordem sugerida.
- `docs/revisao-visual-unificado/comparativo.html`: comparação hoje × proposta em computador, tablet e celular.
- `docs/revisao-visual-unificado/telas/`: telas propostas em HTML estático. São a especificação visual.
  - `base.css` define tokens, menu lateral, cabeçalho de página, faixa de números, tabela, lista, formulário e estados.
  - `tablet.css` define o trilho de ícones do menu recolhido.
  - `mobile.css` define a referência de celular.
  - Desktop: `inicio.html`, `acesso-rapido.html`, `numeros-serie.html`, `laboratorio.html`, `suprimentos.html`, `carta-traco.html`, `login.html`.
  - Tablet: `t-planejamento.html`, `t-programacao.html`, `t-suprimentos.html`.
  - Celular: `m-*.html`.
- `docs/revisao-visual-unificado/img/antes` e `img/depois`: capturas de antes e depois.
- `docs/ambiente-homologacao-unificado.md`: fluxo oficial de homologação e publicação. Siga esse documento.

Os números nas telas propostas são de exemplo. Use sempre os dados reais das APIs.

## Regras do padrão (valem para todos os módulos)

**Tokens.** Crie `unificado/shell/tokens.css` a partir do `:root` de `telas/base.css` e faça todos os módulos importarem esse arquivo.
- Cores: `--c-navy #0b1730`, `--c-blue #15416f`, `--c-orange #e2702a`, `--c-bg #f4f5f7`, `--c-surface #fff`, `--c-line #e1e5eb`, `--c-ink-2 #5b6779`. Estados: `--c-crit #b42318`, `--c-warn #a15c00`, `--c-ok #1d7a4a`.
- Fonte: só Geist, servida localmente de `unificado/shell/fonts/`. Use `font-variant-numeric: tabular-nums` para números. Remova Inter, IBM Plex, Montserrat, Manrope, DM Sans, Sora, Gotham, Arial e Segoe como fonte principal, e remova todo `@import` do Google Fonts.
- Raio: só 4px (`--r-sm`) e 6px (`--r`). Sombra: só em menus suspensos e diálogos.

**Remover em todo o sistema:**
1. Eyebrows em caixa alta acima de títulos (`.eyebrow`, `.sb-eyebrow`, "MÓDULO", "PLANEJAMENTO · SETOR 3", "CAMPINAS · SUPRIMENTOS"). No lugar, use a trilha (breadcrumb) na barra superior.
2. O ponto final colorido em títulos (`.accent-mark`).
3. Saudações: "Bem-vindo", "Bem-vindo de volta", "Olá, Fulano.", "em um só lugar".
4. Cartões de KPI com gradiente, bolha decorativa, sombra colorida e `translateY` no hover (`shell/home-v2.css`). No lugar, use a faixa `.strip` de `base.css`.
5. Uma cor por módulo (roxo, turquesa, amarelo etc.) e ícones com gradiente.
6. Siglas de 2 letras no lugar de ícone (PL, PR, EC, VG…). Use ícones de traço de um único conjunto. Bootstrap Icons já existe em `unificado/vendor/`; se preferir SVG inline, use os traçados de `telas/*.html`.
7. O texto padrão "Abrir tela e consultar os dados." (`shell/module-pages.js`, `shell/module-cards-overlay.js`). Escreva uma descrição real por tela ou deixe sem descrição.
8. Cartão dentro de cartão, barra colorida no topo ou na lateral de cartões, pílula para estado normal ("Normal", "Concluída"), seta ↗ em cartões e emoji como ícone (🥇📊🧱 etc.).
9. Texto em caixa alta via CSS, exceto siglas reais (CP, CEC, PCP, MOD).

**Componentes** (copie a estrutura de `base.css`):
- **Topo da página (`.ph`):** título, uma linha de situação com dados reais (unidade, horário dos dados, contagens) e ações à direita. O botão principal fica sempre em `--c-navy`.
- **Abas (`.tabs`):** traço laranja embaixo da aba ativa.
- **Faixa de números (`.strip`):** cor só no desvio.
- **Tabelas (`.t`):** situação com ponto colorido (`.st`); linhas encerradas em cinza (`.dim`); destaque só para urgente (`.tag.crit`).
- **Listas de telas (`.lst`/`.row`):** no lugar de grades de cartões.

**Login (decisão já tomada):**
- No **celular e no tablet**, o login continua **exatamente como está hoje**.
- O login novo de `telas/login.html` vale **só a partir de 1025px** de largura. Abaixo disso, mantenha o CSS atual sem nenhuma mudança visual.

**Celular:**
- A versão atual (1.4.x) usa o menu lateral modelo A. O antigo `shell/navigation.js` **não é carregado**; não o reative.
- Aplique o padrão visual (tokens, listas, tabelas viram listas, barra superior com o título correto da tela) sobre a navegação de celular que existe hoje.
- Se for necessário criar uma navegação de baixo como a de `telas/m-*.html`, **pare e me pergunte antes**, porque é mudança de estrutura.

## Ordem de execução (uma fase por vez)

Antes da fase 1, faça a **fase 0**. Execute as fases em sequência, publicando cada uma na homologação e validando antes de ir para a próxima. Não precisa parar para pedir aprovação entre fases.

Pare e me pergunte **somente** quando:
- for necessário mudar a estrutura de navegação, como criar uma navegação de baixo no celular;
- uma tela não puder seguir o mockup sem alterar regra de negócio;
- algo na homologação quebrar e você não conseguir corrigir.

**Fase 0 · Reconhecimento (não altera nada)**
- Compare `unificado/VERSION` do repositório (1.4.2) com o que está publicado (o login mostra 1.4.6) e com `homolog-next`.
- Se o repositório estiver atrás, traga para o repositório os arquivos publicados antes de editar. Mostre o diff e não sobrescreva alterações locais não commitadas: o `git status` tem várias.
- Crie a branch `feat/padrao-visual-unificado` a partir de `main` atualizada. Não use `git stash` sem nome.
- Descubra o comando do "gate 7/7" citado em `docs/ambiente-homologacao-unificado.md` e confirme que ele roda contra a porta 18446.
- Tire capturas atuais de homologação em 1440×900, 1024×768, 820×1180 e 390×844 das telas listadas nas fases. Elas são a referência de "antes".

**Fase 1 · Base**
- `shell/tokens.css`.
- Fontes Geist locais.
- Fonte do menu lateral: no código-fonte `unificado/sidebar-modelo-a/src`, troque IBM Plex por Geist. Remova o `@import` do Google Fonts e recompile com `npm run build`; a saída vai para `shell/modelo-a/menu.js|css`. Não edite o `menu.js` compilado à mão.

**Fase 2 · Casca e menu**
- Menu lateral modelo A:
  - ícones no lugar de siglas no seletor de módulo e nos itens;
  - títulos de grupo em caixa normal e cinza, sem bolinha e sem contador;
  - item ativo com traço laranja de 2px;
  - corrigir os logos quebrados do topo do menu no Laboratório;
  - trilho recolhido no tablet igual a `telas/tablet.css`.
- Início (`index.html`, `home-v2.css/js`): igual a `telas/inicio.html` (faixa de números, tabela "Setores hoje", lista de módulos).
- Meu acesso rápido: igual a `telas/acesso-rapido.html`.
- Páginas de módulo (`module-pages.js`, `module-cards*.css/js`): listas iguais a `telas/laboratorio.html` e `telas/t-planejamento.html`. Sai a faixa colorida do topo de cada módulo.
- Login a partir de 1025px igual a `telas/login.html`.

**Fase 3 · Suprimentos** (`unificado/suprimentos/`)
- Painel, solicitações, nova solicitação, cotações, fornecedores, almoxarifado e inventário.
- Referências: `telas/suprimentos.html`, `t-suprimentos.html` e `m-suprimentos.html`.

**Fase 4 · Planejamento** (`unificado/pcp/`)
- Números de série (`telas/numeros-serie.html`, `m-numeros-serie.html`).
- Programação da semana (`telas/t-programacao.html`).
- Depois, as demais telas de programação, relatórios, armaduras e etiquetas, com o mesmo cabeçalho, faixa e tabela.
- Não mexa no layout de impressão nem no PDF.

**Fase 5 · Laboratório e Usinas**
- `unificado/laboratorio/frontend`: recompile; não edite o `dist` à mão.
- `unificado/usinas`: a carta de traço passa a ficar dentro do menu do Unificado, igual a `telas/carta-traco.html`. Sai o cabeçalho próprio, os 4 botões coloridos, o rodapé "© ConcreTrack — DAutomação" e os rótulos em caixa alta.

**Fase 6 · Qualidade, Logística, Mapa, Manutenção usina, Relatórios, Produção, mobile `m/`**
- Mesmo padrão em todas essas áreas.
- Logística usa o menu do Unificado em vez do menu próprio.
- O ranking de Logística troca as medalhas por posição numérica.

**Fase 7 · Trava contra regressão**
- Crie um teste em `tests/unificado/` que falhe quando aparecer:
  - `font-family` fora de `tokens.css`;
  - cor hex fora da lista de tokens (com lista de exceções documentada para gráficos);
  - `linear-gradient` em componente;
  - `.eyebrow` ou `.accent-mark`;
  - emoji em HTML ou JS de interface.

## Em toda fase

1. Incremente `unificado/VERSION`, todas as URLs `?v=` do HTML e do roteador e o cache em `unificado/sw.js`.
2. Rode `node --check` nos JS alterados e os testes existentes de `tests/` ligados aos arquivos tocados.
3. Publique **só na homologação**:
   - copie apenas os arquivos alterados para `/opt/concrefer-unificado/homolog-next/public/unificado`;
   - rode `scripts/mark_unificado_homolog.py` depois de copiar `index.html` ou `login.html`;
   - faça backup dos arquivos de homologação substituídos.
4. Valide na porta 18446:
   - capturas em 1440×900, 1024×768, 820×1180 e 390×844 das telas da fase, lado a lado com as de `docs/revisao-visual-unificado/img/depois`;
   - nenhuma rolagem lateral no corpo da página em 390px;
   - a atualização do service worker funciona;
   - permissões por perfil continuam iguais;
   - gate 7/7 com `UNIFICADO_BASE_URL=https://concrefer.concretrack.com.br:18446`.
5. Corrija na hora o que falhar e revalide a fase antes de seguir.
6. Faça commit na branch com uma mensagem por fase. Não faça push nem PR sem me perguntar.

Ao fim de cada fase, registre em `docs/revisao-visual-unificado/homolog/fase-N/`:
- capturas antes e depois;
- arquivos alterados;
- versão;
- resultado dos testes e do gate.

## Critério de "100% ok" no ambiente de teste

Só me entregue quando **todos** os itens abaixo estiverem verdadeiros na porta 18446:

- [ ] As fases 1 a 7 estão publicadas na homologação, numa única versão final.
- [ ] Todas as telas de todos os módulos foram abertas com um perfil de cada tipo (gerência, PCP, produção, laboratório, qualidade, suprimentos e consulta). Nenhuma tela fica em branco, com erro no console ou com "Você não tem acesso" indevido.
- [ ] Nas larguras 1440, 1024, 820 e 390 não há texto cortado, elemento sobreposto ou rolagem lateral do corpo da página.
- [ ] Os fluxos principais funcionam como antes, de ponta a ponta, com dados de teste:
  - criar, aprovar e concluir uma solicitação de suprimentos;
  - salvar a programação da semana;
  - gerar etiquetas e o PDF de números de série;
  - ler um CP no laboratório;
  - salvar uma carta de traço;
  - abrir e tratar uma NC na Qualidade;
  - fazer login e logout.
- [ ] Impressões e PDFs saem iguais aos de antes.
- [ ] O service worker atualiza da versão anterior para a nova sem precisar limpar o cache à mão.
- [ ] O login no celular e no tablet está idêntico ao de antes.
- [ ] Gate 7/7 e todos os testes de `tests/` ligados aos arquivos alterados passam, assim como o teste novo da fase 7.
- [ ] Nada em produção foi alterado (confira o hash dos arquivos de `/opt/concrefer-unificado/public/unificado` contra o início do trabalho).

## Entrega final (pare aqui)

Me envie:
- a versão final em homologação;
- a lista completa de arquivos alterados;
- o checklist acima marcado, com evidências;
- o caminho das capturas;
- as diferenças em relação aos mockups, com o motivo;
- um roteiro curto do que eu devo conferir no meu teste definitivo na porta 18446.

Depois, **aguarde**. Eu vou testar no ambiente de teste. Se eu apontar ajustes, corrija na homologação e repita o checklist.

## Produção (somente com meu aval por escrito)

Só quando eu escrever "aprovado, publicar em produção":
1. Faça backup dos arquivos afetados em `/opt/concrefer-unificado/backups/padrao-visual-<versão>`.
2. Publique de uma vez **exatamente** a versão final que eu aprovei na homologação, sem a faixa de teste, em `/opt/concrefer-unificado/public/unificado`. Siga o padrão dos scripts de `deploy/scripts/deploy-*.sh`: conferir hash de origem, trocar arquivo por `mv` atômico e voltar sozinho em caso de erro (`trap rollback ERR`).
3. Repita o smoke e o gate 7/7 na URL de produção e confirme a versão nova na tela de login.
4. Se algo falhar, restaure o backup na hora e me avise.

**Nunca:**
- reinicie serviços de API ou de banco;
- altere o Nginx;
- mexa em bancos;
- publique em produção arquivos que não passaram pela homologação.
