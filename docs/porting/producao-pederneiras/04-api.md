# T4 — API e regras de Pederneiras

`app/api/routers/producao_unidade.py` resolve `unidade_id` no banco, exige vínculo `producao.usuario_unidade` ou conta master PCP ativa e registra toda mudança de quantidade na mesma transação em `producao.auditoria`. O papel gestor só escreve na unidade vinculada. Reabertura exige supervisor e motivo. Data futura é bloqueada no fuso de São Paulo.

Rotas: produtos (listagem, criação, edição, prévia/aplicação de CSV/XLSX e modelo), apontamento (consulta, rascunho, envio, repetição, confirmação e reabertura), áreas configuráveis, mão de obra (consulta, salvamento, repetição, confirmação, reabertura e mensal), consolidado mensal e exportações PDF/XLSX. PDF e Excel usam o mesmo resultado mensal da tela.

`pederneiras_rules.py` centraliza inteiro não negativo, mão de obra em passos de 0,25, m³ com ausência explícita de volume, postes/homem, meta de 1.472 para outubro e bloqueio da confirmação sem equipe. `pederneiras_catalog.py` compara importação antes de gravar e sinaliza conflitos. `pederneiras_exports.py` gera LT-PRO-04.

Validação local: `python -m pytest tests/pederneiras -q` passou (regras, catálogo, exportações, permissões do menu e telas com API simulada). As revisões Alembic 01–03 foram testadas em banco isolado na VPS. Falta um E2E HTTP com banco operacional clonado; nenhuma migration ou seed foi executada no banco operacional.

Ricardo e Marcelo aparecem ativos no PCP operacional como `ADMIN`. Alex permanece master do Mapa, mas sua conta PCP está inativa; a API PCP não lhe dá sessão até regularizar esse vínculo. O gestor de Pederneiras será criado pelo Ricardo posteriormente.
