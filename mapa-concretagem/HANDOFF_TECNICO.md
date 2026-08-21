# Handoff tecnico - Mapa de Concretagem

Atualizado em: 2026-07-08

## 1. Visao geral

O `mapa-concretagem` e uma PWA estatica com uma API Node opcional para fotos de inspecao. A aplicacao roda principalmente no navegador, usando Supabase diretamente no frontend para gravar e consultar dados operacionais.

URL publicada atual:

- `https://usina.concretrack.com.br/mapa-concretagem/`

Fluxo principal da producao:

1. PCP/programacao: grava em `programacao_pcp` e deixa a forma amarela.
2. Liberacao da forma: grava em `liberacao_formas` e deixa a forma azul.
3. Concretagem: grava em `producao`, salva `tipo_concreto` e deixa a forma verde.
4. Relatorio Enc. Producao: le `producao` e cruza com `programacao_pcp` e `liberacao_formas` para mostrar horarios separados de PCP, Lib. e Concre.

## 2. Arquivos do projeto

| Arquivo | Funcao |
|---|---|
| `index.html` | Estrutura HTML da PWA. Contem telas/hubs, formularios, modais e tabelas. Carrega `supabase.js`, assets globais de auth, Chart.js, `styles.css` e `app.js`. |
| `app.js` | Principal arquivo da aplicacao. Contem estado global, catalogo de formas, regras de permissao, login, fluxos de programacao/liberacao/concretagem, relatorios, dashboards, montagem, inspecao, produtividade, realtime e service worker version badge. |
| `styles.css` | Estilos da PWA. Inclui layout, hub, telas operacionais, relatorios/PDF/print, dashboards, modo kiosk, modo liberacao, modo Odin e responsividade. |
| `sw.js` | Service worker. Cacheia arquivos estaticos da PWA. Versao atual: `mapa-concretagem-v4.61`. Ignora chamadas para `supabase.co` e `script.google.com`. |
| `manifest.json` | Manifest PWA: nome, icone, tema, scope e modo standalone. |
| `supabase.js` | Bundle local do `@supabase/supabase-js` usado pelo navegador. |
| `chart.min.js` | Chart.js local para dashboards/graficos. |
| `chartjs-plugin-datalabels.min.js` | Plugin local de labels dos graficos. |
| `server.js` | API Express opcional para upload/listagem/exclusao de fotos de inspecao em storage SFTP, com metadados no Supabase. |
| `package.json` | Dependencias da API Node (`express`, `multer`, `sharp`, `ssh2-sftp-client`, `@supabase/supabase-js`, etc.). Scripts: `npm start`, `npm run dev`. |
| `.env` | Variaveis locais da API Node. Contem credenciais sensiveis; nao compartilhar publicamente. |
| `documentacao_completa.html` | Documentacao HTML antiga/auxiliar. Nao parece ser fonte de verdade do estado atual do app. |
| `HANDOFF_TECNICO.md` | Este documento. |

## 3. Dependencias externas e scripts carregados

`index.html` carrega:

- `supabase.js` local.
- `/auth/config.js?v=2`, `/auth/client.js`, `/auth/guard.js?v=2`: camada externa de autenticacao/guarda do hub. Esses arquivos ficam fora da pasta `mapa-concretagem`.
- `chart.min.js` e `chartjs-plugin-datalabels.min.js` locais.
- `../assets/msgbox.css` e `../assets/msgbox.js` para dialogs/mensagens.
- `app.js?v=f8e12200`.

Dependencias Node da API opcional (`server.js`):

- `express`
- `multer`
- `sharp`
- `ssh2-sftp-client`
- `@supabase/supabase-js`
- `dotenv`
- `uuid`

## 4. Configuracoes e conexoes

### 4.1 Supabase frontend

Configurado diretamente em `app.js`:

- URL: `https://fbvvdyirhtgvycullsqy.supabase.co`
- Chave anon/publica: definida em `SUPABASE_CONFIG.KEY`

