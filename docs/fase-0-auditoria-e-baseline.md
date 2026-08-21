# Fase 0 - Auditoria e Baseline dos Dashboards

Data da auditoria: 2026-08-20
Projeto auditado: `mapa-concretagem-teste`
Escopo: dashboards Produtividade, Montagem e Defeitos, backend analitico, setores e evidencias SGQ.

## 1. Premissas e fonte do plano

- O arquivo solicitado `docs/plano-final-refatoracao-dashboards-backend-iso.html` nao existe no repositorio auditado.
- Foi lido como fonte do plano mestre o anexo informado em `C:\Users\Admin\Downloads\plano_final_refatoracao_dashboards_backend_iso_codex.html`.
- As instrucoes contidas no documento foram tratadas como requisitos do plano aprovado, mas esta execucao ficou restrita a Fase 0, sem aplicar migracoes, views, RPCs ou alteracoes funcionais.
- Nenhuma credencial, politica de autenticacao, configuracao de ambiente ou deploy de producao foi alterado.

## 2. Arquivos analisados

Principais arquivos lidos:

- `mapa-concretagem-teste/app.js`
- `mapa-concretagem-teste/index.html`
- `mapa-concretagem-teste/styles.css`
- `mapa-concretagem-teste/server.js`
- `mapa-concretagem-teste/sw.js`
- `mapa-concretagem-teste/manifest.json`
- `mapa-concretagem-teste/HANDOFF_TECNICO.md`
- `supabase/migrations/202606290001_auth_hub.sql`
- `supabase/migrations/202608200001_add_vibrado_to_producao.sql`
- `docs/AUTH_SETUP.md`
- `scripts/generate_defeitos_concreto_report.py`
- `scripts/daily_concrete_defects_agent.py`

## 3. Arquitetura encontrada

O `mapa-concretagem-teste` e uma PWA estatica com a maior parte da regra de negocio concentrada em `app.js`. O frontend usa o cliente Supabase diretamente no navegador, com URL e anon key declaradas em `SUPABASE_CONFIG`.

Arquitetura operacional encontrada:

- Frontend: `index.html`, `styles.css`, `app.js`, Chart.js local e service worker.
- Persistencia principal: Supabase/PostgreSQL acessado diretamente do browser.
- Backend opcional: `server.js`, API Express para fotos de inspecao via SFTP e metadados em `fotos_inspecao`.
- Cache/offline: `localStorage` para dados operacionais e cache de relatorios; service worker cacheia assets estaticos e ignora chamadas para `supabase.co`.
- Dashboards atuais: calculam grande parte dos KPIs no frontend, depois de carregar registros de `producao` e `montagem_poste`.

Tabelas/views observadas por codigo e leitura Supabase:

- `programacao_pcp`
- `liberacao_formas`
- `producao`
- `montagem_poste`
- `vw_formas_status`
- `usuarios`

Tabelas referenciadas mas nao encontradas no schema cache com a chave atual:

- `prog_s3_s4`
- `programacoes`
- `produtos`
- `fotos_inspecao`

## 4. Evidencia de banco e setores

Consulta em leitura com a conexao atual do frontend:

| Fonte | Resultado |
|---|---|
| `programacao_pcp` | 1.414 registros; colunas `id,data_fabricacao,setor,forma,modelo,codigo_poste,descricao_poste,codigo_produto,quantidade,data_hora` |
| `liberacao_formas` | 3.657 registros; colunas `id,data_fabricacao,setor,forma,colaborador,data_hora` |
| `producao` | 16.743 registros; colunas `id,data_hora,setor,forma,modelo,tipo_concreto,colaborador,data_fabricacao,status,codigo_poste,descricao_poste,codigo_produto` |
| `montagem_poste` | `select("*", count)` estourou timeout; `select` limitado por colunas retornou amostra de 100 registros |
| `vw_formas_status` | 17.113 registros; view unificada de programacao/liberacao/producao |
| `usuarios` | 37 registros; setores de usuario incluem nulos, `Todos` e Setores 1 a 4 |

