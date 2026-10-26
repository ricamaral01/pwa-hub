# Revisão dos links e da Home do Unificado — 26/10/2026

## Problemas reproduzidos

- A Home numerava Suprimentos e PedeRH como `07`; os nove cartões ocupavam seis colunas estreitas em 1366 px.
- Em Qualidade, o cartão **Emitir certificado de qualidade** navegava dentro da guia atual. A página do módulo ficava visível durante o carregamento do iframe.
- **Resultados de bancada** constava no menu, mas não era reconhecido pelo roteador da casca.
- Cinco URLs de Produção Pederneiras respondiam HTTP 403: a autorização do Mapa não relacionava `?tab=` aos cinco IDs já cadastrados.
- O Dashboard de Planejamento não abria para Ricardo quando só a sessão do Mapa estava presente, embora a ponte PCP emitisse um token válido.
- As 14 URLs diretas da Dosagem respondem HTTP 404 porque ela é montada como tela nativa da casca. Os links clicáveis agora apontam para `?view=laboratorio/dosagem/`, que carrega o módulo.

## Alterações

- Certificados da página de Qualidade abrem uma **nova guia da casca**, preservando o bootstrap do Laboratório. A página de origem permanece no lugar.
- Links das páginas de entrada e do menu legado usam a rota da casca como destino de nova guia; o clique normal mantém a navegação interna.
- O roteador reconhece Resultados de bancada, esconde imediatamente a página de entrada ao abrir uma tela e usa a ponte PCP antes de exigir uma sessão PCP prévia.
- O autorizador associa as cinco abas de Pederneiras às respectivas permissões; as entradas do catálogo em produção foram registradas no Git.
- A Home usa cartões com largura mínima de 260 px e numeração sequencial de `01` a `09` para o perfil master testado.
- `VERSION`, `APP_VERSION` e cache do service worker: **1.0.102**.

## Verificação

| Verificação | Resultado |
| --- | --- |
| Rotas do catálogo autenticadas em produção | 108 verificadas; 94 HTTP 200, 14 URLs brutas da Dosagem HTTP 404 por serem nativas |
| Links clicáveis da Dosagem | Rota da casca HTTP 200; montagem nativa confirmada, sem tela de acesso negado |
| Pederneiras | 5/5 URLs HTTP 200 após a correção |
| Primeira tela de Planejamento, Produção, Qualidade, Laboratório, Usinas, GED e Suprimentos | **7/7** abertas com Ricardo; zero erros de página |
| Página de entrada dos sete módulos | 1366×768, 820×1180 e 390×844: zero rolagem horizontal, zero texto U+FFFD, zero cartão com conteúdo estourado |
| Home e certificados | 1366×768 e 390×844: numeração 01–09; certificado em segunda guia; zero 404 de JS/CSS/fonte |
| PedeRH e FaleAqui | Links externos HTTP 200 |
| Testes locais | `test_pederneiras_screen_access.py` e `test_cq_screen_access.py`: 2/2; sintaxe JS aprovada |

Capturas da Home em homologação: [desktop](capturas/links-20261026/home-1366.png) e [celular](capturas/links-20261026/home-390.png).

Homologação recebeu a versão 1.0.102 antes da produção. As páginas estáticas de Pederneiras e o bundle nativo da Dosagem não estão instalados em `:18446`; a autorização foi testada lá e a abertura completa foi confirmada em produção. O deploy verificou `nginx -t`, serviço ativo, versão servida e HTTP 200 da casca. Backups para retorno: `/opt/concrefer-unificado/backups/unificado-links-stage-20261026T121558Z` e `/opt/concrefer-unificado/backups/unificado-links-production-20261026T121633Z`.

A captura antiga de Qualidade em `docs/certificado-qualidade/evidencias/navegacao-20261026/production/qualidade-1366x768.png` foi regenerada pelo teste de leitura, mas não integra este commit.
