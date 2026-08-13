# Cálculos de perda e OEE — Fases 2 e 6

**Status:** planejamento técnico. Nenhum código, view ou job foi criado a partir deste
documento.

Este é o documento normativo dos cálculos. Se a implementação divergir daqui, a
implementação está errada. Escopo executivo em
[plano-fases-2-a-6.md](plano-fases-2-a-6.md#fase-6--painéis-relatórios-e-oee).

---

## 1. Princípio inegociável

**O agregado nunca é a fonte da verdade.** Toda view, materialized view, KPI e relatório
deve ser integralmente reconstruível a partir de `apontamento`, `ocorrencia`,
`movimento_estoque_lote` e `calendario_producao`. Um `DROP` + `CREATE` de todas as views
seguido de refresh completo tem que produzir exatamente os mesmos números.

Consequências operacionais:

1. Existe um endpoint `GET /indicators/reconciliation` que compara o agregado com o
   cálculo direto sobre o bruto no mesmo período e devolve as divergências.
2. Nenhum job de agregação apaga, corrige ou "normaliza" dado bruto.
3. Se o refresh falhar, o painel mostra a data/hora do último refresh bem-sucedido — nunca
   um número silenciosamente velho.

---

## 2. Fórmulas de perda (Fase 2)

### 2.1 Grandezas de entrada

| Símbolo | Origem | Unidade |
|---|---|---|
| `peso` | `apontamento.peso_peca_kg_aplicado` (congelado da configuração item/molde na abertura) | kg/peça |
| `boas` | `apontamento.pecas_boas` | peças |
| `refugo` | `apontamento.pecas_refugo` | peças |
| `borra` | `apontamento.borra_kg` | kg |
| `galho` | `apontamento.galho_kg` | kg |
| `falha` | `apontamento.falha_preenchimento_kg` | kg |
| `outras` | `apontamento.outras_perdas_kg` | kg |

`configuracao_item_molde.peso_peca_g` está em **gramas**; a conversão para kg
(`/1000`) acontece uma única vez, na abertura do apontamento, ao gravar
`peso_peca_kg_aplicado`. Nenhum cálculo posterior converte unidade.

### 2.2 Fórmulas

```
injecao_util_kg      = boas   × peso
massa_refugo_kg      = refugo × peso
perda_total_kg       = massa_refugo_kg + borra + galho + falha + outras
injecao_mais_perdas  = injecao_util_kg + perda_total_kg
perda_sem_galho_kg   = perda_total_kg − galho
base_sem_galho_kg    = injecao_util_kg + perda_sem_galho_kg

perda_sem_galho_pct  = 100 × perda_sem_galho_kg / NULLIF(base_sem_galho_kg, 0)
perda_total_pct      = 100 × perda_total_kg     / NULLIF(injecao_mais_perdas, 0)
```

`injecao_util_kg`, `perda_total_kg` e `perda_sem_galho_kg` são **colunas geradas** em
`apontamento` (`GENERATED ALWAYS ... STORED`) — o banco calcula, não a aplicação.
Os percentuais não são colunas geradas por causa do denominador possivelmente zero; são
calculados em view/serviço com `NULLIF`.

### 2.3 Por que o galho sai também do denominador

O galho é material reaproveitável: ele não é perda de processo, e a métrica que a
operação usa ("perda sem galho") mede quanto se perdeu **descontando** o galho tanto do
numerador quanto da base. Usar `injecao_mais_perdas` no denominador daria 10,34 % no
exemplo de conferência, e não os 10,56 % que a referência exige.

### 2.4 Exemplo de conferência obrigatório

Do mockup aprovado (`docs/referencia-ui/index.html`): peso 0,1522 kg, 618 boas,
19 refugo, borra 7,085, galho 2,315, falha 1,135, outras 0.

| Grandeza | Cálculo | Valor exato | Exibido |
|---|---|---|---|
| `injecao_util_kg` | 618 × 0,1522 | 94,0596 | **94,06 kg** |
| `massa_refugo_kg` | 19 × 0,1522 | 2,8918 | — |
| `perda_total_kg` | 2,8918 + 7,085 + 2,315 + 1,135 | 13,4268 | **13,43 kg** |
| `injecao_mais_perdas` | 94,0596 + 13,4268 | 107,4864 | **107,49 kg** |
| `perda_sem_galho_kg` | 13,4268 − 2,315 | 11,1118 | 11,11 kg |
| `base_sem_galho_kg` | 94,0596 + 11,1118 | 105,1714 | — |
| `perda_sem_galho_pct` | 100 × 11,1118 / 105,1714 | 10,5654… | **10,56 %** (2 casas) / **10,6 %** (1 casa, tablet) |

Se a implementação não reproduzir esta tabela, a fórmula está errada.

### 2.5 Arredondamento

- **Armazenamento:** nunca arredondar. `numeric` guarda o valor cheio; as colunas de
  massa usam `numeric(12,3)` nas entradas e o resultado gerado mantém a precisão do
  produto.
- **Apresentação:** 2 casas para kg e percentual no desktop; 1 casa para o percentual do
  medidor do tablet; separador decimal vírgula, milhar ponto (pt-BR).
- Nunca arredondar antes de somar, nem somar percentuais.

### 2.6 Casos de borda

| Caso | Resultado esperado |
|---|---|
| Tudo zero | todas as massas 0; percentuais `null` (não `0`, não `NaN`) |
| Só galho preenchido | `perda_sem_galho_kg = 0`; `perda_sem_galho_pct = 0` se houver peças boas, `null` se não houver |
| Sem peças boas e com perdas | `perda_sem_galho_pct = 100` (toda a base é perda) |
| Operação que não consome resina | todas as grandezas de massa `null`; a tela não exibe a faixa de resultado |
| `peso` nulo | abertura foi rejeitada; esse apontamento não existe |

### 2.7 Agregação de perda por item/período

**Perda agregada é ponderada por massa, nunca média simples de percentuais:**

```sql
perda_item_pct = 100 * sum(perda_sem_galho_kg) / NULLIF(sum(injecao_util_kg + perda_sem_galho_kg), 0)
```

Somar os percentuais dos apontamentos e dividir pela contagem produz número errado
(um apontamento de 5 peças pesaria igual a um de 20.000).

`acima_do_limite` compara `perda_item_pct` com
`apontamento.limite_perda_percentual_aplicado` — o limite **congelado**, ponderado da
mesma forma quando o período mistura configurações diferentes (usar `max` do limite no
período e sinalizar a mistura é aceitável; usar o limite vigente hoje **não é**).

---

## 3. OEE — definições

```
OEE = Disponibilidade × Performance × Qualidade
```

Todos os três fatores são frações em `[0,1]`, exibidos como percentual. O OEE só existe
para um recorte `(máquina, data, turno)` bem definido; agregações maiores somam os
tempos e as peças, **nunca** fazem média dos OEEs.

### 3.1 Disponibilidade

```
tempo_calendario        = duração total do recorte (data × turno × máquina)
tempo_planejado         = calendario_producao.minutos_planejados do recorte
                          (0 quando o recorte é FERIADO / NAO_PRODUTIVO)
paradas_planejadas      = Σ duração das ocorrências com planejada = true
paradas_nao_planejadas  = Σ duração das ocorrências com planejada = false
tempo_disponivel        = tempo_planejado − paradas_planejadas
tempo_operacional       = tempo_disponivel − paradas_nao_planejadas

Disponibilidade = tempo_operacional / NULLIF(tempo_disponivel, 0)
```

Decisões explícitas:

1. **Parada planejada reduz o tempo disponível**, não a disponibilidade. Setup e
   manutenção programada não punem o indicador — é o que torna o OEE comparável entre
   máquinas com planos de setup diferentes.
2. **Parada não planejada reduz a disponibilidade.**
3. A classificação usada é `ocorrencia.planejada` **congelada na abertura** (Fase 3,
   regra 5.6). Reclassificar o cadastro do tipo não altera o passado.
4. Ocorrência sem `apontamento_id` (parada com a máquina ociosa, ex.: setup antes de
   abrir) conta na disponibilidade da máquina, não na do apontamento.
5. Se `tempo_planejado = 0`, Disponibilidade é `null` e o OEE do recorte é `null` — nunca
   0 (não houve produção planejada; um zero mentiria no gráfico).

**Recorte de ocorrência que atravessa a fronteira do turno/dia:** a duração é **rateada
proporcionalmente** pelo tempo de interseção com cada recorte
(`upper(range * recorte) − lower(range * recorte)`), usando operadores de `tstzrange`.
A soma dos rateios é sempre igual à duração total — verificável por teste.

### 3.2 Performance

```
ciclo_padrao_s   = apontamento.ciclo_padrao_segundos_aplicado   (congelado)
cavidades        = apontamento.cavidades_aplicadas               (congelado)
pecas_produzidas = pecas_boas + pecas_refugo
ciclos_teoricos  = pecas_produzidas / NULLIF(cavidades, 0)
tempo_teorico_s  = ciclos_teoricos × ciclo_padrao_s

Performance = tempo_teorico_s / NULLIF(tempo_operacional_s, 0)
```

Decisões explícitas:

1. Usa `ciclo_padrao_segundos_aplicado`, **nunca** o ciclo vigente hoje.
2. Peças produzidas inclui refugo: o tempo de máquina foi gasto para produzi-lo.
3. `tempo_operacional_s` é o do mesmo recorte da Disponibilidade (já descontadas as
   paradas), não a duração bruta do apontamento.
4. Quando não há configuração item/molde (operação sem molde), o fallback é
   `maquina.ciclo_teorico_segundos`; sem ele, Performance é `null` e o OEE do recorte é
   `null`.
5. **Performance > 1 é sinal de inconsistência, não é truncada.** O valor é retornado com
   `performance_inconsistente = true` e a UI o exibe marcado. Truncar em 100 % esconderia
   ciclo padrão mal cadastrado, contagem de peças errada ou tempo de parada não apontado —
   exatamente os problemas que o indicador existe para revelar.
6. Motivos típicos de inconsistência, que o endpoint deve poder discriminar:
   ciclo padrão superestimado; parada não registrada (tempo operacional inflado);
   quantidade digitada errada; cavidades erradas.

### 3.3 Qualidade

```
Qualidade = pecas_boas / NULLIF(pecas_boas + pecas_refugo, 0)
```

Decisões explícitas:

1. Qualidade é contagem de **peças**. Borra, galho e falha de preenchimento são perda de
   **massa** e entram nos indicadores de perda (seção 2), **não** na Qualidade — misturar
   kg com peças produz um número sem significado.
2. Falha de preenchimento merece leitura própria: ela é massa injetada que não virou peça
   nenhuma. Fica exposta como indicador separado
   (`falha_preenchimento_kg / injecao_mais_perdas`), nunca embutida na Qualidade.
3. Sem peças (`boas + refugo = 0`), Qualidade é `null`.

### 3.4 OEE

```
OEE = Disponibilidade × Performance × Qualidade
```

Se **qualquer** fator for `null`, o OEE é `null`. Não existe "assumir 100 %" para fator
ausente. Toda resposta de OEE devolve os três fatores junto com o produto, para que o
consumidor possa ver qual deles derrubou o indicador.

---

## 4. Views propostas

### 4.1 `vw_apontamento_calculado` (view simples)

Uma linha por apontamento não cancelado, com: chaves (`empresa_id`, `unidade_id`,
`maquina_id`, `item_id`, `molde_id`, `turno_id`, `colaborador_id`, `ordem_producao_id`),
`inicio`, `fim`, `duracao_s`, as massas geradas, os percentuais com `NULLIF`, os valores
congelados (`ciclo_padrao_segundos_aplicado`, `cavidades_aplicadas`,
`limite_perda_percentual_aplicado`) e `acima_do_limite boolean`.

É a única definição dos percentuais em SQL — nenhuma outra view recalcula a fórmula.

### 4.2 `vw_parada_por_apontamento` (view simples)

Por `apontamento_id`: `paradas_planejadas_s`, `paradas_nao_planejadas_s`,
`qtd_ocorrencias`, `qtd_sem_acao_corretiva`. Ocorrências sem apontamento aparecem em
`vw_parada_por_maquina_periodo`, com rateio por recorte (seção 3.1).

### 4.3 `vw_oee_maquina_turno` (view simples)

Por `(maquina_id, data, turno_id)`: tempos da seção 3.1, peças, os três fatores e o OEE,
mais `performance_inconsistente`. É a definição normativa — a materialized view é apenas
um cache dela.

### 4.4 `mvw_oee_maquina_dia` (materialized)

`SELECT * FROM vw_oee_maquina_turno` agregado por dia, com
`UNIQUE INDEX (empresa_id, maquina_id, data, turno_id)` — o índice único é o que permite
`REFRESH MATERIALIZED VIEW CONCURRENTLY` (sem ele o refresh bloqueia leitura).

### 4.5 `mvw_perda_item_mes` (materialized)

Por `(empresa_id, item_id, ano, mes)`: `injecao_util_kg`, `perda_total_kg`,
`perda_sem_galho_kg`, `perda_sem_galho_pct` (ponderada, seção 2.7), `limite_aplicado`,
`acima_do_limite`, `qtd_apontamentos`. Índice único em
`(empresa_id, item_id, ano, mes)`. Sustenta `05-desktop-perdas.html`.

### 4.6 Índices de suporte (na tabela base, não na view)

```
apontamento (maquina_id, inicio)        WHERE status <> 'CANCELADO'
apontamento (item_id, inicio)           WHERE status <> 'CANCELADO'
apontamento (turno_id, inicio)          WHERE status <> 'CANCELADO'
apontamento (empresa_id, inicio)
ocorrencia  (maquina_id, inicio)        WHERE status <> 'CANCELADA'
ocorrencia  (apontamento_id)
ocorrencia  (status)                    WHERE status = 'AGUARDANDO_ACAO_CORRETIVA'
calendario_producao (empresa_id, data, turno_id, maquina_id)  UNIQUE
```

O último índice parcial de `ocorrencia` serve diretamente ao alerta "sem ação corretiva"
do painel do dia.

---

## 5. Estratégia de refresh incremental

1. Tabela de controle `indicador_refresh` — `view_nome`, `data_referencia`,
   `atualizado_em`, `duracao_ms`, `status`, `erro`.
2. O job identifica as **datas afetadas** desde o último refresh:
   `SELECT DISTINCT date(inicio) FROM apontamento WHERE atualizado_em > :ultimo`
   união do mesmo para `ocorrencia` e `movimento_estoque_lote`. Apontamento sincronizado
   com atraso (Fase 4) tem `inicio` antigo e `atualizado_em` recente — é por isso que o
   gatilho é `atualizado_em`, não `inicio`.
3. Para as datas afetadas, recalcula. Como `REFRESH MATERIALIZED VIEW` do PostgreSQL não
   é parcial, a estratégia é uma das duas, decidida na implementação e documentada:
   (a) materialized view **particionada por mês** com refresh só dos meses afetados; ou
   (b) tabela de agregado real (`tabela_oee_dia`) preenchida por `INSERT ... ON CONFLICT
   DO UPDATE` só das chaves afetadas — mais controle, mais código.
   Recomendação: começar por (b) para `oee_maquina_dia` e `perda_item_mes`, mantendo as
   views simples como definição normativa e como base do `INSERT`.
4. Frequência: a cada 5 minutos para o dia corrente; diário completo de madrugada para os
   últimos 90 dias (defesa contra qualquer divergência acumulada).
5. Falha do job: registra em `indicador_refresh`, alerta no painel administrativo, e a UI
   passa a exibir "última atualização: HH:MM" em destaque.
6. `POST /indicators/refresh` permite refresh manual completo de um período
   (permissão `indicadores.refresh.executar`).

---

## 6. Endpoints agregados

| Método | Rota | Resposta |
|---|---|---|
| GET | `/dashboard/day?data=&turnoId=` | KPIs do dia (peças boas, injetado kg, perda sem galho %, parada não programada), contagem de apontamentos abertos/encerrados |
| GET | `/dashboard/machines` | estado ao vivo por máquina: `ok` \| `atencao` \| `parada` \| `ocioso`, item em produção, operador, tempo no estado |
| GET | `/dashboard/alerts` | lista ordenada por severidade: parada sem ação corretiva, perda acima do limite, lote com saldo baixo, setup acima da média, apontamento aberto há muito tempo |
| GET | `/indicators/oee?de=&ate=&maquinaId=&turnoId=&granularidade=dia\|turno\|maquina` | `{ disponibilidade, performance, qualidade, oee, performanceInconsistente, temposS, pecas, atualizadoEm }` |
| GET | `/reports/loss-by-item?de=&ate=&maquinaId=&acimaDoLimite=` | linhas por item com colunas por mês, média ponderada, massa perdida, tendência |
| GET | `/reports/loss-by-value?...` | idem em R$ (custo do lote × massa perdida) — permissão separada |
| GET | `/reports/cycle-actual-vs-standard` | ciclo real derivado × ciclo padrão aplicado, por item/molde/máquina |
| GET | `/reports/machine-occupancy` | tempo produzindo / parado / ocioso por máquina |
| GET | `/reports/*/export?formato=csv\|planilha` | exportação |
| GET | `/indicators/reconciliation?de=&ate=` | divergências agregado × bruto |

Toda resposta agregada inclui `periodo`, `filtros` e `atualizadoEm`. Nenhuma expõe UUID
sem o par código/descrição.

**Ciclo real derivado** (usado no relatório ciclo real × padrão):
`ciclo_real_s = tempo_operacional_s × cavidades / NULLIF(pecas_boas + pecas_refugo, 0)`.
É uma derivação, não uma medição — deve ser rotulado como tal na tela, porque o sistema
não lê sinal da máquina.

---

## 7. Casos de teste canônicos

Cada linha é um teste unitário do `oee.service`.

| # | Cenário | Esperado |
|---|---|---|
| 1 | 480 min planejados, 30 min de setup (planejada), 60 min de quebra (não planejada) | disponível 450, operacional 390, Disponibilidade 0,8667 |
| 2 | 0 min planejados (feriado) | Disponibilidade `null`, OEE `null` |
| 3 | Sem paradas | Disponibilidade 1,0 |
| 4 | Parada não planejada = tempo disponível inteiro | Disponibilidade 0 |
| 5 | 1 cavidade, ciclo 45 s, 500 peças, operacional 390 min | teórico 22.500 s, Performance 0,9615 |
| 6 | 4 cavidades, ciclo 20 s, 1.000 peças, operacional 90 min | teórico 5.000 s, Performance 0,9259 |
| 7 | Ciclo padrão superestimado gerando teórico > operacional | Performance > 1 e `performanceInconsistente = true`, **sem truncar** |
| 8 | Cavidades = 0 (dado ruim) | Performance `null`, sem divisão por zero |
| 9 | 618 boas, 19 refugo | Qualidade 0,9702 |
| 10 | 0 boas, 0 refugo | Qualidade `null` |
| 11 | Todos os fatores presentes (0,8667 × 0,9615 × 0,9702) | OEE 0,8086 |
| 12 | Qualquer fator `null` | OEE `null` |
| 13 | Parada atravessando a virada de turno 14:00 | duração rateada entre os dois turnos, soma igual à duração total |
| 14 | Apontamento atravessando meia-noite | atribuído ao(s) recorte(s) por interseção, sem duplicar peças |
| 15 | Exemplo de conferência da seção 2.4 | os 5 valores exatos |
| 16 | Perda agregada de dois apontamentos (5 peças a 20 % e 20.000 peças a 2 %) | ponderada ≈ 2,0 %, não a média simples 11 % |
| 17 | Item com duas configurações no período (limites 7 % e 8 %) | comparação usa o limite congelado por apontamento; a linha agregada sinaliza mistura de limites |
| 18 | Reconciliação: agregado vs. soma direta sobre 200 apontamentos sintéticos | divergência zero |

---

## 8. O que **não** está definido e precisa de confirmação

Registrado também em [backlog-validacao-fase-6.md](backlog-validacao-fase-6.md):

1. Turnos reais (quantidade, horários, se atravessam meia-noite).
2. O que conta como "tempo planejado" quando a máquina está ociosa sem parada apontada:
   ociosidade entra como indisponibilidade ou reduz o planejado?
3. Se parada de setup é sempre planejada, ou só quando estava programada.
4. Como tratar parada sem apontamento aberto no OEE do apontamento.
5. Meta de OEE por máquina/item (o painel prevê "meta do dia").
6. Se o consumo de resina baixado é teórico (peso × peças) ou real (balança) — muda a
   reconciliação de estoque, não o OEE.
7. Regra determinística de "tendência" (melhorando/estável/piorando) do relatório de
   perda: qual variação percentual e sobre quantos meses.
8. Custo por kg a usar no relatório de perda em R$: custo do lote consumido, custo médio
   do período, ou custo padrão do item.
