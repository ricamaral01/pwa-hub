# PROMPT CODEX — Produção › Pederneiras no Unificado

> Repositório: `C:\Users\Admin\Documents\pwa-hub-fase1` (Unificado ConcreTrack/Concrefer)
> Ambiente: VPS nova `2.25.163.32` (staging/operação do Unificado). Nada no Supabase.
> Stack: React + TypeScript + Vite · FastAPI + Python 3.12 · SQLAlchemy 2 + Alembic · PostgreSQL 16 (schemas por domínio + `unidade_id`).
> Formato: **uma tarefa, uma evidência**. Cada tarefa entrega um documento em `docs/porting/producao-pederneiras/` e **para** aguardando aprovação do Ricardo. Não avance sozinho.
> Anexo: `seed_produtos_pederneiras.csv` (copiar para `docs/porting/producao-pederneiras/seed/`).

---

## 0. Objetivo

Substituir a planilha **LT-PRO-04 — Controle de Produção, Poste Padrão SMA, Pederneiras** e o bloco de mão de obra dela por módulos nativos do Unificado, todos dentro de **Produção › Pederneiras**:

| Item do menu (Produção › Pederneiras) | Desktop | PWA (celular/tablet) |
|---|---|---|
| Apontamento do dia | sim | **PWA Produção Pederneiras** (Hoje · Lançar · Revisar e enviar) |
| Mão de obra | sim | **PWA Mão de Obra Pederneiras** (instalador próprio, igual ao de Campinas) |
| Produção Pederneiras (tela mensal) | sim | — |
| Indicadores | placeholder (fase futura) | — |
| Cadastro de produtos | sim | — |

E reorganizar o menu: **tudo o que existe hoje em Produção passa para Produção › Campinas**, sem mudar comportamento, rotas antigas com redirect.

## 1. Regras invioláveis

1. **Não quebrar nada.** Campinas (telas, PWA de Mão de Obra de Campinas, dados, permissões) continua exatamente igual. Só muda a posição no menu.
2. **Não alterar os modos PWA existentes.** Os PWAs novos são instaladores separados, com `manifest` e `scope` próprios.
3. Tudo com `unidade_id`. Pederneiras é uma unidade; nunca usar texto fixo "Pederneiras" em regra de negócio.
4. **Reaproveitar** o motor do Mão de Obra de Campinas (Planejamento › Mão de Obra, MOD/MOI). Mapear antes, parametrizar por unidade; não duplicar código nem criar segundo modelo de dados se o atual puder ser estendido via expand/contract.
5. Migrations Alembic reversíveis (expand → backfill → contract). Nenhum `DROP` nesta entrega.
6. Toda alteração de quantidade grava auditoria: quem, quando, de → para, origem (desktop/PWA).
7. Layout: casca atual do Unificado (menu lateral modelo A "módulos em lista", logos Concrefer + "C" ConcreTrack, menu recolhível só em PC/tablet). Paleta e componentes existentes do Unificado.

## 2. Regras de negócio

**Apontamento de produção**
- Um **gestor único por unidade** lança. Quantidade = **quantidade produzida** (inteiro ≥ 0) por produto por dia.
- **Data futura é proibida** (validar no backend e no front). Hoje ou anterior.
- Status do dia: `rascunho` → `enviado` → `confirmado`. Fluxo: envia no meio do dia; no fim do dia **Confirmar** (sem alteração) ou ajusta e envia de novo. Reabrir dia confirmado só com permissão de supervisor, com motivo.
- **Repetir ontem**: copia as quantidades do último dia com produção para o rascunho de hoje.
- Liberação prevista = data de produção + 3 dias (campo calculado, não editável).
- m³ do dia = Σ (quantidade × `volume_m3` do produto). Produto sem volume → m³ mostra "—" e a tela avisa quantos produtos estão sem volume.

**Mão de obra Pederneiras**
- Áreas (configuráveis por unidade, tabela, não código): Usina de Concreto, Produção, Fab. armação e estribos, Encarregado de produção, Sacador de núcleo.
- Classificação inicial MOD/MOI (**pendente de confirmação do Ricardo, deixar editável no cadastro de áreas**): Produção = MOD, Sacador de núcleo = MOD, Usina = MOI, Fab. armação = MOI, Encarregado = MOI.
- Valor em homens com passo **0,25** (decimal, ≥ 0). Mesmo fluxo do Campinas: **Enviar = Salvar lançamentos** (grava, sem fechamento nem aprovação); fim do dia **Confirmar mão de obra** ou ajustar e reenviar.
- Data futura proibida. Repetir ontem.

