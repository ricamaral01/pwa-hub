# Infraestrutura de origem

Leitura em 22/10/2026 da VPS `31.97.241.84`. Os comandos usados estão no fim deste documento. Nenhuma alteração remota foi feita.

## Topologia observada

| Componente | Execução | Porta / destino | Dados e função |
|---|---|---|---|
| NGINX | `nginx.service` | 80, 443 | TLS e roteamento dos sites |
| ERP API | `concretrack-api.service`, `www-data` | 127.0.0.1:8010 | FastAPI `/var/www/concretrack-erp/api` |
| Frontend ERP | NGINX `alias` | `/concretrack/` | HTML/JS estático em `/var/www/concretrack-erp/public` |
| Dashboard Usina | `dashboard-usina.service`, `www-data` | 127.0.0.1:8000 | Flask/Gunicorn, lê supervisório e grava apontamentos |
| Pederneiras API | `concretrack-pederneiras.service`, `www-data` | 127.0.0.1:8011 | Instância separada e `supervisorio_db_pede` |
| Etiquetas CP | `pwa_etiquetas.service`, `root` | 0.0.0.0:5050 | Flask/Gunicorn, consulta `tbl_massadas` |
| CEC API + worker | PM2 `controle-est-concre-api`, `controle-est-concre-worker` | 127.0.0.1:3086 | Node, banco `controle_est_concre_db` |
| PostgreSQL | `postgresql@14-main.service` | 0.0.0.0:5432 | PostgreSQL **14** na origem |
| Resultado de ensaios/Mapa | `resultado-ensaios-usina.service` | serviço Node | Integração de relatórios e Mapa |

Outros serviços na mesma VPS incluem PCP Concrefer, PCP Armaduras, Dosagem, RH, Compras e Frotas. Não atribuir esses serviços ao ERP sem contrato de integração; suas dependências são registradas em [05-integracoes.md](05-integracoes.md). Usuários de serviço observados: `www-data`, `postgres`, `resultado-ensaios`, `root`. O uso de `root` por Etiquetas e PM2 merece tratamento próprio na futura migração.

## NGINX e TLS

- `sites-enabled/dashboard-usina` é o bloco HTTPS de `dautomacao.com`, `www.dautomacao.com` e `usina.concretrack.com.br`; usa certificado em `/etc/letsencrypt/live/dautomacao.com/`. Tem `client_max_body_size 25M` global e 20M em `/api/inspecoes/`.
- `location ^~ /concretrack/` aponta para `/var/www/concretrack-erp/public/`; `location ^~ /concretrack/api/` faz proxy para `127.0.0.1:8010/api/`. `/usina`, `/dashboard` e `/api/usina/` vão ao Flask 8000; `/etiquetas/` vai à porta 5050; `/concretrack/mapa-concretagem/` é servido de `/opt/resultado-ensaios-usina/current/mapa-concretagem/`.
- Há ainda `sites-enabled/concretrack-erp` em HTTP com `/concretrack/`, e `sites-enabled/concretrack-public` para `concretrack.com.br` com o mesmo frontend/API. O planejamento não deve assumir um host único.
- `pederneiras.concretrack.com.br` tem TLS próprio e envia `/api/` a 8011. Essas localizações precisam de inventário de redirecionamentos na homologação.
- O endereço público exato de uploads de NF usa a API de estoque; caminhos persistidos devem ser conferidos por contrato antes de mover storage.

## Código e dependências

- `/var/www/concretrack-erp`: frontend estático em `public/`, backend FastAPI em `api/`, scripts em `scripts/`, ambiente `.venv` com Python **3.10.12**; Node **22.22.0** disponível. A origem não usa React/Vite para o ERP.
- `requirements.txt` declara FastAPI 0.110.0, Uvicorn 0.29.0, python-dotenv 1.0.1, bcrypt 5.0.0, email-validator 2.3.0, google-auth 2.40.3, requests 2.32.5. O código também importa `psycopg2`, `openpyxl` e outros pacotes; validar lock efetivo com `pip freeze` na preparação da réplica.
- Variáveis identificadas pelo **nome**, sem valores: `POSTGRES_URL`, `SECRET_KEY`, `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_MAX_AGE`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `COOKIE_DOMAIN`, `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`. Arquivos de ambiente adicionais do serviço: `fechamento-bridge.env` e `mapa-unificado.env`; os valores não foram lidos nem copiados.
- O repositório contém scripts/artefatos de backup locais. Não equivalem a uma política de recuperação comprovada: retenção, restauração e cópia fora da VPS precisam ser verificados antes do corte.

## Agenda e ingestão