Observacao: a chave esta hardcoded no frontend. Isso e comum para anon key do Supabase, mas a seguranca real depende de RLS/policies no Supabase.

### 4.2 API PCP externa

Constante:

- `PCP_PROGRAMACAO_URL = "https://pcp.concretrack.com.br/api/programacao"`

Usos:

- Buscar programacao oficial do PCP por intervalo de datas.
- Resolver programacoes por produto/forma.
- Fallback para `https://usina.concretrack.com.br/api/programacao` em alguns fluxos do Setor 3.

### 4.3 API backend de fotos

`getBackendUrl()` em `app.js` escolhe:

- `http://localhost:5000/api` quando esta em localhost.
- `http://2.25.163.32:5000/api` em producao.

Endpoints usados no app:

- `GET /api/inspecoes/:poste_id/fotos`
- `DELETE /api/fotos/:id?usuario=...`

Endpoint implementado no backend tambem:

- `POST /api/inspecoes/:poste_id/fotos`

### 4.4 WhatsApp/PDF

Relatorio Enc. Producao:

- Carrega `html2pdf` via CDN: `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`
- Usa Web Share API quando possivel.
- Fallback abre `https://api.whatsapp.com/send?text=...`.

### 4.5 Google Maps

Montagem/inspecao pode montar URL:

- `https://www.google.com/maps/search/?api=1&query=lat,lng`

## 5. Banco de dados Supabase

### 5.1 Tabelas principais confirmadas

#### `programacao_pcp`

Usada para programacao PCP/manual. Afeta cor amarela.

Colunas observadas:

- `id`
- `data_fabricacao`
- `setor`
- `forma`
- `modelo`
- `codigo_poste`
- `descricao_poste`
- `codigo_produto`
- `quantidade`
- `data_hora`

Operacoes:

- `upsert` por `data_fabricacao,setor,forma` no fluxo de programacao.
- `delete` por `data_fabricacao,setor,forma` ao desprogramar/cancelar Odin.
- `select` para carregar amarelo no mapa e para relatorio.

#### `liberacao_formas`

Usada para liberacao da forma. Afeta cor azul.

Colunas observadas:

- `id`
- `data_fabricacao`
- `setor`
- `forma`
- `colaborador`
- `data_hora`

Operacoes:

- `upsert` por `data_fabricacao,setor,forma` quando libera a forma.
- `select` para carregar azul no mapa e horario de Lib. no relatorio.
- `delete` no modo Odin/cancelamento.

#### `producao`

Usada para concretagem final. Afeta cor verde e alimenta relatorios/dashboards.

Colunas observadas:

- `id`
- `data_hora`
- `setor`
- `forma`
- `modelo`
- `tipo_concreto`
- `colaborador`
- `data_fabricacao`
- `status`
- `codigo_poste`
- `descricao_poste`
- `codigo_produto`

Operacoes:

- `saveProducaoByNaturalKey(row)` atualiza por `data_fabricacao,setor,forma`, evita duplicidade e remove duplicados antigos.
- `select` em relatorios, dashboard, produtividade, historico, montagem e inspecao.
- `delete` no modo Odin/cancelamento.

Status relevantes:

- `LIBERADO`: no codigo atual representa concretagem confirmada.
- `INSPECIONADO`: usado para lotes/inspecao.

#### `vw_formas_status`

View unificada para combinar programacao, liberacao e producao.

Colunas observadas:

- `data_fabricacao`
- `setor`
- `forma`
- `prog_id`
- `prog_modelo`
- `prog_codigo_poste`
- `prog_descricao_poste`
- `prog_codigo_produto`
- `prog_quantidade`
- `lib_id`
- `lib_data_hora`
- `lib_colaborador`
- `prod_id`
- `prod_data_hora`
- `prod_modelo`
- `prod_codigo_poste`
- `prod_descricao_poste`
- `prod_codigo_produto`
- `prod_tipo_concreto`
- `prod_colaborador`

Observacao importante: a view nao expoe `prog_data_hora`; por isso o relatorio cruza diretamente `programacao_pcp` para obter o horario PCP.

