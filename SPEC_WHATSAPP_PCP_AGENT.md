# SPEC: Envio Automático de Relatório PCP x Produção via WhatsApp

## Contexto do Projeto

**Projeto:** ConcreTrack ERP — `pwa-hub-fase1`
**Repositório local:** `C:\Users\Admin\Documents\pwa-hub-fase1`
**Servidor VPS:** `dautomacao.com` / `usina.concretrack.com.br` (Nginx já configurado)
**Site público (GitHub Pages):** `https://usina.concretrack.com.br`

### O que o agente faz hoje (já implementado e testado)

O agente `pcp_producao_agent/agent_pcp_producao.py`:

1. Busca dados de **produção realizada** no Supabase
2. Busca dados de **programação PCP** no Google Sheets
3. Faz a **comparação realizado × programado** via `comparator.py`
4. **Gera um relatório HTML** salvo em `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_YYYY-MM-DD.html`
5. **Faz git push** do HTML via `git_publisher.py` (publicando no GitHub Pages)
6. **Envia mensagem** via `whatsapp_sender.py` com o link público

### O que FALTA para funcionar de ponta a ponta

- [ ] Instalar **Evolution API** no VPS (Docker)
- [ ] Expor a Evolution API pelo **Nginx** no VPS
- [ ] **Adaptar `whatsapp_sender.py`** ao formato da Evolution API
- [ ] Preencher o **`.env`** com credenciais reais
- [ ] Configurar **cron job** no VPS para rodar o agente diariamente

---

## Arquivos já implementados (NÃO alterar sem necessidade)

### `pcp_producao_agent/git_publisher.py` — NOVO, já criado

```python
"""
git_publisher.py
Publica o relatório HTML no GitHub Pages via git add/commit/push.
"""
import logging
import subprocess
from pathlib import Path

import config

logger = logging.getLogger("pcp_producao_agent")


class GitPublisher:
    def __init__(self):
        self.repo_root = config.PROJECT_ROOT
        self.base_url = config.REPORT_BASE_URL.rstrip("/")
        self.dry_run = config.DRY_RUN

    def publish(self, report_path: Path, date_str: str) -> str | None:
        """
        Faz git add/commit/push do relatório e retorna a URL pública.
        Em dry-run, apenas loga e retorna a URL que seria gerada.
        Retorna a URL pública do relatório ou None em caso de falha.
        """
        # Garante que report_path é um objeto Path
        report_path = Path(report_path)

        # Caminho relativo ao repositório (usado na URL e no git add)
        try:
            rel_path = report_path.resolve().relative_to(self.repo_root.resolve())
        except ValueError:
            logger.error(
                f"O relatório '{report_path}' está fora do repositório '{self.repo_root}'. "
                "Não é possível publicar."
            )
            return None

        # URL pública que será enviada pelo WhatsApp
        public_url = f"{self.base_url}/{rel_path.as_posix()}"

        if self.dry_run:
            logger.info("=== [GIT PUBLISH SIMULATION (DRY-RUN)] ===")
            logger.info(f"  git add {rel_path}")
            logger.info(f'  git commit -m "relatorio: PCP x Producao {date_str}"')
            logger.info("  git push")
            logger.info(f"  URL pública: {public_url}")
            logger.info("===========================================")
            return public_url

        logger.info(f"Publicando relatório no GitHub Pages: {rel_path}")
        try:
            self._run(["git", "add", str(rel_path)])
            self._run(["git", "commit", "-m", f"relatorio: PCP x Producao {date_str}"])
            self._run(["git", "push"])
            logger.info(f"Relatório publicado com sucesso: {public_url}")
            return public_url
        except subprocess.CalledProcessError as e:
            logger.error(f"Falha ao publicar relatório via git: {e}")
            return None

    def _run(self, cmd: list[str]):
        result = subprocess.run(
            cmd,
            cwd=str(self.repo_root),
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True,
        )
        if result.stdout.strip():
            logger.info(f"[git] {result.stdout.strip()}")
        if result.stderr.strip():
            logger.debug(f"[git stderr] {result.stderr.strip()}")
        return result
```

---

### `pcp_producao_agent/config.py` — já atualizado

Variável nova adicionada (após `WHATSAPP_PHONE`):

```python
# URL base pública dos relatórios (GitHub Pages / servidor)
# O caminho relativo ao repositório é concatenado automaticamente.
REPORT_BASE_URL = os.getenv("REPORT_BASE_URL", "https://usina.concretrack.com.br")
```

---

### `pcp_producao_agent/agent_pcp_producao.py` — já atualizado

Importa `GitPublisher` e usa a URL pública no lugar do caminho local:

```python
from git_publisher import GitPublisher
# ...
report_gen = HtmlReportGenerator()
report_path = report_gen.generate(comparison_data, date_str)

publisher = GitPublisher()
public_url = publisher.publish(report_path, date_str)
report_link = public_url or str(report_path)

whatsapp = WhatsAppSender()
whatsapp.send_summary(comparison_data, date_str, report_link)
```

