# T4 · Motor de simulação

- Portado `reference/engine.js` para TypeScript em `engine.ts`, conservando a ordem de sorteios e os algoritmos.
- Tipos públicos em `engine-types.ts`; Web Worker em `engine.worker.ts` para base, seis sequências e comparação de cenário, com progresso e recomendação.
- `npm exec -- vitest run src/cronoanalise/engine.test.ts`: **20 passaram**, incluindo os **18/18 casos golden**.
- `npm exec -- tsc -b --pretty false`: **sem erros**.

O código do motor contém anotações internas `any` introduzidas para portar literalmente o JavaScript; as interfaces de entrada e saída do módulo são tipadas. O script único usado nessa anotação está em `annotate-engine.cjs`.