**Indicadores (cálculo único no backend, usado por todas as telas)**
- Total postes/dia, homens/dia (Σ áreas), **postes/homem = postes ÷ homens totais** (meta configurável, padrão **5,9**).
- Meta mensal: `dias_uteis × pcs_dia` (outubro/2026: 23 × 64 = 1.472). Tabela de metas por unidade/mês.
- **Alerta bloqueante**: dia com produção e sem mão de obra → não confirma; aparece como pendência nas telas.

## 3. Modelo de dados (proposta — ajustar ao padrão do repo após o mapeamento)

Schema `producao`:
- `produto` — id, unidade_id, familia, letra (nullable), descricao, cod_pro, cod_sma, volume_m3 (nullable, numeric(8,4)), ativo, pendencia (text), criado_em, atualizado_em. Únicos: (unidade_id, cod_pro) quando não nulo; letra única por unidade quando não nula (hoje há conflito — ver seed).
- `apontamento_dia` — id, unidade_id, data, status, enviado_em, enviado_por, confirmado_em, confirmado_por, origem. Único (unidade_id, data).
- `apontamento_item` — id, apontamento_dia_id, produto_id, quantidade int ≥ 0. Único (dia, produto).
- `meta_producao` — unidade_id, ano_mes, dias_uteis, pcs_dia, meta_postes_homem.
- Auditoria: usar a tabela/padrão de auditoria que já existir no Unificado; se não houver, `producao.auditoria` (entidade, entidade_id, campo, de, para, usuario, origem, em).

Mão de obra: **estender o modelo do Campinas** com `unidade_id` e tabela de áreas por unidade (`area_mao_obra`: unidade_id, nome, tipo MOD/MOI, ordem, ativo). Se o modelo de Campinas for por grupos S1/S2 e S3/S4, os grupos viram áreas da unidade Campinas no backfill, sem mudar o que Campinas vê.

## 4. API (prefixo sugerido `/api/producao/{unidade}`)

- `GET/POST /produtos`, `PATCH /produtos/{id}`, `POST /produtos/importar` (CSV/Excel, retorna **prévia de diferenças** antes de gravar), `GET /produtos/modelo.xlsx`
- `GET /apontamentos/{data}`, `PUT /apontamentos/{data}` (rascunho/enviar), `POST /apontamentos/{data}/confirmar`, `POST /apontamentos/{data}/repetir-ontem`
- `GET /mensal?mes=AAAA-MM` → matriz já pronta: só **dias com produção até hoje**, totais, homens, postes/homem, m³, pendências
- `GET/PUT /mao-de-obra/{data}`, `POST /mao-de-obra/{data}/confirmar`, `GET /mao-de-obra/mensal?mes=`
- `GET /exportar/lt-pro-04.pdf?mes=`, `GET /exportar/lt-pro-04.xlsx?mes=`
- Permissões: perfil **Gestor Pederneiras** (lança e confirma só em Pederneiras); Ricardo acesso total; leitura configurável na tela de usuários (caixas de marcar por módulo, padrão existente).

## 5. Telas (referência: mockup aprovado no canvas "Produção Pederneiras – Apontamento")

**Desktop**
1. **Apontamento do dia** — data (bloqueia futura) + chip de status; lista de produtos com busca (nome, Cód. Pro, Cód. SMA, letra), abas por família ("Mais produzidos" = top do mês, Padrão, Econômico, Circular, Duplo T, Todos); colunas Letra · Produto · Cód. Pro/SMA · Ontem · Hoje (− campo +, aceita digitar e Tab) · Mês; linha alterada vs ontem destacada; botão Repetir ontem. Painel lateral: total, homens (do Mão de obra), postes/homem vs meta, m³, vs ontem, Confirmar / Salvar, alertas (quantidade fora do padrão dos últimos 15 dias), histórico do dia.
2. **Mão de obra** — lançamento do dia por área (Tipo, Ontem, Hoje com passo 0,25, Observação), total; resumo Total/MOD/MOI e postes/homem; Confirmar / Salvar; grade do mês área × dias com produção + linhas Total e Postes/homem.
3. **Produção Pederneiras** (tela mensal, título "Produção Pederneiras") — cartões: produzido no mês vs meta, dias com produção e média, postes/homem, m³, pendências. Matriz produto × dia **só com dias que tiveram produção até hoje**: sem sábado/domingo (aparecem só se houver produção, cabeçalho destacado), sem dias sem produção, sem dias futuros. Rodapé: Total postes, Homens (MOD/MOI), Postes/homem, m³. Filtro "Com produção / Todos". Clique na célula edita (com auditoria). Exportar LT-PRO-04 (PDF) e Excel.
4. **Cadastro de produtos** — tabela com Família, Letra, Descrição, Cód. Pro, Cód. SMA, m³/peça, Ativo, Situação; divergências primeiro; Importar tabela de postes (com prévia) e Baixar modelo.

