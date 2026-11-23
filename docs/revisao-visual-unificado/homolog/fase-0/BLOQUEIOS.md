# Bloqueios anteriores ? revis?o visual

A homologa??o est? em 1.1.10, enquanto a produ??o est? em 1.4.6.
Nenhuma altera??o foi feita nos servi?os, bancos, permiss?es, Nginx ou arquivos publicados.

## APIs exigidas pelo pedido, ausentes na homologa??o

A inspe??o da aplica??o PCP de homologa??o encontrou 68 rotas. N?o existem rotas de n?meros de s?rie (`postes-series`), programa??o semanal (`programacao-semanal`) nem programa??o/relat?rio de armaduras (`armaduras/programacao`). Existe apenas `/api/etiquetas-armaduras/modelos`, que n?o fornece a programa??o solicitada.

Al?m disso, a p?gina est?tica `pcp/numeros-serie/` n?o existe em homolog-next. As consultas HTTP autenticadas ?s tr?s ?reas devolvem 403 pela camada de acesso existente. Copiar apenas o HTML/CSS n?o resolve a aus?ncia das APIs e das defini??es de acesso.

Evid?ncias: `rotas-api-homolog.json`, `baseline-results.json`, capturas em `antes/`.

## Gate

O gate b?sico passou 7/7 com `PCP_ANON_EXPECTED=401`, a resposta n?o autenticada existente antes de qualquer altera??o. O gate n?o exercita essas telas nem substitui os testes funcionais pedidos.

## Decis?o necess?ria

O pedido pro?be alterar APIs, permiss?es, bancos e reiniciar servi?os. Foi solicitada orienta??o para uma etapa separada de atualiza??o funcional da homologa??o ou para aguardar que outro respons?vel a atualize. Nenhuma dessas mudan?as ser? feita com a autoriza??o atual, que ? apenas visual.
