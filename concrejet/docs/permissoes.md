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

## Fase 1 — Cadastros (planejado, não implementado)

Especificação completa em [fase-1-cadastros.md, seção 12](fase-1-cadastros.md#12-matriz-de-permissões).
Resumo:

- Convenção de chave adotada: `cadastros.<recurso>.<acao>`, com
  `acao ∈ {consultar, criar, alterar, inativar}` (mais uma chave própria
  `cadastros.lote_resina.alterar_status` para a transição de status do lote, por ser
  mais sensível que uma correção cadastral comum).
- É necessário construir, nesta fase, o que a Fase 0 deixou como pendência:
  `PermissionsGuard` + decorator `@RequirePermission(chave)` + resolução de
  permissões efetivas a partir dos perfis do JWT (consulta a `perfil_permissao` por
  request, não uma nova claim no token — evita permissão desatualizada até o próximo
  login) + seed das ~46 novas chaves associadas ao perfil `ADMIN`.
- `configuracao_item_molde` não tem chave de `inativar` (não existe inativação direta,
  só nova vigência) nem de `criar` separada de `alterar` (criar uma vigência nova É a
  ação de "alterar" a configuração).
- Perfis operacionais além de `ADMIN` (ex.: supervisor, almoxarife) não são criados
  nesta fase — ver [fase-1-cadastros.md, seção 25](fase-1-cadastros.md#25-itens-que-precisam-ser-confirmados-com-o-processo-industrial).

## Fase 1 implementada - Permiss�es de cadastros

Formato efetivo: `recurso.acao`.

Recursos: `funcoes`, `colaboradores`, `maquinas`, `operacoes`, `tipos_ocorrencia`, `fornecedores`, `resinas`, `lotes_resina`, `itens`, `moldes`, `configuracoes_item_molde`, `ordens_producao`.

A��es: `consultar`, `criar`, `editar`, `inativar`, `reativar`. O perfil administrador tamb�m mant�m `sistema.administrar` como permiss�o global.
