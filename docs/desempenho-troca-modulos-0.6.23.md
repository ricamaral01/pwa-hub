# Troca entre Planejamento e Produção — 0.6.23

Medição no endereço publicado em Chromium, com uma conta sintética pareada removida ao fim. Rede emulada: 4G, 90 ms de latência, 10 Mb/s de download e 2 Mb/s de upload. O tempo vai do clique até a tela de destino visível; os dados continuam a carregar normalmente depois desse ponto.

## Diagnóstico antes da correção (0.6.21)

| Resolução | Direção | Primeira abertura | Retorno com módulo carregado |
|---|---|---:|---:|
| 1366×768 | Planejamento → Produção | 7,3–10,6 s | 0,03–0,04 s |
| 1366×768 | Produção → Planejamento | Não medida a frio | 0,39–0,61 s |
| 768×1024 | Planejamento → Produção | 8,6–11,3 s | 0,05 s |
| 768×1024 | Produção → Planejamento | Não medida a frio | 0,52 s |

As dez requisições mais lentas da rodada inicial de 1366×768, em 4G:

| Rota | Tempo | Corpo | Cache |
|---|---:|---:|---|
| Mapa `app.js` | 5.042 ms | 617 KB | não |
| Mapa `xlsx.full.min.js` | 4.364 ms | 883 KB | não |
| Mapa `dashboard-defeitos-v5.js` | 3.159 ms | 21 KB | não |
| Mapa `unificado-bridge.js` | 3.129 ms | 16 KB | não |
| Mapa `modelos-formas.js` | 3.014 ms | 33 KB | não |
| Mapa `bridge.js` | 3.003 ms | 6 KB | não |
| logo ConcreTrack | 2.663 ms | 445 KB | não |
| Mapa `assets/msgbox.js` | 2.645 ms | 6 KB | não |
| logo Concrefer | 2.039 ms | 339 KB | não |
| API `pcp/programacao` do Mapa | 1.731 ms | 96 B | não |

O navegador gastou cerca de 0,5–0,7 s em tarefas e 0,1–0,2 s em scripts; a espera predominante foi por rede/download. O Nginx publicava os estáticos com `Cache-Control: no-store` e sem `Content-Encoding`; HTML e APIs também eram `no-store`. O Mapa e o PCP já ficavam montados na mesma casca após a primeira visita; a troca aquecida não recarregava a página de topo. O servidor do Mapa já usa dois workers Gunicorn, e a rota de abertura consultou o dia atual e setores, sem buscar toda a produção histórica. Não houve evidência de serviço externo entre as requisições lentas.

As consultas de abertura já tinham índices em `(data_fabricacao, setor)` de `montagem_poste`, `(data_fabricacao, setor, forma)` de `producao`, e `(data_fabricacao, setor, forma)` nas tabelas de programação e liberação. Nenhum índice novo foi necessário para resolver a demora medida.

## Correção e resultado

O Nginx agora serve JavaScript/CSS comprimidos com gzip e cache imutável quando há versão na URL; recursos sem versão têm cache de cinco minutos. HTML, service workers e APIs continuam sem cache. HTTP/2 já estava habilitado. Os service workers servem os recursos estáticos da casca e do Mapa do cache quando a versão confere. A sessão PCP só é renovada na troca quando o token está próximo do vencimento. Durante a abertura, a casca permanece visível e a área de conteúdo mostra “Carregando tela…”. Nenhuma consulta, regra ou dado foi alterado; o `app.js` publicado manteve o mesmo SHA-256 da versão anterior: `dfd63f718a2cf1a1609f035157a89a2f88c497937ef9a76d4c72b1a04e157780`.

| Resolução | Direção | Primeira abertura (0.6.23) | Retorno aquecido (0.6.23) |
|---|---|---:|---:|
| 1366×768 | Planejamento → Produção | 1,895 s | 0,084 s |
| 1366×768 | Produção → Planejamento | 2,131 s | 0,055 s |
| 768×1024 | Planejamento → Produção | 1,335 s | 0,069 s |
| 768×1024 | Produção → Planejamento | 2,007 s | 0,047 s |

Em uma segunda rodada de 1366×768, o `app.js` levou 1.654 ms/138 KB e o XLSX 1.161 ms/319 KB, ambos baixados pela primeira vez; a troca levou 2.652 ms. Nenhum host externo foi chamado durante as trocas medidas. O script `scripts/check_unificado_switch_performance.py` é o gate obrigatório após publicação: inclui o carregamento do indicador principal do Dashboard Defeitos e reprova se qualquer primeira abertura passar de 4 s ou qualquer retorno aquecido passar de 2 s. A publicação deve ser revertida se o gate reprovar. Na última execução do gate, o Dashboard Defeitos ficou pronto em 3,135 s no computador e 3,010 s no tablet.

No endereço publicado, a navegação sintética passou para os quatro perfis do Mapa (GERENCIA, GESTOR, MONTADOR, APONTADOR) e os quatro perfis do PCP (ADMIN, PCP, PRODUCAO, CONSULTA), com a tela permitida correspondente e sem retorno ao login. A matriz dos 39 itens de menu também foi repetida na versão final.

Na captura do Setor 1 em 1366×768, a comparação por pixel antes/depois foi idêntica em toda a área operacional; a única diferença ficou na pílula do usuário sintético no topo. Cartões, estados e totais visíveis permaneceram iguais.

Com a última tela da Produção definida como Dashboard Defeitos, uma abertura fria em 4G mostrou a tela em 1,6 s no computador e 1,4 s no tablet; o primeiro indicador ficou preenchido em 2,7 s e 2,5 s, respectivamente. Assim, o gate não depende só do iframe aparecer.

O backup anterior está em `/opt/concrefer-unificado/releases/0.6.21-before-0.6.22-performance/`; o da etapa final, em `/opt/concrefer-unificado/releases/0.6.22-before-0.6.23-performance/`. Backups dos bancos com restauração testada foram feitos antes de cada etapa.
