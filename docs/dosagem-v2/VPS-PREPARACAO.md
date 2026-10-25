# Preparação da VPS — rodada 4.1

SHA-256 local (`docs/dosagem-v2/deploy/preparar-vps.sh`): `8b679886850e74ddcde08b1aeb10a1adde069654f87385989597b2c6db95e181`.

SHA-256 remoto (`/root/preparar-vps.sh`): `8b679886850e74ddcde08b1aeb10a1adde069654f87385989597b2c6db95e181`. Permissão remota: `700`.

## Simulação

Comando: `sudo bash /root/preparar-vps.sh --simular`. Código de saída: `0`. Saída completa, stdout e stderr:

```text


==> MODO SIMULAÇÃO — nada será alterado

==> 1. Verificações (somente leitura)
could not change directory to "/root": Permission denied
could not change directory to "/root": Permission denied
    nginx: nginx version: nginx/1.18.0 (Ubuntu)
    PostgreSQL: 14.24(Ubuntu14.24-0ubuntu0.22.04.1) na porta 5432
    CPU: 2 vCPU · carga: 0.11 0.12 0.09 · RAM disponível: 5749 MB
    Disco livre em /opt: 40G
    certbot: presente

==> 2. Usuários
    ctdosagem já existe
    [simular] useradd --create-home --shell /bin/bash deploy-dosagem
    [simular] usermod -aG ctdosagem deploy-dosagem
    [simular] install -d -m 700 -o deploy-dosagem -g deploy-dosagem /home/deploy-dosagem/.ssh
    [simular] touch /home/deploy-dosagem/.ssh/authorized_keys && chown deploy-dosagem:deploy-dosagem /home/deploy-dosagem/.ssh/authorized_keys && chmod 600 /home/deploy-dosagem/.ssh/authorized_keys
    [simular] passwd -l deploy-dosagem >/dev/null

==> 3. Pastas em /opt/concretrack-dosagem
    [simular] install -d -m 2750 -o deploy-dosagem -g ctdosagem /opt/concretrack-dosagem
    [simular] install -d -m 2750 -o deploy-dosagem -g ctdosagem /opt/concretrack-dosagem/releases
    [simular] install -d -m 2750 -o deploy-dosagem -g ctdosagem /opt/concretrack-dosagem/shared
    [simular] install -d -m 2770 -o ctdosagem   -g ctdosagem /opt/concretrack-dosagem/backups
    [simular] install -d -m 2755 -o deploy-dosagem -g ctdosagem /opt/concretrack-dosagem/acme

==> 4. Banco e role PostgreSQL (sem alterar configuração global)
could not change directory to "/root": Permission denied
    role dosagem_app já existe (senha mantida)
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET statement_timeout = '15s'" >/dev/null
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET lock_timeout = '5s'" >/dev/null
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET idle_in_transaction_session_timeout = '60s'" >/dev/null
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET work_mem = '8MB'" >/dev/null
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET maintenance_work_mem = '64MB'" >/dev/null
could not change directory to "/root": Permission denied
    banco concretrack_dosagem já existe
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_dosagem -c "REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC" >/dev/null

==> 5. Wrapper /usr/local/sbin/ctdosagem-instalar (única operação com root permitida ao deploy)
    [simular] instalaria /usr/local/sbin/ctdosagem-instalar (units, nginx-site, reload-nginx, restart-api, status-api, enable, certbot, diagnostico)

==> 6. sudo restrito para deploy-dosagem
    [simular] criaria /etc/sudoers.d/deploy-dosagem permitindo apenas: sudo /usr/local/sbin/ctdosagem-instalar <subcomando>

==> Pronto.

Próximos passos:
  1. Adicione a CHAVE PÚBLICA do Codex ao usuário deploy-dosagem:
       echo 'ssh-ed25519 AAAA... codex-dosagem' >> /home/deploy-dosagem/.ssh/authorized_keys
  2. No ambiente do Codex, configure o alias:
       Host vps-antiga
         HostName 31.97.241.84
         User deploy-dosagem
         IdentityFile ~/.ssh/<chave-privada-do-codex>
  3. Crie o DNS:  A  dosagem  ->  31.97.241.84
  4. Nada foi reiniciado. Nenhum pacote foi instalado. Outros sites não foram tocados.

Para remover tudo depois (se desistir): apague /etc/sudoers.d/deploy-dosagem, /usr/local/sbin/ctdosagem-instalar, /opt/concretrack-dosagem, os usuários
deploy-dosagem/ctdosagem e, no PostgreSQL, o banco concretrack_dosagem e a role dosagem_app.

```

## Portão 0.2

