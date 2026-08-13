# ConcreTrack Injeção

Sistema web industrial para substituir a planilha Excel (~160 abas) de controle de
produção por injeção plástica: cadastros, apontamentos, ocorrências, resinas/lotes,
blendas, estoque e indicadores.

Este repositório está na **Fase 0 — Fundação técnica**: infraestrutura, autenticação,
entidades organizacionais e observabilidade básica. Nenhuma regra de produção (item,
molde, apontamento, resinas, blendas, ocorrências, OEE) foi implementada ainda — ver
[docs/regras-negocio.md](docs/regras-negocio.md) e [docs/handoff.md](docs/handoff.md).

## Estrutura

```
concrejet/
  backend/     # API NestJS + TypeScript + PostgreSQL (TypeORM)
  frontend/    # Scaffold Vite/React para fases futuras; sem telas implementadas
  docs/        # Documentação técnica e ADRs
  docker-compose.yml
```

Não há telas implementadas nesta fase. A pasta `frontend/` existe apenas como scaffold
Vite/React para fases futuras.

## Stack

- Node.js 22 + TypeScript + NestJS
- PostgreSQL 16 (TypeORM com migrations SQL manuais — ver [ADR 0002](docs/adr/0002-orm-e-migrations.md))
- Autenticação por JWT em cookie httpOnly + Argon2id (ver [ADR 0003](docs/adr/0003-autenticacao.md))
- Docker Compose para ambiente de desenvolvimento

## Como rodar localmente

### 1. Com Docker Compose (recomendado)

```bash
cd concrejet
cp .env.example .env   # edite JWT_SECRET e DATABASE_PASSWORD
docker compose up --build
```

A API sobe em `http://localhost:3000`. O Postgres expõe a porta `5432`.

Depois de o container `postgres` estar saudável, rode as migrations e o seed do
administrador (fora do container, apontando `DATABASE_HOST=localhost`):

```bash
cd backend
npm ci
npm run migration:run
SEED_ADMIN_EMAIL=admin@suaempresa.com npm run seed:admin
```

O seed imprime a senha gerada **uma única vez** no console caso
`SEED_ADMIN_PASSWORD` não seja definida. O usuário criado é forçado a trocar a senha
no primeiro login (`deveTrocarSenha = true`).

### 2. Sem Docker (Postgres local já instalado)

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_* para seu Postgres local
npm ci
npm run migration:run
npm run seed:admin
npm run start:dev
```

### Comandos úteis (dentro de `backend/`)

| Comando                | Descrição                                   |
|-------------------------|---------------------------------------------|
| `npm run start:dev`     | API em modo watch                            |
| `npm run build`         | Build de produção (`dist/`)                  |
| `npm run lint`          | ESLint                                       |
| `npm run typecheck`     | `tsc --noEmit`                               |
| `npm run test`          | Testes unitários (Jest)                      |
| `npm run test:e2e`      | Testes e2e (requer Postgres acessível)       |
| `npm run migration:run` | Aplica migrations pendentes                   |
| `npm run migration:revert` | Reverte a última migration                |
| `npm run seed:admin`    | Cria o usuário administrador inicial          |

## Endpoints desta fase

- `GET /health` — liveness, não depende de banco.
- `GET /ready` — readiness, valida conexão com o banco.
- `GET /version` — nome e versão do pacote.
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`.

## Estado atual das funcionalidades

| Funcionalidade | Estado atual |
|---|---|
| Login administrativo | Real |
| Sessao administrativa | Cookie httpOnly |
| Ativacao do dispositivo | Local no IndexedDB nesta fase |
| Login de operador | Nao implementado; demonstracao somente com `VITE_DEMO_MODE=true` |
| Itens, moldes, lotes e O.P. | Mock somente em modo demonstracao |
| Persistencia de apontamento | Nao implementada |
| Sincronizacao operacional offline | Nao implementada |

### Atualizacao Fase 2 - 2026-08-01

A branch `feature/fase-2-apontamento` contem a primeira implementacao da fundacao visual
industrial e do modulo de apontamento de producao. Foram adicionados endpoints
`/production-records`, calculo de perdas, migration da tabela `apontamento`, login
operacional por PIN e seed de desenvolvimento com maquina, dispositivo, operador,
item, molde, lote, configuracao e O.P.

Estado real: backend de apontamento, calculo e persistencia basica estao implementados;
o frontend tablet possui o fluxo visual login/abertura/execucao, mas ainda precisa trocar
os IDs de desenvolvimento por seletores carregados da API para fechar o ponta a ponta
industrial sem ressalvas.

## Documentação

- [docs/arquitetura.md](docs/arquitetura.md)
- [docs/modelo-dados.md](docs/modelo-dados.md)
- [docs/regras-negocio.md](docs/regras-negocio.md)
- [docs/permissoes.md](docs/permissoes.md)
- [docs/implantacao.md](docs/implantacao.md)
- [docs/handoff.md](docs/handoff.md)
- [docs/adr/](docs/adr/)
- [CHANGELOG.md](CHANGELOG.md)

### Planejamento das próximas fases (documentação, nada implementado)

- [docs/plano-fases-2-a-6.md](docs/plano-fases-2-a-6.md) — plano mestre da Etapa 1
  (Design System) e das Fases 2 a 6.
- [docs/design-system-industrial.md](docs/design-system-industrial.md)
- [docs/maquinas-de-estado.md](docs/maquinas-de-estado.md)
- [docs/offline-sync.md](docs/offline-sync.md)
- [docs/calculos-oee.md](docs/calculos-oee.md)
- [docs/backlog-validacao-fase-6.md](docs/backlog-validacao-fase-6.md)

### Fase 1 - Cadastros

A aplica��o agora inclui cadastros administrativos reais em `/admin/cadastros/:resource`. Recursos dispon�veis: fun��es, colaboradores, m�quinas, opera��es, tipos de ocorr�ncia, fornecedores, resinas, lotes de resina, itens, moldes, configura��es item/molde e ordens de produ��o.

Para ambiente local, execute migrations e seed antes de usar os cadastros administrativos.

## Estado local - 2026-08-01

Fases 2, 3 e 4 operacionais foram implementadas no escopo de apontamento, ocorrencias,
paradas e offline/outbox. Backend e frontend podem rodar na rede local; em desenvolvimento,
acesse o tablet pelo IP da maquina na porta do Vite exposta na LAN, por exemplo
`http://192.168.0.14:5174` nesta execucao.
Fases 5 e 6 ainda nao foram iniciadas.
