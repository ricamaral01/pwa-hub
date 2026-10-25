# Prompt para o Codex — Laboratório › Insumos: Carta Traço + Estoque na VPS nova

Abra o repositório `C:\Users\Admin\Documents\pwa-hub-fase1` e cole tudo abaixo da linha.

---

## Objetivo

Levar **Carta Traço** (hoje Google Sheets + Apps Script, em `carta-traco/`) e **Controle de Estoque**
(hoje no ERP ConcreTrack da VPS antiga, `/var/www/concretrack-erp`) para dentro do módulo **Laboratório**
do Unificado, na VPS nova, em PostgreSQL, com um cadastro único de materiais e fornecedores. A leitura de
nota fiscal por IA do estoque **continua**, com o mesmo provedor e prompt do ERP.

## Leia antes de começar

1. `docs/porting/laboratorio/insumos/ESCOPO.md` — o que muda, o que fica, os três cortes.
2. `docs/porting/laboratorio/insumos/REVISAO_CALCULOS.md` — cada regra de cálculo, o que mudou e o que está para decidir.
3. `docs/porting/laboratorio/insumos/pacote/` — SQL, carga, API e 26 testes (todos passando em PostgreSQL 16):
   - `sql/010_insumos.sql`, `sql/020_estoque.sql`, `sql/030_carta_traco.sql`, `sql/090_export_formato_legado.sql`
   - `carga/importar_sheets.py` + `carta_traco_normalizar.sql` (Sheets → Postgres, com reconciliação de MCC)
   - `carga/estoque_sincronizar_legado.sql` (espelho do ERP → `estoque`, idempotente)
   - `api/carta_traco_api.py`, `api/estoque_api.py`, `api/estoque_calculos.py`, `api/nf_leitura.py`, `api/deps.py`
   - `infra/` (timers de espelho e de baixa automática), `tests/`
4. `carta-traco/docs/CARTA_TRACO_ANALISE.md` e `docs/porting/usinas/estoque/CONTROLE-DE-ESTOQUE.md` — inventário dos legados.
5. Serviço do Laboratório: `unificado/laboratorio/service/` (FastAPI em `server/`, migrations SQL idempotentes em
   `migrations/`, testes em `tests/`, unit `laboratorio-unificado.service`) e frontend em `unificado/laboratorio/frontend/`.

## Regras (obrigatórias)

1. **Não quebrar nada.** Sheets/Apps Script e o ERP antigo continuam no ar e **oficiais** até eu mandar cortar.
   Não altere `carta-traco/index.html`, o `.gs`, nem nada na VPS antiga. Na VPS antiga, só leitura.
2. **Uma tarefa, uma evidência.** Cada etapa termina com `docs/porting/laboratorio/insumos/etapa-N-<nome>.md`
   (o que fez, arquivos, comandos, saída de testes, prints). **Pare ao fim de cada etapa e espere minha aprovação.**
3. **Padrão do Laboratório, não do pacote,** quando divergirem: sessão e usuário vêm de `server/postes_api.py`
   (`db`, `current_user`, papéis `tecnico`/`engenheiro`/`admin`, permissão por tela como `crono_screens`);
   migrations são arquivos SQL datados em `service/migrations/` e idempotentes.
4. **Não mude regra de cálculo** do pacote sem me perguntar — estão cobertas por teste. As decisões em aberto
   estão no fim deste prompt; traga números, não decida sozinho.
5. Nada de senha, chave de IA, ID de planilha ou credencial no repositório. Use os `EnvironmentFile` do serviço.
6. No Laboratório, por enquanto **só o usuário Ricardo** acessa Insumos. A bolinha do Laboratório no menu é amarela;
   o menu lateral é o modelo A. Nos modos PWA, não mexa em nada que já existe.
7. Antes de encerrar cada etapa: testes do pacote (`PG_TEST_DSN` = banco **descartável**) e testes existentes do Laboratório.

## Etapas

