# F1 — Fornecedores, cotações e pedidos de compra

**Ambiente:** somente homologação `https://concrefer.concretrack.com.br:18446`, unidade Campinas. Produção e VPS antiga não foram alteradas. Branch local `feat/suprimentos-s0-s1`, sem push.

## Entrega

- Ficha de fornecedor com cadastro, contatos, categorias, documentos privados com validade, critérios por categoria, decisão de homologação pela Qualidade, avaliações e IQF ponderado de 12 meses. Busca e filtros por situação, categoria, IQF e vencimento.
- Fila de itens aprovados com destino Compra; cotações agrupam itens de solicitações distintas. Convites, propostas por item, impostos, desconto, frete CIF/FOB, condições, anexos privados, mapa de custo posto, menor custo/prazo, escolha justificada, exceção emergencial da Qualidade, mínimo de três propostas e aprovação N1/N2 do fechamento abaixo do limiar.
- Pedido `OC-#####` por fornecedor, reaprovação quando o valor supera a solicitação em 10%, PDF com logotipos e condições, download/envio manual, acompanhamento, follow-up e recebimento direto parcial/total com NF e avaliação manual. Envio por e-mail preparado com flag `S3A_EMAIL` desligada.
- Painel com pedidos abertos/atrasados, documentos vencendo e homologações pendentes; menu de Cotações e pedidos e Fornecedores condicionado a S3A.

## Isolamento e parâmetros

`S3A` está ligada apenas em Campinas na homologação; `S3A_EMAIL` está desligada. `S2`, `S3B`, `S4` e `S5` seguem desligadas nesta fase. Os valores de 12 meses, R$ 1.000, 10%, pesos 30/20/30/10/10 e faixas A/B/C são `a_confirmar`, editáveis nos parâmetros. A compra emergencial sem fornecedor homologado exige um evento da Qualidade. Documentos e anexos são servidos por endpoints autenticados, não por URL pública.

## Arquivos da implementação

| Parte | Arquivos |
|---|---|
| Banco | `unificado/suprimentos/migrations/versions/0005_compras.py`, `0006_compras_email.py` |
| API | `unificado/suprimentos/service/suprimentos/api/compras.py`, `api/cadastros.py`, `auth.py`, `main.py`, `requirements.txt` |
| Interface | `unificado/suprimentos/frontend/compras.js`, `compras.css`, `app.js`; `cotacoes/index.html`, `fornecedores/index.html`, `painel/index.html`, `solicitacao/index.html` |
| Casca e permissão | `unificado/shell/menu.config.js`, `router.js`, `unificado/mapa/api/screen_catalog.json` |
| Testes e implantação | `service/tests/test_f1.py`, `deploy/f1-*-homolog.sh`, `deploy/test-f1-api-homolog.sh`, `deploy/seed-f1-demo-homolog.py` |

O `router.js` da árvore local contém diferenças anteriores de outras frentes. A correção da navegação de detalhes foi aplicada na homologação como **duas linhas cirúrgicas** no arquivo que já estava lá; não foi enviado o arquivo local inteiro. A separação final em patch limpo está prevista na F8.

## Verificação funcional

- Migração em banco descartável: upgrade, downgrade em banco vazio e upgrade; testes com assertion assinada por ator. Suíte E1–E7 + F1: **17 testes aprovados**, sete avisos não impeditivos.
- Fluxos cobertos: três fornecedores e três propostas, fornecedor não homologado, exceção emergencial, custo posto com CIF/FOB e rateio, aprovação N1/N2, reaprovação por preço, entrega parcial/total, IQF, documentos privados e e-mail bloqueado pela flag.
- Implantações na homologação com backup, snapshot de modos/donos, `nginx -t`, serviço pronto e **smoke 43/43**. A correção de rota de detalhe elevou `VERSION` para 1.0.67; o polimento da ficha, cotação e histórico elevou para 1.0.68; os limites configuráveis do IQF elevaram para 1.0.69; a correção do cartão no celular elevou para 1.0.70 e a visibilidade da aba ativa para **1.0.71**. `VERSION`, `APP_VERSION` e cache do SW são conferidos após cada publicação. O retorno de 1.0.69 para 1.0.68 foi executado com saúde do serviço e `nginx -t` aprovados; a versão nova foi reinstalada e passou novamente em 43/43. Backups de retorno: `/opt/concrefer-unificado/homolog-next/backups/suprimentos-f1-router-20261026T004100Z/`, `.../suprimentos-f1-ui-polish-20261026T004800Z/`, `.../suprimentos-f1-iqf-20261026T005800Z/`, `.../suprimentos-f1-mobile-20261026T010500Z/` e `.../suprimentos-f1-tabs-20261026T011000Z/`.
- Auditoria autenticada pela casca das telas de lista em sete resoluções (1366×768, 1440×900, 1920×1080, 820×1180, 1180×820, 390×844 e 360×780), zoom 100/125%, menu aberto/recolhido, compradores, Qualidade, Almoxarife e Aprovador: **196 estados, zero estouro horizontal, zero 404 e zero erro de console**. Dados e capturas: [`capturas/f1/diagnostico.json`](capturas/f1/diagnostico.json) e PNGs na mesma pasta.
- O PDF da OC de demonstração foi renderizado e conferido visualmente: logos, dados do fornecedor, CNPJ, data de entrega, pagamento, frete, local, itens e total aparecem sem sobreposição. Exemplo protegido em `backups/suprimentos-f1-final-20261026T002000Z/demo-f1.pdf` na homologação.

