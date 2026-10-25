# E7 — Homologação isolada do Suprimentos S0–S1

**Data:** 25/10/2026. **Branch local:** `feat/suprimentos-s0-s1`. **Ambiente alterado:** apenas a homologação da VPS nova em `https://concrefer.concretrack.com.br:18446`. Nenhum deploy em produção, nenhuma alteração na VPS antiga e nenhum `git push`.

## Ambiente, backup e instalação

O vhost ativo de `:18446` aponta para `/opt/concrefer-unificado/homolog-next/` (o plano citava `/homolog/`). A porta 13067 estava ocupada por um serviço de Dosagem na VPS nova; o serviço do Suprimentos foi isolado em **127.0.0.1:13167**. O gateway do Unificado nessa homologação usa 127.0.0.1:13152. A instalação usou a árvore ativa como base e aplicou somente os trechos do Suprimentos, preservando as adaptações atuais da casca e do Mapa dessa homologação.

Antes da instalação, `deploy/backup-homolog.sh` salvou em `/opt/concrefer-unificado/homolog-next/backups/suprimentos-s1-20261025T171546Z/` um arquivo compactado da casca, gateway, catálogo e nginx, hashes e modos de arquivo, dump PostgreSQL das concessões e o snapshot das cinco contas reais. Diretório modo 0700, arquivos sensíveis modo 0600; o dump foi conferido com `pg_restore --list`.

Foram criados o banco `suprimentos_homolog_20261025`, o papel PostgreSQL exclusivo, o usuário de serviço `concrefer-suprimentos`, o serviço `suprimentos-homolog.service`, o timer `suprimentos-fechamento.timer`, as locations nginx com `auth_request`, e a pasta privada de fotos fora de `public`. As migrations 0001–0004 chegaram a `head`. As flags S0 e S1 estão ativas **somente nessa homologação**. A conta `ricardo.teste` recebeu ADMIN da unidade Campinas e acesso às cinco telas; não recebeu APROVADOR, conforme D7.

`nginx -t` passou antes do reload. Serviço e timer estão `active`; health e flags responderam. Os arquivos públicos do módulo estão em 0755/0644, legíveis por `www-data`; diretórios de dados privados em 0700; envs em 0600. Nenhum arquivo novo do módulo tem escrita de grupo ou mundo. `VERSION`, `APP_VERSION` e a chave do cache do SW da casca estão em **1.0.59**. O SW próprio do PWA usa escopo `/unificado/suprimentos/pwa/`.

## Validação e retorno

O primeiro comando de instalação encontrou a health ainda em inicialização. O retorno automático foi acionado e concluiu; o script passou a esperar a health em dez sondagens de 0,5 s. A instalação seguinte passou. Foi executado ainda um teste de **retorno deliberado**: serviço e timer pararam, as locations e arquivos da casca foram restaurados, o nginx passou no teste e a versão voltou a 1.0.58. As cinco contas mantiveram exatamente seus acessos anteriores. A reinstalação voltou a 1.0.59 e passou novamente no smoke. O retorno conserva o banco e as concessões novas, que ficam inertes sem catálogo/rotas; não apaga dados gerados na homologação.

| Verificação | Resultado |
|---|---|
| Smoke HTTP autenticado em `:18446` | **43/43** após a reinstalação: seis logins e bootstraps, telas/PWA, catálogo, criação idempotente com cinco reenvios, aprovação em dois níveis, separação, entrega, confirmação e negativas 401/403. [Resultado](e7-smoke-final.json). |
| Acessos existentes | 5/5 conjuntos de IDs anteriores idênticos antes e depois; somente cinco telas do Suprimentos foram adicionadas às contas elegíveis. [Antes](e7-screen-access-before.json) · [Depois](e7-screen-access-final.json). |
| PC, tablet e celular | Playwright autenticado em 1440×900, 820×1180 e 390×844; sem rolagem horizontal. [Capturas](capturas/e7/). |
| PWA offline | Em Chrome/Playwright, o SW assumiu a página após recarregar e a tela abriu com a rede desligada. Manifesto, SW e start URL servidos por HTTPS. |
| Lighthouse 10 PWA em HTTPS | **0,89**. A auditoria do Lighthouse marcou controle do SW como 0; a verificação funcional acima passou. A nota não é apresentada como 1,00. |
| Permissões de arquivo | Serviço com usuário próprio; `www-data` lê o PWA; envs 0600, fotos 0700; nenhum 777/666 novo. |

Os testes de API não exibem senhas ou cookies no resultado. As capturas são de contas e dados sintéticos. Os arquivos de apoio do deploy e dos testes estão em `unificado/suprimentos/deploy/` e `tests/suprimentos/`.

## URLs e contas para validação

- Casca e painel: <https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos%2Fpainel%2F>
- Tela direta de solicitações: <https://concrefer.concretrack.com.br:18446/unificado/suprimentos/solicitacoes/>
- PWA instalável: <https://concrefer.concretrack.com.br:18446/unificado/suprimentos/pwa/>

As senhas geradas estão **fora do repositório**, no computador do usuário em `C:\Users\Admin\Downloads\suprimentos-homolog-logins-20261025.json`, e no backup protegido da homologação. Usuários de teste:

| Login | Papel | Uso no roteiro |
|---|---|---|
| `e2e-suprimentos-sol` | SOLICITANTE | Abrir pedido e confirmar entrega |
| `e2e-suprimentos-aprov1` | APROVADOR nível 1 | Primeira aprovação |
| `e2e-suprimentos-aprov2` | APROVADOR nível 2 | Segunda aprovação |
| `e2e-suprimentos-almox` | ALMOXARIFE | Separar e entregar |
| `e2e-suprimentos-compras` | COMPRADOR | Informar preço da cotação nesta S1 |
| `e2e-suprimentos-qualidade` | QUALIDADE | Conferir leitura e negativa de aprovação |
| `ricardo.teste` | ADMIN Campinas | Validar telas/cadastros; não aprova sem papel APROVADOR |

O centro de custo de teste é `E2E-SUP` (Produção Campinas · homologação). As alçadas e SLA marcados `a_confirmar` continuam provisórios; não habilitar usuários reais antes de parametrizar esses valores e cadastrar CC, materiais e papéis reais.

## Roteiro para conferência manual

1. **PC:** entre no Unificado em `:18446` com SOLICITANTE. Abra o painel e Solicitações, crie um pedido no CC `E2E-SUP` e confira a numeração/estado. Com COMPRADOR, informe valor acima da primeira alçada; com APROVADOR 1 e 2, aprove em ordem. Com ALMOXARIFE, separe e entregue; com SOLICITANTE, confirme.
2. **Tablet:** em 820 px, repita a consulta do painel, lista e detalhe; abra o menu, confira os cinco acessos conforme o papel, navegue sem rolagem horizontal e tente aprovar com QUALIDADE para confirmar o bloqueio.
3. **Celular:** abra o link do PWA, instale pelo menu do Chrome/Android ou “Adicionar à Tela de Início” no Safari/iPhone. Crie pedido e foto em conexão normal; desligue a rede, reabra o app e registre outro pedido. Religue a rede, confira envio sem duplicata e preservação da fila se a sessão expirar. O teste automático cobre Chrome móvel; a instalação em Safari físico continua como conferência manual.

**Limite da entrega:** S0–S1 de Campinas em homologação. S2–S4, valores definitivos das alçadas e cadastros reais permanecem para etapas futuras.
