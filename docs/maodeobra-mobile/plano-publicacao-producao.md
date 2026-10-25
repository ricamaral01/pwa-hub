# Plano de publicação — Mão de Obra mobile e confirmação

**Estado:** publicado em produção em 17/10/2026, na janela das 20h30, após nova aprovação e ensaio no `:18446`. Destino: VPS nova, banco PCP `pcp_unificado_teste`, API `/opt/concrefer-unificado/pcp-api` (`pcp-unificado-test.service`, porta local 13054) e estáticos `/opt/concrefer-unificado/public`. Homologação permanece isolada em `:18446`, banco `pcp_unificado_homolog_20261016` e API 13154.

## 1. Pacote exato

| Camada | Arquivos de destino | Tratamento |
| --- | --- | --- |
| Migração | `unificado/pcp/backend/migrations/20261017_maodeobra_mobile_metadata.psql`, `20261017_maodeobra_confirmacao.psql` | Aplicar nessa ordem ao banco PCP de produção. Copiar também os dois arquivos `_rollback.psql` para o pacote de retorno. |
| Backend PCP | `app/api/routers/pcp.py`, `app/models/producao.py`, `app/schemas/producao.py` sob `/opt/concrefer-unificado/pcp-api/` | Gerar candidatos sobre os arquivos atuais de produção. O diff do router deve conter só imports e rotas de Mão de Obra; o do modelo, só campos/relações de `MaoDeObraDia`; o do schema, só validação e campos de Mão de Obra. Compilar antes da troca. |
| Frontend desktop e camada comum | `unificado/pcp/maodeobra/index.html`, `unificado/pcp/static/js/maodeobra-grupos.js`, `maodeobra-core.js`, `app.js` | Preservar o HTML/preâmbulo de autorização de produção; trocar só as referências e trechos de Mão de Obra. Em `app.js`, aplicar somente `failure.status` e `todayISO()` com `America/Sao_Paulo`; o arquivo de homologação contém outras diferenças de menu e não deve ser copiado inteiro. |
| Vista mobile | `unificado/pcp/static/js/maodeobra-mobile.js`, `unificado/pcp/static/css/maodeobra-mobile.css` | Mesma lógica validada no teste, inclusive link “Instalar no celular”. |
| PWA dedicado | `unificado/m/maodeobra/index.html`, `login.html`, `entry.js`, `entry.css`, `manifest.webmanifest`, `sw.js`, `icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | O `index.html` de produção terá a indicação visível **“Versão oficial · Concrefer”**. URLs de ativos e cache recebem a versão de produção descrita abaixo. O protótipo não entra no pacote. |
| Retorno do login | `unificado/shell/auth.js` | Aplicar somente a regra de retorno `m/maodeobra/?launch=1` para conta com PCP. Preservar o restante do arquivo de produção. |
| Nginx de produção | `/etc/nginx/sites-enabled/concrefer.concretrack.com.br` | Adicionar somente dois `location` exatos: manifesto com `application/manifest+json` e `sw.js` dedicado com `no-store`. Preservar o bloco da API PCP e o snippet de `auth_request`. Fazer backup do vhost, `nginx -t` antes e depois da alteração, depois reload. |

`/unificado/manifest.webmanifest` e `/unificado/sw.js` **não serão alterados**. O bridge `unificado/pcp/unificado-bridge.js` também fica como está: os hashes atuais de produção e teste são iguais (`1e425389...`). O manifesto raiz e o SW raiz têm hoje SHA-256 `a12ecab8...` e `d4ed2d4...`; conferir os hashes completos antes e depois da publicação. Não publicar `scripts/`, testes ou capturas como arquivos de runtime.

Há diferenças preexistentes entre homologação e produção em `app.js` e `auth.js`; copiar esses arquivos inteiros arrastaria mudanças de menu/GED. O pacote final deve ser montado com patch mínimo sobre a versão atualmente no ar e ter o diff revisado antes do backup. O backend de Mão de Obra difere de produção somente nos trechos indicados acima, conforme comparação de 17/10.

## 2. Banco e reversão

O banco de produção tem cerca de **14 MB** e `maodeobra_dias` possui hoje só `id`, `data`, `grupo_setor` e `sem_producao`. As duas migrações são aditivas e criam campos anuláveis:

| Migração | Colunas |
| --- | --- |
| `20261017_maodeobra_mobile_metadata.psql` | `salvo_em timestamptz`, `salvo_por_usuario_id integer` (FK `usuarios.id ON DELETE SET NULL`), `motivo_sem_producao varchar(255)` |
| `20261017_maodeobra_confirmacao.psql` | `confirmado_em timestamptz`, `confirmado_por_usuario_id integer` (FK `usuarios.id ON DELETE SET NULL`) |

Comandos previstos no servidor, usando um diretório novo e privado para a janela:

```bash
release_dir=/root/backups/maodeobra-prod-AAAAmmdd-HHMMSS
sudo install -d -m 0700 "$release_dir"
sudo install -d -m 0700 "$release_dir/db"
sudo -u postgres pg_dump -Fc pcp_unificado_teste > "$release_dir/db/pcp.dump"
sudo pg_restore -l "$release_dir/db/pcp.dump" >/dev/null
sudo sha256sum "$release_dir/db/pcp.dump" > "$release_dir/db/SHA256SUMS"
```

O roteiro executável [backup_maodeobra_mobile_prod.sh](../../scripts/porting/backup_maodeobra_mobile_prod.sh) inclui também o tar e os hashes dos arquivos anteriores, o vhost e as contagens iniciais. Ele só aceita um diretório novo em `/root/backups/maodeobra-prod-*`. O script [rollback_maodeobra_mobile_prod.sh](../../scripts/porting/rollback_maodeobra_mobile_prod.sh) está preparado para repor arquivos e vhost, dar **reload** no Nginx e reiniciar apenas o PCP; ambos passaram em `bash -n` na VPS, sem execução.

No mesmo diretório: tar dos arquivos PCP, `auth.js` e vhost/snippet Nginx anteriores, hash SHA-256 e teste de leitura do tar. Só depois aplicar, com `ON_ERROR_STOP=1`:

```bash
sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d pcp_unificado_teste < 20261017_maodeobra_mobile_metadata.psql
sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d pcp_unificado_teste < 20261017_maodeobra_confirmacao.psql
```

Scripts de reversão prontos: `20261017_maodeobra_confirmacao_rollback.psql` **antes** de `20261017_maodeobra_mobile_metadata_rollback.psql`. Eles removem as cinco colunas e as FKs adicionadas. No retorno operacional normal, restaurar o código anterior e **manter as colunas aditivas** para preservar qualquer envio novo; o código anterior as ignora. Executar os scripts de reversão estrutural somente após interromper escritas e preservar os metadados gerados na janela. O dump completo é a reserva para falha de integridade; restaurá-lo descartaria gravações feitas após o backup e exige bloquear a escrita e conferir o ponto de retorno.

Estimativa: dump e verificação **1–2 min**; migrações **menos de 1 min**. Reservar **25–35 min** para toda a janela, incluindo testes e gate.

## 3. Cache, endereço e identificação oficial

Na produção, usar `maodeobra-shell-prod-20261017-v1` no `sw.js` dedicado e `?v=20261017-prod-v1` nas referências de JS/CSS do pacote. A homologação usa `maodeobra-shell-20261017-installer2` e URLs `installer*`; os nomes de cache e versões serão diferentes. A troca de versão deve ser coerente entre HTML, `entry.js` e lista explícita do `sw.js`. O SW só guarda HTML da entrada/login, scripts, estilos e ícones; nenhuma URL `/api/`, token ou resposta pessoal.

O texto **“Versão oficial · Concrefer”** ficará na tela de instalação de produção. A busca nos arquivos de runtime do pacote encontrou **zero** referências a `18446`, `homolog` ou portas 1315x. Repetir essa busca e inspecionar o pacote montado antes da troca. O código aponta a caminhos relativos do mesmo domínio, sem endereço fixo do teste.

### Origem do 403 anônimo — diagnóstico de 17/10

Consulta direta à API PCP em `127.0.0.1:13054` sem token retorna `403 {"detail":"Not authenticated"}` pelo `HTTPBearer` atual. O `auth_request` do Nginx consulta a autorização de tela, que também retorna 403 sem sessão; **a resposta pública** é `403 {"error":"Você não tem acesso a esta tela"}`, gerada por `@unificado_api_denied` antes do proxy para o PCP. Portanto a proteção adicional do Nginx permanece intacta e **403 é o resultado aceito para o smoke anônimo**. Não há mudança de autenticação no Nginx nem no backend para alterar esse status nesta publicação.

## 4. Ordem e critérios da janela

1. **Backup:** capturar snapshot de dono/grupo/modo dos caminhos públicos e `namei -l` da casca/login antes de qualquer cópia; capturar hashes e smoke da versão no ar; fazer dump verificado do banco e tar verificado dos arquivos/configurações. Confirmar espaço livre, serviço PCP ativo e gate prévio 7/7.
2. **Migração:** aplicar as duas migrações na ordem acima e conferir as cinco colunas e as duas FKs. Não alterar linhas legadas.
3. **Backend:** publicar os três candidatos PCP após diff e `py_compile`; reiniciar somente `pcp-unificado-test.service`; aguardar `/openapi.json` e checar rotas de Mão de Obra. Não reiniciar outros serviços.
4. **Frontend:** publicar HTML desktop, JS/CSS comum e mobile, entrada PWA, ícones e patch mínimo de `auth.js` com `install_maodeobra_public.py`, preservando metadados do destino; comparar o snapshot e testar leitura de casca, login e PWA como `www-data`, mais HTTP `200` nas três rotas, antes do smoke. Para os dois `location` estáticos do PWA, salvar o vhost, executar `nginx -t` antes da troca e novamente após, então dar **reload**. Conferir manifesto `application/manifest+json`, SW dedicado `no-store`, versão de produção e hashes do manifesto/SW raiz inalterados.
5. **Smoke de Mão de Obra:** `/unificado/pcp/api/maodeobra/dia` anônimo **403**, conforme proteção atual do `auth_request`; conta sem tela **403**. Em data fictícia controlada e nos dois grupos, desktop salvar → reenviar → sem produção com/sem motivo → confirmar; mobile lançar → confirmar e recarregar; verificar GET `/dia` e `/resumo` (até 31 dias), autores/horas do servidor, `409` ao confirmar dado alterado, validação de múltiplos de 0,5 e retorno de login ao app dedicado. Limpar somente os registros de smoke identificados e conferir a contagem anterior. Testar a página de instalação e o ícone em navegador móvel.
6. **Gate:** executar `python tests/unificado/modelo_a_gate.py` na URL de produção; são sete verificações de casca, login, PCP protegido, Mapa, Laboratório, Qualidade e QR público GED. Só declarar publicada se o smoke e o resultado **7/7** passarem.

## 5. Retorno

Falha em migração: parar antes de trocar backend; usar reversão das duas migrações na ordem inversa se ainda não houver gravação nas colunas novas. Falha após troca: restaurar o tar dos arquivos e o vhost anterior, executar `nginx -t`, **reload**, reiniciar **somente** o PCP, aguardar saúde e repetir rota anônima/smoke da versão antiga e gate 7/7. As colunas aditivas ficam preservadas no retorno operacional, inclusive dados eventualmente salvos com a versão nova. Não restaurar o dump sobre gravações recentes sem decisão explícita.

Tempo previsto para voltar os arquivos e o serviço: **5–8 min**; com verificações e gate, **até 15 min**. Se for necessária restauração completa do banco, reservar **mais 5–10 min** após bloqueio das escritas e avaliação dos registros novos. Qualquer falha interrompe a sequência imediatamente.

## Tentativa de 17/10/2026 — revertida

O Ricardo autorizou a execução imediata. O gate anterior passou 7/7. Backup verificado em `/root/backups/maodeobra-prod-20261017-1755`, com 40 linhas em `maodeobra` e 2 em `maodeobra_dias`. As duas migrações aditivas foram aplicadas; backend, frontend e as duas regras estáticas do PWA foram trocados. O `nginx -t` passou antes e depois da troca, seguido de `reload`.

O smoke parou no login automatizado do desktop: o formulário esperado não apareceu em 30 segundos. A cópia do pacote com `cp -a` havia alterado as permissões de diretórios públicos para `700`, causando `403` do Nginx na casca e no login. Conforme a condição da janela, não houve tentativa de corrigir o smoke na versão nova: o script de retorno restaurou os arquivos e o vhost anteriores e reiniciou somente o PCP. As permissões dos diretórios públicos foram restauradas para `755`; a casca voltou a `200` e o gate posterior passou **7/7**.

O PWA dedicado foi retirado; o link de instalação de produção **não está publicado**. O manifesto e o service worker raiz conservaram seus hashes anteriores. As cinco colunas novas, anuláveis, permanecem no banco e são ignoradas pelo código anterior. A contagem final permaneceu em **40 lançamentos e 2 registros de dia**. Uma nova tentativa precisa usar cópia de arquivos que preserve as permissões dos diretórios de destino e validar casca/login imediatamente após a troca, antes do smoke funcional.

O procedimento corrigido e o resultado do ensaio estão em [ensaio-publicacao-2026-10-17.md](ensaio-publicacao-2026-10-17.md). A próxima janela só começa após aprovação do Ricardo. Se o smoke falhar, executar o retorno sem tentar correção na produção.

## Publicação de 17/10/2026 às 20h30 — concluída

Após a aprovação de nova janela pelo Ricardo, a publicação começou às 20h30 (Brasília) e foi concluída às 20h32. Link oficial: [Instalar Mão de Obra](https://concrefer.concretrack.com.br/unificado/m/maodeobra/). Backup fresco e snapshot em `/root/backups/maodeobra-prod-20261017-2030/`; dump, tar e vhost verificados por hash. O snapshot inicial dos caminhos públicos teve SHA-256 `13778c0cce43a14b1e47ae7e11b732eb02ad96cdb49fe810c0f4ddce22bc0221`, igual ao registro da versão recuperada após a tentativa anterior. O gate antes da troca foi **7/7**.

As migrações idempotentes reconheceram as cinco colunas existentes e passaram. Backend e 17 arquivos públicos foram instalados; `nginx -t` passou antes e depois da adição dos dois `location`, seguido de `reload`. Antes do smoke, `www-data` conseguiu ler casca, login, páginas e ativos do PWA; casca, login e entrada dedicada responderam `200`.

O smoke passou: API anônima `403` pelo `auth_request`; entrada e manifesto dedicados `200`; texto “Versão oficial · Concrefer”; desktop salvar, reenviar, sem produção, motivo, validação e confirmação; mobile lançar e confirmar; conflito `409`; resumo. As datas fictícias foram removidas. O gate posterior foi **7/7**. A contagem no banco ficou em **40 `maodeobra` e 2 `maodeobra_dias` antes e depois**; o fingerprint dos registros existentes permaneceu igual ao inicial.

A comparação final do snapshot reportou `changed_existing_paths: {}`. Os diretórios novos `m/`, `m/maodeobra/` e `m/maodeobra/icons/` ficaram `root:root 0755`, como `unificado/`, e passaram na verificação de leitura como `www-data`. O manifesto e o service worker raiz do Unificado conservaram seus hashes anteriores. O serviço PCP terminou ativo. O snapshot posterior foi salvo em `/root/backups/maodeobra-prod-20261017-2030/public-permissions-after.json` (SHA-256 `1efac0875f333a12c24b8c0d1c616d25205c02660813a203d798679bcae2af4c`). Não foi necessário retorno nesta janela.