Setores vistos em amostras/contagens:

- `Setor 1`
- `Setor 2`
- `Setor 3`
- `Setor 4` aparece no catalogo e em usuarios, mas nao apareceu na primeira amostra de 1000 de `producao` e `vw_formas_status`.
- `Setor de Testes` apareceu em `programacao_pcp` e `liberacao_formas`.
- `Todos` aparece em `usuarios.setor`.
- Nulos/vazios aparecem em `usuarios.setor`.

Pendencias de homologacao:

- Confirmar se `Setor de Testes` deve ser excluido dos KPIs oficiais ou mapeado fora da matriz S1-S4.
- Confirmar presenca e volume de `Setor 4` em `producao`, `montagem_poste` e `vw_formas_status` com consulta administrativa ou RPC propria, pois a amostra atual nao prova ausencia total.
- Confirmar se `Todos` e nulos em `usuarios.setor` sao somente escopo de permissao, nao dado operacional.
- Confirmar se `tipo_concreto` aceita aliases como `Padrao`, `Padrão`, `Concreto Padrao` e `Concreto Padrão`.

## 5. Divergencias em relacao ao plano

- O plano exige agregacoes oficiais em PostgreSQL/Supabase por views e RPCs versionadas; o codigo atual calcula os KPIs oficiais no frontend.
- O plano exige que Defeitos tenha view, estado, servico, carregamento e ciclo de vida proprios; atualmente Defeitos reutiliza `viewMontagemIndicadores`, filtros `mi*`, cache `montagem:*` e `carregarMontagemIndicadores()`.
- O plano exige nao usar `select("*")` nos dashboards refatorados; o codigo atual usa `select("*")` em rotas de dashboard/produtividade/montagem, inclusive em `carregarLinhasSupabaseComCache`.
- O plano exige todos os indicadores nos escopos Total, Setor 1, Setor 2, Setor 3, Setor 4 e Consolidado S1+S2; o frontend atual usa filtros simples e um alias visual `Setores 1 e 2`, sem contrato unico de escopo para todos os indicadores.
- O plano exige Total = S1+S2+S3+S4; o codigo atual pode incluir setores fora da matriz, como `Setor de Testes`, dependendo do fluxo/tabela.
- O plano exige consolidado S1+S2 recalculado por numeradores e denominadores; o codigo filtra linhas S1/S2 em memoria, o que tende a recalcular corretamente quando a base bruta esta completa, mas nao existe contrato SQL que garanta essa regra para todos os KPIs.
- O plano exige paginacao server-side; a tabela de montagem pagina em memoria apos carregar o dataset do periodo.
- O plano exige RLS, indices e contratos versionados para dashboards; no repositorio ha migracoes de auth e um `alter table` de `producao`, mas nao ha migrations dos contratos analiticos.

## 6. Pontos de acoplamento Montagem x Defeitos

Pontos principais:

- `index.html` possui apenas `viewMontagemIndicadores`; `Dashboard Defeitos` troca titulo e mostra apenas `miSecaoDefeitos`.
- `app.js` usa o mesmo modo base visual: `MONTAGEM_INDICADORES` e `DASHBOARD_DEFEITOS` removem/mostram a mesma view.
- `aplicarLayoutDashboardDefeitos()` esconde todas as secoes de `#viewMontagemIndicadores` exceto `#miSecaoDefeitos`.
- `setMode()` chama `ativarAbaMontagem("defeitos")` e depois `carregarMontagemIndicadores()` para Defeitos.
- CSS compartilha seletores `body.mode-montagem-indicadores` e `body.mode-dashboard-defeitos` para a mesma estrutura `.mi-*`.
- Estado global compartilhado: `miRawMontagemData`, `miRawProducaoData`, `miFilteredMontagemData`, `miAbaAtiva`, `miPaginaAtual`, ordenacao e filtros `mi*`.

