# Revisão completa — homologação 1.4.25

Aplicação: **https://concrefer.concretrack.com.br:18446/unificado/**.

A revisão visual adicional foi implementada na branch `feat/padrao-visual-unificado`. A situação descrita no anexo era anterior à entrega 1.4.20; as 13 falhas ali citadas já tinham correções incorporadas e foram novamente verificadas. Esta entrega permanece exclusivamente na homologação, sem push, PR ou publicação em produção.

**Resultado:** 436 cenários de tela/perfil, em quatro larguras, totalizando 1.744 verificações responsivas. São 405 acessos permitidos e 31 testes negativos: 20 combinações das unidades desativadas de Armação e 11 cenários de Laboratório (dez telas e a entrada do módulo) recusados pela autoridade nativa de Suprimentos. Não há falha inesperada de carregamento/layout nem desvio visual detectado nos resultados finais. A divergência de integração Laboratório → Suprimentos continua dependendo de decisão; os testes negativos não certificam esse acesso como permitido.

## Matriz, capturas e alcance

- [Inventário completo](inventario.json): 139 entradas do catálogo, mais login, atualização, suporte, entradas de módulos, Conta/Recentes, Armação por unidade e rotas do GED fora do catálogo. São 182 entradas e 181 identificadores; o catálogo repete `formasPorSetor` em dois grupos.
- [Matriz consolidada](matriz.json) e [resumo das contagens](resumo-matriz.json).
- [Galeria com filtros de módulo, perfil e problema](galeria.html). Uma imagem por entrada/perfil/largura; aliases reutilizam a imagem do mesmo identificador. Todas as capturas finais são da 1.4.25, com abertura nova em cada largura. Os índices de módulos foram reabertos após a seleção assíncrona, incluindo a unidade Noroeste. Os resultados intermediários permanecem nos arquivos de diagnóstico.
- Larguras: **1440×900, 1024×768, 820×1180 e 390×844**. Foram inspecionados documento principal e iframes: respostas HTTP, console, conteúdo vazio, autorização, rolagem do corpo, imagens, fonte computada, gradiente, raios, caixa alta por CSS, estados, listas e títulos. A sobreposição de um drawer/modal com a página de fundo é tratada como sobreposição intencional.

| Contexto existente | Cenários | Permitidos | Negativos | Larguras verificadas |
| --- | ---: | ---: | ---: | ---: |
| Gerência/admin | 182 | 162 | 20 | 728 |
| Laboratório | 138 | 127 | 11 | 552 |
| PCP | 56 | 56 | 0 | 224 |
| Produção, com sessão própria do PCP | 19 | 19 | 0 | 76 |
| Qualidade | 17 | 17 | 0 | 68 |
| Suprimentos | 9 | 9 | 0 | 36 |
| Consulta | 15 | 15 | 0 | 60 |

Os contextos usam contas ativas e permissões existentes no banco de teste. As sessões de teste são assinadas pelo ambiente isolado e conferidas no servidor; não foi trocado o papel de uma conta para fazê-la passar. O login por senha também foi executado pelo formulário real. A matriz cobre rotas e estados acessíveis, não todas as combinações possíveis de registros e ações de negócio.

## Dados reais do cenário de teste

Data inicial: **18/11/2026, America/Sao_Paulo**. A validação atravessou a virada de data da aplicação; foi criada também uma carga identificada para **19/11/2026**, com dumps antes e sem alterar a configuração dos atalhos.

Com dumps anteriores, foram criadas programação e cinco concretagens identificadas por `TESTE-REVISAO-COMPLETA-20261118`. O Início lê as APIs existentes e mostra **20 programados, seis realizados, saldo de 14 e aderência de 30% no setor 1**. Um dos realizados já existia; os demais são os registros desta revisão. Os setores sem programação mostram `—` na aderência. Esse é o registro do cenário de 18/11. Para 19/11 foram criados 20 programados e cinco realizados, com saldo 15 e aderência de 25%; os números efetivamente lidos estão em `fluxos.json` e a carga em [seed-continuity-20261119.json](seed-continuity-20261119.json).

