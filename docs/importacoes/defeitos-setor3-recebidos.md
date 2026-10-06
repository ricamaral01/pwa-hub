# Defeitos do Setor 3 recebidos em 05/10/2026

Fonte: arquivo enviado pelo Ricardo nesta conversa, preservado sem alteração em
`defeitos-setor3-recebidos.tsv` (SHA-256
`fb4d1c952dfe205c9d26ebb9e7b5c3ca224f1390782b7f74128de9726fbc1b46`).

O arquivo tem **214 linhas**. Todas indicam **Setor 3 – Poste Circular** e
**G – Presença de Trincas**. Cada linha está datada entre **01/09/2026 e
30/09/2026**; não há linha de agosto. Uma linha de 30/09 não informa o modelo.
Há modelos repetidos na mesma data e nenhuma linha traz o identificador do
poste ou da inspeção. Por isso, as 214 linhas são 214 ocorrências informadas,
mas não permitem calcular quantos postes distintos foram afetados nem vincular
essas ocorrências ao checklist, a uma segunda inspeção ou a um retrabalho.
O código `G` corresponde a “Presença de Trincas” na lista de defeitos do
`app.js`; no checklist do Mapa, o item que gera esse código é `fissuras`.

| Data de origem | Ocorrências |
|---|---:|
| 01/09 | 28 |
| 02/09 | 18 |
| 03/09 | 23 |
| 04/09 | 22 |
| 08/09 | 6 |
| 09/09 | 7 |
| 10/09 | 8 |
| 11/09 | 9 |
| 14/09 | 8 |
| 15/09 | 9 |
| 16/09 | 5 |
| 17/09 | 20 |
| 18/09 | 4 |
| 21/09 | 8 |
| 22/09 | 7 |
| 23/09 | 6 |
| 24/09 | 8 |
| 25/09 | 2 |
| 28/09 | 6 |
| 29/09 | 4 |
| 30/09 | 6 |
| **Total** | **214** |

Conferência somente leitura no PostgreSQL do sistema novo em 05/10/2026:
`montagem_poste` não tem inspeções do Setor 3 com data de fabricação em agosto
ou setembro; `producao` tem 948 linhas em agosto e 883 em setembro para o
setor. Assim, as ocorrências recebidas ainda não estão nos indicadores de
inspeção do dashboard.

Ricardo confirmou que o período é **setembro, conforme as datas do arquivo**, e
que **cada linha repetida é uma ocorrência distinta**. As 214 linhas foram
importadas em `unificado_auth.reported_defects` no PostgreSQL do sistema novo,
com a chave `(source_key, source_line)` para impedir duplicação ao repetir o
script `scripts/import_defeitos_setor3.py`. A importação conferiu o total,
as 21 contagens diárias e o único modelo ausente. O dashboard mostra essas
ocorrências em bloco próprio, filtrável por período, setor e busca, com
detalhamento por modelo e dia. Elas não entram em FPY, postes não conformes,
defeitos por 100 postes ou taxa por oportunidade, pois falta o identificador
do poste e da inspeção. O Mapa oficial não foi alterado.

Conferência da versão **0.6.16** no endereço publicado: filtro 01–30/09/2026,
Setor 3, mostrou 214 ocorrências informadas, 18 categorias de modelo
(incluindo “Modelo não informado”) e 21 dias. Os cartões de inspeção ficaram
em zero nesse escopo, como exigem os dados identificados. O CSV continha a
linha `"Ocorrencias recebidas";"214"`. Executar a importação uma segunda vez
manteve 214 linhas, sem duplicação.
