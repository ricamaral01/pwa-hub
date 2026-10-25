# Plano de migração para Usinas — origem oficial na VPS antiga

**Atualização em 25/10/2026:** a restrição de leitura foi ampliada por decisão
do proprietário para as dez fontes de relatórios de Campinas. O espelho de
relatórios e custos está ativo na VPS nova, com as consultas publicadas em
somente leitura. Ver [execução de relatórios e custos](execucao/RELATORIOS-CUSTOS-20261025.md).
Os parágrafos abaixo registram a decisão e os gates anteriores de 23/10; o
bloqueio de escrita permanece vigente.

## Decisão de 23/10/2026 e limite atual

O proprietário solicitou a migração funcional completa, incluindo edição, mas decidiu **manter a origem intacta e não alterar suas permissões**. Esta decisão mantém a publicação de `tbl_receitas` Campinas em somente leitura. O papel `usinas_mirror_ro` tem `SELECT` nessa tabela e não tem `SELECT` em `tbl_massadas`, `tbl_produtos`, `tbl_agregados` ou `tbl_est_movimentos`; portanto U03–U06 não podem avançar para essas tabelas por espelhamento com o acesso atual. U07–U12 continuam sem execução: a API legada não oferece autenticação delegada, idempotência nem verificação atômica de conflitos para as ações de escrita descritas abaixo. A solicitação de migração completa não remove esses gates técnicos. Qualquer expansão exige uma nova decisão específica sobre uma fonte de leitura já autorizada e, para edição segura, um contrato de escrita que satisfaça H1–H8 sem violar a restrição da origem.

**Revisado em 22/10/2026 conforme decisão do proprietário.** Há homologação de leitura de `tbl_receitas` Campinas; nenhuma alteração da API, CLP ou das tabelas da origem. Foi criado um papel PostgreSQL usado em transações somente leitura e uma regra HBA restrita na VPS antiga. Esse papel ainda herda `CREATE` no esquema `public` por um grant global preexistente; a limitação está documentada no [README de Usinas](../../../unificado/usinas/README.md) e exige auditoria antes de considerar a conta estritamente sem escrita. As tabelas **ESPELHO** e **MISTAS** permanecem na VPS antiga como fonte oficial. O Unificado deverá ler as cópias no esquema `usinas` da VPS nova. O sincronizador é o único processo que grava nessas cópias. Uma ação humana de tabela MISTA só é habilitada após aprovação explícita dessa tabela/ação/unidade e escreve na origem por [write-through](execucao/write-through-evidencia.md).

