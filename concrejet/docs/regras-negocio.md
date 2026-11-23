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
