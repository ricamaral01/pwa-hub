# Controle Estatistico - Arquitetura

## Fluxo

```text
Navegador
  -> HTTPS same-origin
Frontend controle-estatistico
  -> GET /api/controle-estatistico/rompimentos-grupos
Nginx / reverse proxy
  -> http://127.0.0.1:3086
Backend Node/Express
  -> PostgreSQL
```

O frontend nao acessa IP, porta interna, PostgreSQL ou Google Sheets. Ele conhece apenas a rota relativa:

```text
/api/controle-estatistico/rompimentos-grupos
```

## Endpoint

```text
GET /api/controle-estatistico/rompimentos-grupos
```

Parametros suportados:

```text
limit        1..API_MAX_LIMIT, padrao API_DEFAULT_LIMIT
offset       0..1000000
mes          1..12
ano          2020..2040
data_inicio  YYYY-MM-DD
data_fim     YYYY-MM-DD
```

Resposta padronizada:

```json
{
  "success": true,
  "source": "database",
  "generated_at": "2026-07-11T12:00:00.000Z",
  "count": 1,
  "pagination": {
    "limit": 1000,
    "offset": 0,
    "has_more": false
  },
  "rows": [
    {
      "data_moldagem": "2026-07-07",
      "data_ruptura": "2026-07-08",
      "traco_id": "29689",
      "idade_dias": 1,
      "cp": 1,
      "mpa": 18.5
    }
  ]
}
```

Valores possiveis de `source`:

```text
database
server_cache
google_sheets_fallback
local_storage
```

`local_storage` aparece somente no frontend quando a API falha e ha contingencia local.

## Backend

Estrutura:

```text
src/app.js
src/server.js
src/api/
src/services/
src/repositories/
src/schemas/
src/core/
```

Responsabilidades:

```text
Route -> valida query e chama service
Service -> cache, fallback, contrato da resposta
Repository -> SQL parametrizado
Database -> pool PostgreSQL
```

O pool usa `pg.Pool` com limite configuravel. Valores padrao:

```text
DATABASE_POOL_SIZE=5
DATABASE_IDLE_TIMEOUT_MS=30000
DATABASE_CONNECTION_TIMEOUT_MS=5000
```

## Fallback Google Sheets

Desabilitado por padrao.

```env
GOOGLE_SHEETS_FALLBACK_ENABLED=false
GOOGLE_SHEETS_API_URL=
```

Fluxo:

```text
Backend tenta PostgreSQL
  -> sucesso: source=database
  -> falha + fallback=false: HTTP 503
  -> falha + fallback=true: consulta Google Sheets, normaliza e retorna source=google_sheets_fallback
```

O navegador nunca consulta Google Sheets diretamente.

## Cache

O backend possui cache em memoria opcional:

```env
API_CACHE_ENABLED=true
API_CACHE_TTL_MS=30000
```

A chave considera os filtros da requisicao. O TTL curto evita dados obsoletos indefinidos.

O frontend usa `localStorage` apenas como contingencia:

```text
API sucesso -> renderiza e atualiza cache local
API falha -> tenta cache local
cache local -> renderiza com aviso de modo offline
sem cache -> erro
```

## Nginx

No servidor HTTPS principal do dominio, a rota deve encaminhar para o backend interno:

```nginx
location /api/controle-estatistico/ {
    proxy_pass http://127.0.0.1:3086/api/controle-estatistico/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;
}
```

O processo Node deve escutar somente em `127.0.0.1`.

## Health checks

```text
GET /health -> resposta simples, sem consulta pesada
GET /ready  -> verifica PostgreSQL
```

## Variaveis

Veja `.env.example`.

Nenhuma senha real deve ser versionada. Configure `DATABASE_PASSWORD` e demais segredos somente no ambiente.

## Testes

Backend:

```bash
cd Controle_est_concre
npm test
```

Suite geral do repositório:

```bash
npm test
```

## Deploy seguro

1. Enviar arquivos.
2. Instalar dependencias se necessario:

```bash
cd /root/Controle_est_concre
npm install --omit=dev
```

3. Configurar `.env` com variaveis reais.
4. Validar Nginx:

```bash
nginx -t
```

5. Reiniciar backend:

```bash
pm2 reload controle-est-concre-api
```

6. Recarregar Nginx:

```bash
systemctl reload nginx
```

## Validacao em producao

```bash
curl -i https://DOMINIO/health
curl -i https://DOMINIO/ready
curl -i 'https://DOMINIO/api/controle-estatistico/rompimentos-grupos?ano=2026&mes=07&limit=1000'
```

No navegador, abrir o relatorio e conferir o rodape:

```text
Dados atualizados em ... | Fonte: database
```

Se aparecer `Modo offline`, a API falhou e o frontend esta exibindo contingencia local.
