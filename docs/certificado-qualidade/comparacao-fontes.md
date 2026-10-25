# Comparação da fonte antiga com a nova

Período: **26/07 a 24/10/2026** (90 dias). As duas consultas usaram GET paginado, sem gravação. O resultado detalhado e as dez datas do gate estão em `evidencias/comparacao-fontes-20261024.json`.

| Critério | Antiga | Nova |
| --- | ---: | ---: |
| Leituras de CP | 222 | 222 |
| Datas da antiga ausentes na nova | — | **0** |
| Datas da nova ausentes na antiga | **0** | — |
| Datas com diferença em nº de CPs, médias 3/7/28d, traço ou situação | **0** | **0** |

O gate independente fez SQL direto em `controle_est_concre_campinas.rompimentos_atuais`, agregou por data/traço/idade e escolheu o traço pela maior média de 28 dias. Nas dez datas de 2026 com resultado de 28 dias, nº de CPs, médias 3/7/28d, traço e situação bateram **10/10** com o módulo. A primeira tentativa encontrou quatro diferenças de **0,01 MPa** por arredondamento binário do Python; o cálculo foi corrigido para decimal com duas casas, como no PostgreSQL, e a comparação foi refeita até 10/10. Não houve alteração de dados na fonte.

O único par legado verificável, `CQ-20260326-153230` de 04/02/2026, tem 28 dias **33,00 MPa** no legado, na fonte antiga e na nova; situação **não conforme** para fck 35. Os certificados de 2025 não foram usados para simular CPs inexistentes na base.
