# T6b · Publicação em produção — 18/10/2026

**Estado:** publicada e verificada. A T6a e o complemento do commit `f4417660cc1e790485f13bf469d5135b44140964` foram aprovados. O solicitante autorizou integrar os deltas da Cronoanálise preservando diferenças de produção, ativar o serviço do Laboratório e corrigir uma exceção de acesso master específica da Cronoanálise, com revalidação em homologação. A publicação inicial conferiu os 19 arquivos exclusivos da Cronoanálise e sua migração/SQL com `f4417660`; os patches posteriores de acesso master (`468e1409`) e exportação XLSX (`9a64e285`) foram validados em homologação antes de chegar à produção.

## Conferência somente leitura

| Item | Homologação validada | Produção observada |
| --- | --- | --- |
| Serviço do Laboratório | `laboratorio-homolog.service` ativo, porta 13065 | `laboratorio-unificado.service` **inativo e desativado**, porta 13064 sem escuta |
| Banco do Laboratório | `concretrack_postes_homolog` | `DATABASE_URL` de `/etc/concrefer-unificado/laboratorio.env` aponta para **`concretrack_postes`** |
| Banco citado para backup na solicitação | — | `concretrack_postes_unificado` existe, mas não é o banco apontado pela configuração do serviço |
| Banco de permissões do Unificado | `mapa_unificado_homolog_20261016` | `MAPA_AUTH_DATABASE_URL` de `/etc/mapa-unificado/auth.env` aponta para **`mapa_unificado_teste`**; consulta PostgreSQL confirmou `unificado_auth` nesse banco |
| Serviço de autenticação | `unificado-homolog-mapa.service` ativo | `mapa-unificado-auth.service` ativo, porta 13052 |

O `AUTH_DATABASE_URL` do serviço `concretrack-unificado.service` aponta para `concretrack_auth`, mas esse banco não contém `unificado_auth` e não é a conexão usada pelo serviço `mapa-unificado-auth.service` para as permissões de tela e ação. A confirmação combinou os arquivos de ambiente referenciados pelas unidades systemd com consultas somente leitura a `pg_namespace`. Nem `concretrack_postes` nem `concretrack_postes_unificado` tinha o schema `cronoanalise` antes da publicação.

Inventários de portas, serviços, configuração de bancos sem credenciais e schemas: [antes](T6b-inventario-antes.txt) e [depois](T6b-inventario-depois.txt). `nginx -t` passou, sem alteração de configuração. O diff real foi **+1 porta (`127.0.0.1:13064`), +1 serviço (`laboratorio-unificado.service`), 0 removidos**. A meta original 0/0 não pode coexistir com a ativação do serviço que estava inativo; essa ativação foi expressamente autorizada. Nenhuma porta pública foi adicionada.

## Decisões e backups prévios

O solicitante confirmou: usar o mesmo banco que salva os dados de Ensaio de Postes. Consulta somente leitura mostrou uma conexão ativa em `concretrack_postes`, 18 ensaios nesse banco (último em 09/10/2026) e 13 em `concretrack_postes_unificado` (último em 07/10/2026). A migração foi aplicada em `concretrack_postes`. O solicitante também autorizou ativar `laboratorio-unificado.service`, que foi ativado na publicação.

Backups criados em `/opt/concrefer-unificado/backups/cronoanalise-t6b-20261018-225040`, antes de qualquer migração ou cópia de código:

| Arquivo | Conteúdo | Bytes | SHA-256 | Entradas em `pg_restore --list` |
| --- | --- | ---: | --- | ---: |
| `concretrack_postes.dump` | Banco ativo dos ensaios, destino da migração | 58.772 | `6c05ec4e6f78c77159c882e762bd840a9ac2c4e7d33b1359eda7fca9a0cb1a13` | 50 |
| `concretrack_postes_unificado.dump` | Banco solicitado originalmente para backup | 54.217 | `26721060ddfca9ddae6e89c227c4fad57b79f46ee2da8efbb7ae5161d762b93a` | 50 |
| `mapa_unificado_teste-unificado_auth.dump` | Schema de permissões do banco real de autenticação | 102.916 | `3d71e04c96e3007ca55097afdabf8710a2e53ae97b11cd5dab12073dcd44079c` | 78 |

Os três arquivos têm tamanho positivo, e `pg_restore --list` terminou com código 0 para cada um.

Comparação somente leitura do código: nove dos onze arquivos de integração comparáveis de produção coincidem com a base da homologação anterior à Cronoanálise. `mapa-api/app.py` difere principalmente em cookies, portas e caminhos próprios da produção. `public/unificado/shell/shell.js` contém na base de homologação um tratamento adicional de 401 do PCP ausente em produção. O bundle `shell/modelo-a/menu.js` não constava do backup anterior da homologação; o arquivo atual de produção tem SHA-256 diferente do homologado após a Cronoanálise (`fd449bc7...` versus `3c726ad3...`). Foi autorizada a integração apenas dos deltas de Cronoanálise sobre os arquivos atuais de produção.

