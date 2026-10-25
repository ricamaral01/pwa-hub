# B4 — Integrações do lote 2

**Estado final em 15/10/2026:** B4 está **publicada no destino** após a sétima tentativa controlada. Gate pré e pós-publicação 7/7, smokes PCP/Qualidade/Laboratório aprovados e health 200. O frontend efetivo do Laboratório (`/novo/postes`) contém o botão **Abrir NC** para ensaio finalizado e reprovado. A migration aditiva `20261015_02` está aplicada. Nenhum dado de negócio B4 foi criado; apenas a tela `labTests` foi concedida à conta sintética de prova.

## PCP — setor e produto

O PCP expõe `GET /api/integracoes/qualidade/setores` e `/produtos` em loopback. Cada requisição leva `X-Quality-Timestamp` e `X-Quality-Signature` (HMAC-SHA256 de `GET\n<path>\n<timestamp>`, janela de 20 s). O mesmo segredo aleatório de pelo menos 32 caracteres fica fora do Git em `PCP_QUALITY_CATALOG_KEY` (PCP) e `QUALIDADE_PCP_CATALOG_KEY` (Qualidade). A Qualidade publica `/api/integracoes/pcp/{setores,produtos}` somente atrás da sessão e da afirmação Unificado. Falha do catálogo retorna 503, sem cair em acesso direto a banco.

Na abertura, setor e produto são escolhidos do catálogo PCP. Ao gravar, a API Qualidade consulta de novo o contrato, confirma o vínculo produto–setor e substitui qualquer snapshot enviado pelo navegador por ID, código e nome atuais do PCP. Lote permanece texto livre. Não há contrato confiável de lote; o botão QR não é mostrado.

## Laboratório — ensaio reprovado

Ensaio `finalizado` e `REPROVADO` ganha o link **Abrir NC** no histórico. A abertura mostra origem `ENSAIO_LABORATORIO` (migration aditiva `20261015_02`), identificação do ensaio e amostra no título/descrição, descrição do produto e referência de amostra no campo de lote livre. Quando houver produto PCP de mesmo código ou nome, o seletor é preenchido e o snapshot é validado pela API. A pessoa confere a NC antes de registrar. A permissão `qualidade.nc.abrir` continua exigida no serviço.

## GED — referência documental

Busca remota por código com credencial de serviço somente leitura exigiria criar e operar um novo contrato de autenticação no GED. Foi usada a alternativa autorizada: a tratativa abre o GED para consulta e registra código, revisão opcional e finalidade `REQUISITO` ou `A_REVISAR` em `nc_documento_ref`. A API exige `qualidade.nc.tratar`, valida a referência e grava evento. O código é digitado e não foi conferido automaticamente no GED; essa limitação deve constar do relatório do lote.

## Verificação local

- Qualidade: 30 testes Python passaram, incluindo a guarda de concessão B2.2; build React/TypeScript passou.
- Laboratório: build React/TypeScript passou.
- Sintaxe Python PCP/Qualidade: `compileall` passou.
- Import do módulo PCP e verificação positiva da assinatura HMAC passaram com `DEBUG=false` no ambiente local. A variável global do host de desenvolvimento (`DEBUG=release`) não é aceita pelo tipo booleano da configuração PCP.

O plano de publicação foi: registrar o router PCP; instalar o segredo nos dois serviços; aplicar migration `20261015_02` com backup anterior; implantar API e frontends; repetir regressão PCP, Mapa e Laboratório e smoke de abertura de NC. A execução final está registrada na sétima tentativa abaixo. Nenhuma alteração foi feita no GED antigo.

## Primeira tentativa e retorno

O gate antes da tentativa passou 7/7, conforme registro do lote 2 da sessão principal. Backup em `/opt/concrefer-unificado/releases/lote2-b4-20261015/before/`: `pcp-main.py` SHA-256 `39fcf59839766958011548788268950ceb56292e38159335ac2bb8a831fbaf71`, `quality-api.py` `d2caa5dab8d81ef42f16e2ebd46743cfda5ad0963e1b9bb49b945ef4e234eef4`, banco Qualidade em `qualidade-before-b4.dump` `61365518a943014f72f9e660780a8f033b96b978e132f24e49c26d6823895f64`. Também foram guardados envs e cópias dos dois frontends. O dump fica fora de `public` e restrito a root.

