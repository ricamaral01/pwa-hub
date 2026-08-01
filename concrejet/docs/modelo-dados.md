# Modelo de dados — Fase 0

Escopo: apenas as entidades fundamentais listadas no briefing (organização + máquina/
dispositivo + auditoria). Nenhuma entidade de produção, resinas ou ocorrências foi
criada nesta fase.

Migration correspondente:
`backend/src/database/migrations/1730000000000-Fase0Fundacao.ts`.

## Diagrama lógico (Fase 0)

```
empresa (1) ──< unidade (N)
empresa (1) ──< perfil (N) ──< perfil_permissao >── permissao (N)
empresa (1) ──< usuario (N) ──< usuario_perfil >── perfil (N)
unidade (1) ──< usuario (N, opcional)
unidade (1) ──< maquina (N)
maquina (1) ──< dispositivo (N, opcional)
usuario (1) ──< auditoria (N, opcional — pode ser nula em eventos de sistema)
```

## Tabelas

### empresa
| Coluna | Tipo | Regra |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| razao_social | varchar(200) | obrigatório |
| cnpj | varchar(14) | único; `CHECK` formato `^[0-9]{14}$` (apenas dígitos) |
| ativo | boolean | default `true` (desativação lógica, sem exclusão física) |
| criado_em / atualizado_em | timestamptz | automáticos |
| versao | integer | optimistic locking |

### unidade
FK `empresa_id` → `empresa.id` `ON DELETE RESTRICT` (não é possível apagar empresa com
unidades). Único por `(empresa_id, codigo)`.

### perfil / permissao / perfil_permissao
`perfil` pertence a uma `empresa` (multi-tenant desde já). `permissao` é global ao
sistema (chave única, ex.: `sistema.administrar`). `perfil_permissao` é tabela de
associação N:N com `ON DELETE CASCADE` em ambas as pontas (remover perfil ou permissão
remove só a associação, nunca o outro lado).

### usuario
| Coluna | Regra |
|---|---|
| empresa_id | FK obrigatória, `ON DELETE RESTRICT` |
| unidade_id | FK opcional, `ON DELETE RESTRICT` |
| email | único por `(empresa_id, email)` — mesmo e-mail pode existir em empresas diferentes; `CHECK` de formato básico |
| senha_hash | Argon2id; coluna com `select: false` na entity (nunca retorna em queries por padrão) |
| deve_trocar_senha | `true` por padrão (força troca no primeiro acesso) |
| tentativas_login | `CHECK >= 0`; zera após login bem-sucedido |
| bloqueado_ate | timestamptz nulo; se no futuro, login é recusado com 403 antes de checar a senha |
| ativo | desativação lógica |

`usuario_perfil` é N:N entre `usuario` e `perfil`, com `ON DELETE RESTRICT` no lado do
perfil (não é possível apagar fisicamente um perfil em uso — a Fase 0 usa apenas
desativação lógica em todo lugar, então isso é defesa em profundidade).

### maquina
FK `unidade_id` obrigatória, `ON DELETE RESTRICT`. Único por `(unidade_id, codigo)`.
Cadastrada nesta fase porque `apontamento` (Fase 1) vai referenciá-la, mas nenhuma
regra de produção foi implementada ainda — é só o cadastro.

### dispositivo
FK `maquina_id` **opcional** (um dispositivo pode existir antes de ser associado a uma
máquina, ex.: leitor/terminal genérico). `identificador` único (ex.: MAC/serial).

### auditoria
Tabela de auditoria genérica, não vinculada a uma entidade específica de negócio:
`entidade` (nome da tabela/domínio), `entidade_id`, `acao` (`CREATE`/`UPDATE`/`DELETE`),
`usuario_id` (nulo permitido para eventos de sistema), `dados_antes`/`dados_depois`
(jsonb), `correlation_id`, `criado_em`.

**Imutabilidade garantida por trigger de banco** (não apenas por convenção de
aplicação): `trg_auditoria_bloquear_update` levanta exceção em qualquer `UPDATE` ou
`DELETE` na tabela. Isso implementa a regra "Não permitir: alteração sem auditoria" /
"exclusão física" de forma que nem um bug na aplicação, nem um acesso direto ao banco
por um humano, consigam apagar ou reescrever um registro de auditoria já gravado.

Nesta fase, auditoria é usada apenas para eventos de login/logout/troca de senha do
próprio usuário (`AuthService`). Um interceptor genérico para CRUD de outras entidades
fica para quando essas entidades existirem (Fase 1+).

## Convenções aplicadas em todas as tabelas de negócio

- PK `uuid` gerada por `gen_random_uuid()` (extensão `pgcrypto`).
- `criado_em`, `atualizado_em` (timestamptz, automáticos).
- `versao` (integer, optimistic locking) — TypeORM incrementa automaticamente e falha
  a escrita se a versão em memória estiver desatualizada.
- Nomes de coluna e tabela em `snake_case` português; nomes de propriedade TypeScript
  em `camelCase`.
- Nenhuma tabela desta fase permite `DELETE` de aplicação — desativação é sempre via
  `ativo = false`. (Não há endpoint de exclusão implementado nesta fase; a única
  garantia atual é o não-uso de `ON DELETE CASCADE` em dados de negócio e a inexistência
  de rotas de exclusão física.)

## Fase 1 — Cadastros (planejado, não implementado)