**Reprovado.** A simulação inclui `REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC`, alteração de permissão do banco fora das exceções permitidas pelo usuário para a etapa 0. A role e o banco já existem e não foram recriados. O passo 0.3 não foi executado. A conta `deploy-dosagem` e o wrapper não foram criados. O script copiado em `/root/preparar-vps.sh` permanece lá porque a etapa 0 foi interrompida antes do passo 0.6, que previa sua remoção.


## Adendo 4.2 — nova simulação autorizada (18/10/2026)

SHA-256 local e remoto de preparar-vps.sh: 8b679886850e74ddcde08b1aeb10a1adde069654f87385989597b2c6db95e181. Código de saída 0. O REVOKE foi autorizado expressamente pelo adendo.

```text

[1m==> MODO SIMULAÇÃO — nada será alterado[0m

[1m==> 1. Verificações (somente leitura)[0m
ssh : could not change directory to "/root": Permission denied
No linha:2 caractere:1
+ ssh -o BatchMode=yes vps-rh 'sudo bash /root/preparar-vps.sh --simula ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (could not chang...rmission denied:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
could not change directory to "/root": Permission denied
    nginx: nginx version: nginx/1.18.0 (Ubuntu)
    PostgreSQL: 14.24(Ubuntu14.24-0ubuntu0.22.04.1) na porta 5432
    CPU: 2 vCPU · carga: 0.15 0.12 0.09 · RAM disponível: 5754 MB
    Disco livre em /opt: 40G
    certbot: presente

[1m==> 2. Usuários[0m
    ctdosagem já existe
    [simular] useradd --create-home --shell /bin/bash deploy-dosagem
    [simular] usermod -aG ctdosagem deploy-dosagem
    [simular] install -d -m 700 -o deploy-dosagem -g deploy-dosagem /home/deploy-dosagem/.ssh
    [simular] touch /home/deploy-dosagem/.ssh/authorized_keys && chown deploy-dosagem:deploy-dosagem /home/deploy-dosagem/.ssh/authorized_keys && chmod 600 /home/deploy-dosagem/.ssh/authorized_keys
    [simular] passwd -l deploy-dosagem >/dev/null

[1m==> 3. Pastas em /opt/concretrack-dosagem[0m
    [simular] install -d -m 2750 -o deploy-dosagem -g ctdosagem /opt/concretrack-dosagem
    [simular] install -d -m 2750 -o deploy-dosagem -g ctdosagem /opt/concretrack-dosagem/releases
    [simular] install -d -m 2750 -o deploy-dosagem -g ctdosagem /opt/concretrack-dosagem/shared
    [simular] install -d -m 2770 -o ctdosagem   -g ctdosagem /opt/concretrack-dosagem/backups
    [simular] install -d -m 2755 -o deploy-dosagem -g ctdosagem /opt/concretrack-dosagem/acme

[1m==> 4. Banco e role PostgreSQL (sem alterar configuração global)[0m
    role dosagem_app já existe (senha mantida)
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET statement_timeout = '15s'" >/dev/null
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET lock_timeout = '5s'" >/dev/null
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET idle_in_transaction_session_timeout = '60s'" >/dev/null
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET work_mem = '8MB'" >/dev/null
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE dosagem_app SET maintenance_work_mem = '64MB'" >/dev/null
could not change directory to "/root": Permission denied
could not change directory to "/root": Permission denied
    banco concretrack_dosagem já existe
    [simular] sudo -u postgres psql -v ON_ERROR_STOP=1 -d concretrack_dosagem -c "REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC" >/dev/null

[1m==> 5. Wrapper /usr/local/sbin/ctdosagem-instalar (única operação com root permitida ao deploy)[0m
    [simular] instalaria /usr/local/sbin/ctdosagem-instalar (units, nginx-site, reload-nginx, restart-api, status-api, enable, certbot, diagnostico)

[1m==> 6. sudo restrito para deploy-dosagem[0m
    [simular] criaria /etc/sudoers.d/deploy-dosagem permitindo apenas: sudo /usr/local/sbin/ctdosagem-instalar <subcomando>

[1m==> Pronto.[0m

Próximos passos:
  1. Adicione a CHAVE PÚBLICA do Codex ao usuário deploy-dosagem:
       echo 'ssh-ed25519 AAAA... codex-dosagem' >> /home/deploy-dosagem/.ssh/authorized_keys
  2. No ambiente do Codex, configure o alias:
       Host vps-antiga
         HostName 31.97.241.84
         User deploy-dosagem
         IdentityFile ~/.ssh/<chave-privada-do-codex>
  3. Crie o DNS:  A  dosagem  ->  31.97.241.84
  4. Nada foi reiniciado. Nenhum pacote foi instalado. Outros sites não foram tocados.

Para remover tudo depois (se desistir): apague /etc/sudoers.d/deploy-dosagem, /usr/local/sbin/ctdosagem-instalar, /opt/concretrack-dosagem, os usuários
deploy-dosagem/ctdosagem e, no PostgreSQL, o banco concretrack_dosagem e a role dosagem_app.
```