---

### `pcp_producao_agent/whatsapp_sender.py` — estado atual (PRECISA SER ADAPTADO)

O método `send_summary` atual usa payload genérico (`token`, `to`, `body`) que **não é compatível com a Evolution API**.
Ver Tarefa 4 abaixo para a correção.

---

## TAREFAS PARA EXECUTAR NO VPS

### TAREFA 1 — Instalar Evolution API via Docker

```bash
# Instalar Docker se não tiver
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER
newgrp docker

# Criar diretório
mkdir -p /opt/evolution-api && cd /opt/evolution-api

# Gerar chave de API segura e salvar
API_KEY=$(openssl rand -hex 32)
echo "EVOLUTION_API_KEY=$API_KEY" > .api_key
echo "Chave gerada: $API_KEY"
# COPIAR ESTA CHAVE — será usada no .env do agente e no Nginx

# Criar docker-compose.yml
cat > docker-compose.yml << DOCKER_EOF
version: "3.8"
services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://dautomacao.com/evolution
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=${API_KEY}
      - QRCODE_LIMIT=30
      - DATABASE_ENABLED=false
      - LOG_LEVEL=ERROR
    volumes:
      - evolution_data:/evolution/instances
volumes:
  evolution_data:
DOCKER_EOF

# Subir container
docker compose up -d

# Verificar
docker compose ps
docker compose logs --tail=30
```

---

### TAREFA 2 — Expor Evolution API pelo Nginx

Localizar o arquivo de configuração ativo do Nginx (ex: `/etc/nginx/sites-enabled/dautomacao.com.conf`
ou `/etc/nginx/conf.d/default.conf`). O arquivo de referência local é `dashboard-usina.nginx.conf`.

Adicionar **dentro do bloco `server { listen 443 ssl; ... }`**, antes do último `location /` (fallback):

```nginx
# Evolution API — WhatsApp
location ^~ /evolution/ {
    proxy_pass http://127.0.0.1:8080/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 120s;
}
```

Recarregar:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

Testar:
```bash
curl -s -o /dev/null -w "%{http_code}" https://dautomacao.com/evolution/
# Deve retornar 200 ou 401, nunca 404
```

---

### TAREFA 3 — Criar instância WhatsApp e escanear QR Code

```bash
API_KEY=$(cat /opt/evolution-api/.api_key | cut -d= -f2)

# Criar instância
curl -X POST https://dautomacao.com/evolution/instance/create \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "concretrack", "qrcode": true}'

# Buscar QR Code (abrir URL no navegador)
echo "Abrir no navegador: https://dautomacao.com/evolution/instance/connect/concretrack"
echo "Header necessário: apikey: $API_KEY"
# Ou usar curl e salvar o base64:
curl -s "https://dautomacao.com/evolution/instance/connect/concretrack" \
  -H "apikey: $API_KEY" | python3 -m json.tool
```

Após escanear com o celular (igual WhatsApp Web), verificar conexão:

```bash
curl -s "https://dautomacao.com/evolution/instance/fetchInstances" \
  -H "apikey: $API_KEY" | python3 -m json.tool
# "state" deve ser "open"
```

---

### TAREFA 4 — Adaptar `whatsapp_sender.py` ao formato da Evolution API

**Arquivo:** `pcp_producao_agent/whatsapp_sender.py`

Substituir **somente o método `send_summary`** (manter `format_message` intacto).
O método atual começa na linha `def send_summary(self, data, date_str, report_path):`.

Novo código do método:

```python
    def send_summary(self, data, date_str, report_path):
        """
        Envia a mensagem para o WhatsApp do usuário ou executa dry-run.
        Compatível com Evolution API: POST /message/sendText/{instance}
        Headers: apikey: TOKEN
        Body:    {"number": "5511999999999", "text": "mensagem"}
        """
        message = self.format_message(data, date_str, report_path)

        if self.dry_run or not self.api_url:
            logger.info("=== [WHATSAPP SIMULATION (DRY-RUN)] ===")
            logger.info(f"Destinatário: {self.phone or 'Não configurado'}")
            logger.info(f"Mensagem:\n{message}")
            logger.info("=========================================")
            return True

        # Evolution API usa header "apikey" e body com "number" + "text"
        payload = {
            "number": self.phone,
            "text": message,
        }
        headers = {
            "Content-Type": "application/json",
            "apikey": self.token,
        }

        logger.info(f"Enviando mensagem WhatsApp para {self.phone}...")
        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                timeout=15,
            )
            if response.ok:
                logger.info("Mensagem WhatsApp enviada com sucesso!")
                return True
            else:
                logger.error(
                    f"Falha ao enviar WhatsApp: HTTP {response.status_code}: {response.text}"
                )
                return False
        except Exception as e:
            logger.error(f"Erro de conexão ao enviar WhatsApp: {e}")
            return False
```

