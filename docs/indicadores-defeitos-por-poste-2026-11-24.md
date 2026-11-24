# Indicadores por poste produzido — 24/11/2026

Implementados no cabeçalho do Dashboard Defeitos do Unificado:

- Postes com algum defeito / postes produzidos × 100.
- Postes com defeito crítico / postes produzidos × 100.

A data seleciona a fabricação em `producao`. Inspeções concluídas ligadas por `montagem_poste.record_id = producao.id` fornecem os defeitos, incluindo histórico e reinspeções posteriores. Cada poste conta uma vez. O crítico usa a classificação de seção/item em `checklists.json`, a mesma da validação de inspeções. Segregação confirmada permanece como desfecho separado.

O cartão mostra contagem, percentual, cobertura e pendências. A divisão em críticos, somente não críticos e inspecionados sem defeito é exclusiva. Os críticos estão incluídos no total com algum defeito. Sem vínculo de inspeção, uma peça permanece pendente; ocorrências avulsas não entram no numerador. Sem produção, a taxa é “—”. Situação filtra pelo status atual, mantendo o histórico de defeitos; busca considera forma/modelo/montador. Inspeções posteriores atualizam o resultado da safra produzida, inclusive em consultas históricas.

CSV e XLSX incluem numeradores e denominadores da nova base. Os indicadores anteriores mantêm as regras existentes, pela data de inspeção.

Validação: quatro testes de integração da consulta em PostgreSQL 16 descartável, incluindo 150 produzidos, 120 afetados, 10 críticos, 110 somente não críticos, múltiplos defeitos, histórico duplicado, reinspeção limpa, pendência, filtros e conjunto vazio. Navegador Chromium: 80,00% e 6,67%, cobertura, exportação CSV, erro sem valores antigos e larguras 1440/390 sem transbordamento. Capturas em `outputs/postes-indicadores-qa/` usam dados ilustrativos e o cabeçalho isolado.

O gerador completo do Mapa apresenta incompatibilidade com o texto atual de `mapa-concretagem/app.js`, anterior ao patch do cabeçalho. A entrega usa o build focalizado `deploy/defeitos-por-poste-20261124/build_release.py`, aplicado ao HTML publicado. O JavaScript preserva os comparativos mensais e a evolução anual existentes em produção.

Publicação realizada na VPS Concrefer (`2.25.163.32`), em quatro arquivos: módulo de cálculo da API, JavaScript do Dashboard Defeitos, HTML operacional e service worker. Os hashes anteriores são verificados antes da instalação. Backup: `/opt/concrefer-unificado/backups/defeitos-por-poste-20261124-20261124T173058Z`. Somente `mapa-unificado-auth.service` é reiniciado. O instalador restaura os arquivos e as permissões anteriores se a validação HTTP falhar.

A API usa `mapa_api_login`; a migração concede somente `SELECT (id, data_fabricacao, setor, forma, modelo)` em `public.producao`. A consulta agrega o histórico uma única vez, sem varrer a montagem para cada peça. Foram comparados os resultados antigos e novos em novembro e no ano completo, sem mudança nas métricas legadas; tempo aproximado de 0,5 a 2 segundos. A API publicada respondeu HTTP 200 com sessão e cabeçalho de contexto `X-Unificado-Screen: DASHBOARD_DEFEITOS`.

Para repetir a integração: definir `MAPA_TEST_POSTGRES_DSN` para uma instância descartável e executar `python -m unittest discover -s tests/mapa -p test_dashboard_defects_pieces.py -v`. As tabelas do teste são temporárias.
