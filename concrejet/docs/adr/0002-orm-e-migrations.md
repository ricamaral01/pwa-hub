# ADR 0002 — ORM e estratégia de migrations

## Status
Aceito (Fase 0, 2026-07-31)

## Contexto
A Fase 1 vai exigir SQL avançado do PostgreSQL: `EXCLUDE USING gist` com `tstzrange`
para impedir apontamentos simultâneos na mesma máquina, triggers para bloquear
alteração de histórico, funções para fechamento de balanço de massa em blendas, e
`CHECK` constraints elaboradas. Era preciso escolher entre um ORM "schema-first"
declarativo (ex.: Prisma) ou um ORM com migrations SQL versionadas manualmente.

## Decisão
Usar **TypeORM com migrations escritas manualmente em SQL puro** (dentro de classes
`MigrationInterface`), em vez de Prisma ou de `synchronize: true`/migrations
autogeradas por diff de entidade.

Motivos:
1. **Prisma não suporta nativamente** exclusion constraints, `tstzrange` ou triggers —
   seria necessário escapar do schema Prisma via `Prisma.raw`/migrations manuais de
   qualquer forma, perdendo a principal vantagem da ferramenta (schema único
   declarativo). Melhor não introduzir duas fontes de verdade.
2. TypeORM permite manter **entities tipadas** para o código da aplicação e
   **migrations 100% SQL explícito** para tudo que o ORM não modela bem — sem trocar de
   ferramenta na Fase 1 quando as constraints avançadas entrarem.
3. `synchronize: true` está **desabilitado em todos os ambientes** — nunca alterar
   schema automaticamente a partir das entities; toda mudança de schema passa por uma
   migration revisável e versionada em `backend/src/database/migrations/`.

## Consequências
- Toda entity nova precisa de uma migration correspondente escrita à mão (não há
  `migration:generate` confiável para as constraints avançadas — o comando existe mas
  seu uso deve ser conferido manualmente linha a linha antes de commitar).
- Rollback de schema é responsabilidade do método `down()` de cada migration —
  obrigatório, não opcional.
- CI roda `npm run migration:run` contra um Postgres efêmero antes dos testes e do
  build, garantindo que as migrations aplicam de forma limpa a cada PR.