Conclusao: Defeitos nao e um dashboard independente; e uma secao filtrada do dashboard Montagem.

## 7. Formulas atuais identificadas

Produtividade:

- Total de formas = quantidade de linhas filtradas de `producao`.
- Volume total = soma de `getFormVolume(codigo_produto, modelo, setor)` por linha.
- Ciclos = diferenca em minutos entre concretagens consecutivas no mesmo `data_fabricacao + setor`.
- Ciclo valido = intervalo maior que 0 e menor ou igual a 60 minutos.
- Parada = intervalo maior que 20 minutos; `AMARELO` para >20 e <=30; `VERMELHO` para >30.
- Ciclo medio = media dos ciclos validos.
- Mediana, minimo, maximo e desvio padrao calculados sobre ciclos validos.
- Tempo perdido = soma de `ciclo - meta` para ciclos validos acima da meta.
- Tempo disponivel = soma dos ciclos validos; fallback 480 minutos quando vazio.
- Producao teorica = `tempoDisponivelMin / meta`.
- Eficiencia operacional = `totalFormas / producaoTeorica * 100`.
- Formas/hora = soma, por setor, de `60 / cicloMedioDoSetor`.
- m3/h = `formasPorHora * volumeMedio`.
- Capacidade maxima diaria = `480 / melhorCicloHistorico`.
- Capacidade media diaria = `480 / cicloMedio`.
- Capacidade atual diaria = `totalFormas / numeroDeDias`.

Montagem:

- Total inspecionado = linhas de `montagem_poste` consideradas finalizadas por `isLinhaMontagemDashboard`.
- Aprovados = linhas com `status_montagem === "A"` ou sem rejeitados na serie diaria.
- Recusados = linhas com pelo menos um item rejeitado.
- Tempo de montagem/inspecao = `finalizado_em - inicio_inspecao_montagem`.
- Rankings por setor e montador sao contagens em memoria.
- Tabela e cards sao paginados no frontend com `slice`.

Defeitos:

- Postes analisados = quantidade de linhas de montagem filtradas para defeitos.
- Producao do periodo = quantidade de linhas filtradas em `producao`.
- Oportunidades/possiveis = soma dos itens retornados por `obterDefeitosPossiveisLinha(row)`.
- Ocorrencias/erros = soma dos itens rejeitados por `obterItensRejeitadosLinha(row, { visualOnly: true })`.
- Postes com defeito = linhas com pelo menos um rejeitado.
- Postes reprovados = linhas com `status_montagem` `R` ou `REPROVADO`.
- Retrabalho = linhas com `status_montagem === "RR"`.
- Taxa NC = `totalErros / totalPossivel * 100`.
- Indice de reprovacao = `postesComDefeito / postes * 100`.
- Taxa de postes reprovados = `postesReprovados / producao * 100`.
- Taxa de retrabalho = `retrabalho / postes * 100`.
- Taxa por setor exibida = `erros / producaoDoSetor * 100`.
- Pareto = ordena defeitos por ocorrencia, calcula percentual sobre `totalErros` e acumulado.

## 8. Gargalos e riscos encontrados

