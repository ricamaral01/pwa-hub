# Backlog e validação com o processo industrial — Etapa 1 e Fases 2 a 6

**Status:** lista de pendências. Não é uma auditoria nova da Fase 1 — é a consolidação
do que já está registrado como "a confirmar" em
[fase-1-cadastros.md, seção 25](fase-1-cadastros.md#25-itens-que-precisam-ser-confirmados-com-o-processo-industrial),
[handoff.md](handoff.md) e [regras-negocio.md](regras-negocio.md), **mais** os itens de
backlog de cada fase (subseção 12 de [plano-fases-2-a-6.md](plano-fases-2-a-6.md)).

Duas listas distintas, e a distinção importa:

- **Parte A — Bloqueios de validação.** Perguntas para quem opera a fábrica. Enquanto não
  respondidas, a parte correspondente do sistema não pode ser fechada (mas quase sempre
  pode ser começada com o valor provisório).
- **Parte B — Backlog funcional.** Coisas que já se sabe que ficarão de fora e que
  ninguém precisa confirmar — são escopo adiado conscientemente.

---

# Parte A — Precisa ser confirmado pelo processo industrial

Legenda de bloqueio:
**[BLOQUEIA]** = não implementar a parte marcada antes da resposta.
**[COMEÇAR COM PROVISÓRIO]** = implementar com o valor proposto, trocar depois custa
pouco (`ALTER TABLE` ou seed).

## A.1 Herdados da Fase 1 (ainda em aberto)

| # | Item | Situação atual no código | Pergunta | Impacto |
|---|---|---|---|---|
| A1.1 | Taxonomia de `tipo_ocorrencia.categoria` | **A coluna nem existe.** `tipo_ocorrencia` tem só `codigo`, `descricao`, `ativo` | Quais são as categorias reais de parada? O mockup usa: Molde, Desumidificador, Energia, Qualidade, Ajuste de processo, Manutenção, Falta de material, Setup, Outros. Confere? | **[BLOQUEIA a Fase 3]** — a tela de parada é toda construída em cima dessa grade 3×3 |
| A1.2 | `tipo_ocorrencia.planejada` e `exige_acao_corretiva` | Não existem | Toda parada de setup é planejada, ou só quando estava programada? Quais tipos exigem ação corretiva obrigatória? | **[BLOQUEIA a Fase 3 e o OEE da Fase 6]** — é o que separa Disponibilidade de tempo planejado |
| A1.3 | Taxonomia de `resina.tipo` | Não existe; `resina` tem `codigo`, `descricao`, `fabricante` | Existe lista fechada de família de resina (PP, PC, PEAD, PA)? A tela de abertura mostra "PC cinza granulado", "PC cinza moído", "Blenda PC 70/30" | **[COMEÇAR COM PROVISÓRIO]** — `varchar` livre; vira `CHECK IN` quando a lista existir |
| A1.4 | `item.unidade_medida` | Não existe; `item` tem só `codigo`, `descricao` | Existe item medido em kg ou caixa, ou tudo é peça? | **[COMEÇAR COM PROVISÓRIO]** — `UN` |
| A1.5 | Status de `ordem_producao` | Implementado como `ABERTA`, `CANCELADA`, `ENCERRADA` | Falta `EM_PRODUCAO`? Uma O.P. pode voltar de produção para aberta? Existe "programada" separado de "aberta"? | **[BLOQUEIA o vínculo O.P. ↔ apontamento da Fase 2]** — o apontamento precisa saber se pode abrir contra uma O.P. em determinado status |
| A1.6 | Formato de `codigo_mega` | **Não existe nenhuma coluna `codigo_mega`** no `ordem_producao` implementado | O número de O.P. do mockup (53190) é o do Mega ou interno? Precisa dos dois? | **[BLOQUEIA a integração]**; não bloqueia a Fase 2, que usa `ordem_producao.numero` |
| A1.7 | Inativação dedicada de `lote_resina` | `lote_resina` tem `ativo` **e** `status` (`DISPONIVEL`/`BLOQUEADO`/`ESGOTADO`/`INATIVO`), semanticamente redundantes | `INATIVO` como status e `ativo = false` são a mesma coisa? Falta `QUARENTENA`? | **[BLOQUEIA a Fase 5]** — o consumo precisa saber exatamente quais estados permitem baixa |
| A1.8 | Perfis operacionais além de `ADMIN` | Só existe o perfil `ADMIN`, com todas as permissões | Quais papéis reais existem: operador, líder de turno, supervisor, almoxarife, qualidade, PCP? Quem pode cancelar apontamento? Quem resolve conflito? Quem vê custo em R$? | **[BLOQUEIA o seed das Fases 2–6]** — as chaves podem ser criadas, mas a distribuição por perfil não |
| A1.9 | Login de operador por matrícula/PIN | **`colaborador` não tem `pin_hash`** — nem a coluna preparada do plano da Fase 1 chegou a ser criada | PIN de 4 ou 6 dígitos? Quem cadastra e reseta? Bloqueia após quantas tentativas? Operador pode operar em qualquer máquina ou só na do seu setor? | **[BLOQUEIA a Fase 2]** — é a primeira tela do fluxo |
| A1.10 | `maquina.tipo` / `capacidade` | `maquina` tem `modelo`, `numero_serie`, `setor`, `capacidade integer` (unidade não documentada) | `capacidade` está em toneladas? O mockup diz "Sandretto 220 t" | **[COMEÇAR COM PROVISÓRIO]**; renomear para `capacidade_toneladas` na Fase 2 |

## A.2 Etapa 1 — Design System

| # | Item | Pergunta | Impacto |
|---|---|---|---|
| A2.1 | Modelo e resolução real do tablet | O mockup assume Galaxy Tab A9+ 1280×800. É esse o equipamento comprado? Quantos? | **[BLOQUEIA]** o breakpoint de posto — todo o layout sem scroll depende dessa altura |
| A2.2 | Uso com luva | Os operadores usam luva? Que tipo (a tela capacitiva responde)? | Define se 56 px é suficiente ou se precisa subir |
| A2.3 | Iluminação do galpão | Há incidência de sol direto nas telas? | Define se a paleta clara é adequada ou se é preciso um modo alto contraste |
| A2.4 | Nomenclatura das telas de gestão | "Painel do dia", "Ocupação de máquina", "Efetivo" são os nomes que a operação usa? | Baixo — troca de texto |

## A.3 Fase 2 — Apontamento

| # | Item | Pergunta | Impacto |
|---|---|---|---|
| A3.1 | Turnos reais | Quantos turnos, com que horários? Algum atravessa a meia-noite? Todas as máquinas seguem os mesmos turnos? | **[BLOQUEIA]** o cadastro de `turno` e todo o OEE da Fase 6 |
| A3.2 | Apontamento sem O.P. | O mockup prevê "Sem O.P. — produção avulsa". Isso é permitido de fato, ou é exceção que exige autorização? | **[BLOQUEIA]** a obrigatoriedade de `ordem_producao_id` |
| A3.3 | Operações que não consomem resina | Montagem de caixas, solda, montagem de postes aparecem como "só quantidade". Precisa de campo `operacao.consome_resina`? | **[BLOQUEIA]** a validação condicional de lote na abertura |
| A3.4 | "Outras perdas" | O campo existe hoje no frontend, mas não no mockup aprovado. Fica ou sai? | Baixo, mas muda a fórmula de perda total |
| A3.5 | Duração máxima de um apontamento | Um apontamento cobre o turno inteiro, ou é por O.P./lote? Quando um apontamento aberto vira anomalia (4 h? 12 h? 24 h?) | Define o alerta de "apontamento esquecido" — importante porque um apontamento aberto **trava a máquina** por causa do `EXCLUDE` |
| A3.6 | Troca de item sem encerrar | O botão "Trocar item" encerra e abre um novo apontamento, ou altera o apontamento corrente? | Muda a máquina de estados |
| A3.7 | Múltiplos operadores | Dois operadores podem estar na mesma máquina no mesmo apontamento? Como é o efetivo do relatório "Efetivo"? | **[BLOQUEIA]** o relatório de efetivo da Fase 6 |
| A3.8 | Correção de apontamento encerrado | Quem pode corrigir? Precisa de aprovação? Vira apontamento de ajuste ou edição com trilha? | Define o backlog B.2.1 |
| A3.9 | Relógio do tablet | Os tablets têm hora sincronizada por NTP? | Alto — `inicio` errado contamina todo o OEE |
| A3.10 | Peso da peça de referência | O peso vem sempre da configuração item/molde, ou o operador pesa e informa em algum caso? | Define se `peso_peca_kg_aplicado` pode ser sobrescrito |

## A.4 Fase 3 — Ocorrências

| # | Item | Pergunta | Impacto |
|---|---|---|---|
| A4.1 | Parada sem apontamento aberto | Setup antes de iniciar produção é apontado como parada da máquina sem apontamento? Como entra no OEE? | **[BLOQUEIA]** a atribuição de tempo do OEE |
| A4.2 | Quem registra a ação corretiva | O próprio operador, ou o líder/manutenção? Precisa de segunda pessoa? | Define permissões e talvez um estado de aprovação |
| A4.3 | Parada que afeta várias máquinas | Queda de energia derruba 13 injetoras: registra 13 ocorrências ou uma? | **[BLOQUEIA]** o modelo se a resposta for "uma" |
| A4.4 | Tempo máximo sem ação corretiva | O painel diz "1 sem ação corretiva". A partir de quanto tempo isso vira alerta vermelho? | Baixo — parâmetro |
| A4.5 | Fechamento de turno | Existe uma ação explícita de "fechar turno"? O mockup diz que o turno não pode ser encerrado com parada pendente — mas nenhuma tela de fechamento de turno foi desenhada | **[BLOQUEIA]** essa regra; hoje ela não tem onde ser aplicada |
| A4.6 | Micro-paradas | Parada de 2 minutos é apontada? Existe um piso? | Alto para o OEE (micro-paradas são o maior sumidouro de disponibilidade) |

## A.5 Fase 4 — Offline

| # | Item | Pergunta | Impacto |
|---|---|---|---|
| A5.1 | Cobertura de rede no galpão | Quanto tempo, na prática, um tablet fica offline? Minutos ou dias? | Define retenção de `idempotencia_requisicao` e tamanho do pacote de bootstrap |
| A5.2 | Quem é o "supervisor" que resolve conflito | Papel existe? Está sempre presente no turno? | **[BLOQUEIA]** a tela de conflitos — sem alguém para resolver, o conflito represa |
| A5.3 | Tablet compartilhado entre turnos | O mesmo tablet fica na máquina 24 h com operadores diferentes, ou cada um leva o seu? | Define o ciclo de vida da sessão local |
| A5.4 | Política de atualização do app | Pode atualizar durante o turno, ou só na troca? | Define se a atualização forçada por `426` é aceitável |

## A.6 Fase 5 — Estoque e blendas

| # | Item | Pergunta | Impacto |
|---|---|---|---|
| A6.1 | Consumo teórico × real | O sistema baixa `peso × peças` (teórico) e corrige por inventário, ou o operador informa o consumo real pesado? | **[BLOQUEIA]** todo o modelo de baixa |
| A6.2 | Galho reaproveitado | O galho volta para o estoque como lote de moído? Hoje ele sai do saldo e desaparece | **[BLOQUEIA]** o fechamento do balanço de massa |
| A6.3 | Blenda: onde é feita | No posto, pelo operador (o mockup prevê a operação "Mistura de resinas"), ou no almoxarifado por outra pessoa? | Define se a tela de blenda é de tablet ou de desktop |
| A6.4 | Tolerância de arredondamento na blenda | Quanto de diferença entre a soma dos componentes e o total é aceitável? | Baixo — parâmetro, mas precisa de um número |
| A6.5 | Custo de lote de blenda | Média ponderada dos componentes é a regra do financeiro? | **[BLOQUEIA]** o relatório de perda em R$ |
| A6.6 | Frequência de inventário | Contagem física é mensal? Quem faz? Divergência gera ajuste automático ou aprovação? | Define o fluxo de `inventario` |
| A6.7 | Lote em quarentena | Existe processo de quarentena de resina (recebimento pendente de análise)? | Define se `QUARENTENA` entra no enum de status |

## A.7 Fase 6 — Indicadores e OEE

| # | Item | Pergunta | Impacto |
|---|---|---|---|
| A7.1 | Definição de "tempo planejado" | Máquina ociosa sem parada apontada: reduz o planejado ou conta como indisponibilidade? | **[BLOQUEIA]** o OEE — é a decisão que mais muda o número |
| A7.2 | Calendário de produção | Existe calendário formal (feriados, paradas programadas, fins de semana)? Quem mantém? | **[BLOQUEIA]** a Disponibilidade |
| A7.3 | Metas | Existe meta de peças/dia e de OEE por máquina? O painel prevê "meta do dia 26.000" | **[BLOQUEIA]** os KPIs com meta |
| A7.4 | Regra de "tendência" | Melhorando/estável/piorando: qual variação e sobre quantos meses? | Baixo — mas precisa ser determinístico, não "olhômetro" |
| A7.5 | Custo por kg no relatório em R$ | Custo do lote consumido, custo médio do período, ou custo padrão do item? | **[BLOQUEIA]** `perda-valor` |
| A7.6 | OEE por operador | O indicador pode ser individualizado por pessoa? (questão trabalhista, não técnica) | **[BLOQUEIA]** o relatório de efetivo se a resposta for não |
| A7.7 | Histórico da planilha | Os relatórios comparativos por mês (Jan–Jul no mockup) precisam do histórico importado. A planilha de ~160 abas será migrada? Quando? | Alto — sem isso os relatórios nascem vazios e frustram a expectativa criada pelo mockup |
| A7.8 | Layout de exportação "no layout da planilha" | Existe um arquivo modelo? Quais colunas, em que ordem? | **[BLOQUEIA]** o botão "Exportar no layout da planilha" |
| A7.9 | Orçamento de tempo de resposta do painel | Quanto é aceitável: 1 s, 3 s? | Define o critério de aceite de performance |

---

# Parte B — Backlog funcional consolidado

Consolidação das subseções 12 ("itens que podem ir para backlog") de cada fase do
[plano mestre](plano-fases-2-a-6.md). Não precisa de confirmação: é escopo adiado.

## B.1 Etapa 1 — Design System
- Tema escuro opcional no desktop.
- Animações e transições além de foco/estado.
- Componentes de gráfico (só necessários na Fase 6).
- Modo alto contraste e ajuste de tamanho de fonte pelo usuário.
- Internacionalização (o sistema é pt-BR por decisão).

## B.2 Fase 2 — Apontamento
- B.2.1 Apontamento de ajuste/estorno (`origem = 'AJUSTE'`) e reabertura.
- Troca de item sem encerrar o apontamento.
- Múltiplos operadores no mesmo apontamento.
- Assinatura/conferência do líder no encerramento.
- Ciclo real capturado por sinal da máquina (hoje é derivado).
- Importação histórica da planilha.

## B.3 Fase 3 — Ocorrências
- Ocorrência sem máquina (processo/qualidade geral).
- Anexo de foto.
- Escalonamento automático (notificar líder após N minutos).
- Aprovação da ação corretiva pelo líder.
- Ocorrência multi-máquina (queda de energia) — ver A4.3.
- Vínculo com ordem de manutenção.

## B.4 Fase 4 — Offline
- Sincronização em lote (multi-registro por requisição).
- Compressão de payload.
- Sincronização peer-to-peer entre tablets.
- Resolução de conflito pelo próprio operador.
- Fila priorizada por criticidade.
- Telemetria de qualidade de rede.

## B.5 Fase 5 — Estoque e blendas
- Reserva de lote para O.P.
- FIFO/FEFO automático na seleção de lote.
- Custo médio móvel do estoque global.
- Devolução de sobra ao lote de origem.
- Rastreabilidade reversa (de qual lote saiu a peça X).
- Blenda pelo tablet no posto — ver A6.3.
- Entrada automática por nota fiscal / integração de compras.
- Moagem de galho como lote de resina moída — ver A6.2.

## B.6 Fase 6 — Indicadores
- Pareto e drill-down interativo.
- Alertas ativos (e-mail/push) além do painel.
- Comparativo entre turnos e equipes.
- Previsão estatística de tendência.
- OEE por operador — ver A7.6.
- Exportação em PDF.
- Histórico importado da planilha — ver A7.7.
- Custo real por item com rateio de mão de obra e energia.

## B.7 Transversal (fora de todas as fases 2–6)
- Integração real com o ERP Mega (leitura de O.P. e envio de produção).
- Migração da planilha Excel de ~160 abas.
- Gestão de perfis e permissões por tela (hoje só por seed).
- Multi-empresa/multi-unidade na interface (o modelo suporta; a UI assume uma).
- Notificações e e-mail transacional.
- Backup e retenção formalizados.
- Observabilidade além de log estruturado (métricas, tracing).
- Fase 7 em diante — **fora do escopo desta rodada de planejamento**.

---

## Como usar esta lista

1. Antes de iniciar cada fase, o executor lê a seção correspondente da Parte A e confirma
   que nenhum item **[BLOQUEIA]** dela está em aberto.
2. Item **[COMEÇAR COM PROVISÓRIO]** é implementado com o valor proposto e registrado no
   `CHANGELOG` como provisório.
3. Cada resposta obtida é registrada **aqui**, com data e quem respondeu, e o item sai da
   Parte A. Este arquivo é a memória das decisões de processo — não deve virar uma lista
   morta.
4. Itens da Parte B não voltam sem decisão explícita de escopo do usuário.
