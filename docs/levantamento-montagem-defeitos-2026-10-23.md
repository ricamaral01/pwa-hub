# Levantamento e propostas — Dashboard Montagem e Dashboard Defeitos

Data: 23/10/2026. Base: `mapa-concretagem/index.html`, `app.js`, `unificado/mapa/operacao/dashboard-defeitos-v5.js`, `unificado/mapa/api/dashboard_defects_indicators.py` e [guia de indicadores](./guia-completo-dashboards-2026-10-07.md). A rota operacional exige sessão; este é um inventário da implementação, sem afirmar valores atuais de produção. Os números dos mockups são ilustrativos.

## Dashboard Montagem (`MONTAGEM_INDICADORES`)

### Dados, filtros e indicadores

Fonte: `montagem_poste` e `producao`, paginadas e cacheadas. A produção usa `data_fabricacao`; a montagem filtra pela data de referência do evento (finalização, início ou fabricação). Há filtros de período, setor (incluindo S1+S2), status A/R/RR e busca por forma, modelo ou montador; atalhos de data, filtros rápidos, atualização e XLSX.

| Área | Indicador ou conteúdo | Regra atual |
|---|---|---|
| Resumo | “Programado” | Contagem de registros de **produção** no intervalo/setor; o rótulo não descreve a origem com precisão |
| Resumo | “Realizado” | Montagens/inspeções concluídas elegíveis após status e busca |
| Resumo | Atingimento | Realizado ÷ produzido × 100; pode passar de 100% por diferença de datas e fluxo entre etapas |
| Resumo | Produção do dia | Produzidos **hoje**, mesmo quando o usuário filtra outro período |
| Resumo | Aprovados | Montagens com status `A` na base filtrada |
| Comparativo | Produzidos × montados, geral e S1–S4 | Contagens e barra de atingimento |
| Produção | Postes montados por dia | Produzidos, aprovados e recusados em barras |
| Qualidade | Montagens por setor e ranking por montador | Contagem de registros; ranking não mede presença |
| Produtividade | Postes inspecionados, montadores identificados e postes/montador/dia | Montadores = nomes distintos dos registros do dia; razão sem denominador vira “—” |
| Produtividade | Tempo médio por tipo de poste e operador | Diferença entre início e finalização, quando ambos existem |
| Auditoria | Montagens realizadas | Tabela ordenável/paginada com data, setor, forma, modelo, início, fim, duração, status e montador; cartões em celular |

### Diagnóstico e proposta

1. Trocar “Programado” por **Produzidos no período**, mantendo o campo e a regra. “Produção do dia” deve ficar em cartão contextual, separado dos KPIs do filtro, ou respeitar o período escolhido.
2. Mostrar o funil **produzidos → montados → aprovados** no topo, com denominadores e dias de referência. Quando a taxa ultrapassar 100%, explicar o trânsito de peças de dias anteriores em vez de cortar a barra sem contexto.
3. Reunir as quatro abas numa página de leitura contínua: funil, evolução diária, comparação por setor, produtividade da equipe e tabela. Dar à tabela busca e filtros persistentes.
4. Chamar **postes por montador identificado/dia** pelo nome correto. Não confundir com Poste/Homem da Concretagem, cujo denominador vem de MOD+MOI do PCP.
5. Preservar tempo por operador/modelo e exibir quantidade de medições válidas junto à média. Adicionar estado de cache, hora de atualização e cobertura de nomes de montador.

Mockup responsivo: [Dashboard Montagem](./mockup-dashboard-montagem.html).

## Dashboard Defeitos (`DASHBOARD_DEFEITOS`)

### Dados, filtros e indicadores

A parte analítica lê `montagem_poste` e `producao` paginadas, filtra período/setor/status/busca e calcula itens “NÃO” de checklist. O topo novo do Unificado consulta também `/unificado/mapa/api/dashboard/defeitos/indicadores`, que consolida a **primeira inspeção por poste**, e traz ocorrências informadas sem vínculo como grupo separado. Exporta CSV/XLSX e oferece apresentação 4:3 com impressão/PDF.

