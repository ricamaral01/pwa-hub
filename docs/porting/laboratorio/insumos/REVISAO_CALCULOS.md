# Revisão dos cálculos — Carta Traço e Estoque

Levantamento de 25/10/2026, feito sobre `carta-traco/docs/CARTA_TRACO_ANALISE.md` e
`docs/porting/usinas/estoque/CONTROLE-DE-ESTOQUE.md`. Cada item diz **o que o legado faz**, **o problema**
e **o que o pacote novo faz**. Os itens marcados com **DECIDIR** mudam números e precisam do seu aval;
até lá o pacote mantém o comportamento do legado onde isso for possível.

Todos os cálculos abaixo têm teste automatizado em `pacote/tests/` (26 testes, PostgreSQL 16 real).

---

## A. Custo de material (comum às duas aplicações)

| # | Legado | Problema | Pacote novo |
|---|---|---|---|
| A1 | Carta Traço: `líquido = valor × (1 − ICMS) + frete`. Estoque: `(valor_nota × (1 − ICMS) + frete × qtd × (1 − ICMS do frete)) / qtd` | Duas fórmulas para a mesma coisa. Na Carta o frete entra cheio; no Estoque o crédito de ICMS do frete é descontado. O mesmo cimento tem custo diferente nas duas telas. | Uma função só, `insumos.custo_liquido_unit`: `valor_unit × (1 − ICMS) + frete_unit × (1 − ICMS do frete)`. A tabela de preços ganhou `icms_frete_pct` (padrão 0, que dá o número antigo). Paridade com o ERP conferida centavo a centavo na carga. |
| A2 | Carta Traço calcula o líquido no navegador e o servidor grava o que receber | Número financeiro sem validação | Coluna gerada pelo banco, nos dois módulos |
| A3 | Custo em **litro** → R$/kg multiplicando pela M.E. | R$/L × kg/L não dá R$/kg. Aditivo comprado por litro sai com custo errado (ex.: R$ 11,50/L com M.E. 1,08 vira 12,42 em vez de 10,65/kg). | Divide pela M.E. **DECIDIR** (confirmar no código do front antes; o relatório da carga lista as cartas afetadas) |
| A4 | Agregado comprado em **m³** convertido pela massa **específica** (2,63) | O m³ de compra é solto; o certo é a massa **unitária** (~1,45 t/m³ para areia). Usando a específica, o R$/kg da areia sai cerca de 45 % menor. | Campo `massa_unitaria` no material; quando preenchido, é usado. Vazio = regra do legado. **DECIDIR** os valores por material (o laboratório já mede massa unitária). |
| A5 | — | PIS/COFINS não entram no custo líquido em nenhum dos dois | Mantido. **Pergunta para o fiscal:** se a empresa toma crédito de PIS/COFINS na compra de insumos, o custo líquido real é menor e a fórmula precisa de mais um campo. |

## B. Carta Traço

| # | Legado | Problema | Pacote novo |
|---|---|---|---|
| B1 | MCC calculado em 3 lugares; o Resumo do servidor não converte unidade e ignora o fornecedor | Resumo ≠ tela (achado C4) | Uma função `carta_traco._mcc` alimenta editor, consulta, impressão e resumo |
| B2 | Só existe a tabela de preços digitada | O MCC não acompanha o que a empresa realmente pagou | `insumos.config fonte_custo_mcc`: `tabela` (padrão, igual ao legado), `ultima_entrada` (NF do estoque), `media_ponderada` (90 dias) ou `entrada_senao_tabela`. Pode ser escolhida por consulta para comparar. |
| B3 | a/c usa só cimento | Traço com adição (filler, sílica) fica com a/c distorcido | Mantém a/c e acrescenta **a/aglomerante** e **aditivo sobre aglomerante** |
| B4 | Teor de argamassa = areia ÷ (areia + brita) | Esse número é a proporção de areia no agregado, não o teor de argamassa | Entrega os dois: `teor_argamassa_pct` = (cimento + adição + areia) ÷ secos e `areia_agregados_pct` (fórmula do legado). **DECIDIR** qual aparece em destaque. |
| B5 | Sem conferência de volume | Carta que não fecha 1 m³ passa despercebida | Fechamento = 1000 − Σ(kg ÷ M.E.) com tolerância configurável (±10 L de partida). **Sugestão:** incluir o teor de ar previsto da carta no fechamento (1000 − Σ − ar); hoje o ar incorporado aparece como "sobra". |
| B6 | Salvar Rev. 1 depois da Rev. 3 inativa a Rev. 3 | Revisão errada fica ativa | Banco só inativa revisões menores e recusa ativar revisão menor |
| B7 | — | Não dá para saber se a usina está consumindo o que a carta manda | **Novo:** consumo teórico × real. Teórico = volume produzido de cada traço × kg/m³ da revisão **vigente na data**; real = baixa do estoque. Exige preencher `codigo_traco` na carta (o código que a automação grava na massada). |