### Etapa 1 — Mapeamento (só leitura)
- No serviço do Laboratório: como `app.py` monta routers e o startup, como `postes_api` resolve sessão/usuário e
  a permissão por tela, onde o frontend registra telas e menu.
- Na VPS nova: em qual banco e schema estão espelhadas `tbl_est_materiais`, `tbl_est_movimentos`,
  `tbl_est_config_massada`, `tbl_massadas` (e se `tbl_est_silos` ainda não está — o inventário diz que não).
  Liste as **colunas reais** de cada uma e compare com as que `carga/estoque_sincronizar_legado.sql` e
  `tests/erp_espelho_exemplo.sql` assumem.
- Na VPS antiga (somente leitura): copie para `docs/porting/laboratorio/insumos/legado/` o trecho de
  `api/routers/estoque.py` da leitura de NF (provedor, prompt, formato de resposta, sem credenciais) e o trecho
  do saldo que trata `[Contagem fisica: X]` — preciso saber se "movimentos posteriores" é por data ou por ID.
- No `carta-traco/index.html` (≈ L1244-1254): registre exatamente a conversão de litro e de m³.
- Evidência: `etapa-1-mapeamento.md` com caminhos, colunas, trechos e a lista de ajustes que fará no pacote.

### Etapa 2 — Banco (staging da VPS nova)
- Crie as migrations do Laboratório a partir de `sql/010`, `020`, `030`, `090` (mesma ordem) e aplique no staging.
- Ajuste `estoque_sincronizar_legado.sql` às colunas reais e crie o espelho de `tbl_est_silos` se faltar
  (no mesmo mecanismo de 1 minuto que já espelha as outras).
- Troque as views `estoque.v_massada_leitura` (uma linha por massada × coluna `real_*`) e
  `estoque.v_massada_produto` (data, código do traço, volume) por views sobre o espelho real de `tbl_massadas`,
  mantendo nomes e tipos das colunas.
- Papel de banco da aplicação com acesso só a `insumos`, `estoque`, `carta_traco`, `carta_traco_stg` e leitura no espelho.
- Evidência: migrations aplicadas duas vezes sem erro, `\dn`, `\dt` dos schemas, testes do pacote passando.

### Etapa 3 — Cargas em ensaio e paridade
- **Carta:** eu deixo a planilha em `docs/porting/laboratorio/insumos/dados/cartaTraco.xlsx` (adicione `dados/` ao
  `.gitignore`). Rode `importar_sheets.py` **sem** `--aplicar`, proponha linhas para `mapa_materiais.csv` até
  toda diferença de MCC ter motivo.
- **Estoque:** rode `estoque.sincronizar_legado('Campinas')` no staging. Compare com o ERP (pela ponte de leitura
  que já existe) o saldo por material e por silo em **três datas**: 29/06/2026, 30/06/2026 e hoje; e o custo
  unitário de todas as entradas (a função já devolve quantas diferem).
- Compare `GET /consumo/calculado` com as baixas do ERP de 7 dias.
- Evidência: relatórios da carga, tabela de paridade de saldo (ERP × novo, diferença, motivo), tabela de
  consumo calculado × gravado, e os números de cada decisão em aberto. **Não aplique nada ainda.**

### Etapa 4 — Backend no serviço do Laboratório
- Copie `api/*.py` para `service/server/` (`carta_traco_api.py`, `estoque_api.py`, `estoque_calculos.py`,
  `nf_leitura.py`). Substitua `deps.py` pelos imports de `postes_api` e integre a permissão por tela.
- Registre os routers no `app.py`; no startup chame `nf_leitura.retomar_pendentes(app.state.postes_session)`.
- **Porte o provedor de IA** do ERP para `nf_leitura.extrair_com_ia` (mesmo provedor, prompt e campos; credenciais
  pelo ambiente). `NF_UPLOAD_DIR=/var/lib/concrefer-lab/nf_uploads` (já está em `ReadWritePaths`).