Alembic aplicou `20261015_01 → 20261015_02` e `alembic_version` confirmou `20261015_02`. A nova origem de laboratório é um cadastro aditivo. Após copiar os bundles, o Laboratório entrou em loop de reinício com `PermissionError` em `static/postes/assets`. Causa: `scp -r` havia deixado os diretórios candidatos com modo `0700` e `cp -a` preservou esse modo no diretório servido. O script de uma eventual nova tentativa foi corrigido localmente para copiar estáticos sem preservar modo e para aguardar os serviços ficarem prontos, mas **não foi executado novamente naquele momento**.

O retorno restaurou código, envs e frontends dos backups. Os três serviços ficaram ativos; a API Qualidade respondeu 200 em `/api/health`. `scripts/qualidade_regression_gate.py --label lote2-b4-rollback` passou 7/7 (Unificado, Laboratório, auth PCP/Mapa, permissões Mapa, dashboards PCP ADMIN/CONSULTA). Os novos arquivos auxiliares permanecem inertes no destino, e a migration aditiva permanece aplicada. Nenhuma NC ou outro dado sintético foi criado por essa tentativa.

## Dependência incorporada antes da nova tentativa

Depois do retorno B4, a frente B5 publicou uma guarda B2.2 no serviço Qualidade: `concluir-contencao` devolve 409 se qualquer disposição `CONCESSAO` ainda não tiver `concessao_aprovada_por`. Comparei a API e `rules.py` ativos com o código local; a única diferença local da API corresponde a B4 e ao endpoint de preparação C2. Regenerei **localmente** `tmp/lote2-b4/candidate/quality-api.py` excluindo apenas o endpoint C2; ela preserva integralmente a guarda B2.2 ativa. `rules.py` local e ativo são idênticos. Os 30 testes da Qualidade, incluindo concessão sem/com aprovação, passaram. Naquele momento o candidato remoto ainda era o antigo; ele foi atualizado antes da terceira tentativa, preservando a guarda B2.2.


## Segunda tentativa e diagnóstico antes da terceira

A segunda tentativa usou backup novo em `before-retry2` (dump SHA-256 `ec686619237223834648003a900474650950c77ba103d1ee973a9207e7543b8f`) e cópia dos estáticos sem preservar modo. Gate antes e depois da publicação: 7/7. O contrato assinado PCP respondeu 200 para 4 setores e 277 produtos; sem assinatura respondeu 401. Um smoke de navegação Qualidade falhou em assert antigo que exigia exatamente duas ações do probe. O cadastro de dados sintéticos já registrava que a B5 ampliara essa conta para nove ações. Por orientação da sessão principal, houve retorno imediato do código/env/frontends, health 200 e gate pós-retorno 7/7. O teste foi corrigido para exigir `abrir` e `triar` como subconjunto; executado após o retorno, passou com SPA/contexto 200 e nove ações. Nenhum registro de negócio B4 foi criado.

Antes da terceira publicação, o gate prévio teve 6/7: `unificado.home_pcp_mapa` expirou no Playwright após `domcontentloaded`; os outros seis casos passaram. Nada foi publicado nessa tentativa. Diagnóstico somente leitura: PCP, Mapa, Laboratório e Qualidade estavam ativos; navegação isolada dos dois probes passou, com login em 0,67/0,57 s, redirecionamento em 1,85/3,28 s, painel em 0,38/0,21 s, quatro cartões e APIs 200. A causa provável é contenção transitória entre os casos do gate executados em paralelo; não há evidência de falha persistente de serviço. Naquele momento a publicação ficou suspensa até a decisão da sessão principal.


## Terceira tentativa e smoke tardio

Ricardo autorizou repetir o gate; o pré-gate repetido passou 7/7. A terceira tentativa usou backup novo em `before-retry3`, preservando os dois dumps anteriores. A migration já estava em `20261015_02` e `alembic upgrade head` foi inócuo. Health, serviços PCP/Qualidade/Laboratório, SPA/contexto Qualidade e contrato PCP assinado passaram; o contrato sem assinatura retornou 401. O pós-gate passou 7/7.

