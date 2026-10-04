# Retorno do Ricardo — conferência de 04/10/2026

Ambiente exclusivo de testes: `https://concrefer.concretrack.com.br/unificado/`, VPS `2.25.163.32`. Fotografia dos bancos: `2026-10-04T09:44:18Z`. O Mapa oficial foi usado apenas em GET para gerar as respostas da fotografia; o navegador abriu o HTML original sem rede oficial, alimentado pelos fixtures locais. O backend PCP e `mapa-concretagem/app.js` não foram alterados.

## Dashboards e Histórico

| Tela | Período e recortes | Resultado final original × unificado |
|---|---|---|
| Defeitos | 01–04/10, Todos e Setores 1–4 | Iguais: KPIs, seis tipos de defeito, totais por setor, 30 linhas visíveis e texto. Em Todos, 415 produções, 270 postes, 28 ocorrências, 10 reprovados e sete retrabalhos. Hash da lista por defeito: `f1d3cbe2f737f5a2e8f220e1849f128c3e6b5096a60700e311218e31526c4768`. |
| Montagem | 01–04/10, Todos e Setores 1–4; 01/09–04/10, Todos | Seis cenários iguais em KPIs, linhas e texto. Hash das 15 linhas visíveis em Todos: `ffb92a20e8fb54ea039caa8a9239488ace9df0fdbe0bbc34a3f1f6f4ad58a2c1`. |
| Produtividade | Mesmos seis recortes | Após corrigir o desempate no proxy, seis cenários iguais em KPIs, linhas e texto. Hash das 415 linhas de outubro: `79d060646554d4bfb9e5cb0fba8da1250673a2c6d2e9dd057322fd9533de57a4`; hash das 4.366 linhas exibidas de setembro a outubro: `88c77cdc41200c8c0ef84650f16bb9c4554727f8ad4a4659481c1c4fb136f53d`. |
| Histórico | 01 e 03/10, quatro combinações de filtro por data | Oito cenários iguais em quantidade, texto e classes das linhas exibidas. |

No Dashboard Defeitos, o original também exibe 28 ocorrências para 14 pares únicos de peça e defeito. A contagem por linha de finalização e histórico é o comportamento original, preservado e detalhado em `docs/comportamentos-atuais-suspeitos.md`. As leituras da origem e do destino tiveram hashes ordenados e de conjunto iguais para as duas tabelas em três períodos; a hipótese de duplicação exclusiva do servidor foi descartada.

Em Produtividade, o conjunto de 415 linhas de outubro era igual (`SHA-256` canônico `0009bd7dc33a39ff0d341af062f0cd0852719ed9b102d9a9727377548e962dd7`), mas a ordem da consulta `data_hora.asc` diferia nos horários empatados. Antes da correção, a primeira linha exibida diferente era a posição 206, e o total continuava igual. O proxy só aplicava o desempate nas respostas HTTP 200; as páginas reais vinham como 206. Ele agora usa a ordem da origem também nas respostas paginadas, com um ranking privado específico da consulta de Produtividade. O script `scripts/sync_mapa_producao_source_order.py` o refaz junto com a fotografia. O teste final do HTML original com respostas da origem contra a rota nova passou 12/12 cenários, com zero diferenças de KPI, linha e texto. O Histórico tinha ordem bruta diferente em quatro consultas de 01/10, mas o resultado final foi igual nos oito cenários.

O E2E anterior não detectou o defeito reportado porque as duas variantes usavam o mesmo proxy de testes e conferiam igualdade entre elas. Também não auditava pares únicos de peça e defeito. Os testes atuais `tests/mapa/e2e/dashboard_defects_source_parity.py`, `dashboard_other_source_parity.py` e `historico_ui_parity.py` comparam o HTML original alimentado pela fotografia da origem com o unificado, registram KPIs, linhas exibidas e hashes; os dois primeiros incluem auditoria explícita de totais e linhas. Os fixtures completos e as respostas contendo dados de produção ficam fora do Git, sob `.work-mapa-unificado/` e `/opt/concrefer-unificado/migration/`.

## Navegação, logos e menu

O seletor de Produção agora abre diretamente `/unificado/pcp/dashboard/`; o destino inverso abre `/unificado/mapa/operacao/`. A rota intermediária `/unificado/pcp/` tinha 217 bytes, uma atualização automática e um link visível enquanto redirecionava. O fundo navy é desenhado no `head` antes da casca. CSS e JavaScript da casca têm cache privado de cinco minutos; HTML e APIs continuam sem cache. Na medição final em 1366×768, a rota anterior levou 1.085 ms e a direta 780 ms; em 1920×1080, 1.208 ms e 899 ms. São medições únicas por largura, com rede e aquecimento de cache variáveis.

Menu desktop: 228 px expandido, 64 px recolhido, preferência `localStorage` compartilhada entre módulos, conteúdo alargado, ícones Bootstrap do PCP, monogramas do Mapa, rótulos acessíveis e subitens do PCP em painel flutuante. O teste de navegador abriu o painel e encontrou links visíveis. A tela de login e os dois menus usam `concrefer-logo.png` e o logo ConcreTrack existente. `tests/pcp/shell_resize.py` passou seis transições entre desktop e tablet após retirar o botão novo do DOM em 1024 px; tablet, celular e quiosque não receberam a interação do menu desktop.

Capturas em `docs/capturas-retorno-ricardo/`: Produção e Planejamento expandidos e recolhidos em 1366×768 e 1920×1080, mais o painel de grupo recolhido do Planejamento nas duas larguras e o login em 1366×768. A página `/unificado/testar/` foi aberta com a conta sintética e mostrou a atualização; as partes ainda não certificadas continuam marcadas como parciais. As contas sintéticas de prova foram removidas dos dois bancos após as capturas.
