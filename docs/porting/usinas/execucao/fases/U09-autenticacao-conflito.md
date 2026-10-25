# U09 — Autenticação legada, idempotência e conflito

**Resultado:** [a evidência por endpoint](../write-through-evidencia.md#endpoints-existentes-por-tabela-e-ação) relaciona ações e arquivos da API legada. As rotas de receitas usam `ct_session`; o Unificado não possui delegação de sessão por usuário para essa escrita. A busca no código não encontrou contrato de `Idempotency-Key`, `If-Match` ou comparação de `_source_hash` nas rotas de criação/revisão/ativação. A consulta read-only por nome normalizado foi testada, mas não reserva a chave na mesma transação do `POST`.

**Limite:** manter a API e o banco antigos intactos impede afirmar “nunca gravar duas vezes” ou rejeitar toda corrida de conflito usando essas rotas. Uma resposta HTTP perdida depois do commit permanece ambígua. Nenhuma credencial de escrita ou papel `espelho_rw` foi criado.

## Pendências para aprovação

- Não há decisão operacional que habilite U09 sob o contrato atual. Uma alternativa futura precisa trazer autenticação de serviço/autoria, idempotência persistida na origem e comparação/reserva atômica da chave ou versão, demonstradas em homologação.
- Se a exigência de origem intacta permanecer, aceitar que esta fase e as seguintes de **escrita** continuem suspensas.
