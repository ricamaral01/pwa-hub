# Regras de negócio — Fase 0

Esta fase implementa apenas regras de **autenticação e organização**. As regras de
produção do briefing original (histórico imutável de apontamento, blendas, estoque de
resinas, OEE, ocorrências, offline/sync, importação Excel) **não foram implementadas**
e estão listadas em [handoff.md](handoff.md) como pendências para a Fase 1+.

## Autenticação

| Regra | Implementação |
|---|---|
| Senha nunca em texto puro | Argon2id (`argon2` package), hash armazenado em `usuario.senha_hash` (`select: false`) |
| Primeiro acesso força troca de senha | `usuario.deve_trocar_senha = true` no seed e em qualquer criação futura de usuário; exposto em `/auth/login` e `/auth/me` |
| Bloqueio por tentativas inválidas | Após `AUTH_MAX_LOGIN_ATTEMPTS` (default 5) tentativas inválidas consecutivas, `usuario.bloqueado_ate` é definido `AUTH_LOCKOUT_MINUTES` (default 15) minutos no futuro; login é recusado com 403 mesmo com senha correta enquanto bloqueado |
| Não revelar se e-mail existe | Mensagem de erro de login é sempre "Credenciais inválidas" (401), independente de o e-mail existir ou a senha estar errada |
| Sessão via cookie, não localStorage | JWT em cookie `httpOnly`, `sameSite=strict` — mitiga XSS lendo o token via JS |
| Troca de senha exige senha atual | `POST /auth/change-password` valida `senhaAtual` via Argon2id antes de aceitar `novaSenha` (mínimo 12 caracteres) |

## Organização

| Regra | Implementação |
|---|---|
| Multi-empresa desde a Fase 0 | `usuario`, `unidade`, `perfil` sempre pertencem a uma `empresa`; e-mail é único por empresa, não globalmente |
| Sem exclusão física | Toda entidade tem `ativo: boolean`; não existem endpoints de `DELETE` físico nesta fase |
| Integridade referencial estrita | Toda FK organizacional usa `ON DELETE RESTRICT` — não é possível apagar uma empresa/unidade/perfil que ainda tenha registros dependentes (a única forma de "remover" é desativar) |

## Auditoria (básica)

| Regra | Implementação |
|---|---|
| Login e troca de senha geram auditoria | `AuthService` chama `AuditoriaService.registrar()` em login bem-sucedido e troca de senha |
| Auditoria é imutável | Trigger de banco (`trg_auditoria_bloquear_update`) impede `UPDATE`/`DELETE`, não apenas a aplicação — ver [modelo-dados.md](modelo-dados.md) |
| Correlation ID rastreável | Todo registro de auditoria inclui o `correlation_id` do request que o originou |

## Regras do briefing explicitamente FORA desta fase

Reforçando o que não deve ser assumido como pronto: refugo/perdas negativos, estoque
negativo, uso de lote inexistente, sobreposição de apontamentos na mesma máquina
(`EXCLUDE USING gist` + `tstzrange`), ocorrência sem ação corretiva obrigatória,
duplicação por sincronização offline (idempotency keys), duplicação de integração com
o Mega, cálculos de produção/perdas/OEE, importação da planilha. Nenhuma dessas regras
tem tabela, constraint ou código associado ainda.

## Fase 1 — Cadastros (planejado, não implementado)

Especificação completa em [fase-1-cadastros.md](fase-1-cadastros.md). Regras centrais
que essa fase introduz:

- **Peso da peça, número de cavidades, ciclo padrão, ciclo para custo e limite de
  perda nunca são sobrescritos historicamente.** Toda alteração fecha a vigência
  anterior de `configuracao_item_molde` (`vigencia_fim`, `ativo = false`) e cria uma
  nova linha (`version + 1`, motivo obrigatório) — nunca um `UPDATE` desses campos.
  Vigências sobrepostas para o mesmo item+molde são impedidas por `EXCLUDE USING
  gist` no banco, não apenas por validação de aplicação — ver
  [fase-1-cadastros.md, seção 7](fase-1-cadastros.md#7-estratégia-de-vigência-configuracao_item_molde).
- **Saldo de lote de resina não é editável diretamente após a criação.** O saldo só
  muda através de um registro em `movimento_estoque_lote` (tabela append-only, sem
  consumo automático implementado nesta fase); a API nunca aceita `saldoAtualKg` como
  campo de entrada, e um trigger de banco bloqueia `UPDATE` direto do campo fora desse
  fluxo — ver [fase-1-cadastros.md, seção 13.4](fase-1-cadastros.md#134-lote_resina).
- **Sem exclusão física, sem exceção**: os 12 cadastros novos seguem o mesmo padrão já
  estabelecido na Fase 0 (`ativo: boolean`, nunca `DELETE`), com endpoints de
  reativação explícitos (novidade desta fase — a Fase 0 não tinha `/reativar`).
- **Regras explicitamente fora desta Fase 1** (mesmo que o briefing original as
  mencione): apontamento de produção, baixa automática de estoque, consumo de lote,
  blendas, registro operacional de ocorrências (só o cadastro do *tipo* existe),
  cronômetros, OEE, dashboards, sincronização offline, integração real com o Mega,
  migração histórica da planilha, login de operador por matrícula/PIN (o campo
  `pin_hash` é preparado em `colaborador`, mas não usado) — ver
  [fase-1-cadastros.md, seção 25](fase-1-cadastros.md#25-itens-que-precisam-ser-confirmados-com-o-processo-industrial)
  para os pontos que ainda precisam de confirmação do processo industrial antes da
  implementação final.

## Fase 1 implementada - Regras de cadastros

- Cadastros administrativos exigem sess�o administrativa real e permiss�o `recurso.acao` ou `sistema.administrar`.
- Lote de resina cria movimento inicial de entrada e define saldo inicial a partir da quantidade recebida; saldo n�o � edit�vel diretamente.
- Configura��o item/molde � hist�rica: nova configura��o encerra a vers�o ativa anterior e cria nova vers�o com vig�ncia pr�pria.
- Ordem de produ��o pode ser cancelada somente quando aberta e exige justificativa.
- A Fase 1 n�o implementa login de operador, apontamento operacional real ou funcionalidades da Fase 2.