## C. Estoque

| # | Legado (ERP) | Problema | Pacote novo |
|---|---|---|---|
| C1 | Saldo inicial guardado no material | Com mais de uma unidade, o saldo inicial seria contado em todas | `estoque.saldo_inicial` por unidade e material |
| C2 | Nível do silo atribuído ao material **atualmente** mapeado | O silo 1 foi Filler até 29/06/2026 e CP V-ARI depois: consultas e reprocessamentos de antes da troca atribuem o histórico ao material errado | `estoque.silo_material` com vigência (desde/até, sem sobreposição) e `material_silo_permitido` (ADD-FILL: 1; CP V: 1–2; CP II: 1–3) |
| C3 | Mapeamento posição do misturador → material sem histórico | Mudar uma posição e reprocessar um período antigo reescreve as baixas do passado com o material novo | `posicao_misturador` com vigência; alterar = fechar a atual na véspera e abrir outra |
| C4 | Contagem física gravada como texto `[Contagem fisica: X]` na observação de um acerto | Contrato frágil (vírgula, espaço, acento quebram) | Tipo de movimento `contagem` com a quantidade contada. A carga converte os acertos antigos com esse texto. |
| C5 | Contagem "redefine a base; movimentos posteriores somam" | Ambíguo para o mesmo dia: a baixa do dia é gerada à 00:01 do dia seguinte, com a data do dia. Se "posterior" for por ordem de lançamento, a baixa do dia contado é descontada duas vezes. | Contagem vale como **saldo de fim do dia contado**: tudo com data até ela fica absorvido. **DECIDIR** (confirmar como a equipe mede: fim do expediente ou antes da produção). |
| C6 | Reprocessar consumo apaga e regrava (IDs mudam) | Quem referencia a baixa perde o vínculo; auditoria confusa | Chave natural `massadas:<unidade>:<data>:<coluna>`: reprocessar atualiza a mesma linha, cria só o que falta e remove só o que deixou de existir. Testado: rodar duas vezes = zero alterações. |
| C7 | Excluir entrada apaga a linha | Sem rastro em sistema ISO 9001 | Anulação com quem, quando e motivo; o saldo ignora, o histórico mostra. Baixa automática não se anula à mão (corrige-se o mapeamento e reprocessa). |
| C8 | Rateio: editar é proibido; tem que excluir e lançar de novo | Duas operações, janela com saldo errado | `PUT /entradas/grupo/{id}` troca o rateio numa transação (anula o grupo antigo e lança o novo). O valor da NF é dividido pela quantidade, centavos na última parcela: a soma bate com a nota e o custo unitário é igual em todos os silos. |
| C9 | Leitura de NF por IA com estado em memória | Reinício perde a leitura; mesma NF pode ser lançada duas vezes | **Mantém a IA** (mesmo provedor e prompt, portados). Estado em `estoque.nf_leitura`, retomada na subida do serviço, arquivo guardado com SHA-256, tipo validado pelo conteúdo (não pela extensão), limite de tamanho e de tempo. NF duplicada bloqueada por chave de acesso ou CNPJ+número+série. **Novo:** XML da NF-e é lido direto, sem IA (mais rápido e exato). A IA continua só preenchendo para conferência humana. |
| C10 | Previsão de cimento: média de 30 dias, segurança fixa de 2 dias, carga de 40 t se couber | Média sobre dias corridos subestima o consumo por dia útil; 2 dias fixos não protegem quando o consumo oscila | Média por **dia útil**; estoque de segurança = maior entre 2 dias de consumo e `z × σ × √prazo` (nível de serviço 95 %); ponto de pedido = consumo × prazo + segurança. Mantida a regra de só sugerir carga se couber na chegada. Parâmetros em `insumos.config`. |
| C11 | — | Valor do estoque não é calculado | Custo médio ponderado e última entrada por material (`estoque.custos_entrada_em`), disponíveis para relatório e para o MCC |
| C12 | Movimento com data futura não entra no saldo | — | Mantido (testado) |

## D. O que continua igual de propósito

- Fator 0,001 (kg da massada → t do estoque) nas posições de agregado, silo e adição.
- Produção anterior a 22/04/2026 não gera baixa.
- Capacidades 60 / 90 / 108 t, alívio de 20 % nos silos 1 e 2, prazo de 3 dias e carga de 40 t.
- Déficit de um silo não reduz o disponível de outro; nível físico nunca negativo.
- Regras do rateio: pelo menos dois silos, silos distintos, soma igual ao total.
- A IA nunca grava entrada sozinha.
