# Reconhecimento da VPS — Dosagem v2

Atualizado em 18/10/2026. O alias `vps-antiga` foi incluído na entrada já existente da VPS no `~/.ssh/config` local. `ssh -o BatchMode=yes -o ConnectTimeout=8 vps-antiga true` passou com a chave existente; a senha enviada pelo usuário não foi usada. O levantamento abaixo foi somente leitura.

| Campo exigido | Estado |
|---|---|
| SO e versão | Ubuntu 22.04.5 LTS |
| CPU, RAM disponível | 2 CPUs; 7.936 MB total, 5.758 MB disponíveis; sem swap |
| Disco livre em `/opt` | `/opt` está no volume `/dev/sda1`: 97 GB total, 40 GB livres |
| Portas e processos (`ss -ltnp`) | nginx em 80/443; PostgreSQL em 5432; aplicações existentes em 500, 3000–3090, 5000, 5050, 8000–8086; 18300 livre no momento do reconhecimento |
| Serviços systemd ativos | 38 unidades, incluindo PCP, Mapa, GED/ERP, dashboards, nginx, PostgreSQL e Docker. Nenhuma foi alterada no reconhecimento |
| Sites nginx e `server_name` | `compras`, `concretrack.com.br`, `usina`, `ged`, `pcp`, `pederneiras`, `rh`, `ribeirao`, `relatorios`, `dautomacao.com` e hosts sslip.io. nginx já atende 80/443 |
| PostgreSQL, versão, clusters, porta | PostgreSQL 14.24; cluster `14/main` ativo na porta 5432. Reutilizar o cluster, criando somente role e banco da Dosagem |
| Docker | Docker 29.4.0 ativo |
| Python 3.12 | Ausente no sistema; Python 3.12.15 instalado isoladamente sob `/opt/concretrack-dosagem/python/` via uv 0.13.1 e exposto apenas em `/opt/concretrack-dosagem/bin/python3.12` |
| Certbot | Certbot 1.21.0 presente |
| DNS do subdomínio para esta VPS | `getent ahostsv4 api-dosagem.concretrack.com.br` não retornou endereço em 18/10/2026; TLS público pendente |

## Códigos HTTP dos outros sites antes da mudança

Obtidos na própria VPS com `curl --resolve <host>:443:127.0.0.1` e requisição `GET /`:

| Site | Código |
|---|---:|
| compras.concretrack.com.br | 200 |
| dautomacao.com | 301 |
| concretrack.com.br | 200 |
| usina.concretrack.com.br | 301 |
| ged.concretrack.com.br | 302 |
| pcp.concretrack.com.br | 302 |
| pederneiras.concretrack.com.br | 200 |
| rh.concretrack.com.br | 200 |
| ribeirao.concretrack.com.br | 200 |
| relatorios.concretrack.com.br | 200 |

## Comandos de reconhecimento, somente após SSH por chave funcionar

```bash
ssh -o BatchMode=yes vps-antiga true
ssh -o BatchMode=yes vps-antiga 'cat /etc/os-release; nproc; free -m; df -h /opt; ss -ltnp; systemctl list-units --type=service --state=running --no-pager; nginx -T 2>/dev/null | grep -E "server_name|listen"; psql --version || true; pg_lsclusters || true; docker --version || true; certbot --version || true; python3.12 --version || true'
```

Antes de instalar, confirmar se nginx é o servidor atual de 80/443. Se houver Caddy, Apache ou Traefik, integrar nele e adaptar os templates, sem abrir segundo servidor. Se PostgreSQL existir, reutilizar o cluster e criar somente `dosagem_app`/`concretrack_dosagem`; se não existir, instalar só o pacote padrão. Escolher a primeira porta livre entre 18300 e 18399. Parar antes do deploy se houver menos de 300 MB de RAM disponível ou 2 GB livres em `/opt`.

Registrar aqui os valores observados e os códigos HTTP dos demais `server_name` antes e depois da implantação. Como não houve deploy, comparação posterior e verificação de TLS, timer de backup e restauração também estão pendentes.

## Leitura complementar em 18/10/2026 — especificação 4.1

