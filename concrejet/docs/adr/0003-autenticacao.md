# ADR 0003 — Modelo de autenticação (Fase 0)

## Status
Aceito para a Fase 0 — **revisável** antes de produção (ver riscos).

## Contexto
A Fase 0 exige login, logout, usuário atual, troca obrigatória de senha no primeiro
acesso, hashing com Argon2id e bloqueio por tentativas. É preciso decidir onde a
sessão é mantida (client-side JWT vs. sessão server-side com store) sem sobre-projetar
antes de existir necessidade real de múltiplos serviços/instâncias.

## Decisão
- **JWT assinado (HS256) guardado em cookie `httpOnly`, `sameSite=strict`**, sem
  refresh token nesta fase. TTL curto (padrão 15 min, configurável via
  `JWT_ACCESS_TOKEN_TTL_SECONDS`).
- **Argon2id** (`argon2` npm, biblioteca com binding nativo, parâmetros default da
  biblioteca — considerados adequados para esta fase) para hashing de senha.
- **Bloqueio por tentativas**: contador `tentativas_login` e `bloqueado_ate` na própria
  tabela `usuario`; após N tentativas inválidas (`AUTH_MAX_LOGIN_ATTEMPTS`, default 5),
  bloqueia por M minutos (`AUTH_LOCKOUT_MINUTES`, default 15). Mensagem de erro de
  login é **genérica** ("Credenciais inválidas") para não revelar se o e-mail existe.
- **Primeiro acesso**: usuário criado com `deve_trocar_senha = true`; o frontend (fora
  do escopo desta fase) deve forçar a tela de troca antes de liberar navegação — o
  backend expõe esse campo em `/auth/login` e `/auth/me` para essa finalidade.

## Alternativas consideradas
- **Sessão server-side com store (Redis)**: mais fácil revogar sessões individualmente,
  mas adiciona uma dependência de infraestrutura (Redis) que a Fase 0 não justifica
  ainda. Fica como candidato natural quando "sessões revogáveis" e "offline/sync" da
  Fase 1+ exigirem invalidação ativa de tokens antes do TTL expirar.
- **JWT em `localStorage`**: descartado por expor o token a XSS; cookie `httpOnly`
  mitiga esse vetor.

## Consequências / riscos conhecidos
- Sem refresh token, o usuário precisa logar novamente a cada expiração do TTL — aceitável
  na Fase 0 (sem telas), mas deve ser revisitado ao construir o frontend.
- **Não há revogação ativa de sessão** antes do TTL expirar (ex.: ao desativar um
  usuário, tokens já emitidos continuam válidos até expirar). Isso é uma lacuna
  conhecida, não uma escolha definitiva — para revogação real será necessário
  introduzir uma denylist (Redis ou tabela `sessao_revogada`) nas próximas fases.
- CSRF: como o cookie é `sameSite=strict` e a API não usa formulários HTML tradicionais,
  o risco de CSRF é mitigado, mas nenhum token CSRF explícito foi implementado nesta
  fase — reavaliar quando o frontend existir e decidir a estratégia de requisições
  cross-origin, se houver.