- `montagem_poste` com `select("*", count)` sofreu timeout em leitura, sinalizando risco real para dashboards que carregam periodo inteiro.
- Dashboards carregam dados brutos de `producao` e `montagem_poste` para calcular KPI oficial no browser.
- Limites `pageSize=1000` e `maxPages=20` podem truncar dados sem evidencia clara ao usuario.
- Cache local pode mascarar dados obsoletos; ha estado `OFFLINE_CACHE`, mas faltam contrato de validade, versao e evidencia de stale por KPI.
- Nao ha protecao central contra requisicoes concorrentes por dashboard; chamadas sucessivas podem aplicar respostas fora de ordem.
- `select("*")` aumenta trafego, exposicao e custo, principalmente em JSONB `checklists`.
- RLS das tabelas operacionais nao esta documentado em migrations no repo; como o frontend usa anon key, o risco depende de politicas no Supabase.
- `server.js` usa `select("*")` em `fotos_inspecao` e a tabela nao foi encontrada com a conexao atual.
- Campos com alto volume de nulos: `codigo_poste`, `descricao_poste`, `codigo_produto`, `colaborador` em `producao`; isso afeta rastreabilidade e volume por produto.
- O plano mestre no repositorio esta ausente do caminho solicitado, dificultando controle documental SGQ.

## 9. Contratos SQL propostos, nao aplicados

Escopos oficiais sugeridos:

```sql
-- Proposta conceitual; nao aplicada nesta fase.
-- scope_code: TOTAL, S1, S2, S3, S4, S1_S2
-- TOTAL deve incluir somente Setor 1..Setor 4.
-- S1_S2 deve somar numeradores e denominadores antes de calcular percentuais.
```

Views versionadas propostas:

```sql
create or replace view public.vw_dashboard_setores_v1 as
select
  setor,
  case
    when setor = 'Setor 1' then 'S1'
    when setor = 'Setor 2' then 'S2'
    when setor = 'Setor 3' then 'S3'
    when setor = 'Setor 4' then 'S4'
    else 'UNCLASSIFIED'
  end as setor_code
from (...fontes normalizadas...);
```

RPCs propostas:

- `rpc_dashboard_produtividade_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text, p_filters jsonb default '{}')`
- `rpc_dashboard_montagem_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text, p_filters jsonb default '{}')`
- `rpc_dashboard_defeitos_resumo_v1(p_data_inicio date, p_data_fim date, p_scope text, p_filters jsonb default '{}')`
- `rpc_dashboard_defeitos_pareto_v1(p_data_inicio date, p_data_fim date, p_scope text, p_limit int default 10)`
- `rpc_dashboard_defeitos_tendencia_v1(p_data_inicio date, p_data_fim date, p_scope text, p_bucket text default 'day')`
- `rpc_dashboard_montagem_ranking_v1(p_data_inicio date, p_data_fim date, p_scope text, p_dimensao text, p_limit int default 20)`
- `rpc_dashboard_montagem_lista_v1(p_data_inicio date, p_data_fim date, p_scope text, p_page int, p_page_size int, p_sort text, p_dir text)`

Indices candidatos:

- `producao(data_fabricacao, setor, status)`
- `producao(data_hora, setor)`
- `producao(data_fabricacao, setor, forma)`
- `montagem_poste(data_fabricacao, setor)`
- `montagem_poste(finalizado_em, setor)`
- `montagem_poste(status_montagem, data_fabricacao)`
- indice GIN em `montagem_poste.checklists` se houver consultas JSONB server-side.

Pendencias antes de aplicar:

- Validar DDL real das tabelas no Supabase.
- Confirmar RLS atual e perfis.
- Confirmar formulas oficiais e nomes aprovados dos indicadores.
- Confirmar regras de inclusao de status, datas-base e registros em andamento.

## 10. Contratos JSON propostos, nao aplicados

Resumo comum:

```json
{
  "contract_version": "dashboard-v1",
  "generated_at": "2026-08-20T00:00:00Z",
  "filters": {
    "data_inicio": "2026-08-01",
    "data_fim": "2026-08-20",
    "scope": "S1_S2"
  },
  "scope": {
    "code": "S1_S2",
    "label": "Consolidado Setor 1 + Setor 2",
    "included_sector_codes": ["S1", "S2"]
  },
  "kpis": {
    "numerators": {},
    "denominators": {},
    "values": {}
  },
  "data_quality": {
    "unclassified_sector_count": 0,
    "null_sector_count": 0,
    "stale": false,
    "warnings": []
  },
  "trace": {
    "source_views": [],
    "rpc": "",
    "correlation_id": ""
  }
}
```

