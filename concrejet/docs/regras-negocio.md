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

## Fases 2 a 6 (planejado, não implementado)

Especificação completa em [plano-fases-2-a-6.md](plano-fases-2-a-6.md). Abaixo somente as
regras classificadas como **"não podem ser adiadas"** em cada fase — as que, se ficarem
para depois, corrompem dado histórico de forma irreversível.

### Etapa 1 — Design System
- Alvo de toque mínimo (56 px no tablet, 34 px no desktop).
- Nenhum `<select>` nativo, nenhum teclado nativo e nenhum scroll vertical nas telas de
  posto; nenhuma webfont externa (o tablet opera offline em galpão).
- Estado nunca comunicado só por cor — sempre cor + ícone + texto.
- `htmlFor`/`id` em todo par label/controle (regressão já corrigida em 0.2.4).

### Fase 2 — Apontamento
- **Dois apontamentos não podem se sobrepor na mesma máquina.** `EXCLUDE USING gist` com
  `tstzrange(inicio, fim)` por `maquina_id` — garantia de banco, não de aplicação. Como
  `fim` nulo produz intervalo aberto, a mesma constraint garante no máximo um apontamento
  aberto por máquina.
- **Peso, cavidades, ciclo padrão e limite de perda são congelados no apontamento.**
  Alterar a configuração item/molde depois nunca altera apontamento passado.
- Refugo, borra, galho, falha e outras perdas nunca negativos.
- **Fórmula de perda sem galho**: `(perda total − galho) / (injeção útil + perda total −
  galho)`. O exemplo de conferência obrigatório (618 boas, 19 refugo, peso 0,1522 kg,
  borra 7,085, galho 2,315, falha 1,135 → 94,06 / 13,43 / 107,49 kg e 10,56 %) está em
  [calculos-oee.md](calculos-oee.md#24-exemplo-de-conferência-obrigatório).
- `idempotency_key` única — reenvio nunca duplica apontamento.
- `apontamento_evento` append-only imutável; apontamento encerrado nunca é editado nem
  apagado.
- Sessão de operador (matrícula/PIN) é sempre separada da sessão administrativa.

### Fase 3 — Ocorrências e paradas
- **Duas ocorrências não podem se sobrepor na mesma máquina** (mesmo `EXCLUDE`).
  Sobreposição parada × apontamento é o caso normal e continua permitida.
- **Ocorrência que exige ação corretiva não encerra sem ela** — `CHECK` de banco.
- **Apontamento não encerra com ocorrência vinculada não encerrada.**
- `planejada` e `exige_acao_corretiva` congelados na abertura (é o que impede o OEE do
  passado de mudar quando alguém edita o cadastro do tipo).
- Cronômetro sempre derivado do timestamp absoluto persistido, sobrevivendo a reload,
  troca de operador e fechamento do app.

### Fase 4 — Offline e sincronização
- Nada é enviado sem `Idempotency-Key` estável entre tentativas.
- Ordem e dependência da fila respeitadas (abrir → parada → encerrar); item com
  dependência falha nunca é enviado.
- **Conflito nunca é resolvido silenciosamente** — vira registro para o supervisor, com o
  dado local intacto.
- **Nunca existe sessão de operador falsa offline**; sem credencial verificável, o app
  bloqueia.
- Operação administrativa é bloqueada offline.
- Saldo de lote lido offline é sempre rotulado como possivelmente desatualizado.

### Fase 5 — Estoque e blendas
- Estoque nunca negativo (`CHECK` de banco).
- Saldo só muda por `movimento_estoque_lote`; nenhum `UPDATE` direto (trigger).
- Movimento é imutável; correção é movimento de `AJUSTE` com justificativa.
- Baixa por apontamento idempotente (`idempotency_key = apontamento_id`) — reprocessar
  nunca baixa duas vezes.
- Efetivação de blenda é atômica: falha em um componente aborta tudo.
- Ajuste de inventário exige justificativa e permissão própria.

### Fase 6 — Indicadores e OEE
- **Agregado nunca é fonte da verdade**: toda view é reconstruível a partir do bruto, com
  endpoint de reconciliação.
- OEE = Disponibilidade × Performance × Qualidade, com ciclo e limite **congelados no
  apontamento**, nunca os vigentes hoje.
- Denominador zero produz `null`, nunca `0`, `NaN` ou `Infinity`.
- Performance > 100 % é exibida marcada como inconsistente, **nunca truncada**.
- Perda agregada é ponderada por massa, nunca média simples de percentuais.
- Relatório que expõe valor financeiro tem permissão separada.

## Regras do briefing explicitamente FORA das Fases 2 a 6

Reforçando o que **não** deve ser assumido como pronto ao fim da Fase 6: integração real
com o ERP Mega; migração da planilha Excel de ~160 abas (e, por consequência, os
comparativos históricos por mês dos relatórios); gestão de perfis e permissões por tela
(continua só por seed); reabertura ou edição de apontamento encerrado; ocorrência
multi-máquina; reserva de lote e FIFO/FEFO; reaproveitamento de galho como lote de
moído; OEE por operador; exportação em PDF; notificações ativas por e-mail/push;
multi-empresa na interface. Lista completa e justificada em
[backlog-validacao-fase-6.md](backlog-validacao-fase-6.md).

# Atualizacao Fase 2 - 2026-08-01

Regras implementadas no backend de apontamento: operador, dispositivo, maquina, lote e configuracao item/molde ativos/validos; lote `DISPONIVEL`; bloqueio de outro apontamento `em_andamento` na mesma maquina; conclusao com `fimEm` posterior a `inicioEm`; cancelamento com motivo; versao otimista; calculo de perdas por peso aplicado, pecas boas, refugos, falha de preenchimento, borra, galho e outras perdas.

Ressalva: o frontend tablet ainda precisa carregar seletores reais da API para aplicar essas regras sem IDs de desenvolvimento.
