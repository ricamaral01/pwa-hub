# Acesso dos masters e certificados — 26/10/2026

## Resultado

O menu e a regra de acesso estão em homologação (`:18446`) e produção. A rota Nginx da Dosagem nativa foi ativada em produção, onde o serviço está instalado; não há backend isolado de Dosagem em `:18446`. A versão publicada da casca é **1.0.97**. Os logins IAM `user-ricardo`, `philippe`, `alex` e `marcelo` recebem todas as telas distintas do catálogo do Unificado. O catálogo tem 94 linhas e 93 IDs distintos, pois `formasPorSetor` já aparece duas vezes.

No menu de **Qualidade → Certificados**, aparecem **Certificados de qualidade** e **Certificados de ensaios**. O segundo abre o histórico de ensaios de postes, onde o documento disponível é o **Laudo PDF**. Não foi encontrada uma emissão independente chamada “certificado de ensaios”; a navegação aponta para o documento existente, sem mudar o conteúdo do laudo.

## Causas e correções

| Problema | Causa encontrada | Correção |
| --- | --- | --- |
| Ricardo não via Dosagem | O menu Modelo A publicado em 1.0.95 omitia Dosagem, CEC e Usina, embora o catálogo e o menu alternativo os tivessem | Recolocados esses grupos no Modelo A |
| Dosagem ainda não carregava ao abrir | O serviço `concrefer-dosagem-native.service` estava ativo, mas o vhost não incluía `laboratorio-dosagem-native.conf` | Include instalado no Nginx; o JS nativo e a API voltaram a responder |
| Certificados ausentes de Qualidade | Os links estavam somente em Laboratório | Adicionado grupo Certificados em Qualidade nos dois menus; links originais mantidos em Laboratório |
| Philippe sem acesso master | `philippe` faltava nas listas de masters do IAM, casca e administração de usuários | Incluído nas listas; todos os quatro recebem também Cronoanálise e cartas de traço |
| Acessos efetivos divergentes | Ricardo tinha conta PCP ADMIN arquivada; Philippe não tinha papéis no Suprimentos nem vínculo no GED | Conta PCP de Ricardo reativada; Philippe recebeu ADMIN e APROVADOR níveis 1 e 2 em Campinas e vínculo GED `ADMIN_MASTER` |

Outras telas cadastradas que faltavam no menu Modelo A também foram recolocadas: Fechamento diário, Carta de traço e MCC, e Usuários do Laboratório. `prodUsuarios`, `pcpUsuarios` e `labHelp` continuam no rodapé; `qualidadeTratativa` é rota de um registro específico.

## Verificação

- Sintaxe Python, JSON e JavaScript: válida; `nginx -t`: aprovado.
- Menus: `labCertificados` e `labTests` aparecem em Qualidade; Dosagem, Carta de traço, Usuários do Laboratório e Fechamento diário resolvem para as URLs esperadas.
- Para **cada um dos quatro usuários**, uma sessão de verificação assinada pelo próprio IAM retornou: 93 IDs de tela, sessão PCP `ADMIN` HTTP 200, bootstrap Suprimentos HTTP 200, bootstrap Laboratório HTTP 200, JS e API de saúde da Dosagem HTTP 200, Certificados de qualidade HTTP 200, histórico/laudos de ensaios HTTP 200 e sessão GED HTTP 200. Os tokens de verificação não foram registrados.
- `mapa-unificado-auth.service`, `cq-laboratorio.service`, `suprimentos-prod.service` e `concrefer-dosagem-native.service`: ativos.
- Versão, HTML e ativos da casca foram verificados em `:18446` e produção; arquivos publicados conferidos com os candidatos por `cmp`.
- Arquivos de produção continuam `root:root` modo `0644`; backups `root:root` modo `0700`.

## Publicação e retorno

O deploy atualiza somente os arquivos listados em [deploy-master-access-quality-20261026.sh](../../deploy/scripts/deploy-master-access-quality-20261026.sh); a transformação verificável das cópias da versão 1.0.95 está em [patch-master-access-quality-20261026.py](../../deploy/scripts/patch-master-access-quality-20261026.py). A ativação da rota da Dosagem está em [enable-dosagem-native-20261026.sh](../../deploy/scripts/enable-dosagem-native-20261026.sh).

Backups de código:

- Homologação: `/opt/concrefer-unificado/homolog-next/backups/master-access-quality-20261026-20261026T100822Z`
- Produção: `/opt/concrefer-unificado/backups/master-access-quality-20261026-20261026T100828Z`
- Backup anterior de produção, incluindo dados de usuários PCP, papéis Suprimentos e vínculos GED: `/opt/concrefer-unificado/backups/master-access-quality-20261026-20261026T095924Z`

O script de deploy restaura automaticamente os arquivos e reinicia o serviço Mapa se um gate falhar. O arquivo anterior do vhost Nginx está em `nginx-vhost-before-dosagem.conf` no segundo backup de produção. As alterações de contas e papéis estão registradas nos dumps privados do primeiro backup. Não houve alteração na VPS antiga.

## Limite do ensaio

A navegação foi verificada por catálogo, resolução das URLs, regras de menu e requisições autenticadas aos serviços de produção. Não houve captura visual de uma sessão interativa de cada usuário. PedeRH e FaleAqui possuem autenticação própria fora do catálogo de telas do Unificado e não foram alterados nesta correção. A branch local ainda diverge de outras partes já publicadas; o deploy desta correção usou cópias verificadas dos arquivos em produção, sem publicar a árvore inteira.
