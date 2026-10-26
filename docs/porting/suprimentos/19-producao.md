# Suprimentos — publicação na produção em 26/10/2026

**Resultado:** publicado na VPS nova em `https://concrefer.concretrack.com.br/unificado/?module=suprimentos`. A casca, o serviço e o PWA estão na versão **1.0.95**. Produção usa a porta local **13267** e o banco isolado `suprimentos_prod`, migrado até `sup_0012`. A porta 13067 prevista no F8 já era usada por outro serviço e não foi alterada.

## Escopo publicado

- Fonte do módulo retirada do commit local `f75bf08c` da branch `feat/suprimentos-s0-s1`; nenhum arquivo sujo de Dosagem, GED, Mapa, PCP ou Laboratório entrou no pacote.
- Seis arquivos compartilhados da produção receberam somente os patches de Suprimentos regenerados a partir da cópia atual de produção; a aplicação foi validada com `git apply --check`, `py_compile`, `node --check` e comparação de conteúdo. `index.html`, `sw.js` e `VERSION` receberam apenas a troca 1.0.58 → 1.0.95 nas referências pertinentes.
- Serviço FastAPI, migrations, 12 telas estáticas e PWA instalados em caminhos próprios. Nginx usa autenticação do Mapa e limite de 16 MB na API e no subrequest de autenticação. Anexos ficam fora de `public`, em diretório 0700. Arquivos de ambiente são 0600 e não entram no Git.
- Unidades de medida e Campinas vieram da migration. Não foi copiado o banco DEMO da homologação. Não há solicitações, materiais, fornecedores nem saldos reais no banco novo.
- Flags de Campinas **S0, S1, S2, S3A, S3B e S5 ligadas**. **S4 e S3A_EMAIL desligadas**; provedor de leitura de NF por IA e notificações não foram configurados.
- Os três masters ativos `user-ricardo`, `marcelo` e `alex` receberam no banco de Suprimentos ADMIN e APROVADOR níveis 1 e 2 para testes. A própria regra master do IAM lhes apresenta as dez telas. Nenhum outro usuário recebeu papel ou caixa de tela nesta publicação. Estes papéis de ensaio precisam ser revistos quando as alçadas reais forem cadastradas.

## Backups, retorno e tentativas

Cada tentativa teve tar dos arquivos compartilhados, snapshot de hashes e modos e dump das concessões do IAM, em diretório root 0700 e arquivos 0600. O retorno restaurou versão, nginx e Mapa; o banco isolado foi preservado para diagnóstico.

| Tentativa | Backup protegido | Resultado |
|---|---|---|
| 1 | `/opt/concrefer-unificado/backups/suprimentos-prod-20261026T092810Z` | Retorno automático antes de mudar a casca. Health apontava para 13067, já ocupada, e o venv tinha diretórios 0700 criados sob umask restritivo. |
| 2 | `/opt/concrefer-unificado/backups/suprimentos-prod-20261026T093128Z` | Serviço e migrations passaram. Retorno automático após o gate de versão; o pacote gerado no Windows tinha CRLF em `VERSION`. |
| 3 | `/opt/concrefer-unificado/backups/suprimentos-prod-20261026T093300Z` | Diagnóstico confirmou o gate exato na linha 249; retorno automático. |
| 4 | `/opt/concrefer-unificado/backups/suprimentos-prod-20261026T093402Z` | **Publicação concluída.** Pacote com LF, porta 13267 e venv legível pelo usuário de serviço. |

O instalador final é [deploy-production.sh](../../../unificado/suprimentos/deploy/deploy-production.sh). O gerador de pacote é [prepare-production-package.py](../../../unificado/suprimentos/deploy/prepare-production-package.py). Os segredos foram gerados na VPS e nunca impressos ou gravados no repositório. A VPS antiga não foi acessada.

## Gates e conferência

O script [verify-production.sh](../../../unificado/suprimentos/deploy/verify-production.sh) passou **7/7**: versão consistente entre `VERSION`, `APP_VERSION` e caches; serviços e health; migration, três masters e banco sem solicitações; flags; rotas públicas com 200/401/403 esperados; catálogo com dez telas e páginas físicas; nginx e permissões. O script [verify-production-auth.sh](../../../unificado/suprimentos/deploy/verify-production-auth.sh) assinou assertions locais com a chave protegida, recebeu 200 e os três papéis esperados para cada master, recebeu 403 para identidade sem papel e confirmou as dez telas no IAM. Após a publicação, serviço, timers e Mapa estavam ativos; `journalctl -p err` do Suprimentos não registrou erros novos.

O smoke 43/43 com contas e dados DEMO foi executado em homologação `:18446` na F8. Em produção, a verificação usou apenas leitura e identities assinadas locais; nenhum pedido, recebimento ou movimento fictício foi criado. Um teste visual autenticado no navegador com sessão real de produção e a instalação em iPhone físico ainda dependem das contas e dispositivos dos gestores.

## Configuração operacional restante

1. Preencher e validar os CSVs de centros de custo, materiais, fornecedores, colaboradores, papéis, alçadas e parâmetros. Os modelos em `pacote-producao/cargas/` permanecem vazios. Valores da migration estão marcados `a_confirmar`.
2. Fazer a contagem física e reconciliar o estoque de abertura antes de registrar entradas e saídas reais; revisar os níveis de aprovação de teste dos masters.
3. Liberar telas e papéis dos demais usuários pela gestão de acesso depois da definição dos responsáveis. S4, e-mail, IA de NF, NC automática e push seguem desligados até suas integrações serem configuradas e testadas.
4. Tratar separadamente as credenciais antigas de Dosagem V2 registradas na F7: havia `.env.production` legado rastreado e DSNs estáticos a revisar. Nenhum desses arquivos entrou neste deploy isolado. Não foi feito `git push` nesta tarefa.
