# Mão de Obra mobile — etapa 3 no ambiente de teste

**Endereço:** `https://concrefer.concretrack.com.br:18446/unificado/?view=pcp%2Fmaodeobra%2F`  
**Estado:** vista funcional publicada somente no `:18446`. Produção não foi alterada. Instalador e PWA dedicado pertencem à etapa 5.

## O que está ligado

| Tela | Comportamento no teste |
|---|---|
| 1 · Lançamento | Atividades e ordem vêm do cadastro; `GET /dia` traz os valores e a situação. Autor e horário são mostrados quando existem; no legado aparece “Horário e usuário indisponíveis”. Rascunho local separado por usuário, data e grupo. |
| 2 · Conferência | Totais vêm de `MaoDeObraCore`; lista valores alterados. Se `lancado=true`, avisa que o envio substitui o grupo. Enviar fica indisponível enquanto o POST está pendente. |
| 3 · Enviado | Mostra apenas os metadados da resposta do servidor (ou do GET que confirmou um POST após timeout). Apaga o rascunho confirmado. |
| 4 · Erro | Mantém os valores digitados. Após falha de rede, faz `GET /dia` antes de permitir novo POST; sem acesso ao servidor mantém o erro, sem reenvio automático. |
| 5 · Sem produção | Motivo opcional, até 255 caracteres, enviado no mesmo `POST /api/maodeobra/grupo`; atividades zeradas. |
| 6 · Histórico | Usa `GET /api/maodeobra/resumo` em janelas de 31 dias, com filtro de grupo e fim de período selecionável. Tocar num grupo abre a tela 1 na data correspondente. |

A vista mobile usa `MaoDeObraCore` para leitura, ordenação, validação, totais, POST e confirmação após timeout; não calcula nem valida valores por conta própria. `todayISO()` do PCP usa `America/Sao_Paulo`. O desktop continua com a tabela anterior.

No celular, esta rota ocupa a altura útil do quadro do Unificado. O botão Voltar retorna à casca. A mudança visual da casca é ativada apenas enquanto o iframe Mão de Obra está ativo em largura até 600 px. A correção de sessão expirada encaminha ao login com `next=pcp/maodeobra/`, preservando o rascunho para a volta. O aviso amarelo do ambiente de teste permanece visível uma vez.

## Verificações no `:18446`

| Cenário | Resultado |
|---|---|
| Android Chromium emulado, 360/390/430 px | Sem rolagem horizontal; S1/S2 e S3/S4 lançados; `12,5` aceito, `1,25` bloqueado. |
| Reenvio | Aviso de substituição; valores substituídos no mesmo dia/grupo. |
| Sem produção | Com “Chuva” e sem motivo; banco confirma zero, motivo e limpeza no novo envio. |
| Modo avião simulado | Todas as chamadas PCP foram interrompidas. Valores e rascunho permaneceram; tentar novamente offline não fez outro POST; após reconexão, `GET /dia` precedeu o envio. |
| Sessão expirada | Token inválido levou ao login do Unificado e retornou à rota; rascunho `1,5` reapareceu na mesma data/grupo. |
| Sem permissão de escrita | Conta PCP `CONSULTA` existente não abriu a tela (regra atual do catálogo) e o POST retornou **403**. Nenhuma permissão ou conta foi alterada. |
| Banco de teste | Após cada envio automatizado, conferidos grupo, total, sem produção, motivo, `salvo_em` e `salvo_por_usuario_id`. Registros das datas fictícias foram removidos apenas do banco de teste. |
| iPhone WebKit emulado | Lançamento, conferência, POST, histórico e total 12,5 no banco passaram. |
| Desktop 1440 px | Salvar, reenviar e sem produção passaram novamente; layout desktop permaneceu. |

Scripts: `tests/pcp/maodeobra_stage3_homolog.py`, `maodeobra_stage3_ios_homolog.py`, `maodeobra_stage3_access_homolog.py` e regressão `maodeobra_stage2_homolog.py`.

## Capturas e vídeo

- Android emulado: [lançamento 360 px](capturas-etapa3-teste/01-lancamento-android-360-emulado.png), [lançamento 390 px](capturas-etapa3-teste/01-lancamento-android-emulado.png), [lançamento 430 px](capturas-etapa3-teste/01-lancamento-android-430-emulado.png), [conferência](capturas-etapa3-teste/02-conferencia-android-emulado.png), [enviado](capturas-etapa3-teste/03-enviado-android-emulado.png), [erro](capturas-etapa3-teste/04-erro-android-emulado.png), [sem produção](capturas-etapa3-teste/05-sem-producao-android-emulado.png), [histórico](capturas-etapa3-teste/06-historico-android-emulado.png).
- iPhone WebKit emulado: [lançamento](capturas-etapa3-teste/01-lancamento-iphone-emulado.png), [conferência](capturas-etapa3-teste/02-conferencia-iphone-emulado.png), [enviado](capturas-etapa3-teste/03-enviado-iphone-emulado.png), [histórico](capturas-etapa3-teste/06-historico-iphone-emulado.png), [vídeo curto](capturas-etapa3-teste/fluxo-iphone-emulado.webm).

**Aparelhos reais:** o Ricardo informou que enviará as gravações do Android e do iPhone. Ainda não recebidas; por isso, os testes em aparelhos reais permanecem pendentes e as capturas acima estão identificadas como emulação. Não declarar aceite final da etapa com base apenas nelas.

