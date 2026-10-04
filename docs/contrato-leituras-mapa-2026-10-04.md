# Contrato de leituras brutas do Mapa — fotografia de 04/10/2026

GET apenas na origem oficial. 67/78 corpos exatos. As 11 diferenças abaixo foram classificadas individualmente; os corpos completos ficam fora do repositório. `compare_order_render.py` compara a saída final do mesmo `app.js` nas duas respostas.

| Chamada | Recurso e filtro | Registros oficial/teste | SHA-256 oficial | SHA-256 teste | Resultado final |
|---:|---|---:|---|---|---|
| 32 | producao; ordem sem desempate | 415/415 | `a1a08a0dc659beac7a64d45f2c2f32ef1dcc5ae70a101c9a9c07b0d378b3c273` | `7ced293dd73220f14cc22d878b8ffcc6c12e267e9a9332070f06a045dc2d7729` | Relatório: mesmos 415 registros; texto e total iguais (app agrega/ordena). |
| 48 | vw_formas_status; ordem sem desempate | 209/209 | `2114802566b7397f751219ac9fd3f769a6739634f0b9617efed1ab496a93190c` | `af4c064e3ff38bdaa2fddf591d7d5a8a91a7ac7510f0e50d3f5db4c782cf28a5` | Cartões: mesmas 209 chaves data/setor/forma; estado, cor e texto iguais. |
| 57 | producao; paginação | 1000/1000 | `f62f46a667055070cabf64aad66fc9651489173d2cc483fa03913b5707d413b7` | `cd083551092765a5b353ba254ff00ad58538ba434fe9730b9458f2ff4a20cc4e` | Página 1 do empate por data: 39 IDs mudam de página; avaliar junto à 58. |
| 58 | producao; paginação | 56/56 | `49883cdb7cfcece9863f3e7a68df6a2f8fc0e127b659094da6e3e15738ca01b2` | `916bbaf05a18da2d01e47aaeb844a2120faf817245cccc56ad69dff8c49f362b` | Página 2: 1.056 IDs únicos no percurso, mesma coleção e indicadores. |
| 60 | producao; ordem sem desempate | 67/67 | `5d496301f241eafee497fccbfaa0d5530fcfa0f1a69e391948fa17c024bb8b64` | `c2ea44a4c9baf967bf1d80ba522d9887d530f07d886648429b9cceac23e86182` | Acompanhamento S1: 67 linhas e resultado exibido iguais; app ordena por horário. |
| 61 | producao; ordem sem desempate | 76/76 | `16a51071af57942caf4043a47cfb289cdda65616a77a0738b349a36a1fc3c430` | `4852de37e41c1cad202a139082b66d6e52c5cb13f784f43adc3e89c7e40a1859` | Acompanhamento S2: 76 linhas e resultado exibido iguais; app ordena por horário. |
| 62 | producao; ordem sem desempate | 46/46 | `c642fba8804137d5342b11015e4c2a8123132715384557299232a8620eed792b` | `cdd0094a6b94c31282edfbc6004ddc2d1976034b6ea5ce509befd63d8e19221b` | Acompanhamento S3: 46 linhas, cartões e texto iguais. |
| 64 | producao; ordem sem desempate | 46/46 | `c642fba8804137d5342b11015e4c2a8123132715384557299232a8620eed792b` | `cdd0094a6b94c31282edfbc6004ddc2d1976034b6ea5ce509befd63d8e19221b` | Relatório S3: mesmos 46 registros; texto final igual. |
| 70 | producao; ordem sem desempate | 46/46 | `c642fba8804137d5342b11015e4c2a8123132715384557299232a8620eed792b` | `cdd0094a6b94c31282edfbc6004ddc2d1976034b6ea5ce509befd63d8e19221b` | Dashboard S3: mesmas 46 formas, totais e cartões iguais. |
| 74 | producao; ordem sem desempate | 46/46 | `c642fba8804137d5342b11015e4c2a8123132715384557299232a8620eed792b` | `cdd0094a6b94c31282edfbc6004ddc2d1976034b6ea5ce509befd63d8e19221b` | Helper de pendências: 46 registros iguais; sem tela chamadora no app atual. |
| 76 | producao; ordem sem desempate | 46/46 | `c642fba8804137d5342b11015e4c2a8123132715384557299232a8620eed792b` | `cdd0094a6b94c31282edfbc6004ddc2d1976034b6ea5ce509befd63d8e19221b` | Mesmo helper com filtros invertidos: 46 registros iguais; sem tela chamadora. |

As chamadas 57 e 58 não são iguais página a página: 39 IDs mudam de página por empate em `data_fabricacao`. O contrato só fica justificado se a varredura completa tiver 1.056 IDs únicos sem perda nem repetição; executar `contract_producao_pagination.py` sem gravações concorrentes após cada fotografia.

As outras nove diferenças têm os mesmos registros em outra ordem. A comparação de renderização após esta fotografia encontrou igualdade nos sete grupos de estado, cartões, acompanhamento, relatório e inspeção, com 8/8 consultas correspondentes em cada lado. A chamada 73 sem HTTP está documentada em `docs/comportamentos-atuais-suspeitos.md`.