**PWA Produção Pederneiras** (`/unificado/producao/pederneiras/app`, manifest próprio, iPhone e Android, fila offline com sincronização automática)
- **Hoje**: status do dia, total vs meta, homens, postes/homem, m³; Confirmar / Ajustar; acumulado do mês; alertas.
- **Lançar**: data, Repetir ontem, busca, abas por família, cartões com botões − / + (44 px), barra fixa com total, homens e postes/homem ao vivo; Revisar e enviar.
- **Revisar e enviar**: resumo, lista do que foi lançado, alertas, Enviar.

**PWA Mão de Obra Pederneiras** (`/unificado/producao/pederneiras/mao-de-obra/app`, manifest próprio): mesma experiência do PWA de Campinas, com as áreas de Pederneiras; cabeçalho Total/MOD/MOI; cartões por área com − / + de 0,25 e "ontem"; postes/homem do dia; Enviar e Confirmar mão de obra.

## 6. Tarefas (uma por vez, cada uma com evidência e parada para aprovação)

| # | Tarefa | Evidência em `docs/porting/producao-pederneiras/` |
|---|---|---|
| T0 | **Mapeamento (somente leitura)**: estrutura atual do módulo Produção (rotas, menus, telas), Mão de Obra de Campinas (modelo, rotas, PWA, manifest, service worker, permissões), padrão de auditoria, IAM/perfis, `unidade_id` de Pederneiras. Propor ajustes ao modelo da seção 3. | `00-mapeamento.md` |
| T1 | Menu: criar Produção › Campinas (mover itens atuais, redirects das rotas antigas) e Produção › Pederneiras (itens da seção 0, telas vazias com "em construção"). Testar que Campinas não mudou. | `01-menu.md` + prints PC/tablet |
| T2 | Migrations Alembic (expand) do schema `producao` + áreas de mão de obra por unidade + backfill Campinas sem mudança visível. | `02-migrations.md` (up/down testados) |
| T3 | Seed de produtos a partir de `seed_produtos_pederneiras.csv` (coluna `pendencia` vira Situação); metas de outubro/2026; áreas de Pederneiras. | `03-seed.md` com contagens |
| T4 | API + regras da seção 2 + testes (pytest): data futura, passo 0,25, unicidade, confirmar sem mão de obra, cálculo postes/homem e m³. | `04-api.md` + relatório de testes |
| T5 | Desktop: Cadastro de produtos + importação com prévia. | `05-cadastro.md` + prints |
| T6 | Desktop: Apontamento do dia. | `06-apontamento-desktop.md` + prints |
| T7 | Desktop: Mão de obra. | `07-mao-de-obra-desktop.md` + prints |
| T8 | Desktop: Produção Pederneiras (mensal) + exportação LT-PRO-04 PDF/Excel. | `08-mensal.md` + PDF gerado |
| T9 | PWA Produção Pederneiras (offline, instalação iPhone/Android). | `09-pwa-producao.md` + prints celular |
| T10 | PWA Mão de Obra Pederneiras (reuso do Campinas). | `10-pwa-mao-de-obra.md` + prints celular |
| T11 | **Paridade**: importar a LT-PRO-04 de outubro/2026 (Excel) e comparar totais por dia/produto com a tela mensal. Divergências viram lista (ex.: 74 postes lançados em 29/10, data futura). | `11-paridade.md` |
| T12 | E2E (Playwright) dos fluxos: lançar → enviar → confirmar (desktop e PWA), mão de obra, mensal, data futura bloqueada; deploy na VPS nova em paralelo, sem desligar a planilha. | `12-e2e-deploy.md` |

## 7. Pendências que o Ricardo vai decidir (não inventar)

- Classificação MOD/MOI das áreas de Pederneiras (seção 2).
- Tabela definitiva de postes e `volume_m3` por peça (o seed é provisório; a importação substitui).
- Divergências do seed (coluna `pendencia`): letra C, letra P repetida, medidas Cemig 150 × 200, Poste Coluna 25x30 × 25x25, coluna dos produtos com um só código, itens AAT.
- Nome do gestor e cadastro do usuário Gestor Pederneiras.