---

### TAREFA 5 — Configurar `.env` do agente no VPS

Editar `pcp_producao_agent/.env` no VPS:

```env
# Supabase (já configurado)
SUPABASE_URL=https://fbvvdyirhtgvycullsqy.supabase.co
SUPABASE_KEY=<manter valor existente>

# Google Sheets (já configurado)
GOOGLE_CREDS_PATH=<caminho no VPS para o JSON de credenciais do Google>
SPREADSHEET_ID=18OwJ1bUK1xvr1WG-epDChi5na7FD2MMdsEgeJgBTpRA

# WhatsApp — Evolution API
# Formato: https://dautomacao.com/evolution/message/sendText/{instanceName}
WHATSAPP_API_URL=https://dautomacao.com/evolution/message/sendText/concretrack
WHATSAPP_TOKEN=<chave de /opt/evolution-api/.api_key>
WHATSAPP_PHONE=<número destinatário: DDI+DDD+número, sem + ou espaços. Ex: 5516999999999>

# URL pública dos relatórios
REPORT_BASE_URL=https://usina.concretrack.com.br

# Ativar envio real
DRY_RUN=false

# Fonte do PCP
PCP_PROGRAM_SOURCE=sheets
```

---

### TAREFA 6 — Testar manualmente no VPS

```bash
cd /caminho/do/projeto/pwa-hub-fase1/pcp_producao_agent

# 1. Verificar se git push funciona (pré-requisito)
cd .. && git push && cd pcp_producao_agent

# 2. Dry-run — verificar URL e mensagem formatada
python3 agent_pcp_producao.py --dry-run

# 3. Se OK, rodar de verdade
python3 agent_pcp_producao.py --data ontem
```

---

### TAREFA 7 — Configurar cron job no VPS

```bash
# Abrir editor de cron
crontab -e
```

Adicionar (rodar todo dia útil às 07:00):

```cron
0 7 * * 1-6 cd /CAMINHO_DO_PROJETO/pcp_producao_agent && /usr/bin/python3 agent_pcp_producao.py --data ontem >> /var/log/pcp_producao_agent.log 2>&1
```

> Substituir `/CAMINHO_DO_PROJETO` pelo caminho real no VPS (ex: `/opt/resultado-ensaios-usina/current`).

Verificar:
```bash
crontab -l
```

---

## Fluxo completo após configuração

```
[Cron 07:00 — dias úteis]
         ↓
agent_pcp_producao.py --data ontem
         ↓
1. Supabase → produção realizada (188+ registros)
         ↓
2. Google Sheets → programação PCP (P e R por poste)
         ↓
3. Comparator → realizado × programado
         ↓
4. HtmlReportGenerator → HTML em
   relatorios/defeitos-concreto/diario/relatorio_pcp_producao_YYYY-MM-DD.html
         ↓
5. GitPublisher → git add + commit + push
   → GitHub Pages publica automaticamente
         ↓
6. WhatsAppSender → Evolution API (POST /message/sendText/concretrack)
         ↓
[WhatsApp recebe]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Meta do dia atingida*
*Data:* 15/09/2026
*Fora do padrão:* 0 de 188 formas (0.0%)
*Insight:* 5 dia(s) dentro da meta de 2%.

*Link do Relatório:*
https://usina.concretrack.com.br/relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-15.html
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Critérios de aceite

- [ ] `docker compose ps` no VPS mostra `evolution-api` com status `Up`
- [ ] `curl https://dautomacao.com/evolution/` retorna HTTP 200 ou 401 (não 404)
- [ ] Instância `concretrack` com `"state": "open"` no endpoint fetchInstances
- [ ] `python3 agent_pcp_producao.py --dry-run` termina com exit 0 e loga URL pública correta
- [ ] `python3 agent_pcp_producao.py --data ontem` envia mensagem no WhatsApp com link clicável
- [ ] Link abre o relatório HTML no navegador do celular
- [ ] `crontab -l` mostra o job configurado

---

## Observações importantes

1. **git push no VPS:** Requer autenticação configurada (SSH key ou token HTTPS). Testar `git push` manualmente antes de rodar o agente.
2. **Número `WHATSAPP_PHONE`:** É o número de **quem recebe** o relatório, não o número conectado na Evolution API.
3. **Reconexão da instância:** A instância pode desconectar se o celular ficar sem bateria/internet. Para reconectar, basta acessar `https://dautomacao.com/evolution/instance/connect/concretrack` com o header `apikey` e escanear o QR novamente.
4. **Múltiplos destinatários:** Para enviar para mais de um número, adaptar `whatsapp_sender.py` para iterar sobre uma lista separada por vírgula em `WHATSAPP_PHONE`.
5. **Logs:** O agente grava em `pcp_producao_agent/agent_execution.log`. Em produção, redirecionar também para `/var/log/pcp_producao_agent.log` (já feito no cron acima).