Leitura somente leitura via SSH com chave existente. Ubuntu 22.04.5, 2 vCPU, carga instantânea 0,25/0,18/0,14, RAM disponível 5755 MB, swap 0, `/opt` com 40 GB livres. nginx e PostgreSQL ativos; banco `concretrack_dosagem` e role `dosagem_app` existem. O usuário `ctdosagem` e o arquivo privado de ambiente existem. O usuário `deploy-dosagem` e `/usr/local/sbin/ctdosagem-instalar` não existem. A consulta DNS feita na VPS não retornou endereço para `dosagem.concretrack.com.br`. Códigos HTTP locais por `--resolve` dos sites vizinhos: compras 200, concretrack.com.br 200, usina 301, ged 302, pcp 302, pederneiras 200, rh 200, ribeirao 200, relatorios 200. Não houve medição contínua de 10 minutos nem deploy, pois F1 está reprovado. A leitura usou a conta root já configurada por chave; nenhuma credencial foi registrada ou usada na linha de comando.

### Continuação 4.1 — restrição de acesso

Nesta continuação, tentou-se somente SSH como `deploy-dosagem@31.97.241.84`, com autenticação em lote, e o servidor respondeu `Permission denied (publickey,password)`. Não houve acesso root nesta continuação, nova verificação do wrapper, medição F5 ou alteração na VPS. A preparação da conta e do wrapper por Ricardo continua pendente.

### Preparação autorizada — 18/10/2026

Ricardo autorizou excepcionalmente root para os passos 0.1–0.6 da preparação. O script 4.1 foi copiado para `/root/preparar-vps.sh` com modo 700 e hash local/remoto `8b679886850e74ddcde08b1aeb10a1adde069654f87385989597b2c6db95e181`. O comando `sudo bash /root/preparar-vps.sh --simular` terminou com código 0 e confirmou nginx, PostgreSQL 14, `ctdosagem`, a role `dosagem_app` e o banco `concretrack_dosagem` existentes. Mediu instantaneamente 2 vCPU, carga 0,11/0,12/0,09, 5749 MB de RAM disponível e 40 GB livres em `/opt`; isso não substitui a medição contínua de 10 minutos da F5.

A simulação também propôs `REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC`, alteração fora das exceções autorizadas no passo 0.2. O portão 0.2 foi **reprovado** e o passo 0.3 não foi executado. Não foram criados `deploy-dosagem` nem `/usr/local/sbin/ctdosagem-instalar`; não houve nova verificação dos sites vizinhos. O script copiado permanece em `/root/preparar-vps.sh` porque a etapa parou antes da remoção prevista no passo 0.6. A saída completa está em `VPS-PREPARACAO.md`. Não houve deploy ou mudança de serviço na VPS.

## Verificação após a preparação 4.2

Como `deploy-dosagem`, os códigos HTTP locais por `--resolve` permaneceram: compras 200, concretrack.com.br 200, usina 301, ged 302, pcp 302, pederneiras 200, rh 200, ribeirao 200, relatorios 200. A preparação não reiniciou serviços. O acesso root excepcional terminou com a remoção de `/root/preparar-vps.sh`.

## Piloto 4.3 — estado posterior (18/10/2026)

A Dosagem v2 piloto está ativa em `/opt/concretrack-dosagem/releases/20261019-010306-piloto`; API em 127.0.0.1:18300 e nginx privado em 127.0.0.1:18380. A página e `/api/v1/saude` responderam 200; o último retornou `piloto=true`. Os nove sites vizinhos preservaram os códigos 200/200/301/302/302/200/200/200/200. O DNS público da Dosagem ainda não resolve para esta VPS, portanto TLS está pendente e a interface é acessada pelo túnel SSH. Ver `VPS-PREPARACAO.md` para F5/F6 e `RELATORIO-EXECUCAO.md` para portões e pendências.


## Estado do deploy ap?s Adendo 4.2 ? 18/10/2026, 20:33 BRT

A prepara??o autorizada foi conclu?da, os nove c?digos HTTP vizinhos permaneceram iguais e o alias `vps-antiga` usa somente `deploy-dosagem`. A verifica??o final de `GATES.json` mostra F1 verde e F2?F4 vermelhos; F5/F6 permanecem pendentes, sem nova opera??o remota.


## Atualiza??o dos port?es ? 18/10/2026, 20:45 BRT

?ltima execu??o de `npm run gates`: F1 e F2 verdes; F3 e F4 vermelhos pelos fluxos E2E da Release 1 ainda n?o cobertos. F5 e F6 n?o foram iniciados. N?o houve acesso root nem altera??o adicional na VPS.
