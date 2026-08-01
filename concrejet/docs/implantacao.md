# Implantação — Fase 0

## Pré-requisitos

- Node.js 22+
- Docker + Docker Compose (para Postgres local) **ou** um PostgreSQL 16 acessível
- `openssl` (ou equivalente) para gerar `JWT_SECRET`

## Variáveis de ambiente

Ver `.env.example` (raiz, para uso com `docker compose`) e `backend/.env.example`
(para rodar a API fora de container). Nunca commitar `.env` com valores reais —
ambos os arquivos contêm apenas placeholders.

Variáveis obrigatórias sem default: `DATABASE_USER`, `DATABASE_PASSWORD`,
`DATABASE_NAME`, `JWT_SECRET` (mínimo 32 caracteres — o boot da aplicação falha com
mensagem clara se a validação de ambiente, via `zod`, não passar).

## Passo a passo local (Docker Compose)

```bash
cd concrejet
cp .env.example .env
# edite .env: defina JWT_SECRET forte, ex.:
#   openssl rand -base64 48
docker compose up --build -d postgres
cd backend
npm ci
cp .env.example .env   # DATABASE_HOST=localhost para rodar migrations/seed fora do container
npm run migration:run
SEED_ADMIN_EMAIL=admin@suaempresa.com npm run seed:admin
cd ..
docker compose up --build api
```

Verificação manual:
```bash
curl http://localhost:3000/health   # {"status":"ok"}
curl http://localhost:3000/ready    # {"status":"ok","database":"up"}
curl http://localhost:3000/version  # {"name":"concretrack-injecao-backend","version":"0.1.0"}
```

## CI

`.github/workflows/ci.yml` sobe um Postgres de serviço, roda `npm ci`, `lint`,
`typecheck`, `migration:run`, `test`, `test:e2e` e `build` a cada push/PR que altere
`concrejet/backend/**`.

## Limitação conhecida desta entrega

O ambiente onde a Fase 0 foi desenvolvida **não tem o daemon Docker em execução**
(`docker ps` falha com "cannot connect to the Docker API"), então **migrations e
testes e2e não puderam ser executados contra um Postgres real neste momento** — apenas
`lint`, `typecheck`, `npm run build` e os testes **unitários** (que não dependem de
banco) foram executados com sucesso. Ver resultado real em
[handoff.md](handoff.md#testes-executados). Antes de considerar a Fase 0 pronta para
uso, alguém com Docker (ou um Postgres) disponível deve rodar:

```bash
docker compose up -d postgres
cd backend && npm run migration:run && npm run test:e2e
```

## Backup e restauração

Fora de escopo desta fase (nenhum dado de produção existe ainda). Será tratado em
`docs/backup-e-restauracao.md` quando a Fase 1 introduzir dados operacionais reais.
