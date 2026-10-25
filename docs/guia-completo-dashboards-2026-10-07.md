# Guia dos dashboards e painéis de indicadores

**Referência:** 07/10/2026. **Base:** telas e cálculos implementados neste repositório. Este documento descreve o comportamento do código; os números efetivamente vistos dependem do período, dos filtros, das permissões e dos dados disponíveis no momento da consulta.

## Visão rápida

| Tela | Onde fica | Pergunta que responde | Fonte principal | Unidade mais comum |
| --- | --- | --- | --- | --- |
| Dashboard Montagem | Produção → Indicadores → Dashboard Montagem; também no Mapa antigo | Quanto foi inspecionado/montado em relação ao produzido, por quem e em quanto tempo? | `montagem_poste` e `producao` | Postes, %, minutos, postes por montador |
| Dashboard Defeitos | Produção → Indicadores → Dashboard Defeitos; também no Mapa antigo | Quantas não conformidades apareceram, em quais postes, tipos e setores? | `montagem_poste`, checklists e `producao` | Ocorrências, postes, %, defeitos por 100 |
| Produtividade | Produção → Indicadores → Produtividade; também no Mapa antigo | Qual foi o ritmo e o volume da concretagem? | `producao` | Formas, m³, minutos, formas/hora |
| Dashboard PCP | Planejamento → Dashboard, no sistema unificado | Quanto do programado foi realizado? | Produção consolidada pelo PCP | Postes, m³, kg, % |
| Programado vs Realizado | Planejamento → Programado vs Realizado, no unificado | Onde estão os desvios de execução, por setor e produto? | Mesma API do Dashboard PCP | Postes, m³, % |
| Temperatura de cura | Laboratório → Monitoramento, no unificado | Como evolui a temperatura do concreto e do ambiente? | Coletor ESP32 e histórico de medições | °C, registros, tempo |

Os **quatro primeiros** são os dashboards principais. Os dois últimos são painéis analíticos relacionados e estão descritos para completar o mapa de consulta. “Produtividade” no menu principal mede **concretagem**; “Produtividade” dentro do Dashboard Montagem mede **inspeção/montagem**.

## 1. Dashboard Montagem

### Objetivo

Acompanhar a passagem dos postes da produção para a inspeção/montagem, identificar diferenças por setor e dia, acompanhar aprovação, localizar registros concluídos e comparar tempos de execução. É o local do indicador **postes inspecionados por montador, por dia** solicitado recentemente.

### Filtros e ações

Período inicial/final; atalhos Hoje, 7 dias, 30 dias, mês atual e mês anterior; todos os setores, S1+S2 ou um setor; status Aprovado (`A`), Reprovado (`R`) e Aprovado e Retrabalhado (`RR`); busca por forma, modelo ou montador. Há filtros rápidos de status, atualização e exportação XLSX. O painel pode mostrar dados do cache local quando estiver sem conexão.

### Aba Resumo

| Elemento | O que mostra | Como ler |
| --- | --- | --- |
| Programado | Quantidade de registros da tabela `producao` no período/setor | É a base de postes produzidos usada no comparativo da tela; o nome do cartão é “Programado”. |
| Realizado | Quantidade de registros concluídos de montagem/inspeção elegíveis | Registros de `montagem_poste` após os filtros. |
| Atingimento | Realizado ÷ Programado × 100 | Compara as duas bases no mesmo período; não é taxa de qualidade. |
| Produção do dia | Registros de produção da data atual | Sempre se refere ao dia atual, mesmo ao consultar outro intervalo. |
| Aprovados | Registros concluídos com `status_montagem = A` | Volume aprovado na base filtrada. |
| Geral: produzidos vs montados | Contagens lado a lado e barra percentual | Visão consolidada da passagem produção → montagem. |
| Detalhamento por setor | Produzidos, montados e percentual em S1–S4 | Ajuda a localizar a diferença no setor. |

A tela contém uma **memória de cálculo** com as fórmulas de atingimento, aprovação e tempo médio. “Produzido” e “inspecionado” vêm de tabelas e datas de referência diferentes; uma taxa acima de 100% pode ocorrer quando se conclui a inspeção de peças produzidas em dias anteriores.

### Aba Produção

- **Postes montados por dia:** série diária de registros concluídos, distinguindo aprovados e recusados no gráfico.
- **Montagens realizadas:** tabela paginada e ordenável com data de produção, setor, forma, modelo, início, fim, duração, status e montador. Em tela pequena, há cartões equivalentes.

### Aba Qualidade

- **Montagens por setor:** distribuição das inspeções/montagens concluídas.
- **Ranking por montador:** quantidade de registros atribuídos a cada `montador_nome`. É uma contagem de registros, não um controle de presença.

### Aba Produtividade da Montagem