**Avanço de homologação em 22/10/2026:** `tbl_receitas` Campinas foi escolhida para primeiro teste. Os esquemas `usinas` e `usinas_write` foram instalados somente em `mapa_unificado_homolog_20261016`, com outbox e flags de despacho desligadas. O sincronizador passou E1–E8 com dados sintéticos e está ativo a cada 60 segundos, lendo a origem real com papel `SELECT` restrito e TLS. A primeira carga trouxe 265 receitas; a verificação comparou todas as colunas e hashes sem divergência. A [evidência](execucao/write-through-evidencia.md#execução-de-homologação--tbl_receitas-campinas) separa esses testes dos gates H1–H8 de escrita, ainda pendentes. A API, o CLP e as tabelas da origem seguem operando; foi criado apenas um papel de leitura e uma regra HBA restrita para o sincronizador.

**Decisão vigente:** o proprietário escolheu manter a API e o banco antigos intactos e continuar somente leitura. A página de receitas e a API de consulta foram publicadas no Unificado oficial após carga e reconciliação do espelho na VPS nova; [evidência da implantação](execucao/DEPLOY-LEITURA-20261022.md). A checagem read-only da chave `nome_traco` normalizada passou, mas não torna o `POST` legado idempotente ou atômico; as três ações de escrita permanecem desligadas. O andamento e as pendências para aprovação de cada tarefa U01–U12 estão em [execucao/fases/00-indice.md](execucao/fases/00-indice.md).

## 1. Dados e responsabilidades

| Componente | Responsabilidade | Regra de escrita |
|---|---|---|
| VPS antiga: API, CLP, bancos | fonte oficial, validações e operação da usina | continuam lendo e gravando as mesmas tabelas, sem modificação |
| VPS nova: `usinas` espelho | consultas do Unificado, por `unidade_id` e chave de origem | **somente sincronizador** |
| VPS nova: `usinas_write.outbox` | intenção, idempotência, autoria, estados, antes/depois e fila de erros | somente serviço de write-through, separado do espelho |
| Unificado UI/API | leitura do espelho; edição aprovada por outbox → origem | nunca escreve diretamente nas tabelas espelho |

O [mapeamento coluna a coluna](04-banco-de-dados.md#mapeamento-coluna-a-coluna-para-a-camada-fiel) continua válido para cópias fiéis, mas **não** muda o dono dos dados. Manter `unidade_id`, `origem_banco`, `origem_id`, `_source_hash`, instante de coleta e atraso de sincronização. Posições de agregado, silo, água e aditivo seguem interpretação versionada por unidade; não achatar Pederneiras/Noroeste. Usuários `ct_usuarios` são vinculados ao IAM, sem segundo login ativo. Tabelas PCP correlatas continuam no domínio PCP e são consumidas por contrato.

## 2. Etapa 2 — espelho com atualização a cada 1 minuto

1. Preparar na VPS nova somente o esquema, papéis mínimos e sincronizador de homologação. Na origem, usar leitura para captura inicial consistente e incremental; não alterar API, CLP ou rotina existente.
2. Executar ciclo de **1 minuto** com checkpoint, chave idempotente `(unidade_id, origem_banco, origem_id)`, atualização de `source_hash` e janela de reconciliação para exclusões ou tabelas sem `updated_at`. Medir atraso, falhas e volume.
3. A aplicação recebe permissão `SELECT` no espelho e **nenhum** `INSERT/UPDATE/DELETE` nessas tabelas. O sincronizador recebe permissão de escrita apenas no espelho.
4. Comparar contagens, `SUM(qtd)`, campos `real_*`/`prog_*`, movimentos, saldos, revisões e CEC por unidade/data. O espelho não recalcula dados para substituir a origem; indicadores derivados devem apontar fonte e versão da fórmula.
5. Pausa/falha de sincronização não autoriza escrita local. Mostrar idade do espelho; conforme limite aprovado, suspender edição e sinalizar leitura potencialmente desatualizada.

## 3. Etapa 2B — edição MISTA com write-through

O fluxo completo, a matriz de endpoints Campinas/Pederneiras, limitações e testes estão em [execucao/write-through-evidencia.md](execucao/write-through-evidencia.md). Em resumo:

- Aprovar tabela, ação, unidade e perfis **individualmente**. Até a aprovação, só leitura.
- Registrar intenção em outbox, comparar `_source_hash` com leitura atual da origem, chamar o endpoint legado existente com autorização válida e verificar a resposta. SQL direto com `espelho_rw` só quando não existir endpoint para a ação aprovada; a conta ainda não existe e exigirá autorização específica.
- Após confirmação na origem, pedir ao sincronizador refresh imediato de todos os registros afetados e mostrar o estado confirmado. O ciclo de 1 minuto continua.
- Se a VPS antiga estiver fora do ar, a tela entra em modo leitura. Resposta ambígua fica em fila de reconciliação; não repetir POST cegamente.
- Depois da virada da **interface de edição** daquela tabela, orientar usuários a editar no Unificado. A API, os jobs e o CLP antigos continuam gravando na VPS antiga. A tela legada não é modificada nesta tarefa.

Os endpoints existentes não apresentam contrato geral de `Idempotency-Key`/`If-Match`, e a API exige `ct_session` para a maioria das escritas. Isso bloqueia a promessa de “nunca duas vezes” e conflito atômico até haver solução comprovada em homologação, mantendo a API sem alterações. A ação que não passar esse gate fica em leitura.

## 4. Integrações e interfaces

- **CLP/supervisório:** conserva o destino e o fluxo atual. O espelho apenas observa a origem; nenhuma ordem nova ao equipamento.
- **Dashboard Usina:** levar consultas e apontamentos à navegação Usinas. Apontamentos aprovados escrevem no endpoint Dashboard da VPS antiga; o espelho reflete o resultado.
- **CEC:** levar telas e análises ao Unificado, lendo espelho. Leituras aprovadas passam pelos endpoints legados da unidade; worker e banco CEC antigos continuam oficiais.
- **Etiquetas:** integrar UI/PDF/QR, consultando o espelho. Impressoras e push exigem validação própria; não mudar a fonte das massadas.
- **PCP, Mapa e Dosagem:** consumir contratos existentes e evitar duplicação de autoria ou dados oficiais.

## 5. Identidade e alçadas

Vincular cada `ct_usuarios` ao IAM após verificação, por unidade. Definir permissões por tela e **ação** no backend. Para chamada ao endpoint legado, decidir uma forma válida de `ct_session` com autoria rastreável sem copiar senha do usuário. Até isso estar resolvido, endpoint com escrita não entra em produção. O outbox registra ator IAM e identidade usada na origem; não registra senha/token.

## 6. Tarefas e aceite

| ID | Tarefa | Depende | Evidência de aceite |
|---|---|---|---|
| U01 | confirmar tabela ESPELHO/MISTA, escritores CLP/API/job e regra por unidade | — | matriz assinada por operação/fornecedor |
| U02 | confirmar mapeamento de materiais e agregados Campinas/Pederneiras/Noroeste | U01 | casos de referência anonimizados por unidade |
| U03 | preparar esquema e papéis do **espelho** em homologação | U01 | aplicação sem DML no espelho; sincronizador com DML restrito |
| U04 | carga inicial e sincronizador de 1 minuto | U03 | checkpoints, ausência de duplicatas e atraso monitorado |
| U05 | reconciliação por tabela/unidade | U04 | contagens/somatórios/hash e divergências tratadas |
| U06 | Usinas nativo em leitura, menu, PWA e relatórios | U04 | telas e cálculos comparados, IAM por unidade |
| U07 | aprovar primeira tabela/ação MISTA | U01, U06 | autorização escrita do proprietário |
| U08 | outbox e fila de erros em homologação | U07 | estados, auditoria antes/depois, retry seguro e rollback testados |
| U09 | autenticação da chamada legada e hash/conflito | U08 | autoria válida, idempotência e conflito atômico demonstrados |
| U10 | homologar gravação, duplicata, conflito e origem fora do ar por ação | U09 | H1–H8 de `write-through-evidencia.md` verdes |
| U11 | ativar edição de **uma** tabela/ação/unidade | U10 | aprovação explícita de produção e observação monitorada |
| U12 | repetir U07–U11 para cada tabela seguinte | U11 | aprovação e evidência isoladas por tabela |

U03–U06 não autorizam escrita do Unificado na origem. U07–U12 não alteram a API legada. Não há “corte” do CLP ou transferência da fonte oficial nesta arquitetura. O legado continua operando normalmente mesmo após a interface de edição do Unificado ser ativada.

## 7. Riscos, rollback e decisões

| Risco | Controle | Reversão |
|---|---|---|
| espelho atrasado | idade visível, ciclo de 1 min, refresh imediato e reconciliação | suspender edição; continuar leitura com aviso |
| POST duplicado por timeout | outbox, chave, estado desconhecido, read-after-write | não fazer retry cego; conciliar na origem |
| sobrescrita concorrente | comparar hash diretamente na origem e exigir garantia atômica para a ação | desabilitar aquela edição |
| autorização incorreta | IAM por unidade/ação e identidade legada verificável | revogar flag de edição; legado normal |
| indisponibilidade da VPS antiga | health, timeout e modo leitura | novas edições bloqueadas; fila anterior conciliada |
| interpretação errada entre plantas | configuração por unidade e competência | retornar regra/consulta anterior sem reescrever origem |

Rollback de uma ação: desligar a flag de edição no Unificado, parar novos despachos, conciliar eventos em voo, manter sincronização do espelho e orientar o uso da tela legada. Nunca restaurar o espelho sobre a origem. Produção só com autorização explícita **tabela por tabela**.

**Decisões pendentes:** confirmar escritores e mapeamentos por unidade; priorizar o próximo espelho de leitura e o acesso somente leitura necessário; e, se um dia for retomada a edição, substituir explicitamente a decisão atual, definir ações/perfis e resolver autenticação, idempotência e conflito atômico. `espelho_rw` não existe. Até lá, o fluxo de edição permanece em leitura.
