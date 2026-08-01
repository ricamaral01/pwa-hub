# Arquitetura — ConcreTrack Injeção (Fase 0)

## Visão geral

```
concrejet/
  backend/
    src/
      main.ts                  # bootstrap: helmet, cookie-parser, ValidationPipe, filtro global
      app.module.ts             # composição dos módulos + middleware de correlation id
      common/
        entities/base.entity.ts # id (uuid), criadoEm, atualizadoEm, versao (optimistic lock)
        filters/                # GlobalExceptionFilter (nunca vaza stack/segredos)
        middleware/              # CorrelationIdMiddleware (x-correlation-id)
        logger/                 # nestjs-pino, logs JSON estruturados, redação de campos sensíveis
      config/
        env.schema.ts            # validação de variáveis de ambiente (zod)
        app-config.module.ts
      database/
        data-source.ts           # DataSource usado pela CLI do TypeORM (migrations)
        typeorm.config.ts        # opções de conexão usadas pelo NestJS em runtime
        migrations/               # migrations SQL versionadas (fonte da verdade do schema)
        seeds/seed-admin.ts       # seed idempotente do usuário administrador inicial
      modules/
        health/                  # GET /health, /ready, /version
        auth/                    # login, logout, me, change-password, JWT, Argon2id, lockout
        organizacao/              # empresa, unidade
        usuarios/                 # usuario, perfil, permissao
        producao-base/            # maquina, dispositivo (pré-requisitos da Fase 1)
        auditoria/                 # tabela e serviço de auditoria genérica
  docker-compose.yml
  docs/
```

## Princípios adotados desde a Fase 0

1. **Schema é definido por migrations, nunca por `synchronize`.** As entities TypeORM
   descrevem o modelo para o código da aplicação; a fonte da verdade do banco é
   `backend/src/database/migrations/`.
2. **Sem exclusão física de dados operacionais.** Todas as tabelas desta fase usam
   `ativo: boolean` para desativação lógica. Auditoria é fisicamente imutável (trigger
   de banco bloqueia `UPDATE`/`DELETE` — ver [modelo-dados.md](modelo-dados.md)).
3. **Toda tabela de negócio tem `versao` (optimistic locking)** via
   `@VersionColumn`/coluna `versao integer`, preparando o terreno para a regra de
   "atualização concorrente silenciosa" proibida na Fase 1 (sincronização offline).
4. **Correlation ID de ponta a ponta**: todo request recebe/propaga
   `x-correlation-id`, presente em todos os logs estruturados e nos registros de
   auditoria — necessário para rastrear incidentes e correlacionar retries de
   sincronização offline nas fases seguintes.
5. **Erros nunca vazam detalhes internos.** O `GlobalExceptionFilter` normaliza toda
   resposta de erro; exceções não tratadas (bugs) são logadas no servidor mas
   retornam "Erro interno do servidor" ao cliente.
6. **Validação estrita de entrada.** `ValidationPipe` global com
   `whitelist + forbidNonWhitelisted + transform`: qualquer campo não declarado no DTO
   é rejeitado, não apenas ignorado.

## Fluxo de autenticação (Fase 0)

```
Cliente --POST /auth/login (email, senha)--> AuthController
  -> AuthService.login()
     -> busca usuario ativo por e-mail (com senha_hash via query builder explícito;
        select: false por padrão na entity evita vazar hash em qualquer outra consulta)
     -> se bloqueado_ate no futuro: 403 Forbidden (nem chega a validar a senha)
     -> valida senha via Argon2id
        -> inválida: incrementa tentativas_login; se atingir o limite, define
           bloqueado_ate e zera o contador; sempre 401 com mensagem genérica
        -> válida: zera tentativas_login/bloqueado_ate, atualiza ultimo_login_em,
           registra evento em auditoria, emite JWT em cookie httpOnly
  <- 200 { deveTrocarSenha } + Set-Cookie (httpOnly, sameSite=strict)
```

Ver decisão completa e riscos em [ADR 0003](adr/0003-autenticacao.md).

## O que NÃO existe ainda (fora de escopo da Fase 0)

item, molde, configuração item-molde, ordem de produção, apontamento, tipo de
ocorrência/ocorrência, turno, calendário de produção, fornecedor, resina, lote de
resina, movimento de estoque, blenda, indicadores/OEE, importação da planilha Excel,
integração com o ERP Mega, sincronização offline, e qualquer tela/frontend. Essas
entidades e regras estão descritas no briefing original e serão tratadas na Fase 1 em
diante — ver pendências em [handoff.md](handoff.md).
