# Reconhecimento da VPS — Dosagem v2

Data: 17/10/2026. **Pendente: sem leitura da VPS.** `ssh -o BatchMode=yes -o ConnectTimeout=8 vps-antiga true` falhou porque o alias `vps-antiga` não foi resolvido no `~/.ssh/config` disponível. Conforme o complemento, não foram tentados senha, IP direto ou outro alias. Nenhum serviço remoto foi alterado.

| Campo exigido | Estado |
|---|---|
| SO e versão | Não observado |
| CPU, RAM disponível | Não observadas |
| Disco livre, especialmente `/opt` | Não observado |
| Portas e processos (`ss -ltnp`) | Não observados |
| Serviços systemd ativos | Não observados |
| Sites nginx e `server_name` | Não observados |
| PostgreSQL, versão, clusters, porta | Não observados |
| Docker | Não observado |
| Python 3.12 | Não observado |
| Certbot | Não observado |
| DNS do subdomínio para esta VPS | Não confirmado |

## Comandos de reconhecimento, somente após SSH por chave funcionar

```bash
ssh -o BatchMode=yes vps-antiga true
ssh -o BatchMode=yes vps-antiga 'cat /etc/os-release; nproc; free -m; df -h /opt; ss -ltnp; systemctl list-units --type=service --state=running --no-pager; nginx -T 2>/dev/null | grep -E "server_name|listen"; psql --version || true; pg_lsclusters || true; docker --version || true; certbot --version || true; python3.12 --version || true'
```

Antes de instalar, confirmar se nginx é o servidor atual de 80/443. Se houver Caddy, Apache ou Traefik, integrar nele e adaptar os templates, sem abrir segundo servidor. Se PostgreSQL existir, reutilizar o cluster e criar somente `dosagem_app`/`concretrack_dosagem`; se não existir, instalar só o pacote padrão. Escolher a primeira porta livre entre 18300 e 18399. Parar antes do deploy se houver menos de 300 MB de RAM disponível ou 2 GB livres em `/opt`.

Registrar aqui os valores observados e os códigos HTTP dos demais `server_name` antes e depois da implantação. Como não houve deploy, comparação posterior e verificação de TLS, timer de backup e restauração também estão pendentes.
