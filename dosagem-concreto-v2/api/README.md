# API da Dosagem v2

Python 3.12, FastAPI e PostgreSQL. A API usa sessão própria por cookie, ticket de uso único do Hub com PKCE e conta local de emergência. Documentos ficam em JSONB.

## Desenvolvimento

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install -e '.[test]'
Copy-Item .env.example .env
# Preencha .env com valores reais, mantendo-o fora do Git.
.\.venv\Scripts\python -m alembic upgrade head
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 18300
```

O teste automatizado sobe um PostgreSQL 16 isolado com Docker Compose e remove o volume ao terminar:

```powershell
.\.venv\Scripts\python -m pytest -q
```

## Implantação

Consulte `docs/dosagem-v2/API.md` e `docs/dosagem-v2/VPS-RECONHECIMENTO.md` na raiz do repositório. O arquivo `.env` de produção fica apenas em `/opt/concretrack-dosagem/shared/.env`. O endpoint de ticket consulta o Supabase do Hub; Bearer antigo só é aceito em ambiente de desenvolvimento. A implantação na VPS não está autorizada enquanto os portões estiverem reprovados.

`GET /api/v1/saude` testa a conexão com o banco. `POST /api/v1/rpc` exige cookie, mesma origem, `X-Requested-With: dosagem` e `Idempotency-Key` igual ao `requestId` UUID do JSON.