- Leve os testes para `service/tests/` adaptando o `conftest.py`.
- Evidência: rotas no OpenAPI, testes passando, uma leitura real de NF (foto) e uma de XML no staging, com o
  resultado da IA lado a lado com o do ERP para a mesma nota.

### Etapa 5 — Espelho ligado
- `infra/lab-insumos-espelho.*` com `CARTA_ESPELHO=1` e `ESTOQUE_ESPELHO=1`; conta de serviço Google **somente
  leitura** (me passe o e-mail para eu compartilhar a planilha).
- `insumos.config`: `carta_fonte_oficial='sheets'`, `estoque_fonte_oficial='erp'`, `consumo_gerador='erp'`.
  **Não** instale `lab-estoque-consumo.*` ainda.
- Evidência: duas execuções seguidas sem alteração de IDs, relatório da última.

### Etapa 6 — Telas (somente leitura nesta fase)
Laboratório → **Insumos**, seguindo os mockups do canvas "Carta Traço — Telas novas" (8 telas, menu do Laboratório).
- **Carta traço (5):** Visão geral, Editor (indicadores e MCC ao vivo por `POST /cartas/calcular`, seletor de fonte de
  custo), Consulta com painel de revisões e "o que mudou", Materiais e custos (material sempre do catálogo, prévia
  de impacto), Resumo MCC.
- **Estoque (8 do ERP):** Início, Entrada (NF), Saldo, Relatório, Consumo e previsão, Consumo de cimento,
  Mapeamento das caixas (com "a partir de" — nova vigência, nunca edita o passado), Contagem. Mesmos filtros,
  gráficos, impressão e estados vazios do ERP.
- **Novas:** Entrada com NF (arrastar foto/PDF/XML; conferência lado a lado com a imagem; aviso de NF repetida;
  rateio com soma ao vivo e custo unitário), Saldo e silos (contábil × físico, material por silo, última contagem,
  autonomia), Consumo teórico × real.
- Botões de gravar visíveis mas desabilitados com o aviso "Modo paralelo: o oficial ainda é o sistema antigo".
- PC e tablet 100 %.
- Evidência: prints de todas as telas em PC e tablet; 5 cartas reais (MCC novo × antigo) e 5 materiais (saldo novo × ERP).

### Etapa 7 — Roteiro dos três cortes (só documento)
`etapa-7-cortes.md` com passo a passo, verificação e volta atrás para cada corte (ver `ESCOPO.md`):
1. Carta: travar `doPost` do Apps Script, última carga, `carta_fonte_oficial='postgres'`, `CARTA_ESPELHO=0`.
   Volta: views `carta_traco.legado_cadastro`/`legado_custos`.
2. Estoque: travar gravação nas telas de estoque do ERP, última sincronização, `estoque_fonte_oficial='vps_nova'`,
   `ESTOQUE_ESPELHO=0`, redirecionar Usinas → Controle de estoque.
3. Gerador: desligar o cron `sync_consumo_producao.py` da VPS antiga, `consumo_gerador='vps_nova'`,
   `estoque.gerar_consumo` no período da virada, ligar `lab-estoque-consumo.timer`.
**Nenhum corte acontece sem ordem minha.**

## Decisões que ficam comigo (traga os números na etapa 3)
1. Custo em litro: legado multiplica pela M.E.; pacote divide. Quais cartas mudam e quanto?
2. Agregado comprado em m³: massa unitária por material (o laboratório informa); impacto no MCC.
3. Teor de argamassa em destaque: fórmula do legado ou (c + adição + areia) ÷ secos.
4. Contagem física: fim do dia contado (pacote) ou outra regra (o que o código do ERP faz).
5. Fonte de custo do MCC: tabela, última entrada, média ponderada ou entrada senão tabela.
6. Tolerância de fechamento (±10 L) e se o teor de ar entra no fechamento.
7. ICMS do frete na tabela de preços da Carta (o estoque já desconta).