| Linha da tabela | Significado |
| --- | --- |
| Datas nas colunas | Dias encontrados no intervalo filtrado, em ordem cronológica. |
| Postes inspecionados | Quantidade de registros concluídos atribuídos a cada dia. |
| Montadores | Contas distintas com perfil `MONTADOR` que fizeram login no dia, segundo `mapa_login_events`. |
| Postes/montador/dia | Postes inspecionados ÷ montadores que fizeram login no dia. Exemplo: 100 ÷ 4 = **25**. |

A última linha é uma **média de postes por montador**, **não um percentual**. Quando não há login registrado no dia, a divisão é exibida como travessão. A contagem diária vem dos logins de contas com perfil `MONTADOR`; o KPI mensal divide as inspeções pela soma dessas contagens diárias, isto é, presenças-dia, e não por pessoas únicas do mês. A data da inspeção usa `finalizado_em`, depois início da inspeção e, por último, data de fabricação. O gráfico mensal mostra, dia a dia, postes inspecionados, montadores logados e a relação entre eles. A tela também mostra **tempo médio por tipo de poste** e **tempo médio por operador**, a partir da diferença entre início e finalização quando ambos existem.

## 2. Dashboard Defeitos

### Objetivo

Medir incidência de não conformidades, identificar concentração por tipo e setor e orientar a investigação de causa. Uma **ocorrência** é um item de checklist marcado “NÃO”; um **poste não conforme** é uma peça que teve ao menos um desses itens. Um poste pode ter vários defeitos.

### Filtros e recursos

Período e os mesmos atalhos de data; setor individual, Total ou S1+S2; status; busca por forma, modelo ou montador. Há atualização, CSV e apresentação 4:3 com impressão/PDF. No unificado há também exportação XLSX do painel novo. As listas permitem examinar ocorrências por tipo, incluindo detalhe de registros.

### O que aparece no Mapa antigo

| Indicador/bloco | Conteúdo e finalidade |
| --- | --- |
| Taxa de defeitos | Ocorrências de não conformidade ÷ oportunidades avaliadas × 100. Mede a fração dos itens de checklist com defeito, não a fração de postes defeituosos. |
| Ocorrências de NC | Total dos itens registrados como defeito. |
| Postes avaliados | Peças com registros de inspeção considerados pela regra antiga. |
| Produção | Registros produzidos no período e escopo. |
| Índice de reprovação | Postes com defeito ÷ postes avaliados × 100. |
| Postes reprovados / taxa | Quantidade com status de reprovação e proporção sobre a produção do período. |
| Retrabalho | Peças com status de retrabalho e taxa sobre postes avaliados. |
| Fissuras | Ocorrências classificadas como fissura, inclusive recorte de modelos circulares. |
| Taxa por setor | Erros do setor ÷ produção do setor × 100. Pode exceder 100% se houver mais de um erro por poste. |
| Participação dos defeitos | Quantidade e parcela de cada tipo no total, geral e separadamente para S1/S2. |
| Pareto | Tipos ordenados por frequência, participação e percentual acumulado; “tipos vitais 80/20” indica a concentração inicial. |
| Ações prioritárias | Sugestões automáticas baseadas nos tipos mais frequentes, com classificação e meta sugerida; exigem análise humana. |
| Lista por tipo | Ocorrências detalhadas para investigar modelo, forma, setor e demais dados do registro. |

### O que muda no Mapa novo (unificado)

O **topo** foi redesenhado para usar **primeiras inspeções concluídas por poste**. Isso altera a interpretação e pode alterar os números em comparação com o Mapa antigo. A parte analítica inferior (por setor, participação, Pareto, ações e detalhes) continua disponível, com exclusão de ocorrências sem item “NÃO” do total de defeitos do novo critério.

| Indicador novo | Fórmula / interpretação |
| --- | --- |
| Inspecionados e cobertura | Postes distintos com primeira inspeção; cobertura = inspecionados ÷ produzidos × 100. |
| Postes não conformes | Postes com pelo menos um “NÃO” na primeira inspeção; taxa = não conformes ÷ inspecionados × 100. É o indicador principal de qualidade do topo novo. |
| FPY, aprovados de primeira | Postes sem “NÃO” na primeira inspeção ÷ inspecionados × 100. É o complemento da taxa anterior para a mesma base. |
| Defeitos encontrados | Total de itens “NÃO” de inspeções elegíveis; **defeitos por 100 postes** = defeitos ÷ inspecionados × 100. É uma taxa de ocorrências, podendo ultrapassar 100. |
| Retrabalhados | Peças com resultado de aprovação após retrabalho ÷ inspecionados × 100. |
| Perda do poste | Peças segregadas/perdidas ÷ inspecionados × 100. |
| Defeitos por poste não conforme | Total de “NÃO” ÷ postes não conformes. |
| Taxa por oportunidade | Total de “NÃO” ÷ oportunidades avaliadas × 100; preserva a métrica principal antiga como medida complementar. O cálculo atual usa 26 itens por avaliação em S1/S2 e 17 em S3/S4. |
| Indicadores por setor | Produzidos, inspecionados, cobertura, não conformes, FPY, defeitos/100, retrabalho e perda para Total, setores e S1+S2. |
| Tendência mensal | Evolução de não conformes e FPY com base na primeira inspeção. |
| Defeitos sem vínculo | Ocorrências informadas sem identificação do poste aparecem em bloco separado, por modelo e dia; não entram nas taxas por poste ou no FPY. |

