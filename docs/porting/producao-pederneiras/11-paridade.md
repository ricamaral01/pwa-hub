# T11 — Fonte de outubro e divergências da planilha impressa

**Atualização de 24/10/2026:** o Excel original chegou. A diferença de seis peças é de acessórios fora da fórmula de postes; os 74 do dia 29 estão escritos somente no rodapé. Os dias válidos foram importados com auditoria. Ver [conciliação e importação](13-excel-importacao.md). O texto abaixo registra a análise anterior do PDF.

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

**Paridade com o Excel e com a tela mensal:** Ricardo informou que não possui o Excel original. Portanto a verificação de fórmulas não poderá ser feita nesta entrega; o PDF e a transcrição auditável são a referência disponível. A tela mensal foi testada com dados sintéticos em banco isolado. A paridade histórica real permanece impossível sem uma fonte corrigida: não foram importados lançamentos do PDF. Os 74 postes do dia 29 permanecem bloqueados até essa data e até correção explícita da fonte.
