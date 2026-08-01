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

## Fase 1 - Cadastros

Foi adicionado o `CadastrosModule` ao backend. O m�dulo exp�e endpoints administrativos sob o prefixo global da API para os recursos de cadastro da Fase 1, usando cookie httpOnly existente, `JwtAuthGuard`, permiss�es `recurso.acao` e auditoria.

No frontend, a �rea `/admin/cadastros/:resource` � uma rota administrativa protegida por `AdminGuard`. Ela n�o usa estado operacional, n�o cria operador simulado e n�o persiste tokens no navegador.

## Fases 2 a 6 (planejado, não implementado)

Especificação completa em [plano-fases-2-a-6.md](plano-fases-2-a-6.md). Nada desta seção
existe no código — é o desenho arquitetural alvo.

### Módulos novos do backend

```
backend/src/
  common/
    guards/permissions.guard.ts     # promoção do CadastroPermissionsService (hoje dentro
                                    # de modules/cadastros) para uso de todos os módulos
    interceptors/idempotency.interceptor.ts   # Fase 4
  modules/
    producao/            # Fase 2 e 3: apontamento, apontamento_evento, turno,
                         # ocorrencia, ocorrencia_evento, máquinas de estado no servidor,
                         # serviço único de cálculo de perdas
    estoque/             # Fase 5: movimento de estoque como porta única de alteração de
                         # saldo, blendas, inventário, reconciliação
    sincronizacao/       # Fase 4: bootstrap, delta, heartbeat, conflitos
    indicadores/         # Fase 6: OEE, painel, relatórios, exportação, job de refresh
    auth/                # estendido: login de operador por matrícula + PIN, guard de
                         # escopo por dispositivo/máquina
```

Decisões arquiteturais que valem para todos eles:

1. **O `CadastrosModule` genérico dirigido por registry não é o padrão para produção.**
   Apontamento, ocorrência e estoque têm regra de negócio densa e máquina de estados —
   exigem módulo, service transacional e DTOs dedicados.
2. **Regra crítica mora no banco.** Sobreposição de apontamento e de parada por máquina é
   `EXCLUDE USING gist` sobre `tstzrange`, mesmo mecanismo já usado em
   `configuracao_item_molde`; ação corretiva obrigatória é `CHECK`; saldo não negativo é
   `CHECK`; movimento e evento são imutáveis por trigger. A aplicação valida antes, o
   banco é a última linha de defesa.
3. **Cálculo derivado é coluna gerada.** As massas do apontamento são
   `GENERATED ALWAYS ... STORED`, não campos escritos pela aplicação.
4. **Agregado nunca é fonte da verdade** (Fase 6): toda view/materialized view é
   reconstruível a partir do bruto, com endpoint de reconciliação.
5. **Idempotência ponta a ponta**: `Idempotency-Key` nas escritas de produção, resolvida
   por `idempotencia_requisicao` no servidor e por `outbox` no cliente.
6. **Rotas continuam na raiz do backend** (sem `setGlobalPrefix`), com o cliente chamando
   `/api/*` via proxy — introduzir `/api/v1` agora quebraria a Fase 1 sem benefício.

### Mudança de arquitetura do frontend

A Etapa 1 introduz `frontend/src/design-system/` e `frontend/src/styles/tokens.css` como
camada de apresentação única, substituindo a paleta escura com webfont externa por
tokens claros ISO 3864 com pilha de fonte do sistema (ver
[design-system-industrial.md](design-system-industrial.md)). As páginas passam a ser
composição de componentes do design system; nenhum componente conhece o domínio.

O acesso a dados mantém o padrão de repositório substituível já validado
(`XxxRepository` + `getXxxRepository()`), estendido para apontamento, ocorrência e
estoque. A máquina de estados do posto (`session.store.ts`) é **estendida** de 16 para 21
estados, não recriada — ver [maquinas-de-estado.md](maquinas-de-estado.md). A camada
offline ganha um `SyncEngine` próprio sobre Dexie v3, substituindo o `processQueue` mock
atual ([offline-sync.md](offline-sync.md)).

# Atualizacao Fase 2 - 2026-08-01

Implementado `ProducaoModule` no backend com `Apontamento`, `ProductionRecordsService`, `ProductionCalculationService` e controller `/production-records`. O modulo usa TypeORM, auditoria e validacoes de dispositivo, maquina, operador, lote e configuracao item/molde.

O frontend recebeu uma fundacao visual industrial em `frontend/src/ui`, com shells tablet e desktop. A tela operacional foi refatorada para o fluxo tablet login/abertura/execucao. A autorizacao operacional ainda esta parcial: `/auth/operator-login` cria sessao por PIN, mas os endpoints de apontamento continuam protegidos pelo JWT administrativo.