**Diferença crítica:** a “taxa de defeitos” antiga mede **itens de checklist defeituosos por oportunidade**. A taxa principal nova mede **postes não conformes por poste inspecionado na primeira passagem**. Elas respondem perguntas diferentes e não devem ser comparadas como se fossem a mesma série. O código do novo topo usa data de finalização da inspeção, com fallback para início e data de fabricação; produzido usa data de fabricação. Reinspeções podem contribuir para a contagem de “NÃO” sem criar outro poste na contagem de primeiras inspeções.

## 3. Produtividade da concretagem

### Objetivo

Medir volume e ritmo de concretagem, distinguir concreto padrão/fora do padrão e localizar pausas ou variações no ciclo operacional. É uma visão de **formas concretadas**, não de postes inspecionados nem de montadores.

### Filtros e abas

Período, atalhos de data, setor (inclusive S1+S2) e **meta de ciclo** em minutos, inicialmente 15. Permite atualizar, exportar CSV/Excel/PDF e exportar a tabela de dados. Possui abas **Resumo**, **Produção**, **Qualidade**, **Produtividade** e **Dados**.

| Aba | O que mostra | Uso principal |
| --- | --- | --- |
| Resumo | Formas concretadas; volume total e volume acumulado do mês; volumes de concreto padrão e fora do padrão com percentuais; ciclo médio e mediana; eficiência; paradas amarelas/vermelhas; desvio padrão; formas/hora; m³/hora; início e fim da jornada. | Ver o resultado e identificar desvio de ritmo. |
| Produção | Volume diário padrão × fora do padrão; produção e volume por hora produtiva; produção dos últimos sete dias úteis por setor; formas e volume por setor no período; histórico por data. | Descobrir quando e onde a produção se concentrou. |
| Qualidade | Volume de concreto por setor, separado em padrão e fora do padrão. | Localizar concentração de concreto fora do padrão. |
| Produtividade | Ciclo médio diário e distribuição dos tempos de ciclo, com guia dos indicadores. | Observar estabilidade do ritmo e dispersão dos intervalos. |
| Dados | Linhas de concretagem: forma, setor, tipo de concreto, horário e operador; exportação CSV. | Auditar os números dos gráficos. |

**Regras importantes:** o ciclo é o intervalo entre concretagens consecutivas do mesmo dia e setor, ordenadas pelo horário. Intervalos positivos de até 60 minutos entram no cálculo de ciclo; acima disso são tratados como pausa longa. Intervalos acima de 20 até 30 minutos são paradas amarelas; acima de 30, vermelhas. A **eficiência operacional** compara o número de formas com uma produção teórica calculada pelo tempo disponível dividido pela meta de ciclo. É um índice operacional e pode superar 100%; não representa aproveitamento de matéria-prima. Volumes de forma são estimados pela função de volume do produto/modelo. Nos cartões “do dia”, a base exibida segue o **período filtrado**, embora o nome sugira um único dia; o subtítulo “Mês” usa o mês da data final do filtro.

## 4. Dashboard PCP

### Objetivo

Dar ao planejamento uma visão consolidada do cumprimento da programação por setor, grupo de setores e tipo de poste. Seus valores vêm da produção consolidada pelo backend do PCP, portanto “realizado” aqui é **produção**, não inspeção/montagem.

### O que mostra

| Bloco | Conteúdo |
| --- | --- |
| Filtro | Data inicial e final; padrão é o dia atual. |
| Geral | Volume programado (m³), volume realizado (m³) e atingimento = realizado ÷ programado × 100. |
| S1+S2 e S3+S4 | Postes programados, realizados e atingimento em quantidade para cada grupo. |
| Programado vs realizado por setor | Gráfico de barras de volumes em m³. |
| Indicadores por setor | Volume realizado de programado, peso realizado em kg e percentual de cumprimento. |
| Produção em andamento | Até 80 linhas, com data, setor, produto/código, quantidade programada, realizada, faltante (nunca negativa), volume realizado e percentual. |
| Desempenho por produto | Até 60 produtos exibidos, com quantidade programada/realizada, m³ e kg realizados e percentual. Permite ordenar por nome, quantidade realizada ou percentual. |

