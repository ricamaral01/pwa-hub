# Refatoração da tela Indicadores da Concretagem (PROD_ANALISE) e saída do Supabase

Data: 22/10/2026

## 1. Contexto e decisões

- Tela: `https://concrefer.concretrack.com.br/unificado/?view=mapa/operacao/?tela=PROD_ANALISE`
- Fonte oficial do código: `mapa-concretagem/` (`index.html`, `app.js`, `styles.css`). `current-mapa/` é cópia antiga e não deve ser usada como base (ver `unificado/mapa/LEIA-ME.md`).
- Divisão do trabalho:
  - **Usuário (manual):** remover dependências do Supabase (seção 4).
  - **Assistente:** implantar somente o novo HTML/CSS/JS da tela (seção 3), reaproveitando IDs e funções atuais, sem alterar cálculos nem endpoints.
- Decisões já tomadas: implantar na versão de produção (`unificado/mapa/operacao`), mesmos dados e endpoints, tema claro e escuro com alternância.
- A implantação (deploy no servidor) fica a cargo do usuário; o assistente edita apenas arquivos locais.

> Observação: o mockup inicial foi feito sem acesso ao conteúdo real da tela. A estrutura abaixo foi levantada depois, a partir do código.

## 2. Estrutura atual da tela (`mapa-concretagem/index.html`, ~linhas 330-408)

### Filtros (gaveta)
Início, Fim, Setor (Todos, Setores 1 e 2, Setor 1-4), Meta ciclo (min, padrão 15). Botões: Limpar, Aplicar filtros, CSV, Excel, PDF.
IDs: `paFiltroSetor`, `paMetaCiclo`, `paBtnLimparFiltros`, `paBtnFiltrar`, `paBtnExportarCSV`, `paBtnExportarExcel`, `paBtnExportarPDF`. Alertas em `#paAlertsPanel`.

### Abas
Resumo, Produção, Qualidade, Produtividade, Dados (`data-pa-tab`).

| Aba | Conteúdo | IDs principais |
|---|---|---|
| Resumo | 11 KPIs: formas, volume total, concreto padrão, fora do padrão, ciclo médio, eficiência, paradas, desvio padrão, formas/hora, m³/hora, jornada | `paKpiFormas`, `paKpiVolume`, `paKpiVolBomDia`, `paKpiVolForaDia`, `paKpiCicloMedio`, `paKpiEficiencia`, `paKpiParadas`, `paKpiDesvioPadrao`, `paKpiFormasHora`, `paKpiM3Hora`, `paKpiJornada` |
| Produção | Volume diário bom vs fora do padrão; produção por hora; volume por hora; produção por setor (7 dias); formas por setor; volume por setor; histórico por data | `chartPaVolDiaStacked`, `chartPaHeatmap`, `chartPaM3Hora`, `chartProdSetores`, `chartPaFormasSetor`, `chartPaVolumeSetor`, `#dbHistory` |
| Qualidade | Volume por setor, padrão vs fora do padrão (lista) | `#paVolumeTipoSetor` |
| Produtividade | Ciclo médio por dia; distribuição de ciclos; guia de indicadores | `chartPaCicloDia`, `chartPaHistograma` |
| Dados | Tabela "Dados das concretagens" (Forma, Setor, Tipo, Horário, Operador) + Exportar CSV | `paDadosTbody`, `paBtnExportarDadosCSV` |

Funções relacionadas no `app.js`: renderização da tabela em torno da linha ~10776; modo `PROD_ANALISE` chama `loadKgHomem()` em `unificado/mapa/operacao/unificado-bridge.js` (linha ~338).

## 3. Proposta de nova tela (a implantar pelo assistente)

1. **Visão única, sem abas**, na ordem: filtros, alertas, KPIs, qualidade, operação, produtividade, paradas.
2. **Período:** um único seletor de período com atalhos (Hoje, Ontem, 7 dias, Mês atual, Mês anterior, Personalizado). Padrão: Hoje. Com mais de um dia, KPIs usam média ponderada e comparação com período anterior de mesmo tamanho. Com "Hoje", o gráfico diário vira gráfico por hora.
3. **Exportar:** menu único (CSV, Excel, PDF). **Remover a aba Dados** e a tabela "Dados das concretagens".
4. **Alertas:** uma faixa recolhível única.
5. **KPIs:** 6 principais com mini-tendência e comparação com o mês (formas, volume, ciclo médio vs meta em medidor, formas/hora, m³/hora, concreto fora do padrão em destaque). Desvio padrão, jornada e eficiência vão para detalhes ou tooltip.
6. **Qualidade:** volume diário padrão vs fora do padrão + rosca de proporção.
7. **Operação:** produção por hora, ciclo médio por dia (com linha da meta), volume por setor (substitui "formas por setor", "volume por setor" e "produção por setor 7 dias").
8. **Produtividade:** bloco único por setor (kg/homem e postes/homem).
9. **Paradas do dia:** linha do tempo com marcadores amarelo/vermelho.
10. **Tema claro e escuro** com alternância (variáveis CSS).
11. Remover "Histórico por Data" (duplica o volume diário).

