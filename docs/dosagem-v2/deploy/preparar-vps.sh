#!/usr/bin/env bash
# =============================================================================
# preparar-vps.sh — ConcreTrack Dosagem v2 · preparação ÚNICA da VPS (rodar como root)
#
# O que faz (idempotente):
#   - confere que já existem PostgreSQL e nginx (NÃO instala nada; se faltar, para sem alterar nada)
#   - cria o usuário de sistema  ctdosagem      (roda a API; sem shell)
#   - cria o usuário             deploy-dosagem (usado pelo Codex via chave SSH; sudo restrito)
#   - cria /opt/concretrack-dosagem/{releases,shared,backups,acme}
#   - cria a role e o banco PostgreSQL com limites; senha aleatória gravada só em shared/.env
#   - instala o wrapper /usr/local/sbin/ctdosagem-instalar (única porta de entrada com root)
#   - cria /etc/sudoers.d/deploy-dosagem permitindo SOMENTE esse wrapper
#
# O que NÃO faz: não instala pacotes, não reinicia serviços, não mexe em outros sites,
# não altera postgresql.conf / pg_hba.conf, não abre portas.
#
# Uso:
#   sudo bash preparar-vps.sh --simular     # mostra o que faria, sem alterar nada
#   sudo bash preparar-vps.sh               # executa
#   sudo bash preparar-vps.sh --email-certbot voce@dominio.com.br
# =============================================================================
set -euo pipefail

SIMULAR=0
EMAIL_CERTBOT=""
APP_DIR="/opt/concretrack-dosagem"
DOMINIO="dosagem.concretrack.com.br"
USR_APP="ctdosagem"
USR_DEPLOY="deploy-dosagem"
DB_NOME="concretrack_dosagem"
DB_ROLE="dosagem_app"
WRAPPER="/usr/local/sbin/ctdosagem-instalar"
SUDOERS="/etc/sudoers.d/deploy-dosagem"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --simular) SIMULAR=1; shift ;;
    --email-certbot) EMAIL_CERTBOT="${2:-}"; shift 2 ;;
    *) echo "Parâmetro desconhecido: $1"; exit 2 ;;
  esac
done

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
run()  { if [[ $SIMULAR -eq 1 ]]; then printf '    [simular] %s\n' "$*"; else eval "$@"; fi; }

[[ $EUID -eq 0 ]] || { echo "Rode como root (sudo)."; exit 1; }
[[ $SIMULAR -eq 1 ]] && log "MODO SIMULAÇÃO — nada será alterado"

# -----------------------------------------------------------------------------
log "1. Verificações (somente leitura)"
command -v nginx >/dev/null 2>&1 || { echo "ERRO: nginx não encontrado. Nada foi alterado."; exit 1; }
command -v psql  >/dev/null 2>&1 || { echo "ERRO: PostgreSQL (psql) não encontrado. Nada foi alterado. A Dosagem não instala PostgreSQL nesta VPS."; exit 1; }
id postgres >/dev/null 2>&1      || { echo "ERRO: usuário 'postgres' inexistente. Nada foi alterado."; exit 1; }
sudo -u postgres psql -tAc "select 1" >/dev/null 2>&1 || { echo "ERRO: não consegui conectar no PostgreSQL local como 'postgres'. Nada foi alterado."; exit 1; }
PG_PORT="$(sudo -u postgres psql -tAc 'show port' | tr -d '[:space:]')"
PG_VER="$(sudo -u postgres psql -tAc 'show server_version' | tr -d '[:space:]')"
info "nginx: $(nginx -v 2>&1)"
info "PostgreSQL: $PG_VER na porta $PG_PORT"
info "CPU: $(nproc) vCPU · carga: $(cut -d' ' -f1-3 /proc/loadavg) · RAM disponível: $(awk '/MemAvailable/{printf "%d MB",$2/1024}' /proc/meminfo)"
info "Disco livre em /opt: $(df -h /opt | awk 'NR==2{print $4}')"
command -v certbot >/dev/null 2>&1 && info "certbot: presente" || info "certbot: AUSENTE (TLS ficará pendente; não será instalado)"

# -----------------------------------------------------------------------------
log "2. Usuários"
if id "$USR_APP" >/dev/null 2>&1; then info "$USR_APP já existe"; else
  run "useradd --system --no-create-home --home-dir $APP_DIR --shell /usr/sbin/nologin $USR_APP"; fi