## Arquivos alterados ou criados

- `unificado/pcp/static/js/maodeobra-mobile.js` (novo); `unificado/pcp/static/css/maodeobra-mobile.css` (novo)
- `unificado/pcp/maodeobra/index.html` (carrega a vista em largura de celular); `unificado/pcp/static/js/app.js` (`todayISO`)
- `unificado/shell/shell.js` e `unificado/index.html` (retorno ao login ao expirar token PCP sem sessão Mapa, com versão de cache atualizada)
- Três scripts de homologação citados acima, capturas, vídeo e este relatório.

Os arquivos anteriores da homologação foram salvos em `/root/backups/pcp-homolog-maodeobra-stage3-before-20261017.tgz` e `/root/backups/unificado-homolog-maodeobra-session-before-20261017.tgz`. Os arquivos de PCP alterados na etapa 2 e o banco permanecem isolados. Nenhum manifesto ou service worker foi criado ou alterado nesta etapa.

**Próximo gate:** validar as gravações em Android e iPhone reais e obter aprovação antes de iniciar a etapa seguinte. Produção permanece sem mudança.

## Ajuste após o primeiro teste em Android real (17/10)

O Ricardo relatou que tocar em `+` no lançamento parecia atualizar a página. A causa era `render()` no manipulador do botão, que recriava toda a tela a cada toque. Os botões `+` e `−` agora atualizam apenas o campo, o rascunho e os totais; o nó do campo e a posição de rolagem permanecem. O script recebeu versão de URL `20261017-stage3-stepper1` para evitar o arquivo antigo em cache. O ajuste foi publicado apenas em `:18446`, com backup em `/root/backups/pcp-homolog-maodeobra-stepper-before-20261017.tgz`.

O teste `tests/pcp/maodeobra_stage3_stepper_homolog.py` repetiu `+`, `+`, `−`, `+` no Android Chromium e iPhone WebKit emulados: valor e total corretos, mesmo nó de entrada, rolagem preservada, sem navegação e sem POST. Ainda falta repetir em aparelhos reais e receber as gravações para concluir o gate da etapa 3. Nenhum dado de produção foi alterado.

Após o relato de que o problema ainda ocorria em S3/S4, o teste foi ampliado para tocar `+` na primeira, na intermediária e na última atividade do grupo, com o campo selecionado, nos dois navegadores emulados. Não houve recriação do campo, navegação ou POST. O arquivo publicado em `:18446` tem o hash SHA-256 `cf4d248633865760b3d2ccf4b47f5bc8a389d225c33a2e79f65a7ff28f1983ba`, e o HTML aponta para a versão `stage3-stepper1`. Como o script anterior era servido com cache `immutable`, uma aba que continuou aberta antes do ajuste pode seguir executando-o; isso ainda precisa ser confirmado no Android real. Foi solicitado fechar e reabrir a aba e enviar vídeo caso o sintoma persista.

### Diagnóstico confirmado pela gravação do Android

A gravação `WhatsApp Video 2026-10-17 at 14.13.16.mp4` mostra o título “Mão de Obra — protótipo” e a faixa “Protótipo visual · dados de exemplo · nenhum envio real”. O telefone abriu `/unificado/m/maodeobra/prototipo/`, a demonstração da etapa 1, e não `/unificado/?view=pcp%2Fmaodeobra%2F`, a vista funcional da etapa 3. O código do protótipo chamava `render()` a cada toque em `+` ou `−`, recriando a lista e voltando a rolagem; a hipótese de cache da vista funcional não explicava essa gravação. Os números digitados nela eram dados locais do protótipo e não foram enviados à API.

O protótipo foi corrigido para atualizar somente o campo e os totais, sem recriar a lista, e sua faixa passou a oferecer “Abrir teste funcional”. A versão do script mudou para `20261017-stepper1`. Backup do teste: `/root/backups/pcp-homolog-maodeobra-prototype-stepper-before-20261017.tgz`. `tests/pcp/maodeobra_prototype_stepper.py` passou tanto localmente quanto na URL publicada de `:18446`, em S1/S2 e S3/S4, confirmando campo e rolagem preservados. A etapa 3 continua aguardando o teste real da **vista funcional** no Android e no iPhone; produção continua intacta.

### Primeiro envio confirmado em Android real

Após abrir a vista funcional, Ricardo informou que lançou o dia 17/10 pelo celular. Consulta somente leitura ao banco isolado `pcp_unificado_homolog_20261016` confirmou `maodeobra_dias` para `2026-10-17`, grupo `12` (S1/S2), `sem_producao=false`, salvo por Ricardo às **14:38:29** no fuso `America/Sao_Paulo`. Sete atividades foram gravadas: subtotal MOD **20**, MOI **46,5**, total **66,5**. Nenhum registro do grupo S3/S4 foi encontrado nessa consulta. O lançamento real do usuário foi preservado; nenhuma limpeza foi executada. Isso confirma o POST desse caso no Android, mas ainda faltam as demais verificações em aparelhos reais previstas para a etapa 3, especialmente o iPhone.

**Regra posterior de ratificação:** a implementação e as evidências estão em [etapa-3-confirmacao.md](etapa-3-confirmacao.md). A confirmação foi adicionada apenas ao ambiente de teste e aguarda aprovação.