No diretório de backup `stage/`, uma cópia dos onze arquivos compartilhados atuais recebeu o patch de integração registrado no commit `f4417660` e o [patch de acesso master](integracao/crono-master-exclusivo.patch). O patch da casca preservou a versão própria de produção. O menu foi atualizado por inserção das sete entradas da Cronoanálise no bundle atual de produção, preservando seus bytes anteriores. Quatro arquivos Python compilaram, dois catálogos JSON foram analisados e os seis arquivos JavaScript passaram em `node --check` antes da publicação.

Os **19 arquivos exclusivos da Cronoanálise e SQL de permissões** na preparação inicial foram conferidos por SHA-256 contra os bytes do commit `f4417660`: 19/19 iguais. A diferença inicial de `002_seeds.sql` era apenas CRLF na cópia da homologação; o arquivo preparado foi normalizado para os bytes do commit. Após a publicação, os bundles exclusivos foram comparados diretamente com a homologação:

| Bundle | SHA-256 em produção e homologação | Resultado |
| --- | --- | --- |
| `cronoanalise.html` | `172b3c6aa8337c9a37fc84a8047a3e831601f963748316ea9726dbc4fe906aeb` | iguais |
| `cronoanalise-CZoiX6bG.js` | `b77736a8373aec48f52aefe004db3f268ff94f51242dabba813cdf1c17eba152` | iguais |
| `cronoanalise-4yXJyGlj.css` | `18b2fe65ab7b81cce335a8e64d37a90f7fd08e5114849215454ef7d9e613e570` | iguais |
| `engine.worker-Cc5MV-Im.js` | `e9f962a6473d1a1ef58ad259f1c23213d16700e346bbde1ee377a2349aa9a0cf` | iguais |
| Menu compartilhado `modelo-a/menu.js` | produção `e4a315106434735387574ce143167a6429851d43768baf82126d123783f9e396`; homologação `3c726ad37ff05f0412042601ea22f8a6b9424b30d5ab63576a52bd6897f9777f` | diferentes pela base preexistente de produção |

Os doze arquivos compartilhados atuais de produção foram arquivados em `code-before.tar.gz` no mesmo diretório de backup: 127.704 bytes, SHA-256 `537292778d14d1e0138504ddab4c8ebae9ba2bab9091c36450c799d92e1d0304`, doze entradas verificadas. Os diretórios exclusivos da Cronoanálise ainda não existiam na produção.

### Correção de acesso revalidada em homologação

O commit T6a concedia telas e ações a todos os usuários master (`user-ricardo`, `marcelo`, `alex`) por regra implícita, impedindo atender “ninguém mais”. Após autorização, o patch específico da Cronoanálise foi aplicado ao serviço `unificado-homolog-mapa.service` e revalidado: a API retornou **7 telas e 3 ações** para `user-ricardo`, **0 telas e 0 ações** para `marcelo` e `alex`; com bootstrap autenticado, a página respondeu **200** para Ricardo e **403** para os outros dois. Consulta à base de autenticação de produção não encontrou concessões explícitas de telas ou ações da Cronoanálise para nenhum usuário antes da publicação. O restante do acesso master a outros módulos não foi alterado. Backup dos dois arquivos da homologação antes desse patch: `/opt/concrefer-unificado/homolog/backups/crono-master-20261018-225356`.

## Migração, permissões e serviços

`001_schema.sql` e `002_seeds.sql` foram aplicados em `concretrack_postes`; a restrição de ações e as [concessões exclusivas](integracao/production-grants.sql) foram aplicadas em `mapa_unificado_teste`. Consulta posterior: **40 atividades, 0 medições, 0 eventos de auditoria**; somente `user-ricardo` tem linhas de Cronoanálise, **7 telas e 3 ações**. `mapa-unificado-auth.service` foi reiniciado para carregar o gateway e `laboratorio-unificado.service` foi ativado e iniciado na porta local 13064. `concretrack-unificado.service`, NGINX e demais serviços não foram reiniciados. Ambos os health checks locais e `/cronoanalise` responderam 200.

Um dump posterior apenas do schema `cronoanalise` foi salvo no diretório de backup (`cronoanalise-postdeploy.dump`): 51.846 bytes, SHA-256 `06f1bd93fc2f268b05e97dfd2b426507fe90eea2a5634962a9df46849ae741de`, 66 entradas em `pg_restore --list`. Restaurado em `cronoanalise_restore_t6b_20261018`, mostrou 11 tabelas; o banco temporário foi removido.

## Smoke de produção sem dados de teste

Com sessão autenticada de `user-ricardo`, `/status` respondeu **200**, schema/revisões corretos e `medicoes=0`. As **sete telas** carregaram em `/unificado/laboratorio/cronoanalise`: [Início](capturas-T6b/crono-inicio.png), [Coletar](capturas-T6b/crono-coletar.png), [Medições](capturas-T6b/crono-medicoes.png), [Catálogo](capturas-T6b/crono-catalogo.png), [Dimensionar](capturas-T6b/crono-dimensionar.png), [Simular](capturas-T6b/crono-simular.png) e [Metodologia](capturas-T6b/crono-metodologia.png). O [menu com sete itens](capturas-T6b/crono-menu-7.png) foi conferido no DOM e capturado.

