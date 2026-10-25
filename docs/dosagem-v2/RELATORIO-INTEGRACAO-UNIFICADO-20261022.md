# Dosagem no Laboratório do Unificado — 22/10/2026

## Resultado

- URL: `https://concrefer.concretrack.com.br/unificado/?view=laboratorio%2Fdosagem%2F`.
- Menu Modelo A e menu alternativo: `Laboratório > Dosagem`. A casca abre a aplicação oficial `https://dosagem.concretrack.com.br/` em um iframe, preservando seus módulos, métodos por empacotamento e por volume, API, dados e impressão. A autenticação da Dosagem continua própria; entrar no Unificado não cria automaticamente uma sessão na Dosagem.
- O catálogo de permissões do Unificado ganhou `labDosagem`. Ricardo recebe a tela pelas regras de acesso existentes; usuários sem concessão ao Laboratório não a recebem. A API da Dosagem continua exigindo sua própria autorização.

## Publicação

- VPS Concrefer: nove arquivos publicados em `/opt/concrefer-unificado`, versão da casca `1.0.28`. Serviço `mapa-unificado-auth.service` reiniciado para carregar o catálogo e permaneceu ativo. Pacote SHA-256 `3aec054c13a9ec7ce906b43ab92c8f0a1883f8170b3be5670abad01912563837`, em `/root/dosagem-unificado-20261022/`.
- Backup dos nove arquivos anteriores: `/root/dosagem-unificado-20261022/before.tar.gz`; hash em `before.sha256`. A Dosagem oficial na VPS antiga não foi modificada.
- Ponte do Hub: commit isolado `0de17282` em `ricamaral01/pwa-hub`, contendo **somente** `auth/ponte-dosagem.html`, publicado pelo GitHub Pages. O build terminou com status `built` e a URL `https://usina.concretrack.com.br/auth/ponte-dosagem.html` passou de HTTP 404 a 200.

## Verificações

- Build do menu React/TypeScript: aprovado. `node --check` para `menu.config.js`, `shell.js` e `router.js`: aprovado. Catálogo JSON: 68 entradas; as 67 anteriores da produção foram preservadas e somente `labDosagem` foi adicionado. Verificação de Ricardo autorizado e usuário comum sem concessão: aprovada.
- Navegador de teste com sessão sintética do Unificado e permissão de tela **simulada apenas no teste**: link visível, casca na rota esperada, breadcrumb `Laboratório / Dosagem`, iframe visível e login público da Dosagem carregado. Repetido com os arquivos **publicados**, sem substituir scripts no navegador. Captura: `capturas/unificado-dosagem-published-20261022.png`.
- Login pelo Hub no iframe: após publicar a ponte, o botão abre a página do Hub. Na sessão de teste sem login no Hub, a mensagem correta foi `Entre no Hub antes de abrir a Dosagem.`. A troca de ticket com usuário Hub autenticado não foi executada nesta verificação.
- HTTP 200: casca, login do Unificado, menu, roteador, bundle do menu, login da Dosagem e `/api/v1/saude`; serviço de autenticação do Unificado ativo. Arquivos publicados conferidos contra o pacote.

## Limites da verificação

Os fluxos autenticados da Dosagem dentro do iframe (salvar, reabrir e imprimir um traço de cada método) dependem da conta do usuário e não foram repetidos nesta rodada. Os fluxos já haviam passado em homologação e o usuário confirmou a conferência na aplicação oficial antes desta integração. A validação do iframe comprovou o carregamento e a navegação pública; não equivale a uma execução autenticada dos cálculos na nova casca.