Na cópia de teste da conta Ricardo, foram habilitados oito itens reais de Meu acesso rápido, com todos os destinos conferidos no IAM. A opção de substituir o Início permanece desligada: os atalhos são acessados pelo botão correspondente, e os indicadores continuam disponíveis. Nenhuma resposta foi simulada e a validação de Origin permaneceu intacta. [Fluxos e números conferidos](fluxos.json).

Os bancos efetivamente usados pela porta 18446 são `pcp_visual_homolog_20261118` e `mapa_visual_homolog_20261118`. Uma primeira carga foi feita também na geração antiga de homologação, antes da confirmação do destino ativo; ela não alimenta essa URL. Ambas receberam dumps prévios e a mesma identificação de teste. A normalização posterior do setor para o contrato publicado `Setor 1` alterou apenas esses registros identificados, novamente com dump antes. [Carga ativa](seed-visual-results.json), [carga na geração antiga](seed-results.json), [correção dos registros de teste](seed-normalized.json).

## Correções desta revisão

| Problema | Causa e resultado |
| --- | --- |
| Título móvel ficava em Início | A busca exigia igualdade exata da URL. O roteador expõe o identificador resolvido; a navegação tenta URL exata, identificador e caminho sem parâmetros somente para entradas sem parâmetros. O fallback usa a trilha. Rotas cujo nome é Início recebem contexto do módulo/grupo. |
| Ajuda cobria o nome na Conta | A Conta reutilizava o menu absoluto do rodapé. Agora apresenta os mesmos destinos permitidos como linhas comuns; o menu suspenso fica no rodapé lateral. |
| Unidade do Laboratório no celular | O mapeamento dos grupos descartava os metadados de unidade, e o seletor era restrito a Produção. Os grupos preservam a unidade; Campinas/Noroeste podem ser alternadas e a abertura direta respeita o parâmetro. O teste abre uma página nova em cada largura e confere Noroeste explicitamente. |
| Ícone de documento repetido em todo lugar | O conjunto de traços passa a selecionar gráfico, calendário, documento, etiqueta, leitor, QR, lista, pasta, caixa, carrinho, caminhão, tendência e pessoa pelo tipo de destino. Destinos sem associação conhecida ficam sem ícone. |
| Textos genéricos, atalhos repetidos e botões redundantes | Foram retiradas as frases indicadas, o retorno Menu principal, Abrir em atalhos únicos e Ver início geral. Atalhos de grupos diferentes recebem contexto no rótulo. As descrições funcionais ficam limitadas a 50 caracteres; [lista completa dos textos](textos-escritos.md). |
| Listas, cartões e estados | Linhas dos módulos medidas em 40px, e 44px no celular. Indicadores usam faixa; filtros e blocos deixam de empilhar superfícies. Normal e Concluída aparecem como texto. As solicitações móveis usam item, número/solicitante e situação à direita, sem pares de rótulo/valor empilhados. |
| Abas móveis e Painel de Suprimentos | As abas usam linha com rolagem local e marca laranja. No painel incorporado ao celular, o título não é duplicado e Nova solicitação vem após a fila, conforme a referência. |
| Maiúsculas e elementos decorativos | A apresentação dos títulos e colunas usa caixa de frase, preservando siglas, identificadores e dados. Ícones em quadrados e números decorativos de blocos foram removidos da apresentação em tela. |
| 1 urgentes e 0 há mais de 24 h | O painel trata singular e zero. Há teste do renderizador para Nenhuma há mais de 24 h e 1 urgente, além da leitura real do painel. |
| Percentual sem programação e decimal com ponto | Dashboard e comparação mostram `—` sem divisor e usam vírgula. Campos numéricos do Laboratório mostram vírgula mantendo strings canônicas com ponto no payload; datas e identificadores não são convertidos. Foi testada a edição visual de 5,0 para 5,1 sem salvar critérios. |
| Fonte e cantos em páginas menos visíveis | Metodologia, relatórios CEC, certificados e painéis incorporados receberam os estilos compartilhados. Foram corrigidos cabeçalhos cortados e os raios de campos e do painel de liberação excepcional, sem mudar sua autorização. |
| GED fora do catálogo | As quatro páginas documentais usam Geist, indicadores em faixa e os tokens da casca. O modo de prévia deixou de expor GED a contas recusadas pela autoridade existente. A referência remota a Inter foi removida apenas do CSS do contêiner de teste, com backup e hash; o arquivo publicado permaneceu igual. O service worker revalida esse CSS sem incluir APIs no cache. [Evidência](ged-fonts.json). |
| Login desktop | A partir de 1025px, o painel escuro conserva logo e unidades; o formulário conserva título, campos e ação. O login até 1024px permanece congelado. |
| Logos do Laboratório | Não houve URL quebrada no estado final: recursos carregados e dimensões naturais válidas. Um apontamento transitório antes de a imagem terminar de carregar foi refeito aguardando a decodificação; não foi inventada uma alteração de URL para um erro não reproduzido. |