## Navegação de detalhe e rede

A auditoria de URLs com `?id=` revelou que `screenFor()` da casca procurava a URL exata do menu e devolvia `null` para fornecedor/cotação/pedido. A correção mapeia os caminhos base `fornecedores/` e `cotacoes/` aos IDs de tela, mantendo a checagem IAM. Foi publicada e passou no smoke. A rede entre a estação de testes e a VPS demorou mais de dois minutos para carregar arquivos estáticos. A auditoria passou a servir ao navegador uma cópia exata dos arquivos estáticos de :18446, capturada após a implantação, enquanto login, sessão, IAM e APIs continuam no servidor de homologação. A cópia temporária no diretório público foi removida após a transferência. Não houve alteração no código de produção. A matriz completa de fornecedor, cotação e pedido, pelos quatro papéis, sete resoluções, zoom 100/125% e menu aberto/recolhido, fechou **196/196 sem estouro, 404 ou erro de console**. Diagnóstico e capturas na pasta `capturas/f1-detalhes/`.

Na revisão visual foram corrigidos três problemas: `Invalid Date` no histórico passou a data e hora reais; a cotação que já gerou OC mostra o link do pedido em vez de oferecer geração duplicada; endereço/contatos vazios deixam de exibir `{}`. O teste de API agora confirma que a cotação lista a OC gerada e bloqueia a segunda geração. A suíte permaneceu em **17 aprovados**.

A faixa de IQF da ficha e da resposta de avaliação agora usa os parâmetros editáveis `iqf_faixa_a/b/c`, com teste que altera o limite e verifica a nova faixa; a operação valida os parâmetros antes de confirmar a transação.

A primeira rodada completa das abas da ficha localizou quatro estados com selo de homologação maior que o cartão, exclusivamente em 390×844 e 360×780 com zoom 125%. O layout móvel passou a usar uma coluna para indicadores. A segunda rodada cobriu **112/112 estados sem falhas**; a aba selecionada também é centralizada na faixa horizontal quando necessário. Diagnóstico e capturas em `capturas/f1-abas/`.

## Fechamento da F1 — versão 1.0.72

- A suíte completa E1–E7 + F1 passou com **18 testes** após separar os bancos descartáveis por caso. A cotação com categoria ABRASIVO exclui o fornecedor EPI; o filtro de situação deixa o convite indisponível quando não há fornecedor elegível.
- As listas passaram em **196/196** estados autenticados; os detalhes de fornecedor, cotação e pedido passaram em **196/196** estados dos quatro papéis. A repetição para Comprador na versão 1.0.72 passou em **84/84**. As quatro abas da ficha passaram em **112/112**. O convite, em quatro larguras, dois zooms e dois estados do menu, passou em **16/16**. Diagnósticos e capturas: `capturas/f1/`, `capturas/f1-detalhes/`, `capturas/f1-abas/` e `capturas/f1-convite/`.
- A auditoria do convite registra um **403 da consulta de produtividade do Mapa feita pela casca** para a conta exclusiva de Suprimentos. Essa chamada não pertence ao módulo, nem impede a cotação; não houve 404, erro JavaScript do Suprimentos ou estouro horizontal. A correção compartilhada da casca fica para a auditoria de patches da F8, para preservar os demais módulos nesta fase.
- A homologação foi publicada com backup em `/opt/concrefer-unificado/homolog-next/backups/suprimentos-f1-invite-20261026T012000Z`, validação `nginx -t`, serviço pronto e smoke **43/43**. O procedimento de retorno foi exercitado nesta fase. `VERSION`, `APP_VERSION` e chave de cache do service worker estão em **1.0.72**. Produção, VPS antiga e remoto Git não foram alterados.
- Além de `DEMO-F1`, a homologação contém uma cotação aberta de demonstração com material ABRASIVO e fornecedor EPI inelegível. Os IDs de teste estão no arquivo privado temporário `sup-f1-category-demo-ids.json`; serão removidos com os demais dados DEMO na F8.

## Dados de demonstração

`DEMO-F1` foi criado exclusivamente na homologação: solicitação `SOL-00020`, três fornecedores homologados, cotação com três propostas e pedido `OC-00001`. O script `seed-f1-demo-homolog.py` registra os IDs no backup protegido; a limpeza será executada e documentada na F6/F8. Nenhum dado foi criado em produção.