Lista paginada:

```json
{
  "contract_version": "dashboard-list-v1",
  "page": 1,
  "page_size": 50,
  "total_rows": 0,
  "sort": "data_fabricacao",
  "dir": "desc",
  "rows": []
}
```

## 11. Dataset ouro proposto

Dataset minimo para homologacao dos escopos e formulas:

| Caso | Setor | Producao | Postes avaliados | Oportunidades | Ocorrencias | Reprovados | Retrabalho |
|---|---:|---:|---:|---:|---:|---:|---:|
| Base S1 | S1 | 10 | 8 | 80 | 8 | 2 | 1 |
| Base S2 | S2 | 5 | 5 | 50 | 10 | 1 | 0 |
| Base S3 | S3 | 7 | 6 | 60 | 0 | 0 | 0 |
| Base S4 | S4 | 3 | 2 | 20 | 2 | 1 | 1 |
| Alias invalido | UNCLASSIFIED | 1 | 1 | 10 | 1 | 0 | 0 |
| Nulo | null | 1 | 1 | 10 | 1 | 0 | 0 |

Resultados esperados oficiais:

- `TOTAL`: usa somente S1+S2+S3+S4 = producao 25, avaliados 21, oportunidades 210, ocorrencias 20.
- `S1_S2`: producao 15, avaliados 13, oportunidades 130, ocorrencias 18.
- Taxa NC `S1_S2` = `18 / 130 * 100 = 13,846%`; nao pode ser media simples entre S1 e S2.
- Registros `UNCLASSIFIED` e nulos devem entrar em `data_quality`, nao em Total.

## 12. Plano de testes necessario

Testes de banco:

- Validar normalizacao de setores S1-S4, Total e S1+S2.
- Validar que Total exclui `UNCLASSIFIED`, nulos e `Setor de Testes`.
- Validar que S1+S2 soma numeradores e denominadores antes dos percentuais.
- Validar formulas de produtividade, montagem e defeitos com dataset ouro.
- Validar RLS por perfil e grants de views/RPCs.
- Validar paginacao, ordenacao e filtros server-side.
- Validar indices com `explain analyze` nos periodos reais.

Testes frontend:

- Garantir que dashboards refatorados nao chamam `select("*")`.
- Garantir que Defeitos tem servico, estado e lifecycle proprios.
- Testar concorrencia: duas trocas rapidas de filtro nao devem renderizar resposta antiga.
- Testar estados loading, empty, partial, error, forbidden, offline/cache e stale.
- Testar desktop, tablet, celular e TV/kiosk.
- Testar cache e reset do service worker apos mudanca de contrato.
- Testar exportacao com filtros, escopo, versao e timestamp.

Testes de regressao:

- `node --check mapa-concretagem-teste/app.js`
- `node --check mapa-concretagem-teste/sw.js`
- Testes existentes em `tests/`, se aplicaveis.

## 13. Mudancas propostas no backend

- Criar views/RPCs versionadas para KPIs oficiais.
- Centralizar normalizacao de setor no SQL.
- Implementar RPC de resumo setorizado para cada dashboard.
- Implementar RPCs de Pareto, tendencia, ranking e lista paginada.
- Remover dependencia de registros brutos para KPIs oficiais.
- Adicionar indices por data/setor/status e, se necessario, GIN para `checklists`.
- Documentar e validar RLS das fontes e contratos analiticos.
- Adicionar campos de rastreabilidade nos retornos: contrato, versao, timestamp, fonte, warnings e correlation id.
- Definir politica de cache/stale por contrato.

## 14. Mudancas propostas no frontend