As fontes foram recompiladas para Modelo A, Qualidade/Tarefas, Logística e Laboratório/novo/Cronoanálise. Não foi editado JavaScript compilado à mão. O ajuste do GED remove somente um import de fonte do CSS gerado no contêiner isolado; a imagem e o contêiner publicados não foram alterados.

## As 13 falhas do anexo

O [diagnóstico anterior preservado](diagnostico-13-anterior.txt) permite distinguir defeitos de interface de problemas do teste/sessão. Todas as entradas abaixo passaram na nova matriz, nas quatro larguras.

| Perfil e tela | Diagnóstico e correção já incorporados, novamente verificados |
| --- | --- |
| Gerência · pdrProdutos | Campos da grade impunham largura mínima e faziam o corpo transbordar; limites de largura e `min-width:0` no formulário. |
| Gerência · rbrProdutos | Mesmo formulário compartilhado de produtos e mesma correção de largura. |
| Gerência · fechamentoDiario | O documento ainda referenciava bibliotecas CDN bloqueadas no teste isolado; usa cópias locais das mesmas versões. O ERP de teste permanece isolado. |
| Produção · programacaoSemanal12 | A casca consultava Armação/atalhos de Mapa numa sessão somente PCP; consultas condicionadas à existência de Mapa. |
| Produção · dashboard | Mesma consulta indevida e largura do canvas no celular; contexto e limites de gráfico corrigidos. O percentual sem programação recebeu a correção adicional desta revisão. |
| Produção · comparacao | Mesma consulta indevida e gráfico com largura mínima; o layout respeita o contêiner e o número usa vírgula. |
| Produção · armadurasProgramacao | Consulta de Armação sem sessão Mapa; a amostra anterior também pegava o documento ainda invisível. O teste aguarda a revelação real. |
| Produção · postesNumerosSerie | Consulta de Armação alheia ao contexto PCP; não é feita nessa sessão. Também foi validado o título ao abrir com parâmetros. |
| Produção · armadurasRelatorio | Mesma consulta indevida e amostragem do documento ainda invisível; sessão PCP e espera de prontidão verificadas. |
| Suprimentos · suprimentosSolicitacoes | O lote anterior declarava GERENCIA no cliente para a conta CONVIDADO e registrava 401 em `/me` e centros de custo. O teste usa o perfil devolvido pelo servidor e renova a sessão nativa. |
| Suprimentos · suprimentosPainel | Mesmo problema de contexto/sessão do lote; refeito sem alterar papéis. |
| Suprimentos · manutencaoUsina | Constava no lote com contexto divergente. O trecho preservado não contém a resposta HTTP individual desta subpágina, portanto não permite afirmar uma causa histórica mais específica. Não se reproduziu com a conta e a prontidão corretas. |
| Suprimentos · suprimentosNova | Revalidada com a identidade do servidor e a sessão nativa renovada; sem mudança de API ou de permissão. |

## Pendência que exige decisão

**Laboratório → Suprimentos:** a conta `user-alex` recebe os dez identificadores de Suprimentos no catálogo central, mas a autoridade nativa `/api/suprimentos/me` responde **403**. A recusa foi conferida antes dos casos e permanece registrada em [boundaries-laboratorio.json](boundaries-laboratorio.json). Não foi concedido um papel nem alterada API para eliminar o erro.

A causa provável é a divergência entre a concessão do catálogo central e a habilitação/vínculo de usuário na aplicação nativa. A proposta é conferir a intenção de acesso e alinhar o vínculo ou filtrar o catálogo pela autoridade nativa, preservando as regras existentes. Alterar essa integração fica condicionado ao seu aval, conforme a seção D do anexo; a pergunta correspondente foi enviada durante a execução.

