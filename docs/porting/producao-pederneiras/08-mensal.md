# T8 — Produção mensal e exportações

Cartões de total/meta, dias/média, postes/homem, m³ e pendências. A matriz inclui apenas dias com produção até hoje, permite filtrar produtos e editar célula de dia aberto com auditoria. Exporta PDF e XLSX pelo mesmo payload mensal. A exportação XLSX permanece disponível.

Evidências com dados sintéticos: [captura desktop](prints/08-mensal-desktop.png) e [PDF LT-PRO-04 de exemplo](prints/08-lt-pro-04-exemplo.pdf). `tests/pederneiras/test_exports.py` verifica os totais e o PDF gerado. A comparação com LT-PRO-04 original está em `11-paridade.md`; o Excel original não está disponível.
