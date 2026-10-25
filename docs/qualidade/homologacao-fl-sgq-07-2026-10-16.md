# FL-SGQ-07 e numeração RNC — homologação de 16/10/2026

Estado: **aprovado por Ricardo e publicado em produção em 16/10/2026, às 10h45 (São Paulo)**. Após a primeira amostra, o PDF eletrônico foi repaginado em estilo moderno, mantendo os dados do FL-SGQ-07.

- Homologação: `https://concrefer.concretrack.com.br:18446/unificado/qualidade/` na VPS nova, banco `qualidade_homolog_20261016`, serviço e arquivos isolados. Produção: mesmo backend, renderer e SPA publicados após aprovação.
- Backup anterior à migração: `/root/quality-flsgq07-test-20261016/qualidade-before.dump` e `files-before.tgz` na VPS nova.
- Migração `20261016_05` aplicada no teste: cadastros Local e Atividade, campos FL-SGQ-07, acompanhamento tabular da eficácia, vínculo de nova RNC após ação ineficaz, contador interno e sorteio de número público `RNC-AAAA-NNNNNN`.
- Três registros migrados renumerados no teste com evento imutável que guarda o número anterior: `NC-2026-0001` → `RNC-2026-881824`; `NC-2026-0002` → `RNC-2026-953732`; `NC-2026-0003` → `RNC-2026-543069`. Os números de produção serão sorteados pela própria migração, portanto diferentes.
- Smoke no teste: RNC EMBU `RNC-2026-885242` aberta e exportada em PDF; formulário inválido com descrição vazia retornou 422; outro fluxo percorreu triagem, contenção, análise, plano, acompanhamento e resultado ineficaz, criando a RNC vinculada `RNC-2026-238777` na mesma transação. O PDF desse fluxo contém a linha de acompanhamento e o número da RNC sucessora.
- Testes locais: 32 passaram. Build TypeScript/Vite passou. Gate de homologação após publicação dos arquivos finais: **7/7** (`flsgq07-homolog-final-20261016`). Capturas desktop 1440 px e celular 390 px sem rolagem horizontal.
- Hashes iguais entre os arquivos locais e os publicados no teste: API `96cdfd73071f…`, renderer PDF moderno `fd2a2307c1cc…`, regras `c5527ee1169f…`, modelos `4e5fd0d88888…`, migração `e54678f034f4…`, SPA JS `bbbd1e534b3b…`, CSS `a7a0d4694230…`.

## PDF repaginado

- O exemplo EMBU exportado da API isolada ocupa **duas páginas A4**, com seções numeradas, identificação em grade, textos sem truncamento, tabela de acompanhamento e rodapé com código/revisão/página. O formulário de referência permanece como base de conteúdo, sem reproduzir sua diagramação antiga.
- O fluxo de eficácia negativa também ocupou duas páginas; a segunda mostra a linha de acompanhamento, o resultado “Não” e a nova `RNC-2026-238777`.
- Teste de paginação sintética com 24 acompanhamentos e textos longos gerou páginas adicionais sem erro. O smoke da API passou. Na primeira execução do gate após a troca houve timeout ao abrir o login do Laboratório; a URL respondeu 200 em nova checagem e o gate completo repetido passou **7/7** (`flsgq07-pdf-modern-homolog-rerun-20261016`).

## Artefatos para aprovação

- [Referência FL-SGQ-07](modelos/FL-SGQ-07_RNC-Formulario_referencia.pdf)
- [RNC EMBU moderna exportada no teste](../../output/pdf/RNC-FL-SGQ-07_EMBU_moderno_aprovacao.pdf)
- [RNC com eficácia negativa e sucessora](../../output/pdf/RNC-FL-SGQ-07_eficacia_homolog.pdf)
- [Abertura desktop](capturas-fl-sgq-07-20261016/desktop-abertura.png) e [tratativa desktop](capturas-fl-sgq-07-20261016/desktop-tratativa.png)
- [Abertura celular](capturas-fl-sgq-07-20261016/celular-abertura.png) e [tratativa celular](capturas-fl-sgq-07-20261016/celular-tratativa.png)

## Publicação em produção

- Escopo: somente serviço, banco, anexos e SPA da Qualidade. Casca, Nginx geral, PCP, Mapa, Laboratório e GED não foram alterados.
- Gate pré **7/7**. Backup fresco do banco, anexos, serviço, migrações e SPA em `/root/quality-flsgq07-prod-20261016-approved/` na VPS nova. A primeira tentativa falhou antes da migração por executar Alembic a partir de `/root`; os arquivos foram restaurados imediatamente, a revisão permaneceu `20261015_04`, os hashes antigos foram conferidos e o gate após retorno passou **7/7**.
- Segunda tentativa: backup novo em `/root/quality-flsgq07-prod-20261016-retry2/` (`qualidade.dump` SHA-256 `83e9bfed…`; `quality-files.tgz` SHA-256 `1ceb9d26…`). Com o diretório de execução correto, a migration `20261016_05` passou; permissões foram concedidas somente às novas tabelas do banco Qualidade. API e SPA publicadas têm hashes iguais aos da homologação. Health da API retornou 200.
- As três RNCs migradas ficaram: `NC-2026-0001` → `RNC-2026-809223`; `NC-2026-0002` → `RNC-2026-921249`; `NC-2026-0003` → `RNC-2026-758738`. Cada uma tem `numero_anterior_texto` e evento `NUMERO_RENOMEADO`.
- Smoke de produção: `RNC-2026-882561` aberta, formulário atualizado, PDF exportado, triada e com contenção registrada; ao final, cancelada com motivo explícito para não permanecer como tarefa ativa. Lista, abertura, tratativa e PDF renderizaram no navegador como Ricardo. Gate pós-publicação **7/7**.
