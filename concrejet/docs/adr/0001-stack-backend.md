# ADR 0001 — Stack do backend

## Status
Aceito (Fase 0, 2026-07-31)

## Contexto
O ConcreTrack Injeção precisa substituir uma planilha Excel de ~160 abas por um
sistema industrial com regras de negócio pesadas (histórico imutável, constraints
avançadas de PostgreSQL, rastreabilidade de lotes, controle de estoque transacional).
É necessário escolher a stack de backend antes de qualquer modelagem de dados.

## Decisão
- **Node.js 22 + TypeScript** — mesma linguagem em todo o projeto, forte tipagem para
  reduzir erros em regras de negócio críticas (cálculos de produção, estoque).
- **NestJS** — arquitetura modular (módulos por domínio: auth, organizacao, usuarios,
  produção, resinas, etc.), DI nativa, boa integração com TypeORM, validação e
  observabilidade (interceptors, filtros de exceção, middlewares).
- **PostgreSQL 16** — único banco considerado: suporta `EXCLUDE USING gist` com
  `tstzrange` (necessário para impedir apontamentos simultâneos na mesma máquina na
  Fase 1), `jsonb`, triggers e funções — requisitos explícitos do briefing de
  arquitetura.

## Alternativas consideradas
- **Express puro**: mais leve, mas sem estrutura modular nativa; o projeto precisa de
  organização clara por domínio desde o início (produção, resinas, blendas, OEE).
- **Django/Python**: bom para regras de negócio e ORM maduro, mas fragmenta a stack
  (frontend futuro em TS) e a equipe/ferramentas do projeto já apontam para Node/TS.
- **MySQL/MariaDB**: não suporta exclusion constraints nem `tstzrange` de forma nativa,
  o que exigiria reimplementar em aplicação a regra de "sem apontamentos simultâneos
  na mesma máquina" — risco de condição de corrida.

## Consequências
- Migrations e regras avançadas (Fase 1) ficam presas ao PostgreSQL — decisão
  consciente, não portável para outro SGBD sem reescrever constraints.
- Qualquer novo módulo de domínio segue o padrão de pastas `modules/<dominio>/`
  (entities, dto, service, controller, module).
