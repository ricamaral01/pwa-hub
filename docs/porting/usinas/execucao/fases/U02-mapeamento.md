# U02 — Materiais, posições e regras por unidade

**Resultado:** o [mapeamento coluna a coluna](../../04-banco-de-dados.md#mapeamento-coluna-a-coluna-para-a-camada-fiel) preserva as posições brutas e o `unidade_id`; Pederneiras/Noroeste não são achatadas para a interpretação de Campinas. Uma consulta `BEGIN READ ONLY` em `tbl_config_traco_campo` e `tbl_est_config_massada` nas duas bases confirmou:

| Unidade | Config. traço: total/ativos/sem material/referência quebrada/coluna duplicada | Config. massada: total/ativos/sem material/referência quebrada/fator não positivo/coluna duplicada |
|---|---|---|
| Campinas | 11/11/2/0/0 | 15/15/5/0/0/0 |
| Pederneiras | 11/11/3/0/0 | 15/15/6/0/0/0 |

Consulta reproduzível: `unificado/usinas/scripts/probe_mapping_readonly.sql`. Os totais não revelam nomes de materiais ou valores individuais.

**Limite:** posição sem `material_id` pode representar reserva intencional ou lacuna; a consulta não decide. As regras físicas de Noroeste dependem da operação, mesmo quando compartilham uma base ou interface com Pederneiras.

## Pendências para aprovação

- Validar com responsável de cada usina o significado e a vigência de cada posição e dos fatores de conversão, incluindo as posições sem material.
- Fornecer ou aprovar casos de referência anonimizados de uma massada e de um traço por unidade para teste de paridade antes de publicar cálculos.