if id "$USR_DEPLOY" >/dev/null 2>&1; then info "$USR_DEPLOY já existe"; else
  run "useradd --create-home --shell /bin/bash $USR_DEPLOY"; fi
run "usermod -aG $USR_APP $USR_DEPLOY"
run "install -d -m 700 -o $USR_DEPLOY -g $USR_DEPLOY /home/$USR_DEPLOY/.ssh"
run "touch /home/$USR_DEPLOY/.ssh/authorized_keys && chown $USR_DEPLOY:$USR_DEPLOY /home/$USR_DEPLOY/.ssh/authorized_keys && chmod 600 /home/$USR_DEPLOY/.ssh/authorized_keys"
run "passwd -l $USR_DEPLOY >/dev/null"   # sem senha: só entra por chave

# -----------------------------------------------------------------------------
log "3. Pastas em $APP_DIR"
run "install -d -m 2750 -o $USR_DEPLOY -g $USR_APP $APP_DIR"
run "install -d -m 2750 -o $USR_DEPLOY -g $USR_APP $APP_DIR/releases"
run "install -d -m 2750 -o $USR_DEPLOY -g $USR_APP $APP_DIR/shared"
run "install -d -m 2770 -o $USR_APP   -g $USR_APP $APP_DIR/backups"
run "install -d -m 2755 -o $USR_DEPLOY -g $USR_APP $APP_DIR/acme"

# -----------------------------------------------------------------------------
log "4. Banco e role PostgreSQL (sem alterar configuração global)"
ENV_FILE="$APP_DIR/shared/.env"
ROLE_EXISTE="$(sudo -u postgres psql -tAc "select 1 from pg_roles where rolname='$DB_ROLE'" | tr -d '[:space:]')"
if [[ "$ROLE_EXISTE" == "1" ]]; then
  info "role $DB_ROLE já existe (senha mantida)"
  [[ -f "$ENV_FILE" ]] || info "ATENÇÃO: a role existe mas $ENV_FILE não. Crie o .env manualmente com a DATABASE_URL da role (o script não troca senhas)."
else
  DB_SENHA="$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)"
  if [[ $SIMULAR -eq 1 ]]; then
    info "[simular] CREATE ROLE $DB_ROLE LOGIN PASSWORD '********' CONNECTION LIMIT 10"
  else
    sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE $DB_ROLE LOGIN PASSWORD '$DB_SENHA' CONNECTION LIMIT 10" >/dev/null
  fi
  if [[ $SIMULAR -eq 0 ]]; then
    umask 027
    cat > "$ENV_FILE" <<EOF
# Gerado por preparar-vps.sh em $(date -Iseconds). NÃO versionar.
DATABASE_URL=postgresql+psycopg://$DB_ROLE:$DB_SENHA@127.0.0.1:$PG_PORT/$DB_NOME
AMBIENTE=producao
DOMINIO=$DOMINIO
EOF
    chown "$USR_DEPLOY:$USR_APP" "$ENV_FILE"; chmod 640 "$ENV_FILE"
    info ".env criado em $ENV_FILE (senha do banco só neste arquivo)"
  else
    info "[simular] criaria $ENV_FILE com DATABASE_URL"
  fi
fi
for ajuste in "statement_timeout='15s'" "lock_timeout='5s'" "idle_in_transaction_session_timeout='60s'" "work_mem='8MB'" "maintenance_work_mem='64MB'"; do
  run "sudo -u postgres psql -v ON_ERROR_STOP=1 -c \"ALTER ROLE $DB_ROLE SET ${ajuste/=/ = }\" >/dev/null"
done
DB_EXISTE="$(sudo -u postgres psql -tAc "select 1 from pg_database where datname='$DB_NOME'" | tr -d '[:space:]')"
if [[ "$DB_EXISTE" == "1" ]]; then info "banco $DB_NOME já existe"; else
  run "sudo -u postgres createdb -O $DB_ROLE -E UTF8 -T template0 $DB_NOME"; fi
run "sudo -u postgres psql -v ON_ERROR_STOP=1 -d $DB_NOME -c \"REVOKE ALL ON DATABASE $DB_NOME FROM PUBLIC\" >/dev/null"