Um smoke HTTPS adicional confirmou leitura de 4 setores e 277 produtos pela API Qualidade, rejeição 422 de `setor_pcp_id` inválido antes de gravar, seletores de setor/produto visíveis e botão QR oculto. Ao ampliar esse smoke para o Laboratório, a parte da abertura Qualidade expirou aguardando o heading depois de 20 s. Por ser smoke falho, a sessão principal determinou retorno: código/envs/frontends restaurados de `before-retry3`; migration aditiva e arquivos inertes preservados. Health 200, três serviços ativos e gate pós-retorno 7/7. Não houve novo apontamento PCP nem nova NC.

O diagnóstico posterior, somente leitura, mostrou login/Quality bootstrap 200, rota `/unificado/qualidade/abrir` 200, CSS/JS 200, contexto e catálogos 200, sem erro de página. [Captura da abertura](capturas-b4/abertura-apos-rollback.png) mostra o heading esperado. O seletor permanece correto. A causa exata do timeout não foi capturada durante a falha; havia indício de atraso intermitente de navegação, sem evidência de falha persistente. Naquele momento, a publicação B4 ficou suspensa.

O smoke também revelou que o menu Lab serve `/unificado/laboratorio/novo/postes`, enquanto a primeira versão do botão tinha sido adicionada apenas ao frontend legado `/postes`. O botão foi incluído no `src/novo/postes.tsx` para ensaio `finalizado` e `REPROVADO`; `npm run build:novo` passou. Naquele momento, o bundle novo ficou somente local e a conferência visual HTTPS aguardava publicação e conta com acesso à tela `labTests`.

## Quarta tentativa — preparação e gate preliminar

Por autorização da sessão principal, a tela `labTests` foi concedida pelo endpoint administrativo à conta sintética `lab-auth-probe`. A operação preservou as 19 telas previamente selecionadas e não alterou contas reais. O bundle de `/novo/postes` foi incluído no candidato local, e os scripts de publicação e retorno foram preparados com backup independente `before-retry4`. O teste isolado do contrato PCP passou 2/2.

O primeiro gate prévio da quarta tentativa terminou 6/7: `auth.pcp` recebeu `net::ERR_ABORTED` no primeiro acesso à tela de login; os outros seis casos passaram. **Nenhum deploy foi feito.** Diagnóstico somente leitura confirmou os três serviços ativos, health Qualidade 200, login HTTPS 200 e a mesma página carregando com formulário em 3/3 tentativas isoladas com e sem parâmetro de destino. A causa provável é interrupção transitória da navegação concorrente, ainda sem comprovação. A publicação aguarda decisão da sessão principal para repetir o gate.

Ricardo autorizou repetir o gate, que passou 7/7. O candidato completo foi publicado com backup independente `before-retry4`, incluindo o frontend efetivo `/novo/postes`. PCP respondeu 200 para quatro setores e 277 produtos com assinatura e 401 sem assinatura. O teste isolado de navegação Qualidade passou. O smoke HTTPS ampliado expirou esperando o título da abertura em 30 segundos; por isso houve **rollback imediato** de código, envs e frontends. Health Qualidade 200, três serviços ativos e gate pós-retorno 7/7. Nenhuma NC ou apontamento PCP foi criado.

O diagnóstico específico mostrou que a página de abertura retornava 200 em cerca de seis segundos, assets CSS/JS, contexto e catálogos retornavam 200, não havia erro JavaScript e o título real estava presente no DOM. O seletor do smoke tinha sido duplamente codificado ao salvar o script pelo PowerShell: esperava `Nova n\xc3\xa3o conformidade` em vez de `Nova n\xe3o conformidade`. Comparação dos codepoints e busca isolada pelo título correto retornaram uma ocorrência. Corrigi **somente o script local** em UTF-8. [Captura do diagnóstico](capturas-b4/diagnostico-api-login-apos-rollback.png). O candidato continua revertido; nova publicação depende da decisão da sessão principal.

## Quinta tentativa — estado atual

Ricardo autorizou nova tentativa após a correção de codificação. O gate prévio passou 7/7, o backup independente `before-retry5` foi feito e B4 foi publicada. O contrato PCP assinado retornou 200 (4 setores, 277 produtos) e sem assinatura 401. O smoke HTTPS da Qualidade confirmou proxy PCP, rejeição 422 de snapshot inválido sem gravação, seletores visíveis e QR oculto. O Laboratório carregou 18 ensaios, entre eles três finalizados reprovados, e mostrou três links **Abrir NC** após a hidratação.

