# Dashboard Concretagem Matriz — diagnóstico e plano visual

Data: 23/10/2026. Tela: `PROD_ANALISE` no Unificado.

## Implantação de 23/10/2026

A tela de Concretagem Matriz foi publicada em produção com filtros visíveis, leitura contínua das seções, nova hierarquia de cartões, rótulos de volume/ritmo estimados e bloco **Postes/Homem** acima de KG/Homem. A API PCP passou a retornar Poste/Homem com duas casas decimais: postes produzidos no dia e grupo ÷ (MOD + MOI). O MOI do grupo 3+4 continua rateado em 50% para cada setor. Para S1+S2, o indicador permanece consolidado, coerente com o lançamento conjunto do MOI.

O pacote foi montado sobre os arquivos efetivamente publicados para evitar levar mudanças não relacionadas da árvore local. Backups na VPS: `/opt/concrefer-unificado/backups/concretagem-matriz-v7-20261023-233044` (anterior à primeira publicação) e `/opt/concrefer-unificado/backups/concretagem-matriz-v7-20261023-233435` (anterior ao ajuste final da ordem dos KPIs). A casca pública já exibe o novo rótulo. A folha de estilos publicada respondeu HTTP 200; Mapa e PCP permaneceram ativos, sem erros recentes nos logs. Sintaxe JS/Python/HTML e teste `tests/test_dashboard_kg_homem.py` passaram; a função publicada de Poste/Homem também passou em 4 casos no Python da VPS. A tela autenticada ainda precisa de conferência visual com uma sessão de usuário; a rota operacional retorna 403 sem sessão.

## Alcance da leitura

A URL pública do shell responde, mas a rota operacional responde `403` sem sessão. O menu publicado ainda usa **Concretagem**. Este inventário foi conferido na fonte atual (`mapa-concretagem/index.html`, `app.js` e `unificado/mapa/operacao/unificado-bridge.js`) e na imagem enviada pelo usuário. Os números da imagem são exemplos de referência visual, **não dados validados do ambiente de produção**.

O menu do Unificado no repositório já traz **Dashboard Concretagem Matriz** em `menu.config.js`, `sidebar-modelo-a/src/components/sidebar/navConfig.ts`, `shell/modelo-a/menu.js`, `screen_catalog.json` e `unificado-bridge.js`. O menu lateral da página base e seu título dinâmico também foram alinhados e publicados.

## Inventário da página atual

| Área | O que existe | Fonte/regra observada |
|---|---|---|
| Filtros | Início/fim; atalhos Hoje, 7 dias, 30 dias, mês atual e anterior; setor total, setores 1+2 e setores 1–4; meta de ciclo (15 min inicial) | Datas por `data_fabricacao`; filtro setorial aplicado no cliente |
| Alertas | Ciclo acima da meta; eficiência abaixo de 80%; ao menos 3 paradas vermelhas no dia; tempo perdido acima de 60 min | `renderizarAlertasOperacionais` |
| Resumo | Formas; volume total; volume padrão e fora do padrão (período e mês); ciclo médio, mediana, mínimo, máximo e desvio padrão; eficiência; paradas amarelas/vermelhas; formas/h; m³/h; jornada | 11 cartões atuais, com detalhes adicionais no cartão de ciclo |
| Produção | Volume diário padrão × fora do padrão; formas por hora; m³ por hora; produção por setor nos últimos 7 dias úteis; formas por setor; volume por setor; histórico por data | 6 gráficos e 1 histórico |
| Qualidade | Volume padrão × fora do padrão por setor | Lista visual por setor |
| Produtividade | Ciclo médio por dia; distribuição de ciclos; glossário | 2 gráficos e guia |
| Dados | Tabela por forma, setor, tipo, horário e operador; exportação CSV | Linhas do período filtrado |
| Pessoas | KG/homem e postes/homem para setores 1+2, 3 e 4, por dia | Bloco adicionado pelo bridge; vem da API do PCP, com token próprio |
| Exportações | CSV de paradas, CSV de dados, Excel e PDF | Ações existentes na gaveta de filtros |

### Definições que afetam a interpretação

