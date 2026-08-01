# Permissões — Fase 0

## Modelo

`usuario` N:N `perfil` (tabela `usuario_perfil`) e `perfil` N:N `permissao` (tabela
`perfil_permissao`). Um usuário pode ter múltiplos perfis; suas permissões efetivas são
a união das permissões de todos os seus perfis ativos.

`permissao.chave` é um identificador global em formato `modulo.acao` (ex.:
`sistema.administrar`). Nesta fase existe apenas essa permissão, criada pelo seed
(`npm run seed:admin`) junto com o perfil `ADMIN`.

## O que está implementado

- Estrutura de dados completa (`perfil`, `permissao`, `perfil_permissao`,
  `usuario_perfil`) com constraints de unicidade (`perfil` único por
  `empresa_id + codigo`; `permissao.chave` única globalmente).
- `JwtAuthGuard`: exige sessão válida (cookie JWT não expirado) para `/auth/logout`,
  `/auth/me` e `/auth/change-password`. O payload do JWT inclui a lista de códigos de
  perfil do usuário (`perfis: string[]`) no momento do login.

## O que NÃO está implementado nesta fase

- **Não há guard de autorização por permissão** (`@RequirePermission('...')` ou
  equivalente) — só existe autenticação (usuário logado ou não). Como nenhum endpoint
  de negócio existe ainda além de auth/health, não havia superfície para aplicar
  autorização granular.
- Os perfis do JWT são um snapshot do momento do login; se os perfis do usuário forem
  alterados, isso só se reflete em um novo login (consequência de não haver revogação
  de sessão — ver [ADR 0003](adr/0003-autenticacao.md)).
- Não há tela ou endpoint de gestão de perfis/permissões (CRUD) — apenas o seed cria o
  perfil `ADMIN` inicial.

## Próximo passo recomendado

Ao introduzir os primeiros endpoints de negócio (Fase 1), criar um guard de
autorização que leia `permissoes` efetivas do usuário autenticado (via perfis) e as
compare com a permissão exigida pela rota, documentando aqui a convenção de nomes de
`chave` por módulo (ex.: `producao.apontamento.criar`, `estoque.resina.ajustar`).
