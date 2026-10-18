# ConcreTrack Dosagem v2

Aplicação paralela de dosagem em React, TypeScript e Vite. O código legado permanece em `../dosagem-concreto/`; o build desta aplicação vai somente para `../dosagem-concreto/v2/`.

## Executar

Requer Node.js e npm. Copie `.env.example` para `.env.local`, preencha `VITE_API_URL` com a URL do Web App implantado e execute:

```sh
npm ci
npm run dev
```

Sem API e sessão do Hub, cálculos e rascunhos locais funcionam, mas operações de servidor não são confirmadas. Para testes automatizados e build:

```sh
npm test
npm run test:e2e
npm run build
npm run deploy:check
```

`npm run build` publica os arquivos estáticos em `../dosagem-concreto/v2/` com base `/dosagem-concreto/v2/`. O Vite usa HashRouter. Os scripts de autenticação do Hub são carregados por caminho absoluto. Há service worker próprio para a v2. Publique os arquivos gerados no mesmo domínio do Hub; configure o Web App e `VITE_API_URL` antes de gerar o build de produção.

## Estrutura

- `src/core`: modelo, validação e cálculo puro, sem React.
- `src/data`: API, IndexedDB, outbox e sincronização.
- `src/app`, `src/features`, `src/ui`, `src/print`: interface, telas e carta.
- `apps-script`: backend separado e instruções de implantação.
- `tests`: testes unitários, exemplos legados e fluxos E2E.

O estado real de paridade, os riscos e o checklist estão em `../docs/dosagem-v2/RELATORIO-EXECUCAO.md`. Esta entrega ainda não substitui o legado em produção.