- Formas: a RPC de resumo pode substituir a contagem local. A lista local consulta status `LIBERADO` e `INSPECIONADO`, deduplica registros e filtra setor.
- Volume: estimativa por código/modelo de produto, com valor padrão de 0,20 m³ e regra própria para Setor 4. Não é volume medido por caminhão ou batelada.
- Padrão/fora do padrão: sem `tipo_concreto` conta como padrão; fora do padrão é identificado por termos como `SECO`, `SEGREGAD` e `EXSUDAD`.
- Ciclo: diferença entre registros consecutivos do mesmo setor e dia. A média usa intervalos até 60 min; acima de 20 min conta como parada amarela (até 30) ou vermelha (acima de 30).
- Eficiência: formas ÷ (soma de ciclos válidos ÷ meta) × 100. O cálculo pode ultrapassar 100% e precisa de validação operacional antes de virar sinal de desempenho.
- Formas/h: soma de `60 ÷ ciclo médio` por setor; m³/h multiplica esse resultado pelo volume médio por forma. Ambos são **ritmos estimados**, não produção real dividida pela duração da jornada.
- Tempo perdido: soma do excedente de cada intervalo válido acima da meta. A jornada usa primeiro e último registro de cada dia.

## Problemas a corrigir no redesenho

1. Onze cartões disputam a atenção e misturam total do filtro com subtotal mensal. Falta indicar claramente qual período cada número representa.
2. A análise exige trocar entre cinco abas; alertas, causas e detalhamento ficam separados.
3. “Formas/h” e “m³/h” parecem taxas medidas, embora sejam estimativas por ciclo. O rótulo deve deixar isso explícito ou o cálculo deve ser revisto.
4. Produção por hora agrega horas de vários dias; ao selecionar mais de um dia, o gráfico precisa mostrar média por dia ou separar as séries.
5. Volume usa tabela de estimativas e classificação de concreto por texto; incluir memória de cálculo, cobertura e estado “sem classificação”.
6. Há possível divergência entre a contagem vinda da RPC e o restante dos cartões calculados localmente. Conferir paridade por período/setor.
7. O filtro “Setores 1 e 2” não é aplicado ao cálculo mensal da mesma forma que ao período principal.
8. O alerta de paradas dispara com `>= 3`, mas o texto diz “mais de 3”. Corrigir a regra ou o texto.
9. A imagem de referência omite dados úteis da página real, como eficiência, jornada, distribuição do ciclo, dados auditáveis e produtividade por pessoa. Não descartá-los sem validar o uso operacional.

## Proposta de experiência

**Cabeçalho fixo:** título, data/hora da última atualização e estado da fonte; filtros de período e setor visíveis; meta de ciclo em “Configurar”; exportação em menu único.

**Primeira dobra:** alerta resumido com severidade e ação; seis KPIs principais: formas, volume estimado, conformidade do concreto, ciclo médio × meta, ritmo estimado de formas/h e paradas. Abaixo, uma faixa compacta traz m³/h, eficiência, desvio do ciclo e jornada. Cada KPI informa unidade, período, fórmula curta e comparação somente quando houver base comparável.

**Leitura de causa:** produção e qualidade lado a lado: volume por dia ou hora, composição padrão × fora, ritmo por hora e setores ordenados. Clique em setor aplica o mesmo filtro a todos os painéis.

**Operação:** ciclo com linha de meta e distribuição; linha do tempo de paradas por setor e duração, com tabela acessível. O bloco de KG/homem e postes/homem mostra dia e denominador de pessoas, sempre identificado como fonte PCP.

**Auditoria:** tabela de registros em seção expansível, com busca, paginação e CSV; manter até a equipe confirmar que não é usada. O glossário fica em ajuda contextual e no rodapé técnico.

**Responsividade:** desktop em duas colunas; tablet com filtros em uma linha rolável e painéis empilhados; celular em uma coluna, cartões em pares quando couber, gráficos com rolagem/tabela alternativa. Tema claro inicial; tema escuro como opção após validar contraste.

## Implementação em etapas

| Etapa | Entrega | Critério de aceite |
|---|---|---|
| 0. Paridade | Congelar exemplos reais por período e setor; registrar valores da tela atual, RPC e API PCP | Mesma definição e mesma contagem em todos os cartões; diferenças documentadas |
| 1. Casca | Novo cabeçalho, filtros, menu de exportar, alertas e grade responsiva | Filtros e exportações atuais funcionam; foco/teclado e mobile verificados |
| 2. Visualização | Gráficos de produção, qualidade, ciclo e paradas; tabela acessível | Mesmos dados da etapa 0, sem truncamento e com estados vazio/erro/carregando |
| 3. Semântica | Rótulos de estimativas, memória de cálculo, correções de filtro e alertas | Regras aprovadas por operação/qualidade; comparações só entre períodos equivalentes |
| 4. Publicação | Gerar `unificado/mapa/operacao`, testar e publicar pela rotina existente | Menu publicado com novo nome, tela autenticada validada em desktop/tablet/celular |

## Mockups

O arquivo [`mockup-dashboard-concretagem-matriz.html`](./mockup-dashboard-concretagem-matriz.html) traz a proposta responsiva. Os valores são **ilustrativos**, inspirados na imagem de referência, e não representam uma leitura do servidor.
