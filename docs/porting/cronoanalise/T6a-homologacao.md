# T6a · Homologação do Laboratório › Cronoanálise — 18/10/2026

## Destino e execução

- Casca e gateway isolados: `/opt/concrefer-unificado/homolog-next/public` e `homolog-next/mapa-api`, serviço `unificado-homolog-mapa.service` na porta interna 13152.
- Laboratório isolado: `/opt/concrefer-unificado/homolog/laboratorio/service`, serviço `laboratorio-homolog.service` na porta interna 13065.
- Banco do Laboratório: `concretrack_postes_homolog`, schema novo `cronoanalise`; banco de autenticação: `mapa_unificado_homolog_20261016`, schema `unificado_auth`.
- Scripts SQL `001_schema.sql`, `002_seeds.sql` e `cronoanalise_permissions_20261018.sql` aplicados. Backup prévio do código e do schema de autenticação em `/opt/concrefer-unificado/homolog/backups/cronoanalise-20261018-195508`. O primeiro diretório `...-195437` foi criado antes de o script parar por apontar ao banco de autenticação errado; não houve migração nem instalação nessa tentativa. A segunda tentativa instalou o código e reiniciou somente os dois serviços de homologação.
- O teste HTTP imediato do script encontrou o Laboratório ainda iniciando. Em seguida, os dois serviços ficaram ativos e `/health` e `/cronoanalise` responderam 200. O script foi corrigido para esperar ambos os health checks antes de concluir; essa versão está registrada para eventual repetição.
- O menu lateral Modelo A foi compilado a partir de `navConfig.ts` com apenas o novo grupo. A compilação sem esse grupo reproduziu **exatamente** o SHA-256 do bundle remoto anterior (`a2ff1df5...`), confirmando que o novo bundle inclui somente a adição do Cronoanálise. O bundle instalado tem SHA-256 `3c726ad3...`. O patch isolado está em [modelo-a-navConfig.patch](integracao/modelo-a-navConfig.patch); os demais deltas de integração estão em [homolog-deltas.patch](integracao/homolog-deltas.patch).

## Inventário antes/depois

- Inventários integrais: [antes](T6a-inventario-antes.txt) e [depois](T6a-inventario-depois.txt).
- Comparação dos conjuntos de portas em escuta: **0 adicionadas, 0 removidas**. Comparação dos serviços ativos: **0 adicionados, 0 removidos**. `nginx -t` passou; nenhuma configuração NGINX foi alterada.
- O inventário posterior mostra o schema `cronoanalise` apenas no banco `concretrack_postes_homolog`; o banco descartável de testes `cronoanalise_test_api_20261018` foi removido. Os serviços de homologação e `concretrack-unificado.service` seguem ativos.

## Testes e capturas

| Verificação | Resultado |
| --- | --- |
| Smoke autenticado da Cronoanálise | Três rotas HTTP 200; `/status` com zero medições; 40 atividades; as sete telas no menu; sete caixas de tela e três de ação no editor de usuários. |
| Usuário sem permissão de Laboratório | Solicitações à tela e API redirecionadas para login (302 sem seguir redirect). |
| Editor de Qualidade | Presets existentes passaram para Ricardo e Marcelo, sem overflow. |
| Limites do Unificado | `modelo_a_gate.py`: 7/7 no endereço de homologação, com resposta anônima esperada 401 no PCP. |
| PCP, Mapa, GED, Laboratório | Rotas autenticadas carregaram nos seus iframes; capturas registradas. |
| Testes Python novos | 8 passaram. |
| Testes frontend do Laboratório | 23 passaram; a única suíte com falha continua sendo a fixture ausente `fl-pro-22.json`. |
| Testes npm da raiz | Persistem somente as duas falhas de linha de base, `dashboard-contracts` e `mapa-promocao-producao`; nenhuma falha nova. |

Capturas: [Cronoanálise na casca](capturas-T6a/cronoanalise-casca-desktop.png), [sete itens do menu](capturas-T6a/cronoanalise-menu-desktop.png), [caixas de permissões](capturas-T6a/cronoanalise-permissoes.png), [PCP](capturas-T6a/regressao-pcp.png), [Mapa](capturas-T6a/regressao-mapa.png), [GED](capturas-T6a/regressao-ged.png) e [Laboratório](capturas-T6a/regressao-laboratorio.png).

## Próxima etapa

**Parar após T6a.** T6b em `/opt/concrefer-unificado` e `concretrack-unificado.service` depende de aprovação expressa da homologação pelo usuário. Nenhum arquivo, serviço ou banco de produção foi publicado nesta etapa.
