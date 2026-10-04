# Conferências adicionais — 04/10/2026

Todas as gravações descritas aqui foram dirigidas ao PostgreSQL de testes. O oficial recebeu somente GETs. Os corpos de resposta e as credenciais das contas sintéticas ficaram fora do repositório.

## Leituras e perfis PCP

A API PCP respondeu com JSON idêntico em **63/63** consultas, em datas distribuídas e períodos mensais, após a fotografia de 04/10. As 24 rotas abriram com HTTP 200, casca visível e sem erro de página em ADMIN, PCP, PRODUCAO e CONSULTA; PCP, PRODUCAO e CONSULTA foram repetidos na 0.5.8. Os perfis sem acesso foram redirecionados em Usuários e Teste Programação. Isto verifica carregamento e leituras; não transforma todas as rotas em E2E de gravação.

| Telas | Exercício funcional publicado | Estado |
|---|---|---|
| Programação, Circular S3/S4 | Criar, reler na tabela e excluir com ADMIN e PCP | igual |
| Programação Alex S1/S2 | Editar e excluir com ADMIN | igual |
| Produção, Apontamento Mega | Gravar e reler com ADMIN; Produção também com PRODUCAO | igual |
| Mão de obra, Rateio S1/S2 e S3/S4 | Gravar, conferir campos e excluir; Rateio também com PRODUCAO | igual |
| Usuários | Criação, leitura e exclusão sintética com ADMIN | igual; botão original Redefinir senha segue defeituoso |
| Sincronizar Google Sheets S3/S4 | Código original: lê a escolha de agosto, HTTP 200, zero importações/remoções, banco de testes inalterado | igual |
| Teste Programação | Requisição do botão chega ao backend PCP idêntico; resposta HTTP 500 na comparação texto/inteiro | falha preservada, não certificado |
| Acompanhamento mensal S1/S2 e S3/S4, Comparação, Dashboard, Formas por Setor, PCP Diário, Programação Final, três relatórios e três famílias de etiquetas | Abertura, leituras, indicadores quando aplicável e impressão; as rotas de consulta não têm gravação exigida | leitura/saída verificadas; falta varrer todos os filtros por perfil |
| Primeiro acesso | Em sessão comum, redireciona ao dashboard; troca de senha sintética já verificada em rodada anterior | igual no caso exercitado |

Permissões negativas no endereço publicado: PRODUCAO recebeu **403** ao tentar gravar Programação; CONSULTA recebeu **403** em Programação e Produção. Nenhuma dessas tentativas criou linha. As contas sintéticas foram removidas antes da fotografia final.

## Impressões e arquivos

Na 0.5.7, as sete famílias PCP — FL-PRO-15 S1/S2, S3 e S4, PCP Diário, etiquetas de postes, etiquetas SC e etiquetas de armaduras — tiveram texto, tamanho de página e imagem rasterizada iguais página a página ao oficial em três configurações: 02/10 por um dia com duas etiquetas; 30/09 por dois dias com uma etiqueta; 01/10 por três dias com três etiquetas. O desvio anterior vinha do selo TESTE e do fundo navy aplicados à mídia de impressão pela casca; foram retirados apenas da impressão. A regra de seleção da planilha ficou intacta.

Na Produção, os dois CSVs de Produtividade foram iguais byte a byte em 30/09–01/10 (446 e 28 linhas) e 02–03/10 (190 e 8 linhas). O XLSX de Montagem teve folhas e conteúdo lógico iguais em 30/09 (138 linhas de base) e 02/10 (3 linhas de base). Cada comparação usou o HTML original com as respostas da mesma fotografia de testes; não enviou gravação ao oficial. O Relatório Enc. Produção gerava no original uma folha de conteúdo e outra totalmente branca; a cópia tinha apenas a de conteúdo. A regra isolada de impressão da 0.5.8 reproduziu a segunda folha; PDF, conteúdo e texto do WhatsApp ficaram iguais nos quatro setores.

## Estados visuais internos

Conferência no endereço publicado em Chromium desktop 1366×768: gaveta de filtros e modal do Mapa, cartões, tabela longa e botão principal do PCP. A 0.5.7 passou a dar raio 16 e a sombra única a modal/gaveta do Mapa e aos cartões/tabelas PCP; o botão PCP passou a laranja `#E8762A`, texto navy e raio 10. Os valores calculados pelo navegador e as capturas estão em `.work-mapa-unificado/internal-layout/styles-057.json` e nos PNGs correspondentes, fora do Git. As regras são `screen` e `min-width:1025px`; tablet, celular e quiosque não receberam essas alterações. Permanecem por revisar visualmente todas as mensagens, estados vazios e tabelas longas em cada uma das telas dos dois módulos; a amostra medida não comprova a matriz inteira.

## Chamadas externas e credenciais

No Mapa, a execução dinâmica de 31 roteiros capturados teve 29 executados, zero pedido a host externo, um roteiro de PDF/WhatsApp não executado por depender do simulador da biblioteca PDF e um erro ao tentar inscrever novamente um canal Realtime já inscrito pelo próprio roteiro. O teste dedicado de Realtime da operação e o de relatório/WhatsApp são independentes. Em PCP, a abertura das 24 páginas por perfil bloqueou hosts externos e não detectou chamada; as ações de gravação verificadas usam a API local de testes. Falta instrumentar e conferir todas as ações possíveis das duas aplicações num único inventário dinâmico. A leitura das planilhas Google pelo backend PCP é a exceção autorizada.

A classificação do valor com aparência de credencial está em `docs/auditoria-credencial-pcp.md`, com arquivo, linha, variável, uso real e acesso potencial, sem mostrar o valor.

## Contrato de leitura do Mapa

`docs/contrato-leituras-mapa-2026-10-04.md` registra as 11 diferenças brutas individualmente, seus hashes e o resultado final conferido. As outras 67 de 78 respostas são exatas. Duas diferenças são páginas distintas de um empate de datas; após a fotografia final de **19:18:17 UTC**, a varredura sem gravação concorrente entregou **1.056/1.056 IDs únicos**, hash canônico igual `89a5bb6388d9279a34fc366a979c3b79ca3a0255a30a14073888c92b0c58b913`, zero linha perdida ou repetida. A chamada 73, sem HTTP, permanece coberta pelo comportamento do aplicativo original.
