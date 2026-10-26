# F5 — Indicadores de Suprimentos

**Ambiente:** homologação `https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos%2Fanalises%2F`, Campinas. Versão final `1.0.88`, Alembic `sup_0012`, flag `S5` ativa. Produção e VPS antiga permanecem intactas.

## Indicadores e origem

| Indicador | Regra | Fonte |
|---|---|---|
| Lead time solicitação → entrega, média/P90 | Coorte de solicitações criadas no período e com `entregue_em`; dias corridos entre criação e entrega. | `sup_solicitacao` |
| Lead time OC → recebimento, média/P90 | Primeiro recebimento F1, F3 ou S4 depois de `enviado_em`; OCs criadas no período. | `sup_pedido`, `sup_pedido_entrega`, `sup_recebimento`, `sup_integracao_recebimento` |
| SLA por nível | Decisões aprovadas dentro do parâmetro da unidade, desde a decisão anterior ou criação. É uma aproximação para devoluções e reenvios, pois não há snapshot de SLA por decisão antiga. | `sup_aprovacao`, `sup_solicitacao`, `sup_parametro` |
| Consumo por setor/CC, curva ABC | Entregas sem estorno no período, ligadas ao CC da solicitação; ABC acumulado por valor, faixas 80/95%. | `sup_movimento`, `sup_solicitacao_item`, `sup_solicitacao`, `sup_material`, `sup_centro_custo` |
| Valor, giro e cobertura | Custo médio e saldo atuais; giro = valor consumido / valor atual; cobertura = saldo atual / consumo diário médio do período. O estoque é da unidade, por isso esses totais ficam ocultos quando há filtro/limite por CC. | `sup_custo_medio`, `sup_material` |
| IQF por fornecedor | Avaliações não estornadas do período, agrupadas por fornecedor e mês. | `sup_fornecedor_avaliacao`, `sup_fornecedor_unidade` |
| Economia de cotação | Primeira proposta − proposta escolhida, com o menor custo também mostrado. | `sup_cotacao_preco`, `sup_cotacao_item` |
| Pedidos atrasados e itens zerados | OCs abertas com entrega prevista anterior a hoje; materiais ativos sem saldo. | `sup_pedido`, `sup_material_unidade`, `sup_saldo` |

Filtros: início/fim (até 367 dias), centro de custo autorizado, categoria e fornecedor. A API valida papel `COMPRADOR` ou `ADMIN`, unidade, CC e flag `S5` em leitura e exportações. Os totais do estoque são ocultos em consulta por CC, pois não há atribuição física do saldo a um CC. O retorno informa a regra/fonte de cada número; a tela exibe esses textos junto dos gráficos e tabelas. Exportação em CSV UTF-8 com BOM e PDF A4 com todas as linhas, páginas e fontes. Rotas: `/api/suprimentos/analises/indicadores`, `/exportar.csv`, `/exportar.pdf`.

## Interface e desempenho

- Tela responsiva `analises/` com KPIs, barras de consumo/SLA/IQF, cartões de cotação/giro e tabelas de pedidos/itens. CSS inteiramente escopado a `body[data-modulo="suprimentos"]`; rolagem horizontal só dentro da tabela.
- Migração `0012_analises.py` cria índices por unidade, período, CC, movimento, aprovação, proposta e estorno. Listas de consumo/IQF/pedidos/itens têm limites de 500/200/100/100 linhas para a tela e exportação; os KPIs são agregados no banco.
- Massa sintética em PostgreSQL descartável com **50.000 movimentos**: resposta completa em **0,310 s** no ensaio registrado por `test_fifty_thousand_movements_under_two_seconds`. O limite de aceite é 2 s. Consultas de exemplo e índices serão revisados também na F7 com `EXPLAIN`.
- Suíte E1–F5: **37 passed**; teste de migração `upgrade head → downgrade base → upgrade head` passou. Teste de valores concluiu fluxo com solicitação, OC, entrega, duas propostas, IQF e saldo, comparando os números.
- Playwright autenticado pela casca, comprador, menu aberto/recolhido, zoom 100/125, sete tamanhos PC/tablet/celular: **28/28** sem rolagem horizontal do documento/iframe, elemento estourado, 404 de recurso ou erro de console do módulo. [Diagnóstico](capturas/f5/diagnostico.json) e PNGs na mesma pasta. O primeiro ensaio apontou URL errada da lista de fornecedores; corrigida para `/compras/fornecedores`. Em 390/360 com zoom 125%, cartões de valores foram empilhados.
- Exportação PDF baixada pela sessão autenticada, texto conferido e página renderizada: [amostra](capturas/f5/indicadores-homolog.pdf), [PNG](capturas/f5/indicadores-pagina-1.png), [conferência](capturas/f5/pdf-conferencia.json). Fonte Unicode embutida para acentos, setas e números legíveis.

## Publicação e retorno

Backups com dump e snapshot de permissões em `backups/suprimentos-f5-20261026T040000Z`, complementos `f5-ui-20261026T042000Z`, `f5-security-20261026T043000Z` e `f5-pdf-20261026T044000Z`. Cada publicação passou em `nginx -t`, smoke **43/43** e serviço ativo. A concessão da tela `suprimentosIndicadores` foi aplicada aos masters, `ricardo.teste` e comprador de teste, preservando o snapshot anterior.

O retorno da infraestrutura foi testado: `sup_0012 → sup_0011`, arquivos, catálogo e concessões IAM restaurados. A reinstalação seguiu 1.0.85 → 1.0.86 → 1.0.87 → **1.0.88**, com smoke **43/43** em cada passo, usando backups `f5-reinstall-20261026T044500Z` até `f5-pdf-reinstall-20261026T044800Z`.

## Limites

A medição do SLA histórico usa a data da criação como início aproximado do primeiro nível quando não há snapshot do envio. Giro e cobertura usam o estoque atual, não média histórica. O relatório mostra essas regras ao usuário. O limite de 500 materiais na curva ABC cobre a tela atual; se Campinas superar 500 materiais consumidos no período, ampliar a paginação ou calcular a curva no servidor antes de liberar dados reais.