Pendências a validar com a regra de negócio: o valor de "Eficiência" (já visto acima de 100%), e a necessidade de manter a aba Dados para alguma rotina de auditoria.

Restrições de implantação: manter os IDs `pa*`/`chartPa*` usados por `app.js` e por `tests/mapa/e2e` (`dashboards_ui_parity.py`, `csv_exports.py`, `viewports.py`); rodar esses testes depois.

Mockups gerados: versões escura e clara, com seletor de período (na pasta de artefatos da conversa: `mockup_indicadores_v2_*.jpg` e `mockup_indicadores_claro_*.jpg`).

## 4. Varredura: dependências do Supabase (tarefa manual)

Resultado: o Mapa **não** está totalmente em banco próprio.

### 4.1 Mapa (`mapa-concretagem/`)
- `app.js` linhas ~209-213: `SUPABASE_CONFIG` com URL do projeto e **chave anon fixa no código**; `supabaseClient = window.supabase.createClient(...)`.
- `supabase.js` (biblioteca do cliente, minificada) carregada na página e listada no cache de `sw.js` (linha ~22). Inclui cliente realtime/WebSocket.
- Funções com chamadas ao Supabase: `loadClickedFormsFromSupabase`, `carregarFormasManutencaoSupabase` (e outras que usam `supabaseClient`; buscar por `supabaseClient.` no `app.js`).

### 4.2 Camada de proteção atual (remendo)
- `unificado/mapa/operacao/bridge.js` (linha ~15): intercepta `fetch` e reescreve qualquer host `*.supabase.co` para `/unificado/mapa/api`.
  Também reescreve `pcp.concretrack.com.br`, `usina.concretrack.com.br`, `dautomacao.com` e `docs.google.com` (planilha de leituras QR) para a API local.
- Limitações: só cobre `fetch` (WebSocket/realtime e outros clientes escapam); depende de o bridge carregar antes do app.
- `unificado/mapa/operacao/unificado-bridge.js` (linhas ~36-37): apenas troca textos "Supabase" por mensagens neutras na interface.
- `unificado/mapa/operacao/sw.js` (linha 4): ainda referencia `./supabase.js`.
- `unificado/mapa/index.html` (linha 18): texto "Dados migrados do Supabase para PostgreSQL".

### 4.3 PCP (`unificado/pcp/`)
- `backend/app/core/config.py` (linhas 26-29): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PRODUCAO_TABLE`.
- `backend/app/services/sheets_service.py`: `_fetch_supabase_rows` e leitura de `rest/v1/producao_diaria` (linhas ~25-100, 215-257, 516).
- `backend/app/api/routers/pcp.py`: rota `/producao/supabase` e `_realizado_supabase_por_produto` (linhas ~694, 726, 808-1031, 1674-1703).
- `producao/index.html` (linhas ~313-318, 700): tela "Produção Realizada - Supabase" chamando `/api/producao/supabase`.
- `pcp/unificado-bridge.js` (linha 12): reescreve `*.supabase.co`.

### 4.4 Inspeção
- `unificado/m/inspecao/api.js` (linha 2): `supabaseClient` próprio.

### 4.5 Dados
- Segundo `unificado/mapa/LEIA-ME.md`, o PostgreSQL contém uma **fotografia de 02/10/2026**. Alterações posteriores no Supabase não chegam ao destino automaticamente. O Supabase continua ativo como origem.

## 5. Checklist para o trabalho manual

- [ ] Migração final e contínua (ou corte definitivo) dos dados Supabase para PostgreSQL.
- [ ] Criar/validar na API local (`/unificado/mapa/api`) todos os endpoints que o `app.js` consome via Supabase (leitura e escrita).
- [ ] Remover `supabase.js`, `SUPABASE_CONFIG` e `createClient` do `app.js`; substituir `supabaseClient.*` por chamadas à API local.
- [ ] Atualizar `sw.js` (remover `./supabase.js` do cache) e incrementar a versão do cache.
- [ ] Migrar o backend do PCP (`sheets_service.py`, `pcp.py`, `config.py`) e a rota `/producao/supabase` para o Postgres.
- [ ] Migrar `m/inspecao/api.js`.
- [ ] Remover a reescrita `*.supabase.co` dos bridges depois que nada mais chamar o Supabase.
- [ ] **Revogar/rotacionar a chave anon exposta** no `app.js` e remover as variáveis `SUPABASE_*` dos `.env`.
- [ ] Verificação final no navegador: aba Network sem nenhum request/WebSocket para `*.supabase.co`.
- [ ] Rodar `tests/mapa/e2e` (paridade de dashboards, CSV, viewports).

## 6. Quando o HTML estiver liberado

Avisar o assistente para implantar a nova tela de indicadores (seção 3) em `mapa-concretagem/index.html` (+ CSS/JS necessários), preservando os IDs, sem tocar nas chamadas de dados.