## Adendo 4.2 — execução da preparação (18/10/2026)

Comando: sudo bash /root/preparar-vps.sh. Código de saída 0. Saída completa:

```text

[1m==> 1. Verificações (somente leitura)[0m
ssh : could not change directory to "/root": Permission denied
No linha:2 caractere:1
+ ssh -o BatchMode=yes vps-rh 'sudo bash /root/preparar-vps.sh' 2>&1 |  ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (could not chang...rmission denied:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
could not change directory to "/root": Permission denied
    nginx: nginx version: nginx/1.18.0 (Ubuntu)
    PostgreSQL: 14.24(Ubuntu14.24-0ubuntu0.22.04.1) na porta 5432
    CPU: 2 vCPU · carga: 0.13 0.12 0.09 · RAM disponível: 5753 MB
    Disco livre em /opt: 40G
    certbot: presente

[1m==> 2. Usuários[0m
    ctdosagem já existe

[1m==> 3. Pastas em /opt/concretrack-dosagem[0m

[1m==> 4. Banco e role PostgreSQL (sem alterar configuração global)[0m
could not change directory to "/root": Permission denied
    role dosagem_app já existe (senha mantida)
could not change directory to "/root": Permission denied
could not change directory to "/root": Permission denied
could not change directory to "/root": Permission denied
could not change directory to "/root": Permission denied
could not change directory to "/root": Permission denied
could not change directory to "/root": Permission denied
    banco concretrack_dosagem já existe
could not change directory to "/root": Permission denied
    conexão TCP 127.0.0.1 com a role dosagem_app: OK

[1m==> 5. Wrapper /usr/local/sbin/ctdosagem-instalar (única operação com root permitida ao deploy)[0m
    wrapper instalado

[1m==> 6. sudo restrito para deploy-dosagem[0m
    sudoers instalado em /etc/sudoers.d/deploy-dosagem

[1m==> Pronto.[0m

Próximos passos:
  1. Adicione a CHAVE PÚBLICA do Codex ao usuário deploy-dosagem:
       echo 'ssh-ed25519 AAAA... codex-dosagem' >> /home/deploy-dosagem/.ssh/authorized_keys
  2. No ambiente do Codex, configure o alias:
       Host vps-antiga
         HostName 31.97.241.84
         User deploy-dosagem
         IdentityFile ~/.ssh/<chave-privada-do-codex>
  3. Crie o DNS:  A  dosagem  ->  31.97.241.84
  4. Nada foi reiniciado. Nenhum pacote foi instalado. Outros sites não foram tocados.

Para remover tudo depois (se desistir): apague /etc/sudoers.d/deploy-dosagem, /usr/local/sbin/ctdosagem-instalar, /opt/concretrack-dosagem, os usuários
deploy-dosagem/ctdosagem e, no PostgreSQL, o banco concretrack_dosagem e a role dosagem_app.
```

## Adendo 4.2 — resultado da preparação

A nova simulação foi aceita porque o REVOKE passou a constar na lista autorizada. A execução terminou com código 0; banco, role, senha e `.env` existentes foram reutilizados. Chave pública e alias `vps-antiga` configurados. Diagnóstico do wrapper aprovado; sudo genérico recusado. Sites vizinhos conferidos sem mudança: compras 200, concretrack 200, usina 301, ged 302, pcp 302, pederneiras 200, rh 200, ribeirao 200, relatorios 200. `/root/preparar-vps.sh` foi removido; só `deploy-dosagem` poderá ser usado agora. F5/F6 aguardam F1–F4 verdes.


## Estado ap?s a execu??o dos port?es ? 18/10/2026, 20:33 BRT

Etapa 0 permanece conclu?da e o acesso root continua proibido. `npm run gates` terminou com F1 verde e F2?F4 vermelhos. Portanto o port?o de deploy ?6.2 n?o foi aberto; F5/F6 n?o foram iniciados. Nenhuma nova altera??o na VPS foi realizada ap?s a prepara??o. A stack de homologa??o local foi encerrada ao final do verificador.


## Port?o de deploy em 18/10/2026, 20:45 BRT

`GATES.json` agora registra F1 e F2 verdes; F3 e F4 continuam vermelhos por aus?ncia de 13 fluxos E2E da Release 1. F5/F6 n?o foram iniciados. Nenhuma opera??o adicional foi feita na VPS ap?s a Etapa 0; root permanece proibido.

## Adendo 4.3 — medição F5 do piloto (18/10/2026)