| Área | Indicador ou conteúdo | Regra atual |
|---|---|---|
| Topo novo | Inspecionados e cobertura | Postes distintos com primeira inspeção; cobertura = inspecionados ÷ produzidos |
| Topo novo | Postes não conformes | Primeiras inspeções com ao menos um “NÃO” ÷ inspecionados |
| Topo novo | FPY | Primeiras inspeções sem “NÃO” ÷ inspecionados |
| Topo novo | Defeitos encontrados | Total de “NÃO”; defeitos por 100 postes = ocorrências ÷ inspecionados × 100 |
| Topo novo | Retrabalhados e perdas | Postes em cada desfecho ÷ inspecionados |
| Complementares | Defeitos por poste afetado; taxa por oportunidade | “NÃO” ÷ postes não conformes; “NÃO” ÷ oportunidades (26 itens em S1/S2, 17 em S3/S4) |
| Comparativos | Indicadores por setor e tendência mensal | Produzidos, inspecionados, cobertura, NC, FPY, defeitos/100, retrabalho e perda para Total, S1–S4 e S1+S2; evolução mensal |
| Sem vínculo | Total, tipos, modelos e dias | Informados sem poste identificado; não entram nas taxas por poste/FPY |
| Parte analítica | Taxa de defeitos, índice de reprovação, postes reprovados, retrabalho, fissuras, tipos vitais | Métricas herdadas com outras populações/denominadores |
| Diagnóstico | Taxa por setor, participação geral/S1/S2, Pareto, matriz tipo × setor, ações sugeridas e lista por tipo | Detalhamento de itens “NÃO” e investigação |

### Diagnóstico e proposta

1. A tela mostra **duas famílias de métricas** com nomes próximos: poste não conforme na primeira inspeção e item de checklist não conforme. Separar visualmente “impacto em postes” e “ocorrências de defeito”, com fórmulas sempre acessíveis.
2. Colocar **postes não conformes, FPY, defeitos por 100 e cobertura** na primeira dobra. Retrabalho e perda na segunda linha. Mostrar numerador/denominador em cada cartão.
3. Consolidar a repetição de cartões antigos e novos sem perder as séries históricas. Manter a taxa por oportunidade como complementar, rotulada de forma distinta da taxa de postes não conformes.
4. Transformar Pareto e matriz em um painel de investigação: selecionar tipo ou setor filtra o detalhe e preserva o contexto. “Ações prioritárias” devem ser sugestões para análise humana, ligadas ao tipo e à evidência.
5. Tratar **sem vínculo** como fila própria para saneamento, claramente fora dos índices por poste. Mostrar estados de API indisponível e cache sem apresentar número herdado como se fosse o indicador novo.
6. Validar com qualidade a regra de primeiras inspeções, reinspeções, 26/17 oportunidades e desfechos antes de alterar cálculos ou unir séries históricas.

Mockup responsivo: [Dashboard Defeitos](./mockup-dashboard-defeitos.html).

## Implantação dos dois dashboards — 23/10/2026

- Montagem: a página agora inicia no mês atual, exibe KPI de **postes por montador logado**, total de presenças diárias e postes inspecionados, além de três séries diárias no gráfico. A tabela diária continua acessível. O denominador é a soma dos montadores distintos que fizeram login em cada dia (presenças-dia); não é a contagem de pessoas únicas do mês. Dias anteriores ao início do registro de logins ficam sem taxa.
- O gráfico mostra os dias do mês correspondente ao fim do período selecionado e respeita o recorte de datas e setor. Status e busca afetam a contagem de inspeções, enquanto a contagem de logins é filtrada por data e setor; a legenda da tela informa essa diferença.
- Montagem e Defeitos receberam a hierarquia visual aprovada, com filtros, cartões e painéis responsivos. As fórmulas existentes de Defeitos foram preservadas.
- Produção: pacote `montagem-defeitos-v8b`, backup anterior à revisão `/opt/concrefer-unificado/backups/montagem-defeitos-v8-20261023-235217`. Foram publicados apenas `index.html`, `app.js`, `montagem-taxa.js`, `montagem-taxa.css`, `dashboards-v6.css` e `sw.js` do Mapa operacional.
- Validação: sintaxe JavaScript, parsing HTML, hashes locais/remotos idênticos, CSS e JS públicos com HTTP 200, serviço de autenticação ativo. A rota operacional retorna 403 sem sessão e a API de logins retorna 401 sem sessão; a inspeção visual autenticada e os valores reais dependem de acesso de usuário.

## Sequência recomendada para ambos

1. Congelar exemplos reais por período, setor e status; registrar contagens e denominadores nas fontes e na tela.
2. Aprovar rótulos e regras com operação/qualidade; corrigir ambiguidades sem alterar o dado silenciosamente.
3. Implementar a casca visual preservando IDs, filtros, exportações e tabela de auditoria.
4. Conferir desktop, tablet, celular, teclado, estados vazios/erro/cache e os mesmos resultados do passo 1; publicar após esse gate.