O percentual **geral e por setor** usa **m³**. O percentual dos cartões de grupo S1+S2/S3+S4 usa **quantidade de postes**. O percentual das linhas de produção em andamento usa quantidade, enquanto o desempenho agregado por produto usa volume. Assim, percentuais de blocos distintos podem divergir mesmo no mesmo período. A API também calcula pessoas e m³ por pessoa com registros de mão de obra, mas esses campos **não são cartões visíveis** no Dashboard PCP atual.

## 5. Programado vs Realizado, no PCP

É uma tela de comparação mais detalhada, alimentada pela **mesma API `/api/dashboard`** do Dashboard PCP e com o mesmo filtro por período. Mostra os volumes geral programado/realizado e eficiência, postes programados/realizados nos grupos S1+S2 e S3+S4, gráfico geral em m³ e tabelas/gráficos por setor e por tipo de poste. Cada linha apresenta quantidade programada/realizada, volume programado/realizado e eficiência. Serve para examinar o desvio por recorte; o Dashboard PCP também inclui andamento e ranking de produtos.

## 6. Monitoramento da temperatura de cura, no Laboratório

Este é um **painel de processo**, distinto dos dashboards de produção. Mostra quatro canais: T1 núcleo, T2 centro, T3 próximo à forma e T4 ambiente. Cada cartão informa a última leitura em °C, pico e possível falha. O gráfico compara concreto e ambiente em janelas de 6, 12, 24 ou 72 horas. O resumo apresenta pico registrado de T1, diferença atual T1 − T4 e número de registros no período. Também mostra coletor, tempo desde a concretagem, intervalo de gravação, conexão e eventos registrados. A aba Histórico permite consultar medições e exportar CSV. A aba Dispositivo reúne configuração e diagnóstico do coletor. **Temperatura não é resistência:** o painel não autoriza automaticamente desforma ou retirada de mandril. O código também oferece uma demonstração com dados fictícios, identificada na tela.

## Como escolher o painel certo

| Se a pergunta for… | Abra… |
| --- | --- |
| Quantos postes estavam previstos e quantos foram produzidos? | Dashboard PCP; use Programado vs Realizado para comparar setor e produto. |
| Quantas formas foram concretadas, com qual volume e ciclo? | Produtividade da concretagem. |
| Quantos postes chegaram à inspeção/montagem? | Dashboard Montagem → Resumo ou Produção. |
| Quantos postes foram inspecionados por montador em cada dia? | Dashboard Montagem → **Produtividade** → tabela “Indicadores diários da montagem”. |
| Qual a fração de postes com defeito na primeira inspeção? | Dashboard Defeitos do **Mapa novo** → Postes não conformes. |
| Quais defeitos se repetem e em quais setores? | Dashboard Defeitos → participação, Pareto e detalhes. |
| Como variou a temperatura de cura? | Laboratório → Monitoramento/Histórico. |

## Cuidados ao comparar números

1. **Produzido, concretado, montado e inspecionado são etapas diferentes.** O mesmo poste pode aparecer em dias diferentes em cada uma delas.
2. **Confira o denominador e a unidade.** “25 postes/montador/dia” é uma razão; “25%” é um percentual. “Defeitos por 100” é uma taxa de ocorrências, não porcentagem de postes.
3. **O painel de Montagem não mede login.** A linha “Montadores” usa nomes distintos registrados nas inspeções concluídas; não usa a auditoria de acesso.
4. **Mapa antigo e novo têm topo de Defeitos diferente.** Compare somente métricas com a mesma população, período, setor, definição de evento e fórmula.
5. **O filtro de período usa a data própria de cada etapa.** Produção usa data de fabricação; inspeção prioriza finalização. O cartão “Produção do dia” do Dashboard Montagem olha a data atual.
6. **Sem denominador, o índice não deve ser interpretado como desempenho.** Dependendo da tela, aparece 0, “N/A” ou travessão.

## Fontes para manutenção deste documento

- `mapa-concretagem/index.html`: estrutura visível dos três dashboards do Mapa antigo.
- `mapa-concretagem/app.js`: filtros, consultas, agregações, fórmulas e gráficos do Mapa.
- `mapa-concretagem/montagem-taxa.js`: tabela diária de postes inspecionados por montador.
- `scripts/patch_mapa_dashboard_defects_kpis_unificado.py`, `unificado/mapa/operacao/dashboard-defeitos-v5.js` e `unificado/mapa/api/dashboard_defects_indicators.py`: topo novo de Defeitos.
- `unificado/pcp/dashboard/index.html`, `unificado/pcp/comparacao/index.html` e `unificado/pcp/backend/app/services/dashboard_service.py`: painéis e cálculos PCP.
- `unificado/laboratorio/service/server/static/index.html`: monitoramento de cura.
- `docs/correcoes-intencionais.md`: registro da mudança de critério do Dashboard Defeitos no unificado.