Após os quatro portões piloto ficarem verdes, a medição somente leitura ocorreu como `deploy-dosagem` entre 00:47:04 e 00:57:06 UTC de 19/10/2026. A saída integral está em `VPS-F5-PILOTO.log`: 21 amostras a intervalos de 30 segundos, cobrindo 10 minutos. O `pg_isready` confirmou PostgreSQL em 127.0.0.1:5432. Os nove sites vizinhos tinham os códigos esperados antes e depois: 200/200/301/302/302/200/200/200/200.

Média da carga de 15 minutos: **0,10** para **2 vCPU** (limite 4); RAM disponível mínima **5739 MB** (limite 400 MB); swap usado **0 MB**; disco livre em `/opt` **40 GB** (limite 3 GB); iowait máximo **0%**. O portão de recursos **F5 passou**. A transferência PowerShell do script acrescentou um CR após o registro `END`, causando código de saída 127 *depois* das 21 amostras e da segunda verificação dos sites. Os dados e a duração foram conferidos no log; esse erro de transporte não alterou a medição. O script local foi mantido para reprodução. Nenhum acesso root ocorreu.

## Adendo 4.3 — implantação F6 e verificação posterior

`GATES-PILOTO.json` terminou com P-F1–P-F4 verdes antes da ativação e novamente após as correções finais da faixa e da marca d'água. Como `deploy-dosagem`, a release `/opt/concretrack-dosagem/releases/20261019-010306-piloto` foi ativada; o pacote final local/remoto tem SHA-256 `437498bcfb1d257cdb36189bc4e7319baa29c260a0717ede3d6f9e7f05217b0e`. As únicas operações com sudo usaram `/usr/local/sbin/ctdosagem-instalar`: `units`, `nginx-site`, `reload-nginx`, `enable` e `restart-api`. Banco, role, senha e Python isolado existentes foram reutilizados. A migração aditiva foi aplicada após dump; não houve instalação de pacote nem acesso root. O arquivo `.env` teve somente a linha `MODO_PILOTO=true` acrescentada (471→488 bytes).

`concretrack-dosagem-api.service` e `concretrack-dosagem-backup.timer` estão ativos. `/api/v1/saude` → HTTP 200, `piloto=true`; página do piloto pelo túnel → HTTP 200. O navegador confirmou faixa PILOTO e login do admin com redirecionamento para troca obrigatória. A senha foi entregue uma vez no terminal e está apenas no arquivo protegido da VPS (modo 600, dono `ctdosagem`), não neste relatório. O smoke do servidor conferiu único usuário admin, P1b = 1000,00 L/321 kg, A1 = 999,969085 L/351 kg, ambos `piloto=true`, e removeu os dois traços de teste e a auditoria deles. A criação desses traços no navegador continua pendente da troca da senha inicial pelo Ricardo.

Os nove sites vizinhos mantiveram 200/200/301/302/302/200/200/200/200. Após mais de cinco minutos, load 0,48/0,37/0,24, RAM disponível 5674 MB, swap zero e disco livre 40 GB. O DNS `dosagem.concretrack.com.br` ainda não apontava à VPS; foi publicado apenas o desafio HTTP e a interface privada na porta local 18380. Acesso: `ssh -L 18443:127.0.0.1:18380 vps-antiga`, depois `http://127.0.0.1:18443/`. Quando o DNS apontar para `31.97.241.84`, rodar como `deploy-dosagem`: `sudo /usr/local/sbin/ctdosagem-instalar certbot`; configurar HTTPS da Dosagem com o wrapper. Acesso root permanece proibido.

Antes do piloto, `current` era um link autorreferente e a release anterior não tinha diretório `web`; não havia rollback remoto para versão funcional. O script de rollback apenas de código foi entregue no pacote e o teste N−1 local passou, mas o rollback remoto funcional continua pendente antes da virada oficial.

## 19/10/2026 — conta Ricardo

Depois do `GATES-PILOTO.json` todo verde (10:23:08 UTC), ativou-se `/opt/concretrack-dosagem/releases/20261019-ricardo-master-piloto` como `deploy-dosagem`. O wrapper restrito instalou e iniciou a unit de provisão como `ctdosagem` e reiniciou a API. O hash Argon2id temporário foi consumido e removido. Login HTTP 200; sessão confirmou `admin`, `["*"]` e acesso direto (trocarSenha=false). A senha em texto não aparece neste documento. Sem root, pacote, migração ou alteração do `.env`.

API e login HTTP 200; saúde `piloto=true`; nove vizinhos em 200/200/301/302/302/200/200/200/200. Túnel local `127.0.0.1:18443` reaberto. DNS/TLS público continua pendente.

Correção: o provisionamento marcou inicialmente a senha solicitada como provisória. A API confirmou a mesma senha e retirou a exigência de troca. O navegador alcançou a página inicial após o login.
