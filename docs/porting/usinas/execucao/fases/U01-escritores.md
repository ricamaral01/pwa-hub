# U01 — Classificação de tabelas e escritores

**Resultado:** o [inventário de banco](../../04-banco-de-dados.md) relaciona tabelas de Campinas/Pederneiras, volumes e referências de leitura/escrita no ERP, scripts, Dashboard e CEC. A [matriz de ações](../write-through-evidencia.md#classificação-e-autorização) separa candidatas MISTAS de tabelas somente espelho. As receitas operacionais continuam oficiais na VPS antiga; a API e o CLP não foram alterados.

**Limite:** referência estática em código não comprova todo escritor externo do CLP, supervisório, jobs do fornecedor ou manutenção manual. A classificação ainda não está assinada pela operação/fornecedor. Nenhuma candidata está liberada para edição pelo Unificado.

## Pendências para aprovação

- Confirmar por unidade quais processos externos escrevem `tbl_massadas`, `tbl_leiturasetor`, `tbl_tracos`, `tbl_est_silos` e as demais tabelas de ingestão.
- Validar a matriz ESPELHO/MISTA e a responsabilidade pela edição humana de cada candidata. Esta decisão não ativa escrita; U07 exige aprovação própria.
