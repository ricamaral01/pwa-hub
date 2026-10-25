# Usinas — acompanhamento das fases U01–U12

**Decisão posterior, 23/10/2026:** foi solicitada migração funcional completa, com a origem e suas permissões intactas. O espelho atual de receitas Campinas continua em leitura; a expansão para outras tabelas e a ativação de edição permanecem bloqueadas pelos acessos e garantias técnicas descritos no [plano](../../07-plano-migracao.md#decisão-de-23102026-e-limite-atual). Nenhuma aprovação de tabela/ação nem mudança de privilégio foi inferida dessa solicitação.

Data-base: 22/10/2026. Fonte: [plano de migração](../../07-plano-migracao.md), inventário e [evidência da escrita](../write-through-evidencia.md). Cada fase tem um Markdown próprio com resultado, limite e pendências para decisão. **Nenhuma linha abaixo representa aprovação automática de produção.**

| Fase | Estado | Relatório |
|---|---|---|
| U01 Escritores e classificação | inventário feito; confirmação externa pendente | [U01](U01-escritores.md) |
| U02 Materiais e posições | agregados conferidos; semântica pendente | [U02](U02-mapeamento.md) |
| U03 Esquema e permissões | receitas Campinas no Unificado oficial; demais pendentes | [U03](U03-esquema.md) |
| U04 Carga e ciclo de 1 minuto | receitas Campinas ativo na VPS nova oficial | [U04](U04-sincronizacao.md) |
| U05 Reconciliação | receitas Campinas validado na publicação; demais pendentes | [U05](U05-reconciliacao.md) |
| U06 Interface nativa de leitura | receitas Campinas no Unificado oficial; paridade parcial | [U06](U06-interface.md) |
| U07 Aprovação de ação MISTA | leitura somente, conforme decisão do proprietário | [U07](U07-aprovacao-edicao.md) |
| U08 Outbox e fila de erros | esquema inerte; despacho indisponível | [U08](U08-outbox.md) |
| U09 Autenticação e conflito | contrato da API atual insuficiente | [U09](U09-autenticacao-conflito.md) |
| U10 Homologação de escrita | H1–H8 não executados | [U10](U10-testes-escrita.md) |
| U11 Ativação por tabela | não iniciada | [U11](U11-ativacao.md) |
| U12 Expansão das tabelas | não iniciada | [U12](U12-expansao.md) |

## Decisões consolidadas para o proprietário

1. Confirmar com operação/fornecedor os escritores externos e o significado das posições de agregados, silos e materiais em Campinas, Pederneiras e Noroeste (U01–U02).
2. Definir quais tabelas e unidades entram na **próxima homologação de leitura**, e autorizar para elas os acessos PostgreSQL de somente leitura necessários ao sincronizador (U03–U06). A decisão anterior sobre `tbl_receitas` Campinas não libera automaticamente outras tabelas.
3. Para qualquer edição futura, substituir expressamente a decisão vigente de **manter API e banco antigos intactos e Usinas somente leitura**, definindo a ação/tabela/unidade e uma solução para autenticação, idempotência e conflito atômico (U07–U10).
4. Aprovar produção separadamente, tabela por tabela, somente após os respectivos testes e evidências verdes (U11–U12).

Em produção, está em execução apenas o espelho e a consulta de receitas Campinas, conforme [relatório da implantação](../DEPLOY-LEITURA-20261022.md). A homologação permanece separada. O CLP e a API legada seguem na fonte oficial.