#### `usuarios`

Usada pelo login/gestao de usuarios da aplicacao.

Colunas observadas:

- `id`
- `nome`
- `perfil`
- `senha`
- `ativo`
- `created_at`
- `updated_at`
- `setor`
- `primeiro_acesso`

Perfis no codigo:

- `ADMIN`
- `GESTOR_PRODUCAO`
- `ENCARREGADO`
- `MONTADOR`
- `QUALIDADE`
- `VISUALIZADOR`

Observacao: senha parece trafegar/ser comparada pelo app via Supabase. Recomenda-se revisar seguranca e hashing/policies se isso for producao sensivel.

#### `montagem_poste`

Usada para montagem/inspecao de postes.

Colunas observadas:

- `id`
- `record_id`
- `data_fabricacao`
- `setor`
- `forma_numero`
- `modelo`
- `status_montagem`
- `motivo_recusa`
- `etapa`
- `inicio_inspecao_montagem`
- `finalizado_em`
- `checklists`
- `banco`
- `observacoes_montagem`
- `montador_nome`
- `created_at`
- `updated_at`

### 5.2 Tabelas referenciadas mas nao encontradas na consulta atual

Estas aparecem no codigo, mas a consulta com a chave atual retornou erro de schema cache:

- `prog_s3_s4`
- `programacoes`
- `produtos`
- `fotos_inspecao`

Impacto:

- `prog_s3_s4`: fluxo de sequencia/programacao Setor 3/4 pode depender dela.
- `programacoes` e `produtos`: fallback/modelos PCP Setor 3 pode depender delas.
- `fotos_inspecao`: API `server.js` depende dela para metadados de fotos.

Recomendacao: validar no Supabase se essas tabelas existem em outro schema/projeto, se faltam migrations, ou se a anon key nao tem permissao.

## 6. Fluxos principais

### 6.1 Login e permissoes

Estado:

- `state.authUser`
- localStorage `pwa_mapa_auth_session_v1`

Funcoes:

- `authenticateUserInApi()`
- `loginWithRole()`
- `saveAuthSession()`
- `readAuthSession()`
- `applyRoleVisibility()`
- `isModeAllowed()`

Permissoes ficam em `ROLE_PERMISSIONS`.

Regra especial:

- Ricardo e Philippe sao detectados por nome (`includes("ricardo")` ou `includes("philippe")`).
- Para esses usuarios, `libColaborador`, `kioskLibColaborador` e `relEncarregado` sao preenchidos automaticamente com o nome do usuario e desabilitados.

### 6.2 Producao / mapa de formas

Telas:

- `viewLiberacao`
- Hubs `hubLiberacao`, `hubLiberacaoS1`, `hubLiberacaoS2`, `hubLiberacaoS3`, `hubLiberacaoS4`

Catalogos:

- Setor 1: `SETOR_1_LEFT_FORMS`, `SETOR_1_RIGHT_FORMS`
- Setor 2: `SETOR_2_LEFT_FORMS`, `SETOR_2_RIGHT_FORMS`
- Setor 3: `SETOR_3_LEFT_FORMS`, `SETOR_3_RIGHT_FORMS`
- Setor 4: `SETOR_4_COL1_FORMS`, `SETOR_4_COL2_FORMS`, `SETOR_4_COL3_FORMS`

Modos:

- Programacao: `state.programmingMode`
- Liberacao: `state.liberationMode`
- Odin/cancelamento: `state.odinMode`

Fluxo:

- `toggleFormaProgramada()` -> `programFormaInApiOrLocal()` -> `programacao_pcp`
- `liberarFormaClicada()` -> `postToApi("salvar_forma_click")` -> `liberacao_formas`
- `salvarFormaClicada()` -> `postToApi("salvar_forma_click")` -> `producao`
- `loadClickedFormsFromSupabase()` -> `vw_formas_status`, fallback direto nas tres tabelas

Cores:

- Amarelo: forma programada (`is-programmed`)
- Azul: forma liberada (`is-liberada`)
- Verde: concretada (`is-saved`)