- Separar Defeitos em view propria, estado proprio e servico proprio.
- Substituir carregamento bruto por chamadas `rpc(...)` com contratos explicitos.
- Remover `select("*")` dos dashboards refatorados.
- Criar camada unica de escopos: `TOTAL`, `S1`, `S2`, `S3`, `S4`, `S1_S2`.
- Implementar cancelamento/controle de concorrencia por dashboard.
- Mover paginacao de tabelas para server-side.
- Exibir warnings de qualidade de dados: setor nulo, alias nao classificado, dados stale e contrato parcial.
- Preservar fallback/cache, mas com versao e validade visiveis.

## 15. Proximo passo recomendado

Antes de iniciar a Fase 1, homologar esta Fase 0 e confirmar as pendencias de banco:

- caminho oficial do plano mestre em `docs/`;
- regra para `Setor de Testes`;
- DDL real e RLS das tabelas operacionais;
- formulas oficiais finais para cada KPI;
- dataset ouro aprovado.

Apos isso, preparar uma migration de teste com views/RPCs versionadas, sem deploy de producao.

## 16. Execucao aprovada apos Fase 0

Status: implementacao executada em 2026-08-20, sem deploy de producao. As migrations foram aplicadas no Supabase linkado ao `mapa-concretagem-teste`.

Arquivos alterados nesta execucao:

- `supabase/migrations/202608200002_dashboard_analytics_v1.sql`
- `mapa-concretagem-teste/index.html`
- `mapa-concretagem-teste/app.js`
- `docs/fase-0-auditoria-e-baseline.md`
- `docs/dataset-ouro-dashboards-v1.json`
- `docs/plano-testes-dashboards-v1.md`
- `docs/evidencias-execucao-dashboards-v1.md`

Entregas implementadas:

- Migration SQL versionada `dashboard_analytics_v1` com normalizacao de setores, views base e RPCs de resumo para Produtividade, Montagem e Defeitos.
- Indices candidatos para `producao` e `montagem_poste`.
- Contratos de escopo `TOTAL`, `S1`, `S2`, `S3`, `S4` e `S1_S2`.
- Consolidado `S1_S2` calculado por soma de numeradores e denominadores no SQL, nao por media de percentuais.
- Total limitado a `Setor 1` + `Setor 2` + `Setor 3` + `Setor 4`.
- View propria `viewDashboardDefeitos`, com filtros proprios `df*`, carregamento proprio e controle de ciclo de vida separado.
- Controle de concorrencia por dashboard via sequencia de requisicao.
- Cache de payloads RPC com versao por chave.
- Substituicao dos `select("*")` dos carregamentos de dashboards tocados por colunas explicitas.
- Fallback frontend mantido para contingencia de erro/cache, mesmo apos aplicacao das RPCs.

Validacoes locais executadas:

- `node --check mapa-concretagem-teste/app.js`: passou.
- `node --check mapa-concretagem-teste/sw.js`: passou.
- Parse de `docs/dataset-ouro-dashboards-v1.json`: passou.
- RPCs `rpc_dashboard_produtividade_resumo_v1`, `rpc_dashboard_montagem_resumo_v1` e `rpc_dashboard_defeitos_resumo_v1` responderam para `TOTAL`, `S1`, `S2`, `S3`, `S4` e `S1_S2`.
- Invariantes de `S1_S2` em Defeitos passaram para producao, postes, oportunidades, erros, postes com defeito, reprovados e retrabalho.
- `rg` ainda encontra `select("*")` em fluxos operacionais antigos fora dos carregamentos refatorados de dashboard; eles foram mantidos fora do escopo para evitar impacto lateral.

Pendencias restantes:

- Validar visualmente `Dashboard Montagem`, `Dashboard Defeitos` e `Produtividade` no navegador.
- Decidir se os fluxos operacionais legados fora dos dashboards tambem devem remover `select("*")`.
- Definir regra final de tratamento para `Setor de Testes`.

Evidencia detalhada:

- `docs/evidencias-execucao-dashboards-v1.md`
