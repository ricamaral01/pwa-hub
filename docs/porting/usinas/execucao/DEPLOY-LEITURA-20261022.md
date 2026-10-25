# Implantação oficial de Usinas — receitas Campinas somente leitura

## Correção de leitura em 23/10/2026

A tela oficial passou a sinalizar atraso quando não há confirmação de sincronização ou quando as contagens de origem e espelho divergem. O menu passou a chamar a tela de “Cartas de traço”. Os arquivos anteriores foram preservados na VPS nova como `index.html.bak-sync-aviso-20261023` e `menu.config.js.bak-usinas-label-20261023`. Os hashes SHA-256 dos arquivos publicados coincidiram com os locais após a cópia; o menu público retornou HTTP 200 com o novo rótulo, a API sem sessão retornou 401 e os serviços `mapa-unificado-auth.service` e `concrefer-usinas-prod.service` estavam ativos. Os dez testes Python e o teste visual sintético passaram localmente. O catálogo de telas foi atualizado no código local; sua mudança de rótulo ainda não foi publicada, pois depende de reinício da API.

Na conferência pontual, a origem e o espelho continham 267 receitas cada, e `usinas.sync_status` registrava 29 segundos desde o último sucesso, sem erro. Esses valores são instantâneos e não substituem monitoramento contínuo. A ampliação para outras tabelas não foi realizada: o papel `usinas_mirror_ro` tem `SELECT` em `tbl_receitas`, mas não em `tbl_massadas`, `tbl_produtos`, `tbl_agregados` ou `tbl_est_movimentos`.

**Carta de traço, ainda em 23/10/2026:** a tela de leitura passou a usar os dez rótulos e unidades da composição do detalhe legado de Campinas, incluindo Cimento, Filler, agregados, aditivos e água. A relação água/cimento segue o cálculo do detalhe legado (`agua / (cimento2 ?? cimento)` quando os valores são positivos). Os quatro valores de resistência são identificados como **cadastrados na receita**; a média dos ensaios exibida pelo endpoint legado não foi portada. Um teste visual sintético conferiu tela e prévia de impressão; não houve teste com sessão real. O arquivo anterior foi salvo como `index.html.bak-carta-20261023`. O SHA-256 do HTML publicado é `ea0eb3e699f2652a8f65127617a37cd4f5d676dc9e9f6390d2e0182321aeee1e`, igual ao local. Após a cópia, os serviços continuaram ativos, a tela sem sessão retornou 403 e os dez testes Python passaram. Nenhum componente da VPS antiga foi alterado.

**Navegação de revisões, 23/10/2026:** cada revisão do mesmo grupo pode ser aberta diretamente no detalhe, com indicação da revisão selecionada. O teste visual sintético percorreu a revisão 2 → 1 → 2 e confirmou ID, número e status. O HTML anterior ficou em `index.html.bak-revisoes-20261023`; o SHA-256 da versão publicada é `88da024eb48dbd23508382f8869a2a3fc137d68a2299f54bdcafafaaf8c9ec8e`.

**Código e catálogo, 23/10/2026:** o recorte de leitura foi enviado à branch `feat/sistema-unificado` no commit `f66f858a`, com alterações seletivas de Usinas; o arquivo HTML publicado e o módulo `usinas_receitas.py` têm hashes iguais aos arquivos locais do commit. O catálogo de telas da VPS nova recebeu somente a troca do rótulo `usinasInicio` para “Cartas de traço”, com backup `screen_catalog.json.bak-usinas-label-20261023` e reinício de `mapa-unificado-auth.service`. O shell retornou 200, a API sem sessão 401 e os dois serviços ficaram ativos. A última consulta pontual do espelho retornou 270/270 sem erro.

**Outras instâncias:** a verificação somente leitura em `supervisorio_db_pede` confirmou que o papel de espelhamento atual não tem `SELECT` em `tbl_receitas`, `tbl_massadas`, `tbl_produtos` nem `tbl_agregados` de Pederneiras. Nenhum privilégio foi alterado. Noroeste requer confirmação de fonte e semântica por unidade; nenhuma das duas instâncias foi ativada.

Data da decisão: 22/10/2026 (America/Sao_Paulo). O proprietário autorizou publicar **apenas leitura** no Unificado; a API e o banco antigos permanecem intactos. Esta implantação cobre `tbl_receitas` de Campinas, e não equivale à migração funcional completa das Usinas.

## Endereço e componentes