**Armação:** as quatro unidades continuam com `enabled:false`. Seus 20 destinos foram verificados como recusas previstas; os formulários operacionais de unidades habilitadas não foram certificados por esses testes. A programação e os PDFs de armaduras do PCP são outro fluxo e passaram normalmente. Nenhuma unidade foi ativada para fazer a matriz passar.

## Validação e preservação

- [Checks](checks.json): gate **7/7**, trava visual e seus quatro testes, seis regressões de frontend, três verificações de contexto de setor, sintaxe dos scripts alterados, **27 testes do Laboratório** e **13 de interface/acessibilidade de Tarefas**. [Builds](builds.json).
- [Login e logout reais](login-logout.json): conta fornecida, formulário real, Sair visível, sessão **401** após sair e tokens locais removidos. A senha não foi gravada em artefatos.
- [Login estreito](login-comparison.json): comparação pixel a pixel com a versão 1.4.6 em 1024, 820 e 390px, excluindo somente os 28px inferiores da versão.
- [PDFs](pdf-verification.json): emissões originais de armaduras e séries idênticas por SHA-256. Os estilos da revisão são de tela; o mecanismo de impressão preserva a apresentação anterior, e a nova lista compacta móvel é excluída da impressão. [Conferência dos fluxos existentes](final-flows.json).
- [Service worker](service-worker.json): aba real mantida na 1.4.24 e atualizada para **1.4.25**, sem limpar cache manualmente. O tratamento de CSS do GED não intercepta APIs, coberto por regressão.
- [Auditoria estática](final-release-audit.json): **199 arquivos públicos acumulados e 66 assets dos serviços** conferidos por hash. O pacote acumulado também elimina diferenças de bytes de CRLF/LF entre arquivos logicamente iguais.
- [Produção](production-audit.json): **893 arquivos e 23 serviços** conferidos, sem alteração de arquivos ou processos persistentes. Jobs `oneshot` agendados são identificados separadamente. Nenhum banco de produção foi conectado.
- [IAM](iam-audit.json): perfis das 64 contas do Mapa e 24 do PCP, 667 permissões de tela, 21 de ação e 17 vínculos de identidade iguais aos dumps anteriores. A configuração de atalhos e os registros identificados de teste são as alterações de dados autorizadas.

As rodadas intermediárias foram preservadas para diagnóstico. Tempos excessivos do auditor em árvores grandes do Mapa foram resolvidos limitando a análise de sobreposição aos títulos visíveis e reduzindo concorrência. Um timeout de acessibilidade foi repetido com um worker e passou, sem suprimir regras. O validador de sintaxe também passou a reconhecer imports ESM minificados sem espaço, emitidos pelo bundler; os 116 blocos foram novamente analisados pelo Node. Esses eventos do teste não foram apresentados como correções da aplicação.

## Arquivos e roteiro de revisão

[Fontes e scripts alterados](arquivos-fonte-alterados.txt) · [lista completa do commit](arquivos-repositorio.txt) · [manifesto público](final-public-manifest.json) · [assets de serviços](service-manifest.json) · [descrições escritas](textos-escritos.md) · [referências f2](../../telas/f2-inicio.html).

1. Abra a **18446**, confirme a faixa de teste e **1.4.25**, entre e saia.
2. No Início, confira 20 programados, cinco realizados e saldo 15 para 19/11/2026 (o cenário anterior de 18/11 foi preservado). Abra Meu acesso rápido e seus oito itens reais.
3. Compare Planejamento, Laboratório e Suprimentos com as referências. Confira ícones, linhas, descrições, abas e o painel de solicitações no celular.
4. Abra Números de série com data/semana e confira o título móvel. Em Conta, abra as duas opções de Ajuda em lista.
5. Consulte Dashboard/Comparação sem programação: `—`, sem percentual vermelho indevido. Em Critérios do Laboratório, confira a vírgula sem salvar alterações.
6. Confira CEC, certificados, GED, Produção e os dois Fechamentos; gere os PDFs de referência e compare a galeria. Os dados são snapshots e registros de teste, não posição atual de produção.

**Parada:** aguardar sua revisão e decisão sobre a integração pendente. Produção só será publicada com a instrução escrita **“aprovado, publicar em produção”**.
