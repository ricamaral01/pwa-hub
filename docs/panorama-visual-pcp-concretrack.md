# Panorama Visual — PCP Concrefer (pcp.concretrack.com.br)

> Levantamento de 2026-10-02, **somente leitura**: nada foi alterado no servidor.
> Fonte: cópia do `frontend/` e do `nginx/` baixada da VPS nesta data, mais a configuração ativa do Nginx (`/etc/nginx/sites-enabled/pcp-concrefer`).
> As cópias antigas em `.work-pcp-report/` são **idênticas ao servidor**, exceto pelo número de versão do `app.js` em algumas páginas.

---

## 1. Onde a aplicação está

| Item | Valor |
|---|---|
| Domínio | `pcp.concretrack.com.br` (DNS → **31.97.241.84**, o mesmo IP do `dautomacao.com`) |
| VPS | `31.97.241.84`, hostname **`servidortesteConcreTrack`**; no seu `~/.ssh/config` é o alias `vps-rh` / `vps-hostinger` |
| Pasta | `/opt/pcp-concrefer` (`app/` backend, `frontend/`, `nginx/`, `scripts/`, `venv/`) |
| Serviço | `pcp-concrefer.service` (ativo) → FastAPI/Uvicorn em `127.0.0.1:500` |
| Nginx | HTTPS (Let's Encrypt), `root /opt/pcp-concrefer/frontend`; `/` → `/pages/login.html`; `/api/` → porta 500 |
| Outro app no mesmo domínio | **`/armaduras/`** → serviço separado na porta **8022** (“Controle de Armaduras”, que o menu do PCP remove; ver seção 8) |
| Cache | `/pages/` com `no-store` (o HTML é sempre buscado de novo); **`/static/` com `expires 7d` + `Cache-Control: public, immutable`** |

---

## 2. Resumo

- **Stack:** páginas HTML estáticas, uma pasta por tela (`frontend/pages/<tela>/index.html`, **25 telas**), com **Bootstrap 5.3.3**, **Bootstrap Icons 1.11.3**, fonte **Inter** e, em 2 telas, **Chart.js 4.4.4**, tudo via CDN. Por cima vêm o tema próprio `/static/css/app.css` (495 linhas, sem alteração desde 29/05/2026) e o JS global `/static/js/app.js` (474 linhas, alterado em 01/10/2026).
- **Identidade:** tema claro, menu lateral azul-marinho escuro `#0f2540`, laranja `#f97316` como destaque, cards brancos com título em caixa alta e logos Concrefer em PNG.
- **Duas linguagens visuais:**
  1. a **casca do sistema** (menu, topo, cards, formulários, KPIs, gráficos) em Bootstrap + Inter;
  2. o **conteúdo de trabalho**, que **imita planilhas Excel e formulários de papel**: Arial 11–13px, bordas pretas, cabeçalhos amarelo/cinza/azul, linha ciano e verde/vermelho “de Excel”.
- **Como foi feito:** tela a tela. A maioria das telas tem o próprio `<style>` e o próprio `<script>` **dentro do HTML**, além de uma **cópia do menu lateral**. O `app.js` corrige esse menu em tempo de execução.
- **Comparado ao Mapa de Concretagem, é bem mais contido:** o tema usa variáveis de fato, o `!important` aparece quase só em regras de impressão e o Bootstrap padroniza formulários, botões e grids.

---

## 3. Arquitetura visual

```
frontend/
 ├─ pages/<tela>/index.html     ← 25 telas, cada uma com:
 │    ├─ Bootstrap 5.3.3 + Bootstrap Icons + Inter (CDN)
 │    ├─ /static/css/app.css?v=20260529final1   ← tema PCP
 │    ├─ <style> próprio                        ← layout da tela / réplica de planilha
 │    ├─ <aside id="sidebar">…</aside>          ← menu COPIADO em cada página
 │    ├─ /static/js/app.js?v=…                  ← auth, menu, toasts, formatadores
 │    └─ <script> inline OU /static/js/<tela>.js (render via innerHTML)
 ├─ pages/login.html, pages/primeiro-acesso/    ← sem menu
 ├─ pages/formas-por-setor/                     ← página isolada, sem Bootstrap nem app.css
 ├─ static/css/app.css, msgbox.css
 ├─ static/js/app.js, etiquetas*.js, programacao-*.js, relatorio-producao.js, msgbox.js
 ├─ static/img/concrefer-logo.png, concrefer-logo-alt.png, logo-concrefer-relatorio.png
 └─ guia-pcp.html, relatorio_completo_pcp_2026-04-11.html  ← documentos avulsos
```

- **Navegação:** links comuns entre páginas, sem SPA: cada clique recarrega a página inteira.
- **Sessão no navegador:** `localStorage` (`pcp_token`, `pcp_user`). `requireAuth()` manda para o login. Quem já está logado e abre o login é redirecionado ao Dashboard.
- **Perfis:** `ADMIN`, `PCP`, `PRODUCAO` e `CONSULTA`. Itens e blocos com `data-require` são escondidos por `applyMenuVisibility` conforme o perfil. Usuário com troca de senha pendente vai para `/pages/primeiro-acesso/`.
- **Versão dos arquivos:** controlada à mão por query string. Todas as páginas usam `app.css?v=20260529final1` (o login usa `app.css` **sem versão**). O `app.js` tem versões novas (`?v=20261001armaduras1`), atualizadas pelo script `bump_assets.py`, que só mexe no `app.js`.

---

## 4. Shell (menu + topo)

```
┌─────────────────┬─────────────────────────────────────────────────┐
│ [logo][logo alt]│ TOPBAR branca sticky                             │
│ PCP Concrefer   │ [▤]  Título da página                Nome [PCP]  │
│ PLANEJAMENTO…   ├─────────────────────────────────────────────────┤
│                 │ .content-area (padding 24px, fundo #f0f4f8)       │
│ Dashboard       │  ┌ section-card ─────────────────────────────┐   │
│ Prog. vs Real.  │  │ TÍTULO EM CAIXA ALTA AZUL                 │   │
│ ▸ Programação   │  │ filtros / formulário Bootstrap            │   │
│ ▸ Relatórios    │  └───────────────────────────────────────────┘   │
│ ▸ Etiquetas     │  ┌ conteúdo (KPIs, gráfico ou planilha) ─────┐   │
│ ▸ Acompanhamento│  └───────────────────────────────────────────┘   │
│ Mapa de Produção│                                   [toasts ↘]     │
│ Usuários        │                                                  │
│ Nome / [Sair]   │                                                  │
└─────────────────┴─────────────────────────────────────────────────┘
```

**Menu lateral (`#sidebar`, 240px, `#0f2540`, sombra à direita):**
- **Logo:** o HTML traz um SVG com “Σ” laranja. O `app.css` **esconde o SVG** e coloca dois PNGs (`concrefer-logo.png` e `concrefer-logo-alt.png`) via `::before`/`::after`. Abaixo vem “PCP Concrefer / Planejamento e Controle”, com ícone laranja.
- **Itens:** ícone Bootstrap mais texto, em branco a 65% de opacidade. O item ativo tem fundo claro translúcido e **borda esquerda laranja de 3px**.
- **Grupos recolhíveis** (criados pelo JS): Programação, Relatórios de Programação, Etiquetas e Acompanhamento. O grupo aberto ganha fundo laranja translúcido e seta girada; os subitens são menores (0.76rem).
- **Ordem final** (forçada por `orderSidebarNav`): Dashboard → Programado vs Realizado → Programação → Relatórios → Etiquetas → Acompanhamento → **Mapa de Produção** (abre o Mapa de Concretagem em outra aba) → Usuários.
- **Rodapé:** nome do usuário e botão “Sair”, ambos com estilo inline.

**Topo (`.topbar`):** branco, *sticky*. Tem o botão de ocultar o menu (só no desktop; o estado fica salvo em `pcp_sidebar_hidden`). Nas telas de Programação Circular esse botão mostra o texto “Ocultar menu”. Depois vêm o título da página e, à direita, o nome do usuário com um badge azul do perfil.

**Celular (< 992px):** o menu vira gaveta com fundo escurecido, aberta pelo ☰. As classes `.mobile-only`/`.desktop-only` alternam elementos.

**Avisos (toasts):** no canto inferior direito, caixa grafite `#1e293b` com borda esquerda verde, vermelha ou amarela e ícone Bootstrap.

**Login:** fundo em gradiente `#0f2540` → `#1a3a5c` e card branco de 400px com raio de 16px. O topo do card mostra o **ícone `bi-bar-chart-steps`**, não o logo Concrefer, mais “PCP Concrefer / Planejamento e Controle da Produção”. Os campos usam *input-group* Bootstrap com ícones de usuário e cadeado, há botão de mostrar senha, spinner no botão e erro em `alert-danger`. O rodapé diz “PCP Concrefer v1.0 | © 2026”.

---

## 5. Componentes do tema (`app.css`)

| Componente | Visual |
|---|---|
| `.section-card` | Card branco, borda `#cbd5e1`, raio 12px, sombra mínima; `.section-title` em **caixa alta** 0.85rem azul `#1a3a5c` com linha embaixo. É o container padrão de todas as telas |
| `.kpi-card` | Rótulo em caixa alta cinza + valor 1.85rem/800; variantes `kpi-good`, `kpi-warn` e `kpi-bad` com borda esquerda de 4px e fundo verde, âmbar ou vermelho claro (usado em Comparação e Mão de Obra) |
| `.badge-ef` + `.ef-bar` | Badge e barra de eficiência em três faixas (verde, amarelo, vermelho) via `efClass(pct)` |
| `.btn-primary-pcp` | Azul `#1a3a5c`, raio 8px; é o botão principal de quase todas as telas |
| `.btn-accent` | Laranja `#f97316` (ex.: salvar usuário) |
| `.table` | Tabelas Bootstrap `table-sm table-hover`; cabeçalho em caixa alta 0.72rem cinza sobre `#f8fafc` |
| Formulários | Bootstrap `form-control-sm`/`form-select-sm`; rótulos com `style="font-size:.8rem;font-weight:600"` **inline em cada campo** |

**Tokens:**

| Grupo | Valores |
|---|---|
| Base | `--pcp-primary #1a3a5c`, `--pcp-accent #f97316`, `--pcp-bg #f0f4f8`, `--pcp-sidebar #0f2540`, `--pcp-text #1e293b`, `--pcp-muted #64748b`, `--pcp-border #cbd5e1` |
| Estado | `--kpi-good #16a34a`, `--kpi-warn #d97706`, `--kpi-bad #dc2626` (+ fundos claros) |

---

## 6. Inventário das telas

### Casca moderna (Bootstrap + cards + KPIs)

| Tela | Rota | Linhas | Visual |
|---|---|---|---|
| Dashboard | `/pages/dashboard/` | 586 | Filtro de período; **cards agrupados por setor** com faixa superior em **gradiente azul `#15416f` → laranja** e ícone em quadrado azul-claro; gráfico de barras Programado (azul) × Realizado (laranja); tabelas “Produção em andamento” e “Desempenho por produto” |
| Programado vs Realizado | `/pages/comparacao/` | 371 | 7 `kpi-card`; **rosca** laranja/cinza; barras por setor (azul × laranja) e por tipo de poste (azul × verde); tabelas |
| Produção | `/pages/producao/` | 832 | Várias `section-card` com tabelas largas (até 1.120px): realizado por setor com células verde/vermelho/cinza, **barrinhas de % atingido**, “Faltam”, lançamentos manuais e formas circulares. 46 estilos inline (o maior número) |
| Mão de Obra | `/pages/maodeobra/` | 576 | 6 KPIs (2 em verde) + formulário + histórico |
| Rateio MOI | `/pages/maodeobra-rateio/` | 324 | Oculto no menu |
| Apontamento Mega | `/pages/apontamento-mega/` | 513 | Duas tabelas (S1/2 e S3/4) em caixa com cabeçalho fixo, linhas alternadas, **linha apontada em verde**, pílulas de status “OK” verde / “Pendente” laranja e botão de check |
| Programação Setor 3 e 4 | `/pages/programacao/` | 943 | Formulário “Nova programação” (volume calculado) + tabela larga com seleção em lote |
| Programação Setor 1 e 2 | `/pages/programacao-alex/` | 1.203 | Painel dividido (importar planilha × setor) + **grade própria em CSS Grid** com cabeçalho e colunas fixas, linhas alternadas e 10 colunas; variáveis próprias `--alex-*` |
| Programação Final | `/pages/programacao-final/` | 293 | Filtros + tabela `final-table` |
| Teste Programação | `/pages/teste-programacao/` | 540 | Só ADMIN; parâmetros, demanda, indicadores e “Plano semanal forma × dia” em tabela com bordas |
| Usuários | `/pages/usuarios/` | 205 | Formulário de cadastro (botão laranja) + lista |
| Login / Primeiro acesso | `/pages/login.html`, `/pages/primeiro-acesso/` | 130 / 76 | Card centralizado sobre gradiente navy (seção 4) |
| Etiquetas Padrão / SC-Prod. / Armaduras | `/pages/etiquetas*/` | 82–184 | Filtros, lista de postes em cards com checkbox, pílulas de resumo e **prévia em tamanho real 95×40mm** (Arial 900, modelo rotacionado). Impressão `@page 95mm 40mm` (Zebra/Argox), uma etiqueta por página |

### Réplicas de planilha / formulário de papel

| Tela | Rota | Visual |
|---|---|---|
| Programação Circular S3 / DT S4 | `/pages/programacao-circular-s3/`, `-s4/` | Uma coluna por forma (SC01, SC02…) com cabeçalho **amarelo `#f4d35e`** (a cada 5ª, **ciano `#b5e5ef`**); cada célula é um botão de modelo. Selecionado = **verde**, exceção do dia = **laranja**. Arial 13px, colunas de 92px |
| Relatório de Produção (S1/2, S3, S4) | `/pages/relatorio-producao/`, `relatorio-programacao-s3/`, `-s4/` | **Réplica do formulário FL-PRO-15** com logo Concrefer, bloco de código/revisão, células **amarelo-limão `#f4f500`**, linha m³ **ciano `#00d9df`**, totais cinza, bordas pretas e Arial 11px. Impressão **A4 paisagem**, uma semana por página |
| PCP Diário | `/pages/pcp-diario/` | Planilha com borda preta de 2px, cabeçalho **azul `#073b63`** com texto branco, verde `#00b050` / vermelho `#f00` de Excel |
| Acompanhamento Mensal (e Setor 3 e 4) | `/pages/acompanhamento-mensal*/` | Planilha de **1.420px** com cabeçalho **cinza `#c9c9c9`** fixo, descrição/setor/código fixos à esquerda e uma coluna de 39px por dia |

### Fora do padrão

| Página | Visual |
|---|---|
| Formas por Setor (`/pages/formas-por-setor/`, **4.265 linhas**) | Página **isolada**: não usa Bootstrap, `app.css` nem menu. Tem visual próprio: faixa “hero” grafite `#263747` com linha laranja, cards de resumo, blocos por setor, chips e badges, e variáveis próprias (`--navy #15416f`). **Não aparece no menu** |
| `guia-pcp.html`, `relatorio_completo_pcp_2026-04-11.html` | Documentos avulsos na raiz do frontend |

---

## 7. Paleta e tipografia na prática

**Casca:**

| Função | Cor |
|---|---|
| Menu | navy `#0f2540` |
| Primária | `#1a3a5c` |
| Destaque | laranja `#f97316` |
| Fundo | `#f0f4f8` |
| Bordas | `#cbd5e1` / `#dbe4ee` |
| Texto | `#1e293b` / `#0f172a` / `#64748b` |
| Estados | `#16a34a` / `#d97706` / `#dc2626` |

**Dois azuis “primários” convivem:**
- `#1a3a5c` está no tema `app.css` e nos gráficos da tela de Comparação;
- **`#15416f`** (azul oficial da marca Concrefer) aparece nas telas mais novas: Dashboard (cards e gráfico), Programação S1/S2, Apontamento Mega e Formas por Setor.

**Réplicas de planilha/papel:** amarelo `#f4d35e`, amarelo-limão `#f4f500`, ciano `#00d9df`/`#b5e5ef`, azul `#073b63`, cinza `#c9c9c9`/`#d9d9d9`, verde `#00b050`, vermelho `#f00`, bordas pretas. Foram escolhidas para **ficar iguais aos documentos que a fábrica já usa**.

**Gráficos (Chart.js 4.4.4, só no Dashboard e na Comparação):** Programado em azul, Realizado em laranja ou verde, cores escritas em cada gráfico.

**Fontes:**
- **Inter** na casca;
- **Arial** nas planilhas, relatórios e etiquetas, de propósito, para imitar o Excel e garantir a impressão.

**Ícones:** Bootstrap Icons em todo o sistema, sem emojis.

---

## 8. Métricas por página

| Página | `style="..."` | `!important` | Cores hex | `@media` / impressão | Itens no `<nav>` do HTML |
|---|---|---|---|---|---|
| dashboard | 11 | 1 | 20 | 2 / — | 11 |
| comparacao | 12 | 0 | 4 | 0 / — | 11 |
| producao | **46** | 0 | 25 | 0 / — | 11 |
| maodeobra / rateio | 15 / 13 | 0 | 5 / 6 | 0 / — | **12** |
| apontamento-mega | 32 | 0 | 14 | 0 / — | 11 |
| programacao | 23 | 0 | 3 | 0 / — | 11 |
| programacao-alex | 13 | 0 | **38** | 3 / — | 11 |
| programacao-final | 12 | 0 | 3 | 2 / — | 11 |
| teste-programacao | 28 | 3 | 11 | 0 / — | 11 |
| programacao-circular-s3/s4 | 4 | 0 | 18 | 1 / — | 11 |
| relatorio-* (3 telas) | 4 | 6 (impressão) | 13 | 1 / A4 paisagem | 11 |
| pcp-diario | 10 | 0 | 9 | 1 / — | 11 |
| acompanhamento-mensal* | 7–9 | 0 | 12 | 1 / — | 11 |
| etiquetas / etiquetas-sc | 13 | 14 (impressão) | 5 | 3 / 95×40mm | **9** |
| etiquetas-armaduras | 6 | 8 (impressão) | 9 | 2 / 95×40mm | **6** |
| usuarios | 5 | 0 | 2 | 0 / — | 11 |
| login | 6 | 0 | 2 | 0 / — | — |
| formas-por-setor | 0 | 0 | 21 | 2 / — | — (sem menu) |
| `app.css` | — | 6 | ~30 | 2 | — |

---

## 9. Pontos de atenção

| # | Ponto | Onde | Efeito |
|---|---|---|---|
| 1 | **O menu é copiado em cada HTML e as cópias divergem** | `<nav>` de cada página: 6, 9, 11 ou 12 itens | Nas Etiquetas faltam Acompanhamento e Apontamento Mega; nas Etiquetas Armaduras há só 6 itens. O `app.js` injeta parte dos links, mas o menu ainda muda conforme a página aberta. Existe até um `_sidebar.html.txt` dizendo que o menu deveria ser injetado por uma `initLayout()`, que não existe |
| 2 | **O `app.js` reescreve o menu em tempo real** | `initSidebar` (l. 90–300) | Renomeia itens, remove “Controle de Armaduras”, injeta cerca de 10 links e cria os grupos. O HTML não mostra o menu real e pode haver um “piscar” do menu antigo |
| 3 | **Cache de 7 dias “immutable” no `/static/`** | Nginx ativo | Hoje está tudo certo (o `app.css` não muda desde 29/05, a mesma data da versão). Mas **qualquer mudança futura no `app.css` só chega aos usuários se a versão `?v=` for trocada em todas as 24 páginas**, e o `bump_assets.py` só troca a do `app.js`. O login carrega `app.css` sem versão nenhuma |
| 4 | **Dois azuis primários** | `#1a3a5c` (tema) × `#15416f` (telas novas) | As telas antigas e as novas têm tons de azul diferentes |
| 5 | **Logo trocado por CSS e ausente no login** | `.sidebar-brand::before/::after`; login usa ícone genérico | O SVG “Σ” do HTML só existe para ser escondido. A tela de entrada não mostra a marca |
| 6 | **Estilos e scripts dentro do HTML** | Rótulos com `style` inline em cada campo; 17 telas com `<script>` inline | Mudar o tamanho dos rótulos ou um padrão de tabela exige editar tela por tela |
| 7 | **Página isolada fora do padrão e do menu** | `formas-por-setor` (4.265 linhas) | Visual próprio (hero grafite, sem Bootstrap) e acessível só por link direto |
| 8 | **Arquivos sem uso** | `static/css/msgbox.css`, `static/js/msgbox.js` (nenhuma página carrega); `app.js.bak.20261001-relatorio` dentro de `static/` | Lixo publicado. O backup fica acessível por URL |
| 9 | **Dependência de CDN** | Bootstrap, Icons, Inter e Chart.js via jsDelivr/Google | Sem acesso ao CDN o sistema perde o layout. As prévias `.work-pcp-report/preview-*.png` foram geradas assim e **não representam o visual real** |
| 10 | **Três linguagens sem regra escrita** | Casca Bootstrap × réplicas Excel × grade “alex”/Formas por Setor | Funciona (a equipe reconhece os documentos), mas cada tela nova escolhe o próprio estilo |

---

## 10. O que pesa antes de mudar

1. **Centralizar o menu**, de fato injetado por JS a partir de uma única lista, como o próprio `_sidebar.html.txt` propõe. Isso elimina o problema 1 e a maior parte do 2.
2. **Escolher um azul** (`#15416f` da marca ou `#1a3a5c`) e colocá-lo no `--pcp-primary`.
3. **Criar classes para os padrões repetidos** (rótulo de formulário, tabela larga com cabeçalho fixo, réplica de planilha) e tirar os `style=""`.
4. **Antes de mexer no `app.css`, ajustar o versionamento:** fazer o `bump_assets.py` trocar também o `app.css` em todas as páginas, incluindo o login. Senão, por causa do cache *immutable*, a mudança pode levar até 7 dias para aparecer.
5. **Preservar as réplicas de planilha/papel** (FL-PRO-15, PCP Diário, Circular, etiquetas): são a referência visual de quem usa o sistema.

---

## 11. Arquivos no servidor

| Assunto | Caminho na VPS |
|---|---|
| Tema global | `/opt/pcp-concrefer/frontend/static/css/app.css` |
| Menu, auth, toasts | `/opt/pcp-concrefer/frontend/static/js/app.js` |
| Telas | `/opt/pcp-concrefer/frontend/pages/<tela>/index.html` |
| Nginx ativo | `/etc/nginx/sites-enabled/pcp-concrefer` (cópia em `/opt/pcp-concrefer/nginx/pcp-concrefer.conf`, sem o bloco `/armaduras`) |
| Serviço | `pcp-concrefer.service` |
