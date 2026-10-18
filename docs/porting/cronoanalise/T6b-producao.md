# T6b · Produção — pré-publicação interrompida em 18/10/2026

**Estado:** nenhuma alteração em produção. A T6a e o complemento do commit `f4417660cc1e790485f13bf469d5135b44140964` foram aprovados, mas a verificação prévia encontrou diferenças materiais em relação à homologação. Por instrução expressa do solicitante, a T6b foi interrompida antes de alterar o ambiente.

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

## Decisão necessária antes de continuar

É preciso confirmar qual banco o Laboratório de produção deve usar e se `laboratorio-unificado.service` deve ser ativado. A escolha muda o destino da migração e os backups necessários. A solicitação de backup de `concretrack_postes_unificado` será preservada; caso o destino correto seja `concretrack_postes`, esse banco também precisará de backup antes da migração. O backup de `unificado_auth` deverá sair de `mapa_unificado_teste`, conforme configuração e consulta observadas, salvo se a configuração de produção for corrigida antes da publicação.

## Etapas não executadas

Não foram criados backups, aplicados scripts SQL, alteradas permissões, copiados bundles, reiniciados serviços nem executados testes de produção. Assim, ainda não há hashes dos bundles publicados, comparação com homologação, diff depois/antes 0/0, capturas de produção ou aceite T7. O roteiro de rollback será documentado quando o destino de banco e serviço for definido, antes da publicação.