if [[ $SIMULAR -eq 0 && -f "$ENV_FILE" ]]; then
  URL="$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | sed 's/+psycopg//')"
  if psql "$URL" -tAc "select 1" >/dev/null 2>&1; then
    info "conexão TCP 127.0.0.1 com a role $DB_ROLE: OK"
  else
    info "ATENÇÃO: a role não conectou por TCP em 127.0.0.1. Verifique se o pg_hba.conf tem uma linha"
    info "  'host $DB_NOME $DB_ROLE 127.0.0.1/32 scram-sha-256' (este script NÃO altera o pg_hba.conf)."
  fi
fi

# -----------------------------------------------------------------------------
log "5. Wrapper $WRAPPER (única operação com root permitida ao deploy)"
if [[ $SIMULAR -eq 0 ]]; then
cat > "$WRAPPER" <<'WRAP'
#!/usr/bin/env bash
# ctdosagem-instalar — operações root permitidas ao usuário deploy-dosagem (ConcreTrack Dosagem)
set -euo pipefail
APP=/opt/concretrack-dosagem
CUR="$APP/current/deploy"
DOM="dosagem.concretrack.com.br"
SITE="/etc/nginx/sites-available/$DOM.conf"
EMAIL_CERTBOT="__EMAIL__"
erro(){ echo "ctdosagem-instalar: $*" >&2; exit 1; }
valida_unit(){
  local f="$1"
  [[ "$(basename "$f")" =~ ^concretrack-dosagem-[a-z0-9-]+\.(service|timer)$ ]] || erro "nome de unit não permitido: $f"
  if [[ "$f" == *.service ]]; then
    grep -Eq '^User=ctdosagem$' "$f" || erro "$f precisa ter User=ctdosagem"
    ! grep -Eq '^(User|Group)=root' "$f" || erro "$f não pode rodar como root"
    ! grep -Eq '^Exec[A-Za-z]*=[[:space:]]*[@-]*[+!]' "$f" || erro "$f usa prefixo '+' ou '!' (privilégio elevado), não permitido"
    ! grep -Eq '^(AmbientCapabilities|CapabilityBoundingSet|PermissionsStartOnly|RootDirectory|DynamicUser|SupplementaryGroups)=' "$f" || erro "$f usa diretiva de privilégio não permitida"
    while read -r linha; do
      cmd="${linha#*=}"; cmd="${cmd#[-@+!]}"
      [[ "$cmd" == "$APP/"* || "$cmd" == /usr/bin/nice* || "$cmd" == /usr/bin/ionice* ]] || erro "ExecStart fora de $APP: $cmd"
    done < <(grep -E '^Exec(Start|StartPre|StartPost|Stop|Reload)=' "$f")
  fi
}
case "${1:-}" in
  units)
    shopt -s nullglob
    arquivos=("$CUR"/systemd/concretrack-dosagem-*.service "$CUR"/systemd/concretrack-dosagem-*.timer)
    [[ ${#arquivos[@]} -gt 0 ]] || erro "nenhuma unit em $CUR/systemd"
    for f in "${arquivos[@]}"; do valida_unit "$f"; install -m 644 -o root -g root "$f" /etc/systemd/system/; done
    systemctl daemon-reload ;;
  nginx-site)
    f="$CUR/nginx/$DOM.conf"; [[ -f "$f" ]] || erro "arquivo $f não existe"
    nomes="$(grep -Eo 'server_name[^;]+' "$f" | sed 's/server_name//' | tr -s ' \n' ' ' | xargs -n1 | sort -u | tr '\n' ' ')"
    [[ "$nomes" == "$DOM " ]] || erro "o site só pode declarar server_name $DOM (achei: $nomes)"
    if grep -E '^\s*include\s' "$f" | grep -vqE 'include\s+(/etc/letsencrypt/options-ssl-nginx\.conf|mime\.types|/etc/nginx/mime\.types);'; then erro "include não permitido no site"; fi
    while read -r caminho; do
      [[ "$caminho" == "$APP/"* ]] || erro "root/alias fora de $APP: $caminho"
    done < <(grep -Eo '(^|[;{[:space:]])(root|alias)[[:space:]]+[^;[:space:]]+' "$f" | sed -E 's/^[;{[:space:]]*(root|alias)[[:space:]]+//')
    while read -r cert; do
      [[ "$cert" == /etc/letsencrypt/live/$DOM/* || "$cert" == /etc/letsencrypt/ssl-dhparams.pem ]] || erro "certificado fora do domínio: $cert"
    done < <(grep -Eo '^\s*ssl_(certificate|certificate_key|trusted_certificate|dhparam)\s+[^;]+' "$f" | awk '{print $2}')
    [[ -f "$SITE" ]] && cp -a "$SITE" "$SITE.anterior"
    install -m 644 -o root -g root "$f" "$SITE"
    ln -sfn "$SITE" "/etc/nginx/sites-enabled/$DOM.conf"
    if ! nginx -t 2>/tmp/ctdosagem-nginx-t.log; then
      if [[ -f "$SITE.anterior" ]]; then mv -f "$SITE.anterior" "$SITE"; else rm -f "$SITE" "/etc/nginx/sites-enabled/$DOM.conf"; fi
      cat /tmp/ctdosagem-nginx-t.log >&2; erro "nginx -t falhou; arquivo anterior restaurado, nginx NÃO recarregado"
    fi ;;
  reload-nginx)   nginx -t && systemctl reload nginx ;;
  restart-api)    systemctl restart concretrack-dosagem-api.service ;;
  status-api)     systemctl --no-pager status concretrack-dosagem-api.service || true ;;
  enable)         shift; for u in "$@"; do [[ "$u" =~ ^concretrack-dosagem-[a-z0-9-]+\.(service|timer)$ ]] || erro "unit não permitida: $u"; systemctl enable --now "$u"; done ;;
  certbot)
    command -v certbot >/dev/null || erro "certbot ausente (não será instalado)"
    if [[ -n "$EMAIL_CERTBOT" && "$EMAIL_CERTBOT" != "__EMAIL__" ]]; then em=(-m "$EMAIL_CERTBOT"); else em=(--register-unsafely-without-email); fi
    certbot certonly --webroot -w "$APP/acme" -d "$DOM" --non-interactive --agree-tos "${em[@]}" ;;
  diagnostico)
    echo "## nginx server_names"; nginx -T 2>/dev/null | grep -E '^\s*server_name' | sort -u
    echo "## portas"; ss -ltn
    echo "## carga"; cat /proc/loadavg; nproc; free -m; df -h / /opt ;;
  *) echo "uso: $0 {units|nginx-site|reload-nginx|restart-api|status-api|enable <units>|certbot|diagnostico}"; exit 2 ;;
esac
WRAP
  sed -i "s|__EMAIL__|${EMAIL_CERTBOT:-__EMAIL__}|" "$WRAPPER"
  chown root:root "$WRAPPER"; chmod 755 "$WRAPPER"
  info "wrapper instalado"
else
  info "[simular] instalaria $WRAPPER (units, nginx-site, reload-nginx, restart-api, status-api, enable, certbot, diagnostico)"
fi

# -----------------------------------------------------------------------------
log "6. sudo restrito para $USR_DEPLOY"
if [[ $SIMULAR -eq 0 ]]; then
  TMP="$(mktemp)"
  cat > "$TMP" <<EOF
# ConcreTrack Dosagem — $USR_DEPLOY só pode executar o wrapper como root
Defaults:$USR_DEPLOY !requiretty
$USR_DEPLOY ALL=(root) NOPASSWD: $WRAPPER
$USR_DEPLOY ALL=(root) NOPASSWD: $WRAPPER *
EOF
  visudo -cf "$TMP" >/dev/null || { rm -f "$TMP"; echo "ERRO: sudoers inválido; nada instalado."; exit 1; }
  install -m 440 -o root -g root "$TMP" "$SUDOERS"; rm -f "$TMP"
  info "sudoers instalado em $SUDOERS"
else
  info "[simular] criaria $SUDOERS permitindo apenas: sudo $WRAPPER <subcomando>"
fi

# -----------------------------------------------------------------------------
log "Pronto."
cat <<EOF

Próximos passos:
  1. Adicione a CHAVE PÚBLICA do Codex ao usuário $USR_DEPLOY:
       echo 'ssh-ed25519 AAAA... codex-dosagem' >> /home/$USR_DEPLOY/.ssh/authorized_keys
  2. No ambiente do Codex, configure o alias:
       Host vps-antiga
         HostName 31.97.241.84
         User $USR_DEPLOY
         IdentityFile ~/.ssh/<chave-privada-do-codex>
  3. Crie o DNS:  A  dosagem  ->  31.97.241.84
  4. Nada foi reiniciado. Nenhum pacote foi instalado. Outros sites não foram tocados.

Para remover tudo depois (se desistir): apague $SUDOERS, $WRAPPER, $APP_DIR, os usuários
$USR_DEPLOY/$USR_APP e, no PostgreSQL, o banco $DB_NOME e a role $DB_ROLE.
EOF
