# T4 — Núcleo de regras da API

Foi criado `app/services/pederneiras_rules.py` como fonte única para os cálculos que serão usados por desktop, PWA e exportação:

- Data futura bloqueada no fuso de São Paulo; quantidade inteira não negativa.
- Mão de obra não negativa em passos de 0,25.
- Postes/homem = postes ÷ total de pessoas, com duas casas; sem denominador retorna vazio.
- m³ = soma de quantidade × volume por peça; se houver peça produzida sem volume cadastrado, o resultado fica vazio e informa quantos produtos faltam.
- Confirmação bloqueada quando há produção e não há mão de obra.
- Meta mensal = dias úteis × peças/dia.

`python -m pytest tests/pederneiras/test_rules.py -q`: **3 testes passaram** (data futura, quantidades, passos de 0,25, bloqueio, postes/homem, m³ e meta de 1.472).

## Rotas implementadas em código

`app/api/routers/producao_unidade.py` expõe catálogo, cadastro e edição de produtos; consulta, gravação, repetição, confirmação e reabertura supervisionada de apontamentos; consulta, gravação e confirmação de mão de obra; resumo mensal de produção e mão de obra. A unidade é resolvida pelo catálogo do banco. A autorização consulta `producao.usuario_unidade`; o parâmetro da URL não concede acesso. Ricardo, Marcelo e Alex conservam acesso master com conta PCP `ADMIN` ativa. O perfil `gestor` tem escrita somente na unidade atribuída; `leitor` só consulta.

As alterações de quantidade e de produto são gravadas na mesma transação que `producao.auditoria`. Dias confirmados não aceitam edição. Reabrir exige supervisor e motivo. A rota mensal inclui somente datas até hoje com produção positiva. A migration `20261023_02` cria a associação usuário/unidade e reutiliza as atividades de mão de obra existentes.

Validação de sintaxe Python e importação do roteador: **13 rotas registradas**. A migration foi executada em banco temporário clonado somente com schema, até a revisão `20261023_02`; não foi aplicada ao banco operacional.

**Ainda pendente nesta tarefa:** teste HTTP transacional com dados reais clonados; prévia/importação CSV/Excel, modelo XLSX e exportações LT-PRO-04; vinculação do gestor definitivo; revisão de todos os leitores antigos de Campinas para filtrar `unidade_id=1`. Por isso a API não deve ser ativada em produção ainda. A consulta somente leitura ao PCP operacional encontrou Ricardo e Marcelo ativos como `ADMIN`, mas a conta `Alex` está inativa nesse serviço; o vínculo com a conta master ativa do Mapa precisa ser reconciliado antes de anunciar acesso PCP para Alex.
