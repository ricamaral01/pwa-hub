# Fase 6 ? vers?o 1.4.13

Publicada somente na porta 18446. Qualidade, Log?stica, Mapa, Manuten??o de usina, Relat?rios, Produ??o e telas m?veis usam os componentes e tokens comuns. Qualidade e Log?stica foram recompiladas a partir das fontes. Ranking de Log?stica exibe posi??o num?rica.

As 48 capturas em `depois/` cobrem 12 telas nas larguras 1440, 1024, 820 e 390, sem erros HTTP/JavaScript, tela vazia ou rolagem lateral do corpo (`depois-results.json`). O contexto de setor informado explicitamente pelo Mapa agora ? preservado durante a inicializa??o; o IAM do servidor continua sendo a autoridade. O teste `screen_context.test.cjs` cobre a regress?o.

A NC identificada RNC-2026-825490 foi criada, registrada, triada e tratada com conten??o persistida at? An?lise de causa no banco isolado. Evid?ncia: `qualidade-flow.json`. O rascunho de tentativa inicial 2edeef50-f156-45b5-b7fa-eb62ad87f6f9 foi conservado como dado de teste; a valida??o de setor/?rea foi respeitada.

Fechamento Di?rio: c?digo publicado lido por SFTP de `/var/www/concretrack-erp/api`, sem conex?o a banco de produ??o. A vers?o publicada usa a integra??o nativa Mapa/PCP; a c?pia de teste aponta exclusivamente para 14152. O fallback REST legado aponta para 14153, sem chamada ao Supabase. Tabelas restauradas de um backup offline de 29/08/2026 em `erp_visual_homolog_20261118`, com dump do banco vazio antes do restore. Papel exclusivo somente SELECT. Servi?o `unificado-visual-homolog-erp.service`, porta 14189, rede permitida apenas em localhost; nenhuma credencial externa ou arquivo de ambiente de produ??o foi copiado. A regra Nginx foi adicionada somente ao snippet de homologa??o, com backup e `nginx -t` aprovado. Os dados hist?ricos de ERP n?o representam atualiza??o em tempo real da produ??o. A fonte externa de arma??es permanece indispon?vel em homologa??o e usa o fallback publicado; a interface informa essa situa??o.

Gate Modelo A: 7/7. Service worker: atualiza??o 1.4.12 ? 1.4.13 sem limpeza manual (`service-worker.json`). Auditoria: 893 arquivos de produ??o sem diferen?as e 23 servi?os verificados; processos persistentes n?o foram alterados. Mudan?as de estado de jobs oneshot s?o registradas separadamente.

Arquivos e hashes: `manifest.json`, `arquivos-alterados.txt`; implanta??o e backup: `deploy-results.json`. Fontes ERP e subconjunto de dump s?o tempor?rios privados e n?o fazem parte do commit.

A trava de regress?o e a matriz final ampliada pertencem ? fase 7.
