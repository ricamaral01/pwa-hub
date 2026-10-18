# Fórmulas e unidades — Dosagem v2

Este registro separa a fórmula portada do legado das regras novas da especificação de 17/10/2026. As referências `dosagem-concreto/` apontam para o código antigo, que permanece intacto. Os módulos `metodoCientifica.ts`, `metodoTeorArgamassa.ts` e `argamassaLegada.ts` são cópias das funções puras legadas, com o invólucro de módulo trocado por `export`.

## Núcleo comum

| Nome | Fórmula | Entradas e unidade | Saída e unidade | Origem |
|---|---|---|---|---|
| Volume absoluto | `Vᵢ = mᵢ / ρᵢ` | massa kg; massa específica kg/dm³ | L | `index.html:6700-6703`; especificação §6.1 |
| Volume do ar | `V_ar = arPct × 10` | ar % | L por m³ | `index.html:6823-6827`; especificação §6.1 |
| Volume total | `V = ΣVᵢ + V_ar` | volumes L | L | `index.html:6823-6827` |
| Desvio | `V − 1000` | V L | L | `index.html:6854`; especificação §6.1 |
| Aditivo em % | `m_adit = dosagemPct / 100 × C` ou `× Agl` conforme base | % e kg/m³ | kg/m³ | especificação §6.1; no legado há massa direta e percentual sobre ligantes em `index.html:9589-9595` |
| Normalização | `f = 1000 / V`; massas normalizadas `mᵢ × f` | V L, massa kg | massa kg/m³ | especificação §6.1; o legado também normaliza consumo em `index.html:6856` |
| Relação água/cimento | `Água / C` | água e cimento kg/m³ | razão | `index.html:6835`; especificação §6.2 |
| Relação água/aglomerante | `Água / (C + Ad)` | kg/m³ | razão | `index.html:6836`; especificação §6.2 |
| Teor de argamassa seca, massa | `(Agl + Areia) / (Agl + Areia + Brita) × 100` | kg/m³ | % | `index.html:6838-6840`; especificação §6.2–6.3 |
| Teor de argamassa real, massa | `(Agl + Areia + Água + Aditivos) / (Agl + Areia + Água + Aditivos + Brita) × 100` | kg/m³ | % | `index.html:6841-6843` |
| Teor de argamassa seca, volume | `(V_Agl + V_Areia) / (V_Agl + V_Areia + V_Brita) × 100` | L | % | `index.html:6845-6847` |
| Teor de argamassa real, volume | inclui água e aditivos no numerador do teor volumétrico | L | % | `index.html:6849-6851` |
| Consumo de cimento | `C × 1000 / V` no legado; `C` após normalização no v2 | kg e L | kg/m³ | `index.html:6856`; especificação §6.2 |
| Consumo de aglomerante | `C + Ad` | kg/m³ | kg/m³ | especificação §6.2 |
| Traço unitário | `1 : Areia/base : Brita/base : Água/base` | massas kg; base cimento ou aglomerante | razão | `index.html:6829-6833`; especificação §6.2–6.3 |
| Massa específica teórica | `Σ massas / (V / 1000)` | kg e L | kg/m³ | `index.html:6942`; especificação §6.2 |
| Custo do traço | `Σ massaᵢ × custoᵢ` | kg/m³ e R$/kg | R$/m³ | `index.html:9809-9810`; especificação §6.2 |
| Resistência de dosagem | `fcj = fck + 1,65 × Sd` | MPa | MPa | inversão da projeção em `index.html:7014-7017`; especificação §6.2 |

**Diferença legada:** o comparador e o banco de traços chamavam de `ac` o valor `Água / (C + Ad)` (`index.html:9806`, `index.html:9943`). O v2 usa campos distintos para as duas relações. O legado também agrupava os dois aditivos sob a massa específica do primeiro em `index.html:6891,9604`; o v2 calcula cada item com sua densidade própria.

**Decisão registrada:** a especificação manda multiplicar todas as massas por `1000/V`, mas não manda escalar o volume de ar. Por isso, após normalizar as massas, um desvio residual pode existir quando o ar é maior que zero. O v2 mostra o fator aplicado e o volume resultante. A interpretação física dessa regra deve ser validada por engenharia.

## Umidade, betonada e traço de obra

| Nome | Fórmula | Unidade | Origem |
|---|---|---|---|
| Água livre do agregado | `Δᵢ = massaSecaᵢ × umidadeLivrePctᵢ / 100` | kg/m³ | `index.html:3757-3772`; especificação §6.8 |
| Massa de obra do agregado | `massaSecaᵢ + Δᵢ` | kg/m³ | idem |
| Água de obra | `Água − ΣΔᵢ` | kg/m³ | idem |
| Quantidade por betonada | `massaObraᵢ × volumeBetonadaM3` | kg | especificação §6.8 e §12 |

O cálculo v2 mantém umidade por item; duas areias podem ter umidades diferentes. O legado limita a água de obra a zero em `index.html:3768-3770`; a especificação não prevê esse corte. Antes de liberar um traço cuja correção resulte em água de obra negativa, é preciso tratá-lo como erro de validação.

