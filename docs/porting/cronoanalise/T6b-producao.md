# T6b · Produção — pré-publicação interrompida em 18/10/2026

**Estado:** publicação ainda não executada. A T6a e o complemento do commit `f4417660cc1e790485f13bf469d5135b44140964` foram aprovados. O solicitante autorizou integrar os deltas da Cronoanálise preservando diferenças de produção, ativar o serviço do Laboratório e corrigir uma exceção de acesso master específica da Cronoanálise, com revalidação em homologação.

## Conferência somente leitura

| Item | Homologação validada | Produção observada |
| --- | --- | --- |
| Serviço do Laboratório | `laboratorio-homolog.service` ativo, porta 13065 | `laboratorio-unificado.service` **inativo e desativado**, porta 13064 sem escuta |
| Banco do Laboratório | `concretrack_postes_homolog` | `DATABASE_URL` de `/etc/concrefer-unificado/laboratorio.env` aponta para **`concretrack_postes`** |
| Banco citado para backup na solicitação | — | `concretrack_postes_unificado` existe, mas não é o banco apontado pela configuração do serviço |
| Banco de permissões do Unificado | `mapa_unificado_homolog_20261016` | `MAPA_AUTH_DATABASE_URL` de `/etc/mapa-unificado/auth.env` aponta para **`mapa_unificado_teste`**; consulta PostgreSQL confirmou `unificado_auth` nesse banco |
| Serviço de autenticação | `unificado-homolog-mapa.service` ativo | `mapa-unificado-auth.service` ativo, porta 13052 |

O `AUTH_DATABASE_URL` do serviço `concretrack-unificado.service` aponta para `concretrack_auth`, mas esse banco não contém `unificado_auth` e não é a conexão usada pelo serviço `mapa-unificado-auth.service` para as permissões de tela e ação. A confirmação combinou os arquivos de ambiente referenciados pelas unidades systemd com consultas somente leitura a `pg_namespace`. Nem `concretrack_postes` nem `concretrack_postes_unificado` tinha o schema `cronoanalise` antes da publicação.

Inventário integral de portas, serviços, configuração de bancos sem credenciais e schemas: [T6b-inventario-antes.txt](T6b-inventario-antes.txt). `nginx -t` foi consultado sem alterações. Não há inventário “depois”, pois nenhuma publicação ocorreu.

## Decisões e backups prévios

O solicitante confirmou: usar o mesmo banco que salva os dados de Ensaio de Postes. Consulta somente leitura mostrou uma conexão ativa em `concretrack_postes`, 18 ensaios nesse banco (último em 09/10/2026) e 13 em `concretrack_postes_unificado` (último em 07/10/2026). Portanto, o destino da migração será `concretrack_postes`. O solicitante também autorizou ativar `laboratorio-unificado.service`; a ativação ainda não foi executada.

Backups criados em `/opt/concrefer-unificado/backups/cronoanalise-t6b-20261018-225040`, antes de qualquer migração ou cópia de código:

| Arquivo | Conteúdo | Bytes | SHA-256 | Entradas em `pg_restore --list` |
| --- | --- | ---: | --- | ---: |
| `concretrack_postes.dump` | Banco ativo dos ensaios, destino da migração | 58.772 | `6c05ec4e6f78c77159c882e762bd840a9ac2c4e7d33b1359eda7fca9a0cb1a13` | 50 |
| `concretrack_postes_unificado.dump` | Banco solicitado originalmente para backup | 54.217 | `26721060ddfca9ddae6e89c227c4fad57b79f46ee2da8efbb7ae5161d762b93a` | 50 |
| `mapa_unificado_teste-unificado_auth.dump` | Schema de permissões do banco real de autenticação | 102.916 | `3d71e04c96e3007ca55097afdabf8710a2e53ae97b11cd5dab12073dcd44079c` | 78 |

Os três arquivos têm tamanho positivo, e `pg_restore --list` terminou com código 0 para cada um.

Comparação somente leitura do código: nove dos onze arquivos de integração comparáveis de produção coincidem com a base da homologação anterior à Cronoanálise. `mapa-api/app.py` difere principalmente em cookies, portas e caminhos próprios da produção. `public/unificado/shell/shell.js` contém na base de homologação um tratamento adicional de 401 do PCP ausente em produção. O bundle `shell/modelo-a/menu.js` não constava do backup anterior da homologação; o arquivo atual de produção tem SHA-256 diferente do homologado após a Cronoanálise (`fd449bc7...` versus `3c726ad3...`). Foi autorizada a integração apenas dos deltas de Cronoanálise sobre os arquivos atuais de produção.

No diretório de backup `stage/`, uma cópia dos onze arquivos atuais recebeu o patch de integração registrado no commit `f4417660` e o [patch de acesso master](integracao/crono-master-exclusivo.patch). O patch da casca preservou o tratamento de 401 existente apenas na homologação, sem introduzi-lo na produção. O menu foi atualizado por inserção das sete entradas da Cronoanálise no bundle atual de produção, preservando seus bytes anteriores; SHA-256 preparado `e4a315106434735387574ce143167a6429851d43768baf82126d123783f9e396`. Quatro arquivos Python compilaram, dois catálogos JSON foram analisados e os seis arquivos JavaScript passaram em `node --check` na cópia preparada. Nenhum arquivo ativo foi substituído.

### Correção de acesso revalidada em homologação

O commit T6a concedia telas e ações a todos os usuários master (`user-ricardo`, `marcelo`, `alex`) por regra implícita, impedindo atender “ninguém mais”. Após autorização, o patch específico da Cronoanálise foi aplicado ao serviço `unificado-homolog-mapa.service` e revalidado: a API retornou **7 telas e 3 ações** para `user-ricardo`, **0 telas e 0 ações** para `marcelo` e `alex`; com bootstrap autenticado, a página respondeu **200** para Ricardo e **403** para os outros dois. Consulta à base de autenticação de produção não encontrou concessões explícitas de telas ou ações da Cronoanálise para nenhum usuário antes da publicação. O restante do acesso master a outros módulos não foi alterado. Backup dos dois arquivos da homologação antes desse patch: `/opt/concrefer-unificado/homolog/backups/crono-master-20261018-225356`.

## Etapas não executadas

Não foram aplicados scripts SQL, alteradas permissões, copiados bundles, ativados ou reiniciados serviços nem executados testes de produção. Assim, ainda não há hashes dos bundles publicados, comparação final com homologação, diff depois/antes 0/0, capturas de produção ou aceite T7. O roteiro de rollback será documentado antes da publicação.
