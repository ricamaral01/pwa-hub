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

**Pendência para lançamento operacional:** confirmar se o período pretendido é
agosto, como escrito na mensagem, ou setembro, como consta em todas as linhas;
confirmar se cada linha repetida representa uma ocorrência distinta. Até lá,
não atribuir mês artificialmente nem somar as linhas aos indicadores por poste.
