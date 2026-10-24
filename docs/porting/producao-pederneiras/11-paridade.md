# T11 — Fonte de outubro e divergências da planilha impressa

Foi localizado em `C:\Users\Admin\Downloads` um PDF de uma página intitulado **LT-PRO-04 — Controle de Produção - Poste Padrão SMA - Pederneiras**, outubro/2026, além de uma página de codificações. O Excel original continua ausente. Nenhum lançamento foi importado no banco operacional.

O script `scripts/extract_pederneiras_pdf.py` extraiu as 112 linhas de produtos por coordenadas e conferiu a soma das células com o total impresso de cada linha. A transcrição está em `seed/paridade_pdf_outubro_2026.csv` e permite reproduzir a análise com o PDF local.

| Verificação | Resultado |
|---|---:|
| Produtos impressos e transcritos | 112 |
| Soma de células produto × dia | 1.061 postes |
| Rodapé total impresso | 1.129 postes |
| Diferença | 68 postes |

O rodapé diário também diverge das células dos produtos: dia 20 (73 nas células, 71 no rodapé), dia 21 (75 contra 73), dia 22 (69 contra 67) e dia 29 (0 contra 74). O dia **29/10/2026 é futuro** na data desta análise (23/10/2026) e os 74 postes impressos somente no rodapé não podem ser importados como produção realizada. A discrepância total de 68 = 74 menos 6 (os três dias com diferença de 2).

O CSV provisório de cadastro e o PDF têm 112 linhas cada; 108 códigos Pro coincidem literalmente. Os códigos `5.407` e `3.756` no PDF correspondem visualmente a `5407` e `3756` do seed; `10068` está impresso na coluna seguinte. Essas equivalências não foram aplicadas automaticamente porque a atribuição da coluna de código único ainda é uma pendência de cadastro.

**Paridade com o Excel e com a tela mensal:** ainda não verificável. O Excel de outubro precisa ser fornecido para inspecionar fórmulas e valores de origem. A tela mensal só poderá ser comparada após API, cadastro e dados de teste estarem implantados em homologação. Os 74 postes do dia 29 permanecerão bloqueados até essa data e até correção explícita da fonte.
