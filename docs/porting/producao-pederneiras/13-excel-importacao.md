# Importação do LT-PRO-04 de outubro/2026

O Excel original recebido em 24/10/2026 foi conferido na aba `Prod. P. Compl.`. SHA-256 do arquivo: `cec59721faa06369ec3ec6e4e8fc9dd9d48bc51e5ede13e87a2f67b14c9dbefa`. A extração reproduzível está em `scripts/prepare_pederneiras_oct2026.py`. O arquivo original permaneceu inalterado no Desktop do Ricardo.

## Regra de contagem e resultados

A planilha soma os postes das linhas 10–57 e 65–121 na linha 122. As linhas 58–64 são **Acessórios** e ficam fora do total de postes, mesmo quando têm quantidades. A aplicação passou a seguir a mesma regra no painel, na confirmação do dia e nas exportações; os acessórios continuam visíveis em linha própria no PDF e XLSX.

| Conferência até 23/10/2026 | Resultado |
|---|---:|
| Dias com produção | 16 |
| Postes nas células e no rodapé dos dias válidos | 1.055 |
| Acessórios nas células, fora do total de postes | 6 |
| Todas as peças nas células | 1.061 |
| Mão de obra acumulada | 130,75 homens |
| Postes por homem | 8,07 |

Nos dias 20, 21 e 22, as células mostram respectivamente 73, 75 e 69 peças. Dessas, duas por dia são acessórios. A linha **Total Postes** mostra corretamente 71, 73 e 67. A diferença de seis unidades que aparecia no PDF está explicada pela fórmula do Excel.

No dia **29/10/2026**, a célula `AF122` contém **74** escritos diretamente, sem produtos nem mão de obra nesse dia. É uma data futura em relação à importação de 24/10. A soma impressa de 1.129 postes é 1.055 dos dias válidos mais esses 74. O lançamento futuro não foi importado; depende de produção efetiva e correção da fonte.

As 112 linhas de produtos do cadastro correspondem à planilha. Há 110 códigos Pro preenchidos e distintos na coluna B; os outros dois produtos não têm código nessa coluna e não têm quantidades no período importado. O cadastro de 112 produtos continua provisório para revisão de código, letra e m³ por peça.

## Importação auditada

Após prévia, ensaio em transação revertida e backup do banco, foram inseridos em Pederneiras cinco áreas, 16 dias confirmados, 254 itens de produto e 79 registros de mão de obra positivos. As 339 linhas de auditoria registram a origem `importacao` e o hash do Excel. Nenhuma conta ou permissão de usuário foi alterada. Campinas permaneceu com 136 registros de mão de obra e 19 atividades.

Backup: `/opt/concrefer-unificado/backups/pederneiras-excel-20261024/pcp_unificado_teste.dump`. A leitura real da API confirmou os 16 dias, 1.055 postes, 130,75 homens, 8,07 postes/homem e os 6 acessórios. Os PDF e XLSX gerados da API foram abertos e conferidos.