Dimensionar calculou **34 pessoas** e mostrou o aviso **“Estimativa: há atividades sem amostra suficiente”**: [captura](capturas-T6b/dimensionar-resultado.png). Simular concluiu **seis sequências em 4,006 s**, com 10 replicações: [captura](capturas-T6b/simular-resultado.png). Não foi acionado “Salvar rodada”. Após o smoke, o banco seguia com **0 medições, 0 simulações salvas e 0 eventos de auditoria**.

No roteiro rápido de não interferência, abriram autenticados [PCP](capturas-T6b/regressao-pcp.png), [Mapa](capturas-T6b/regressao-mapa.png), [GED](capturas-T6b/regressao-ged.png) e [Laboratório](capturas-T6b/regressao-laboratorio.png). A verificação de permissão em produção retornou **7 telas e HTTP 200** para Ricardo, **0 telas e HTTP 403** para Marcelo e Alex na página e API da Cronoanálise.

Testes locais após a publicação inicial: Python **12/12** (os 11 da T6a e um teste novo de acesso master); Vitest do motor **20/20**, com os 18 casos golden; suíte raiz **63/65**, permanecendo apenas as duas falhas preexistentes do Mapa; frontend completo do Laboratório **23 testes aprovados**, única suíte falha pela fixture preexistente ausente `fl-pro-22.json`. Após a correção XLSX descrita abaixo, Python passou **13/13**. Nenhuma falha nova foi observada.

### Complemento T7 na mesma publicação

Um ensaio adicional em homologação com medições reais revelou HTTP 500 na exportação XLSX preenchida: UUID e data com fuso não eram tipos aceitos pelo `openpyxl`. O commit `9a64e285` ajusta [api.py](../../../unificado/laboratorio/service/cronoanalise/api.py) para converter esses campos em texto ISO e manter números como números. A correção passou no teste de API e no ensaio com quatro medições, CSV e XLSX; só então foi copiada da homologação para produção. O `api.py` anterior está em `crono-api-before-xlsx.py` no diretório de backup; SHA-256 anterior `b5de234a63ddb07946b61c6a2a99f64e25d7efc34592c1da9a65346ddbb00dfb`, final e homologação `a0dfc26f1954a1029446fe6c74785aecd68db5a874f3ce4d7bc5173dcdd22e7a`. Apenas `laboratorio-unificado.service` foi reiniciado para essa correção. `/status` e XLSX vazio responderam 200 em produção depois do reinício. A suíte Python da Cronoanálise passou **13/13** com o teste de exportação novo.

## Roteiro de rollback — documentado, não executado

1. Bloquear novas gravações da Cronoanálise e preservar um dump adicional de `cronoanalise` e da auditoria antes de qualquer remoção. Em produção, **não usar** `999_rollback_test.sql`: ele rejeita bancos fora de `cronoanalise_test_*`.
2. Parar `laboratorio-unificado.service`; restaurar os doze arquivos compartilhados de `code-before.tar.gz` nos caminhos originais sob `/opt/concrefer-unificado`, inclusive frontend (menu, casca, SW e editor de usuários), router e gateway. Reiniciar somente `mapa-unificado-auth.service`. Como o Laboratório estava inativo/desativado antes, manter esse estado no rollback.
3. Reverter somente as concessões da Cronoanálise em `mapa_unificado_teste.unificado_auth`: remover as sete linhas de `user_screen_permissions` e as três de `user_action_permissions` do usuário `user-ricardo`; restaurar a restrição anterior de `action_id` a `qualidade.%`. O dump `mapa_unificado_teste-unificado_auth.dump` está disponível para recuperação seletiva, se necessário; não substituir integralmente mudanças de outros módulos feitas após o backup.
4. Após exportar qualquer dado criado após a publicação e obter autorização específica para descartá-lo, remover os diretórios exclusivos `laboratorio/service/cronoanalise` e `laboratorio/service/server/static/cronoanalise` e o schema `cronoanalise` do banco `concretrack_postes`. Essa remoção inclui a tabela própria de auditoria e, por isso, não faz parte do rollback automático. Os dumps integrais `concretrack_postes.dump` e `concretrack_postes_unificado.dump` permitem recuperação, mas não devem ser restaurados sobre dados novos sem conciliação.
5. Verificar as rotas antigas de PCP, Mapa, GED e Laboratório, `nginx -t` e comparar portas e serviços com o inventário anterior.

## Correção posterior do cache da casca

Em 19/10/2026, um navegador já atualizado não mostrou a Cronoanálise no menu do Laboratório porque a casca manteve URLs antigas de scripts servidos com cache `immutable`. A [correção e sua verificação](T6b-correcao-cache.md) atualizaram apenas a identificação de versão dos arquivos compartilhados necessários; a aplicação e os dados da Cronoanálise permaneceram como publicados acima.