### 6.3 Tipo de concreto

Constante:

- `CONCRETO_TIPOS = ["Concreto Padrão", "Concreto Seco - Vibrado", "Concreto Segregado", "Concreto Exsudado"]`

UI:

- Modal em `showConcreteTypePopup()`
- Salvo em `producao.tipo_concreto`

### 6.4 Relatorio Enc. Producao

Tela:

- `viewRelatorio`

Campos:

- `relData`
- `relSetor`
- `relEncarregado`

Funcoes:

- `gerarRelatorioSetor()`
- `renderRelatorioSetor()`
- `enviarRelatorioWhatsapp()`
- `imprimirRelatorioSetor()`

Origem dos dados:

- Base: `producao` com `status = "LIBERADO"`
- Horario PCP: `programacao_pcp.data_hora`
- Horario Lib.: `liberacao_formas.data_hora`
- Horario Concre.: `producao.data_hora`

Colunas atuais da tabela:

- Forma
- Tipo de poste
- Operador
- PCP
- Lib.
- Concre.
- Tipo de concreto

### 6.5 Inspecao

Telas:

- `viewInspecao`
- `viewInspecaoDetalhe`

Funcoes principais:

- `renderInspecaoLiberados()`
- `openInspecaoPosteDetalhe()`
- `renderInspecaoChecklistSections()`
- `finalizarInspecaoPosteAtual()`

Dados:

- Usa `producao`, `montagem_poste` e cache local.
- Checklists sao definidos em `getInspecaoChecklistSections(modelo)`.

### 6.6 Montagem de postes

Telas:

- `viewMontagemPostes`
- `viewMontagemPostesDetalhe`
- `viewMontagemIndicadores`

Funcoes:

- `renderMontagemPostesLiberados()`
- `openMontagemPosteDetalhe()`
- `finalizarMontagemPosteAtual()`
- `syncMontagemPosteToApi()`

Dados:

- Supabase `montagem_poste`
- Cache local `pwa_montagem_postes_v1`

### 6.7 Dashboard/produtividade

Telas:

- `viewProdAnalise`
- `viewDashboard`

Funcoes:

- `carregarProdutividadeConcretagem()`
- `calcularMetricasProdutividade()`
- `renderizarTabelaDadosConcretagem()`
- `renderDashboardConcretagem()`

Dados:

- `producao`
- `montagem_poste`
- local cache quando offline/falha

### 6.8 Acompanhamento de concretagem

Tela:

- `viewAcmpConcretagem`

Funcoes:

- `renderAcmpConcretagem()`
- `salvarAcmp()`
- `imprimirAcmp()`

Armazenamento local:

- `pwa_acmp_notas_v1`

## 7. LocalStorage/offline

Chaves usadas:

| Chave | Uso |
|---|---|
| `pwa_liberacao_inspecao_v1` | Banco local principal de registros/eventos. |
| `pwa_liberacao_submit_locks_v1` | Evita submits duplicados. |
| `pwa_formas_clicadas_hoje` | Estado rapido das formas clicadas no dia. |
| `pwa_montagem_postes_v1` | Cache local de montagem/inspecao. |
| `pwa_mapa_auth_session_v1` | Sessao de login do app. |
| `mapa_concretagem_programacao` | Programacoes locais do mapa. |
| `pwa_acmp_notas_v1` | Observacoes/tracos do acompanhamento de concretagem. |
| `pwa_prog_s3_s4_v1` | Cache local de programacao S3/S4. |
| `sidebarCollapsed` | Preferencia visual de sidebar. |

## 8. Service worker/PWA

Arquivo: `sw.js`

Versao atual:

- `mapa-concretagem-v4.61`

Arquivos cacheados:

- `./`
- `./index.html`
- `./styles.css`
- `./app.js`
- `./supabase.js`
- `./chart.min.js`
- `./chartjs-plugin-datalabels.min.js`
- `./manifest.json`
- `../assets/msgbox.css`
- `../assets/msgbox.js`
- `../assets/img/icon.png`