O modelo de dados completo da Fase 1 (`funcao`, `colaborador`, extensão de `maquina`,
`operacao`, `tipo_ocorrencia`, `fornecedor`, `resina`, `lote_resina`,
`movimento_estoque_lote`, `item`, `molde`, `configuracao_item_molde` versionada por
vigência, `ordem_producao`) está especificado em
[fase-1-cadastros.md](fase-1-cadastros.md), seções 2–7. Nenhuma dessas tabelas existe
ainda no banco — este resumo só evita que alguém procure o modelo de dados da Fase 1
neste arquivo e não encontre nada.

Ponto de maior risco/complexidade do modelo: `configuracao_item_molde` implementa a
regra "peso, cavidades, ciclos e limite de perda não podem ser sobrescritos
historicamente" via vigência (`vigencia_inicio`/`vigencia_fim`/`ativo`/`version`) e um
`EXCLUDE USING gist` (extensão `btree_gist`, ainda não habilitada) que impede
sobreposição de vigências para o mesmo item+molde no nível do banco, não apenas da
aplicação — ver [fase-1-cadastros.md, seção 7](fase-1-cadastros.md#7-estratégia-de-vigência-configuracao_item_molde).

## Fase 1 implementada - Cadastros

A Fase 1 adiciona as tabelas `funcao`, `colaborador`, `operacao`, `tipo_ocorrencia`, `fornecedor`, `resina`, `lote_resina`, `movimento_estoque_lote`, `item`, `molde`, `configuracao_item_molde` e `ordem_producao`. A tabela `maquina` foi estendida com `modelo`, `numero_serie`, `setor` e `capacidade`.

Regras estruturais aplicadas no banco:
- unicidade por empresa/unidade conforme recurso;
- FKs com `ON DELETE RESTRICT`;
- saldo de lote protegido contra atualiza��o direta;
- movimentos de estoque imut�veis;
- configura��o item/molde com versionamento por vig�ncia e bloqueio de sobreposi��o.

## Fases 2 a 6 (planejado, não implementado)

Resumo das tabelas novas. Detalhe completo (colunas, constraints, índices) em
[plano-fases-2-a-6.md](plano-fases-2-a-6.md); cálculos derivados em
[calculos-oee.md](calculos-oee.md).

| Fase | Tabelas novas | Ponto crítico do modelo |
|---|---|---|
| 2 — Apontamento | `turno`, `apontamento`, `apontamento_evento` | `EXCLUDE USING gist (maquina_id WITH =, tstzrange(inicio, fim, '[)') WITH &&) WHERE status <> 'CANCELADO'` — impede apontamentos sobrepostos **e** mais de um aberto por máquina. Peso/cavidades/ciclo/limite são **congelados** no apontamento; massas são colunas `GENERATED ALWAYS ... STORED`. `apontamento_evento` é append-only imutável por trigger |
| 3 — Ocorrências | `ocorrencia`, `ocorrencia_evento` | Mesmo `EXCLUDE` por máquina. `CHECK` que impede `status = 'ENCERRADA'` sem `acao_corretiva` quando o tipo exige — a regra vive no banco, não só na aplicação. `planejada` e `exige_acao_corretiva` congelados na abertura |
| 4 — Offline/Sync | `idempotencia_requisicao` (append-only, a única tabela do sistema com expurgo permitido, por não ser dado de negócio); extensão de `dispositivo` | Chave repetida com payload diferente é `409`, nunca devolve resposta antiga |
| 5 — Estoque/Blendas | `blenda`, `blenda_componente`, `inventario`, `inventario_contagem`; extensão de `movimento_estoque_lote` | Saldo só muda por movimento (trigger já existente da Fase 1); `CHECK (saldo_atual_kg >= 0)`; baixa por apontamento idempotente por `idempotency_key = apontamento_id`; blenda é transação atômica |
| 6 — Indicadores/OEE | `calendario_producao`, `meta_producao`, views `vw_*` e materialized `mvw_*` | Nenhum agregado é fonte da verdade: tudo reconstruível a partir de `apontamento`, `ocorrencia` e `movimento_estoque_lote`, com endpoint de reconciliação |

### Extensões de tabelas existentes exigidas pelas fases novas

`configuracao_item_molde` (+`limite_perda_percentual`, +`ciclo_custo_segundos`),
`tipo_ocorrencia` (+`categoria`, +`planejada`, +`exige_acao_corretiva`),
`colaborador` (+`pin_hash` e controles de bloqueio — a coluna prevista no plano da Fase 1
não chegou a ser criada), `movimento_estoque_lote` (+`saldo_resultante_kg`,
+`apontamento_id`, +`blenda_id`, +`idempotency_key`), `maquina`
(+`ciclo_teorico_segundos`), `operacao` (+`consome_resina`).

Todas por `ALTER TABLE ... ADD COLUMN` com default seguro — nenhuma recriação de tabela,
nenhum `DROP` de coluna existente. Convenções da Fase 0/1 mantidas sem exceção:
`BaseEntity`, `snake_case` português, FK `ON DELETE RESTRICT`, unicidade escopada por
empresa, sem exclusão física (`ativo` + `/inativar` + `/reativar`), com a exceção já
estabelecida das tabelas append-only (`auditoria`, `movimento_estoque_lote`,
`apontamento_evento`, `ocorrencia_evento`), que não têm `ativo` nem `UPDATE`.