## Métodos de dosagem

### Científica

O módulo portado de `dosagem-cientifica.js:1-261` calcula:

- Curva alvo de Fuller: `100 × (d / Dmax)^n`, limitada a 100%, para peneiras abaixo do Dmax (`:36-43`).
- Curva combinada: média ponderada das curvas passantes dos agregados (`:46-59`).
- Erro da curva: raiz da média dos desvios quadráticos, com pesos opcionais (`:62-67`).
- Busca de proporções em passos configuráveis, respeitando mínimo e máximo por agregado (`:69-111`).
- Volumes absolutos e massa para fechar 1 m³ com cimento, água, adição, aditivo e ar (`:114-150`).
- Normalização por volume no método de massas informadas (`:151-187`).

### Por teor de argamassa

O módulo portado de `dosagem-por-argamassa.js:1-279` mantém:

- `C = Água / (a/c)`; aditivo percentual sobre cimento (`:107-138`).
- Distribuição de areias e britas, ambas somando 100% (`:37-48`).
- Solução para o teor solicitado em massa seca ou volume seco, fechando volume absoluto de 1 m³ (`:107-210`).
- Traço unitário relativo ao cimento (`:242-273`).

**Estado de integração:** os módulos estão portados e testados com exemplos do legado, mas a interface do editor ainda não converte suas entradas para a lista única de `ItemTraco`. A opção aparece como parcial e não deve ser tratada como dosagem científica concluída.

### Cálculo inverso

`V_sólidos = Σmᵢ/ρᵢ`; `V_total = V_sólidos/(1−arPct/100)`; `V_ar = V_total−V_sólidos`; `volume_m³ = V_total/1000`; `fator_1m³ = 1000/V_total`. Origem: `index.html:7558-7596`. A ferramenta v2 aceita o núcleo da fórmula; a entrada multicomponente e aplicação ao traço ainda precisam ser concluídas.

## Ensaios

| Nome | Fórmula | Unidade | Origem |
|---|---|---|---|
| Chapman, miúdo | `ρ = massaSeca / (leituraFinal−leituraInicial)` | g/cm³ = kg/dm³ | `index.html:5392-5400` |
| Graúdo, seca | `ρ_seca = A/(B−C)` | g/cm³ | `index.html:5417-5422` |
| Graúdo, SSS | `ρ_SSS = B/(B−C)` | g/cm³ | idem |
| Graúdo, real | `ρ_real = A/(A−C)` | g/cm³ | idem |
| Absorção | `(B−A)/A × 100` | % | idem |
| Retida por peneira | `massaRetida / massaInicial × 100` | % | `index.html:5548-5584`; especificação §6.5 |
| Retida acumulada | soma das retidas até a peneira | % | idem |
| Passante | `100 − retidaAcumulada` | % | idem |
| Módulo de finura | soma da retida acumulada na série normal / 100 | adimensional | `index.html:5589-5598`; especificação §6.5 |
| Dmáx | abertura imediatamente acima da primeira peneira com retida acumulada > 5% | mm | especificação §6.5; o código legado em `index.html:5600-5608` usa outra varredura |
| Perda | `massaInicial − ΣmassaRetida` | g | especificação §6.5; legado em `index.html:5630-5632` usa módulo da diferença |

**Diferenças a conferir:** a especificação define alerta de perda acima de 0,3%; o código legado calcula perda e exibe a verificação com outro critério. A classificação granulométrica por faixas de MF também diverge em `index.html:5635-5643`. As zonas completas por peneira não estavam no texto anexado; o v2 calcula MF, Dmáx e faixa de MF, mas ainda não classifica cada peneira contra limites normativos completos.

## Abrams, empacotamento e custos MCC

| Nome | Fórmula | Unidade | Origem |
|---|---|---|---|
| Abrams | `fc_estimada = A / B^(a/c)` | MPa | `index.html:8224-8250`; especificação §6.7 |
| Ajuste Abrams | regressão linear de `ln(fc) = ln(A) − (a/c) ln(B)` | A em MPa, B adimensional | alternativa prevista na especificação §6.7; pares históricos do legado devem ser conferidos |
| Curva Alfred | `100 × (d^q−dmin^q)/(dmax^q−dmin^q)` | % passante | `index.html:7380-7391` |
| Curva combinada | `Σ proporcaoᵢ × passanteᵢ / 100` | % passante | `index.html:7370-7378` |
| RMSE empacotamento | `√[Σ(combinada−Alfred)² / n]` | pontos percentuais | `index.html:7393-7398` |
| MCC líquido | preço por kg − ICMS dedutível − IPI dedutível + frete por kg − ICMS de frete dedutível; mínimo zero | R$/kg | `index.html:10144-10162` |

Os valores de referência de Abrams e as classificações normativas do legado são exemplos, não validação automática da edição vigente de uma norma. O arquivo `src/core/config/nbr12655.ts` exige conferência de engenharia antes de uso em produção.
