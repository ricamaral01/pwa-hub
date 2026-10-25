# Escopo — Carta Traço e Estoque no Laboratório (VPS nova)

## Decisão

Carta Traço e Controle de Estoque passam a viver **dentro do módulo Laboratório** do Unificado, na VPS nova,
em PostgreSQL, com **um cadastro único de materiais e fornecedores** (`insumos`). Saem do Google Sheets
(Carta Traço) e do ERP ConcreTrack da VPS antiga (Estoque). A leitura de nota fiscal por IA continua.

Menu: **Laboratório → Insumos**
- Carta traço: Visão geral · Nova carta · Consulta · Resumo MCC
- Estoque: Início · Entrada (NF) · Saldo e silos · Movimentos · Consumo e previsão · Consumo de cimento · Mapeamento das caixas · Contagem
- Comum: Materiais e custos · Consumo teórico × real

O item **Usinas → Controle de estoque** (ponte de leitura `usinas_legacy_read.py`) continua até o corte do
estoque; depois passa a apontar para Laboratório → Insumos → Estoque.

## O que muda de lugar e o que fica

| Dado | Hoje | Depois |
|---|---|---|
| Cartas e tabela de preços | Google Sheets (Apps Script) | `carta_traco` + `insumos.custo` na VPS nova |
| Materiais, fornecedores, unidades | Duplicados no Sheets e no ERP | `insumos` (único) |
| Entradas, acertos, contagens, silos, mapeamento | ERP, VPS antiga (`tbl_est_*`) | `estoque` na VPS nova |
| Leitura de NF por IA | ERP, estado em memória | Laboratório, estado no banco, anexo em `/var/lib/concrefer-lab/nf_uploads` |
| Baixa automática pela produção | Cron do ERP 00:01 | `estoque.gerar_consumo` na VPS nova (timer 00:05) — **só um gerador por vez** |
| Massadas (`tbl_massadas`) | VPS antiga (alimentada pela API/CLP) | **Continuam na VPS antiga** (decisão de 22/10: o que depende da API não muda). A VPS nova lê do espelho atualizado a cada minuto. |

## Três cortes independentes

Cada um tem chave própria em `insumos.config` e pode acontecer em dias diferentes. Antes de cada corte, o
sistema antigo é o oficial e o novo roda em paralelo, só lendo.

| Corte | Chave | Antes | Depois |
|---|---|---|---|
| 1. Carta Traço | `carta_fonte_oficial` | Sheets oficial; Postgres recarregado a cada 5 min | Apps Script travado para gravação; grava-se só no Laboratório |
| 2. Estoque (lançamentos) | `estoque_fonte_oficial` | ERP oficial; espelho → `estoque` a cada 5 min; API nova recusa gravação (409) | Entradas, NF, contagens e mapeamento só no Laboratório; telas de estoque do ERP travadas |
| 3. Gerador de consumo | `consumo_gerador` | Cron do ERP gera baixas; a VPS nova só compara (`/consumo/calculado`) | Cron do ERP desligado; timer da VPS nova gera |

Ordem recomendada: 1 → 2 → 3. O corte 3 só depois de pelo menos uma semana com `/consumo/calculado`
batendo com as baixas do ERP dia a dia.

## Telas

Carta Traço: as 5 telas dos mockups (canvas "Carta Traço — Telas novas"), agora com o menu do Laboratório.

Estoque: as 8 telas do ERP com o mesmo conteúdo (inventário em `docs/porting/usinas/estoque/CONTROLE-DE-ESTOQUE.md`),
mais:
- **Entrada (NF):** arrastar foto, PDF ou XML; XML preenche na hora; foto/PDF mostra "lendo…" e depois os campos
  para conferir lado a lado com a imagem; aviso de NF já lançada; rateio entre silos com soma ao vivo e
  custo unitário calculado.
- **Saldo e silos:** nível contábil e físico por silo, material em cada silo, data da última contagem, autonomia.
- **Consumo teórico × real:** por material e período, desvio em kg e %, volume produzido sem carta vinculada.

Mockups dessas três telas foram acrescentados ao canvas.

## Aceite (por corte)

- **Carta:** MCC igual ao app antigo em todas as cartas, ou diferença explicada no relatório da carga;
  5 cartas reais conferidas na tela.
- **Estoque:** saldo por material e por silo igual ao ERP em 3 datas fixas (incluindo antes e depois de
  30/06/2026 e uma contagem física); custo unitário de todas as entradas igual (a carga já confere);
  um recebimento real lançado pela NF no Laboratório; permissões testadas com um usuário real do estoque.
- **Gerador:** `/consumo/calculado` sem diferença por 7 dias seguidos; após o corte, um ciclo diário completo
  conferido.

## Fora deste escopo

- Mudar API, CLP ou a origem das massadas.
- Compra automática (a previsão continua sendo sugestão).
- Outras unidades além de Campinas no estoque (o modelo já suporta; a carga é por unidade).