- URL oficial existente: `https://concrefer.concretrack.com.br/unificado/?view=usinas/`.
- `https://concretrack.com.br/unificado/` e `https://www.concretrack.com.br/unificado/` redirecionam (HTTP 302) para o mesmo Unificado em `concrefer.concretrack.com.br`, sem mudança de DNS. O acesso direto com `?view=usinas/` preserva a consulta no redirecionamento.
- Origem oficial: `supervisorio_db.public.tbl_receitas` na VPS antiga. API, CLP, tabela, código e rotas originais sem alteração.
- Destino: `mapa_unificado_teste.usinas.receitas` na VPS nova, espelho com 42 colunas de origem, ID, unidade, hash e instante de ingestão. O nome do banco contém “teste”, mas é o banco usado pelo serviço oficial `mapa-unificado-auth.service`, confirmado pelo processo ativo.
- Leitura da aplicação: `mapa_api_login` com `SELECT` em `usinas.receitas`/`usinas.sync_status`, sem INSERT/UPDATE/DELETE. Só `usinas-sync` atualiza o espelho.
- Sincronizador: `concrefer-usinas-prod.service`, ciclo de 60 segundos, transação de origem somente leitura via TLS, destino conferido pelo nome exato. O papel da origem ainda herda `CREATE` no esquema `public` por um grant global preexistente, conforme o [README](../../../../unificado/usinas/README.md). Nenhum worker/outbox de escrita foi instalado na produção.
- API da tela: `GET /unificado/mapa/api/usina/receitas`; exige sessão e `usinasInicio`, informa `edicao_habilitada=false`.
- Interface: lista, busca, detalhe, histórico de revisões e impressão simples no shell do Unificado. Não há ações de cadastro, nova revisão ou ativação.

## Verificações executadas

| Gate | Resultado |
|---|---|
| Migração `003_receitas_producao_leitura.sql` | COMMIT em `mapa_unificado_teste`; schemas/tabelas apenas na VPS nova |
| Carga inicial | 265 linhas na origem, 265 no espelho |
| Fidelidade | `verify_real_mirror.py`: 0 IDs faltantes, 0 extras, 0 divergências de colunas/hash |
| API com papel oficial | teste local da rota com `mapa_api_login`: HTTP 200, 265 linhas, `edicao_habilitada=false` |
| Permissões | `mapa_api_login`: SELECT sim, INSERT/UPDATE/DELETE não; `usinas-sync`: DML somente nas tabelas do espelho |
| Serviços | `concrefer-usinas-prod.service` e `mapa-unificado-auth.service` ativos; três ciclos consecutivos registrados, sem erro |
| Site público sem sessão | shell HTTP 200; `/unificado/usinas/` HTTP 403; API HTTP 401 |
| Código local | 10 testes unitários OK; `visual_mock.cjs` OK com dados fictícios; `node --check` e `py_compile` OK |
| Origem antiga | hashes de `api/routers/tracos.py` e `api/main.py` iguais aos documentados; nenhuma gravação de teste |

O teste visual com sessão **real autorizada** no endereço oficial permanece pendente. O teste com identidade injetada foi apenas local ao processo para verificar query, papel e resposta, sem criar sessão de usuário ou expor receitas.

## Backup e reversão

- Alias no domínio raiz: `/etc/nginx/sites-available/concretrack-public` na VPS antiga; backup `/etc/nginx/sites-available/concretrack-public.bak-unificado-20261022`. Para retirar só o alias, restaurar esse arquivo, executar `nginx -t` e recarregar o Nginx. As rotas `/concretrack/` e `/` seguem no mesmo host.
- HTML anterior: `/opt/concrefer-unificado/public/unificado/usinas/index.html.bak-usinas-read-20261022`.
- API anterior: `/opt/concrefer-unificado/mapa-api/app.py.bak-usinas-read-20261022`.
- Para retirar a tela/rota: parar e desabilitar `concrefer-usinas-prod.service`, restaurar esses dois arquivos, reiniciar `mapa-unificado-auth.service` e conferir `GET /unificado/` e o bloqueio de `/unificado/usinas/`. O módulo `usinas_receitas.py` pode ficar sem registro ou ser removido depois da reversão.
- Manter o esquema espelho para diagnóstico durante rollback; sua exclusão exige decisão própria. O banco/API/CLP da VPS antiga não precisam de rollback porque não foram alterados.

## Escopo ainda pendente

As demais tabelas, Pederneiras/Noroeste, massadas, estoque, CEC, relatórios, etiquetas, IAM por unidade e paridade de impressão não foram publicados por esta release. U07–U12 de **edição** seguem suspensos pela decisão de somente leitura. As pendências e decisões por fase estão em [fases/00-indice.md](fases/00-indice.md).

## Complemento: alias do domínio raiz

Em 22/10/2026, o proprietário autorizou configurar também `concretrack.com.br/unificado/` e recusou ampliar o acesso do papel `usinas_mirror_ro`: somente `tbl_receitas` de Campinas permanece no escopo. O domínio raiz resolve para `31.97.241.84`; o Unificado oficial resolve para `2.25.163.32`. Foi acrescentado um redirecionamento limitado a `/unificado` e `/unificado/` no Nginx da VPS antiga. Não houve alteração de API, banco, CLP, permissões ou código do Unificado.

Validação: `nginx -t` passou; `systemctl is-active nginx` retornou `active`. `curl -I` retornou HTTP 302 para `/unificado/`, `/unificado`, `?view=usinas/` e o host `www`; a URL profunda preservou a query. Seguindo o redirecionamento, a tela pública retornou HTTP 200 e `/unificado/usinas/` sem sessão retornou HTTP 403. A página inicial do domínio raiz permaneceu HTTP 200. O `nginx -t` registrou avisos preexistentes de conflito em `dautomacao.com` na porta 80.
