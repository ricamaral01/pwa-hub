# API da Dosagem v2

Python 3.12, FastAPI e PostgreSQL. A API usa o token do Hub e guarda documentos completos em JSONB.

## Desenvolvimento

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install -e '.[test]'
Copy-Item .env.example .env
# Preencha .env com valores reais, mantendo-o fora do Git.
.\.venv\Scripts\python -m alembic upgrade head
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 18300
```

O teste automatizado cria um cluster PostgreSQL temporário quando o binário `postgres` está no `PATH`:

```powershell
$env:PATH='C:\Program Files\PostgreSQL\16\bin;'+$env:PATH
.\.venv\Scripts\python -m pytest -q
```

## Implantação

Consulte `deploy/README.md` e `docs/dosagem-v2/VPS-RECONHECIMENTO.md` na raiz do repositório. O arquivo `.env` de produção fica apenas em `/opt/concretrack-dosagem/shared/.env`. Use a configuração Supabase do Hub ou, somente quando for o provedor real, `JWT_SECRET` e `JWT_AUDIENCE`.

`GET /api/v1/saude` testa a conexão com o banco. `POST /api/v1/rpc` exige Bearer e `Idempotency-Key` igual ao `requestId` UUID do JSON.