| Agenda observada | Comando / finalidade | Efeito esperado |
|---|---|---|
| a cada 2 min | `scripts/sync_gsheets_leiturasetor.py` sob `flock` | sincroniza leituras de setor do Google Sheets para o PostgreSQL |
| 00:01 diário | `scripts/sync_consumo_producao.py --dias 2` | sincroniza consumo de produção no estoque |
| 07:00 seg–sáb | agente PCP produção | publica relatório PCP externo |
| timer diário 03:15 | backup da Dosagem | fora do escopo operacional de Usinas |

Também existem `match_massadas_setor.py` e `relatorio_massadas_supervisorio.py`; não foram encontrados no crontab de `root`. Verificar invocação por outro usuário/operador antes de classificar como inativos. PM2 mantém workers do CEC. Não foi encontrado, nos comandos consultados, um timer específico de backup do ERP/CEC.

## Comandos de inspeção usados na VPS

Executados via `ssh root@31.97.241.84` e `bash -s` ou comando remoto simples, **somente leitura**:

```text
hostname; pwd
find /var/www/concretrack-erp ...
systemctl list-units --type=service --all --no-pager
systemctl show <serviço> -p User -p WorkingDirectory -p ExecStart -p EnvironmentFiles
systemctl list-timers --all --no-pager
ss -lntp
ls -l /etc/nginx/sites-enabled
cat /etc/nginx/sites-enabled/concretrack-erp
grep -nE 'server_name|listen|location|alias|root |proxy_pass|client_max_body_size|ssl_certificate' /etc/nginx/sites-enabled/*
crontab -l
pm2 list --no-color
getent passwd www-data postgres resultado-ensaios root
find /etc/systemd/system ...
find /var/www/concretrack-erp/scripts ...
grep / sed / leitura Python dos arquivos-fonte selecionados
runuser -u postgres -- psql -At -c 'SELECT datname FROM pg_database WHERE datistemplate=false ORDER BY datname'
runuser -u postgres -- pg_dump --schema-only --no-owner --quote-all-identifiers --dbname=<banco>
runuser -u postgres -- psql -d <banco> -At (BEGIN READ ONLY; SELECT de catálogo e SELECT COUNT/MIN/MAX; COMMIT)
```

Os dumps de esquema e agregados estão em [schemas](schemas/). A coleta estruturada de `.env` reteve somente **nomes** à esquerda de `=`. Um `grep` exploratório alcançou acidentalmente uma linha de `.env` no terminal; esse valor não foi gravado nos documentos. Recomenda-se rotacionar o segredo afetado em uma tarefa própria. Não se executou `nginx -s`, `systemctl restart/reload`, `pm2 restart` ou SQL de escrita.

### Consultas SQL exatas usadas no catálogo

Para cada um dos sete bancos listados em `04-banco-de-dados.md`, foram executadas as três consultas abaixo por `runuser -u postgres -- psql -d <banco> -At`, com `BEGIN READ ONLY` e `COMMIT`. O `SELECT format(...)` seguido por `\gexec` só gerou `SELECT`s; nenhuma tabela temporária/DDL foi criada.

```sql
BEGIN READ ONLY;
SELECT format('SELECT %L AS tabela, count(*) AS linhas FROM %I.%I;',
              schemaname||'.'||tablename, schemaname, tablename)
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog','information_schema')
ORDER BY schemaname,tablename
\gexec
COMMIT;

BEGIN READ ONLY;
WITH ranked AS (
  SELECT table_schema, table_name, column_name,
         row_number() over(partition by table_schema,table_name
           order by CASE WHEN column_name IN
             ('data','datahora','created_at','criado_em','data_registro','timestamp')
             THEN 0 ELSE 1 END, ordinal_position) AS rn
  FROM information_schema.columns
  WHERE data_type IN ('date','timestamp without time zone','timestamp with time zone')
    AND table_schema NOT IN ('pg_catalog','information_schema')
)
SELECT format('SELECT %L AS tabela, %L AS coluna, min(%I)::text AS minimo, max(%I)::text AS maximo FROM %I.%I;',
              table_schema||'.'||table_name,column_name,column_name,column_name,table_schema,table_name)
FROM ranked WHERE rn=1 ORDER BY table_schema,table_name
\gexec
COMMIT;

BEGIN READ ONLY;
SELECT n.nspname||'.'||c.relname,
       pg_total_relation_size(c.oid),
       pg_size_pretty(pg_total_relation_size(c.oid))
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.relkind IN ('r','p')
  AND n.nspname NOT IN ('pg_catalog','information_schema')
ORDER BY n.nspname,c.relname;
COMMIT;
```

As demais leituras foram `find`, `grep`, `sed`, `cat` de configuração NGINX, `systemctl list-units/show/list-timers`, `ss`, `crontab -l`, `pm2 list`, `getent passwd`, `ps`, `node --version`, `python --version` e análise Python dos arquivos-fonte selecionados. Houve duas tentativas iniciais de `find`/`psql` com erro de aspas; falharam antes de produzir dados ou alterar estado.
