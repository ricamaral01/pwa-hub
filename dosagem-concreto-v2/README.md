# ConcreTrack Dosagem v2

Aplicação paralela de dosagem em React, TypeScript e Vite. O código legado permanece em `../dosagem-concreto/`; o build standalone desta aplicação vai para `dist/`.

## Executar

Requer Node.js e npm. A API usa o mesmo domínio da SPA em `/api/v1/rpc`. Execute:

```sh
npm ci
npm run dev
```

Para testes automatizados e build:

```sh
npm test
npm run test:e2e
npm run build
```

`npm run build` gera `dist/` com base `/`. A aplicação usa sessão própria por cookie; a ponte estática do Hub fica em `../auth/ponte-dosagem.html`. Para a homologação isolada, execute `docker compose -p dosagem-v2-hml -f docker-compose.hml.yml up -d --build --wait`; ela publica HTTPS local em `127.0.0.1:18444`. O script `api/app/hml_seed.py` prepara uma conta de teste somente quando `AMBIENTE=hml`. Após preparar a conta, execute `npx playwright test --config=playwright.hml.config.ts`. A homologação não é produção e os portões pendentes estão no relatório.

## Estrutura

- `src/core`: modelo, validação e cálculo puro, sem React.
- `src/data`: API, IndexedDB, outbox e sincronização.
- `src/app`, `src/features`, `src/ui`, `src/print`: interface, telas e carta.
- `apps-script`: backend separado e instruções de implantação.
- `tests`: testes unitários, exemplos legados e fluxos E2E.

O estado real de paridade, os riscos e o checklist estão em `../docs/dosagem-v2/RELATORIO-EXECUCAO.md`. Esta entrega ainda não substitui o legado em produção.