Uma assertiva acrescentada ao smoke exigia o botão em toda linha com o texto `REPROVADO`; ela falhou porque seis ensaios reprovados ainda estão em `rascunho`. A regra B4 exige botão apenas em `finalizado` + `REPROVADO`, exatamente a condição do componente. Conforme a regra de retorno, o código/envs/frontends foram restaurados imediatamente de `before-retry5`; health 200, serviços ativos e gate pós-retorno 7/7. Nenhum registro de negócio B4 foi criado. Diagnóstico somente leitura contou 18 ensaios: 3 finalizados reprovados, 1 finalizado aprovado e 14 rascunhos; as três ligações observadas correspondem ao total elegível. Corrigi **somente o smoke local** para comparar os IDs dos links com os IDs dos ensaios `finalizado` + `REPROVADO` obtidos na API. A publicação continua revertida e aguarda decisão da sessão principal.

## Sexta tentativa — diagnóstico do contexto Laboratório

Após nova autorização, o gate prévio passou 7/7; foi feito backup `before-retry6` e o mesmo candidato B4 foi publicado. PCP assinado/sem assinatura e Qualidade passaram novamente. A verificação Lab reforçada recebeu 404 ao chamar `/api/ensaios` pelo `BrowserContext.request` do Playwright; houve rollback imediato. Health 200, três serviços ativos e gate pós-retorno 7/7. Nenhum dado de negócio foi criado.

O diagnóstico somente leitura explicou a diferença: `laboratorio-bridge.js` reescreve `window.fetch('/api/...')` para `/unificado/laboratorio/api/...` e acrescenta `X-Unificado-Screen`. O cliente `BrowserContext.request` não passa pela ponte e recebeu 404; `page.evaluate(fetch(...))` retornou 200 na mesma sessão, com 18 ensaios e três elegíveis. Corrigi **somente o smoke local** para obter os IDs via `window.fetch` da página e comparar com os parâmetros `lab_ensaio` dos links. A publicação permanece revertida até nova decisão.

## Sétima tentativa — publicação aprovada

Com nova autorização, o gate prévio passou **7/7**. O backup independente `before-retry7` incluiu código, envs, frontends e `qualidade-before-b4.dump` (SHA-256 `67258a3c671ab5275815ad3bb640b0974ab59a6126f00a8485bd94e74c08281e`). O dump ficou fora de `public`, restrito a root. O deploy reaplicou a migration já em `20261015_02` sem mudança adicional e instalou PCP, API/SPA Qualidade e os frontends legado e efetivo do Laboratório.

Os smokes HTTPS passaram: contrato PCP assinado **200** para 4 setores e 277 produtos, sem assinatura **401**; proxy Qualidade **200**, snapshot inválido **422** sem criar NC, seletores de setor/produto visíveis e QR de lote oculto. No Laboratório, os três links **Abrir NC** apontaram exatamente para os IDs dos três ensaios `finalizado` + `REPROVADO`; os outros 15 ensaios não ganharam link. O gate pós-publicação passou **7/7**, PCP/Qualidade/Laboratório ficaram ativos e health Qualidade retornou **200**. Nenhum apontamento PCP ou NC foi criado nesta publicação.

Hashes SHA-256 do estado ativo: API Qualidade `522b4abd1627d3a2aa0fe7ef9a1f604b7366e2111774840fd9a1a3b2dbcc63b7`, `pcp-api/app/main.py` `67685908768513e6c8e819fbe418a305cc370d02b8a29ae55aa11c7c0f1c7604`, HTML de `/novo/postes` `01c85bfaaa0628f01d1ef4f99801b81e172226e2726753f6d56e620686ce8038`, HTML Qualidade `a293404ce5485c98686d71f32d686c7b6d1deb738de373bded8243e2d8a66632`. O código anterior da API Qualidade no backup tem SHA-256 `434d9320302bdef332029e7d69822c3613164e36f012d04f02399f734cbc0c74`. A guarda B2.2 de concessão permanece no código publicado.