Estrategia:

- Install: abre cache e adiciona assets; chama `skipWaiting()`.
- Activate: apaga caches antigos e chama `clients.claim()`.
- Fetch:
  - Ignora `script.google.com` e `supabase.co`.
  - HTML/navegacao: network-first com fallback para cache.
  - Assets estaticos: cache-first.

Sempre que publicar mudanca, incrementar `CACHE_NAME`.

## 9. API Node opcional (`server.js`)

Objetivo:

- Gerenciar fotos de inspecao, salvando arquivo comprimido na VPS via SFTP e metadados no Supabase.

Variaveis de ambiente:

- `PORT`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SFTP_HOST`
- `SFTP_PORT`
- `SFTP_USER`
- `SFTP_PASSWORD`
- `STORAGE_BASE_PATH`
- `STORAGE_WEB_URL`

Importante: nao versionar credenciais reais. O `.env` local atual contem credenciais sensiveis; recomenda-se rotacionar se foi exposto.

Endpoints:

| Metodo | Rota | Uso |
|---|---|---|
| `POST` | `/api/inspecoes/:poste_id/fotos` | Upload de foto, compressao via Sharp, envio SFTP, insert em `fotos_inspecao`. |
| `GET` | `/api/inspecoes/:poste_id/fotos` | Lista fotos/metadados e monta URL publica. |
| `DELETE` | `/api/fotos/:id` | Exclui arquivo no SFTP e registro em `fotos_inspecao`. |

## 10. Pontos de atencao para o proximo dev

1. `app.js` concentra muitas responsabilidades. Recomenda-se modularizar por dominio: auth, producao, relatorios, montagem, inspecao, dashboards, storage/local.
2. Validar RLS/policies no Supabase, pois o frontend acessa tabelas diretamente com anon key.
3. Tabelas referenciadas e nao encontradas devem ser revisadas: `prog_s3_s4`, `programacoes`, `produtos`, `fotos_inspecao`.
4. `usuarios.senha` aparenta ser usado diretamente pelo app; revisar seguranca/hashing.
5. O nome `status = LIBERADO` na tabela `producao` representa concretagem final, o que pode confundir. Uma migracao futura poderia usar `CONCRETADO`.
6. O relatorio depende de cruzamento por chave natural `data_fabricacao + setor + forma`. Manter esse padrao consistente.
7. A view `vw_formas_status` nao tem `prog_data_hora`; se o banco puder ser alterado, incluir esse campo simplifica o relatorio.
8. O service worker pode manter versoes antigas no navegador; sempre incrementar `CACHE_NAME` e orientar usuarios a atualizar/reabrir o app.
9. Ha chamadas a APIs externas de PCP com possivel CORS/fallback; validar disponibilidade antes de mexer em Setor 3/4.
10. Credenciais no `.env` e no historico local devem ser tratadas como sensiveis.

## 11. Como rodar localmente

Frontend estatico:

1. Servir a pasta `mapa-concretagem` via servidor estatico ou abrir via ambiente do hub.
2. Para simular PWA/service worker, usar HTTP/HTTPS, nao `file://`.

API Node de fotos:

```bash
npm install
npm start
```

Desenvolvimento:

```bash
npm run dev
```

## 12. Publicacao

Repositorio:

- `https://github.com/ricamaral01/pwa-hub.git`

Branch:

- `main`

Deploy:

- A publicacao atual e servida em `https://usina.concretrack.com.br`.
- Na pratica, push em `main` propaga para o site estatico/GitHub Pages/CDN. Pode haver cache de alguns minutos.

Checklist de deploy:

1. Rodar `node --check app.js` e `node --check sw.js`.
2. Incrementar `CACHE_NAME` em `sw.js`.
3. Commitar mudancas.
4. `git push origin main`.
5. Confirmar no dominio:
   - `https://usina.concretrack.com.br/mapa-concretagem/sw.js`
   - `https://usina.concretrack.com.br/mapa-concretagem/app.js`

