# Mão de Obra — causa do 403 e ensaio do novo procedimento

**Estado:** ensaiado no ambiente isolado `:18446`; produção permanece na versão anterior. Nenhuma nova janela de produção foi executada.

## Causa exata da tentativa revertida

O pacote enviado com `scp -r` ficou em `/root/maodeobra-prod-release-20261017/public/unificado/`. Seus diretórios vieram como `root:root 0700` e os arquivos estáticos como `root:root 0644`. O comando que causou a falha foi:

```bash
cp -a /root/maodeobra-prod-release-20261017/public/unificado/. /opt/concrefer-unificado/public/unificado/
```

O `-a` propagou o dono e o modo dos diretórios de origem para o destino. Os diretórios abaixo ficaram temporariamente `root:root 0700` (antes e após o retorno estão `root:root 0755`):

| Diretório relativo a `/opt/concrefer-unificado/public/unificado/` | Modo durante a falha |
| --- | --- |
| `.` | `root:root 0700` |
| `shell/` | `root:root 0700` |
| `pcp/` | `root:root 0700` |
| `pcp/static/` | `root:root 0700` |
| `pcp/static/js/` | `root:root 0700` |
| `pcp/static/css/` | `root:root 0700` |
| `pcp/maodeobra/` | `root:root 0700` |
| `m/` (novo) | `root:root 0700` |

O novo `m/maodeobra/` e `m/maodeobra/icons/` também vieram `root:root 0700`. `unificado/index.html` e `unificado/login.html` permaneceram arquivos `root:root 0644`, mas o processo Nginx `www-data` não podia atravessar `unificado/`; o log registrou `Permission denied` e a casca/login responderam `403`. Os arquivos novos do pacote, como `m/maodeobra/index.html`, `manifest.webmanifest` e `sw.js`, eram `root:root 0644`, mas estavam igualmente inacessíveis pelos diretórios. Os três arquivos do backend PCP permaneceram `pcp-unificado:pcp-unificado 0644`.

## Snapshot e procedimento corrigido

Antes de qualquer nova cópia, o script de backup agora executa [snapshot_maodeobra_public_permissions.py](../../scripts/porting/snapshot_maodeobra_public_permissions.py) e guarda `public-permissions-before.json`, além de `namei -l` da casca e do login. O snapshot da produção já recuperada foi salvo em `/root/backups/maodeobra-prod-20261017-1755/public-permissions-after-rollback.json`, SHA-256 `13778c0cce43a14b1e47ae7e11b732eb02ad96cdb49fe810c0f4ddce22bc0221`. Ele registra dono, grupo e modo de cada diretório/arquivo afetado; os caminhos públicos existentes estão `root:root 0755` para diretórios e `root:root 0644` para arquivos. Os três arquivos novos e a pasta `m/` não existem na produção atual.

O novo [instalador de arquivos públicos](../../scripts/porting/install_maodeobra_public.py) instala cada arquivo por temporário no próprio diretório e troca atômica. Para arquivos existentes, usa exatamente o dono, grupo e modo do destino; não altera metadados de diretórios existentes. Cria diretórios novos com dono, grupo e modo copiados explicitamente de `unificado/` (`root:root 0755` no snapshot atual) e arquivos novos como `root:root 0644`. Não usa `cp -a` na árvore pública. Após a cópia, [verify_maodeobra_public_access.py](../../scripts/porting/verify_maodeobra_public_access.py) compara o snapshot, exige os novos diretórios iguais a `unificado/`, testa como `www-data` a leitura da casca, do login, das páginas e de todos os ativos do PWA, e exige HTTP `200` da casca, do login e da entrada PWA **antes** do smoke funcional. O [script de retorno](../../scripts/porting/rollback_maodeobra_mobile_prod.sh) agora restaura e compara também os metadados existentes usando o snapshot.

As migrações usam `ADD COLUMN IF NOT EXISTS` e só criam as FKs se ainda não existirem. A leitura em produção confirmou as cinco colunas anuláveis e as duas FKs já presentes. No ensaio, as duas migrações foram reaplicadas ao banco separado de teste com `ON_ERROR_STOP=1`: as cinco colunas existentes foram ignoradas e não houve erro.

## Ensaio do zero no `:18446`

Backup do banco de teste e dos arquivos em `/root/backups/maodeobra-homolog-rehearsal-20261017/`, dumps/tar verificados por leitura e SHA-256. Snapshot anterior do teste: `/root/backups/maodeobra-homolog-permissions-before-20261017.json` (SHA-256 `4045a33a283848b03863e441d6f59bfb7b55785855495b53f6b102a95dd91583`). O pacote de transporte continha os 17 arquivos já homologados e foi forçado a `0700` nos diretórios, reproduzindo a origem do erro. A rota PWA e os três arquivos novos de JS/CSS foram retirados temporariamente do teste, depois instalados pelo procedimento corrigido. O backend de teste, com hashes idênticos aos candidatos, foi copiado e o serviço `unificado-homolog-pcp.service` reiniciado. O vhost do teste foi salvo, os dois `location` do PWA foram retirados e depois repostos; houve `nginx -t` e `reload` nas duas etapas. O hash final do vhost foi igual ao anterior: `d5b023523e509da6653bd59574911e0895a455ec101dba605e8b578a8eea36c5`.

| Verificação | Resultado |
| --- | --- |
| Migrações reaplicadas | Passaram; colunas existentes ignoradas |
| Arquivos instalados | 17/17 hashes iguais ao pacote de teste |
| Snapshot após cópia | Nenhum caminho existente mudou dono, grupo ou modo |
| Leitura como `www-data` | Casca, login e PWA legíveis |
| HTTP no `:18446` | Casca `200`, login `200`, PWA `200` |
| Manifesto e SW dedicados | Ambos `200`; manifesto `application/manifest+json`, SW `Cache-Control: no-store` |
| Desktop | Salvar, reenviar, sem produção, motivo, validação e resumo passaram |
| Confirmação | API, desktop, mobile, conflito `409` e reenvio passaram; datas fictícias removidas |
| Instalador em emulação Android/iPhone | Login, abertura, reload, manifesto e link da rota atual passaram |
| Gate do teste | **7/7**; API PCP anônima `401`, conforme regra atual do teste |
| Gate de produção, somente leitura | **7/7**; API PCP anônima `403`, conforme `auth_request` atual |

O `403` de produção para API sem token continua sendo a resposta esperada no smoke e a proteção Nginx não foi alterada. O teste de restauração de metadados em uma cópia isolada da árvore pública também passou: após forçar `pcp/` a `0700`, o script repôs o snapshot e a comparação retornou vazia.

Após a aprovação da janela, o instalador passou a aplicar `chown` e `chmod` explícitos aos diretórios novos, usando `unificado/` como referência. Repeti a retirada temporária da rota PWA e dos três arquivos novos no `:18446` com backup fresco em `/root/backups/maodeobra-homolog-rehearsal-final-20261017/`. A versão final do instalador copiou novamente 17/17 arquivos; a comparação de metadados existentes ficou vazia. A verificação adicional confirmou `m/`, `m/maodeobra/` e `icons/` com o mesmo dono/grupo/modo de `unificado/`, leitura de páginas, manifesto, SW e quatro ícones como `www-data`, e HTTP `200` para casca, login e PWA.

**Próxima janela:** somente após aprovação do Ricardo. Sequência: snapshot e backup → migrações idempotentes → backend → instalador seguro de arquivos públicos → `nginx -t` e `reload` dos dois `location` estáticos → checagem de leitura/HTTP → smoke → gate 7/7. Qualquer falha no smoke: retorno imediato sem corrigir a versão nova em produção.
