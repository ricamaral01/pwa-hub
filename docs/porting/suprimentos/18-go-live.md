# F8 — Homologação final e pacote de entrada em produção

**Estado em 26/10/2026:** F8 concluída somente em `https://concrefer.concretrack.com.br:18446`. Versão final da casca, `APP_VERSION` e caches dos dois service workers: **1.0.94**. Banco isolado `suprimentos_homolog_20261025`, Alembic `sup_0012`. **Nenhum comando deste runbook foi executado em produção; nenhum push foi feito.**

## 1. Homologação final

S0, S1, S2, S3A, S3B e S5 estão ligadas em Campinas. S4 e `S3A_EMAIL` estão desligadas. A [consulta de flags](capturas/f8/flags.json) e o smoke **43/43** confirmaram o ambiente; a comparação das cinco contas com `e7-screen-access-final.json` ficou idêntica nas telas preexistentes após a publicação final. A API sem sessão respondeu 401. Não há dados reais nem contas de produção no banco de homologação.

No fechamento, identifiquei e corrigi dois defeitos de navegação/infraestrutura que não apareceram na matriz anterior:

1. O menu React Modelo A tinha as telas de Suprimentos, mas faltava **Indicadores** (S5). Adicionei o item na fonte `navConfig.ts`, recompilei `menu.js` e confirmei dois links para `suprimentos/analises/` na casca autenticada de Compras. O build passou em TypeScript e Vite.
2. O nginx da homologação limitava `/api/suprimentos/` a 3 MB, apesar de a NF aceitar 12 MB. Um corpo de 4 MB retornava 413. Na primeira correção, a API passou a 16 MB, mas o subrequest de `auth_request` ainda retornava 413 e o nginx expunha 500. A segunda correção fixou **16 MB na API e na location interna de autenticação**. Requisição anônima de 4 MB agora retorna 401; solicitações autenticadas de 4 e 12 MB com ID inexistente chegam à API e retornam 404. [Evidência](capturas/f8/limite-upload.json). Não houve escrita de negócio nesse ensaio.

Publicações finais em `backups/suprimentos-f8-final-20261026T041923Z` (1.0.91), `.../suprimentos-f8-menu-20261026T042105Z` (1.0.92), `.../suprimentos-f8-upload-20261026T042600Z` (1.0.93) e `.../suprimentos-f8-upload-auth-20261026T042630Z` (1.0.94), todas com dump, snapshot de permissões, `nginx -t` e smoke **43/43**. O retorno e a reinstalação da alteração do menu e da location de autenticação foram executados; a última reinstalação está em `.../suprimentos-f8-upload-auth-reinstall-20261026T042717Z`. Backups 0600/root, serviço ativo e nenhum arquivo do módulo com escrita de grupo/mundo.

## 2. Arquivos compartilhados: produção × branch

Li **somente** arquivos da VPS nova em produção, sem alterar a produção: `/opt/concrefer-unificado/mapa-api/app.py`, `screen_catalog.json` e `/opt/concrefer-unificado/public/unificado/shell/{shell.js,router.js,menu.config.js,modelo-a/menu.js}`. A fonte React do Modelo A foi comparada com a base Git anterior à E3, pois não reside na VPS. A comparação hunk a hunk está em [auditoria-trechos.csv](pacote-producao/auditoria-trechos.csv): **750 trechos** no total, sendo 22 de Suprimentos, 727 de outras frentes/rebuild e um misto, dividido no patch limpo. A branch local contém alterações de GED, Laboratório, Usinas, atualização da casca e diferenças de build que não fazem parte do Suprimentos. Copiar esses arquivos inteiros da branch para produção arrastaria tais frentes.

| Arquivo | Suprimentos | Outras frentes / rebuild | Misto separado |
|---|---:|---:|---:|
| `app.py` | 2 | 43 | 1 (resposta com GED e flags de Suprimentos) |
| `screen_catalog.json` | 1 | 3 | 0 |
| `shell.js` | 8 | 14 | 0 |
| `router.js` | 4 | 2 | 0 |
| `menu.config.js` | 3 | 10 | 0 |
| `modelo-a/menu.js` | 2 | 649 | 0 |
| `navConfig.ts` (fonte Git) | 2 | 6 | 0 |

A [série limpa](pacote-producao/patches/) contém apenas as alterações de Suprimentos:

1. [01-gateway-catalog.patch](pacote-producao/patches/01-gateway-catalog.patch): gateway de sessão, flags e dez telas do catálogo.
2. [02-shell-rotas.patch](pacote-producao/patches/02-shell-rotas.patch): menu, rota, bootstrap, visibilidade e cartão inicial.
3. [03-modelo-a-bundle.patch](pacote-producao/patches/03-modelo-a-bundle.patch): cor teal e grupo Suprimentos no **bundle atual de produção**, incluindo Indicadores.
4. [04-modelo-a-fonte.patch](pacote-producao/patches/04-modelo-a-fonte.patch): fonte React, aplicada à base Git anterior à E3. A fonte não reside na VPS; este patch é para manter o próximo build coerente com o bundle.

O gerador [build-f8-clean-patches.py](../../../unificado/suprimentos/deploy/build-f8-clean-patches.py) produziu os patches a partir da cópia de produção e executou `git apply --check`, `git apply`, comparação byte a byte do resultado, `py_compile` do gateway, parse do catálogo e `node --check` dos quatro arquivos JS. Resultado: `F8_PATCH_APPLY_OK 6 arquivos de produção e fonte Modelo A`. **Se qualquer arquivo de produção mudar antes da janela, obtenha nova cópia e regenere os patches; não force a aplicação.** A lista de outras frentes fica para decisão separada de Ricardo, sem entrar neste pacote.

## 3. Runbook de produção — preparado, não executado

**Janela sugerida:** 60–90 minutos fora do pico de solicitações. Operador de infraestrutura e responsável por Compras/Almoxarifado presentes; 30 minutos de observação após a abertura. As flags iniciam todas desligadas, portanto a publicação pode ser validada antes de mostrar o módulo.

1. **Pré-condições e backup.** Resolver os [itens de segurança da F7](17-revisao-final.md), inclusive o `.env.production` legado no HEAD e a rotação das credenciais pertinentes; revisar os três DSNs estáticos sinalizados na varredura. Confirmar valores/alçadas e responsáveis da seção 5 abaixo. Congelar os hashes dos seis arquivos de produção lidos nesta F8. Fazer dump PostgreSQL da autenticação/concessões do Mapa e backup compactado de `/opt/concrefer-unificado/mapa-api`, `/opt/concrefer-unificado/public/unificado`, `/etc/nginx/sites-enabled/concrefer.concretrack.com.br` e dos drop-ins systemd. Salvar hash e modos; diretório 0700, dumps 0600, root. Ensaio de restauração em banco novo antes da janela.
2. **Banco isolado.** Criar role e banco exclusivos do Suprimentos na VPS nova; gerar senhas e chave HMAC aleatórias fora do Git. Configurar em `/etc/concrefer-unificado/prod/suprimentos.env` o DSN, `SUPRIMENTOS_EXPECTED_DATABASE`, `SUPRIMENTOS_MIGRATION_DATABASE_URL`, `SUPRIMENTOS_UPLOAD_DIR` fora de `public`, `SUPRIMENTOS_PUBLIC_DIR` e a chave do gateway. Configurar o mesmo segredo e `SUPRIMENTOS_INTERNAL_URL=http://127.0.0.1:13067` em env/drop-in de `mapa-unificado-auth.service`. Modos 0600; diretório de anexos 0700 com dono do usuário de serviço. Rodar Alembic até `sup_0012`; criar somente Campinas e unidades de medida reais. **Não restaurar o banco da homologação:** ele contém DEMO.
3. **Arquivos e serviços novos.** Instalar o serviço FastAPI em `/opt/concrefer-unificado/suprimentos/service`, venv próprio e usuário `concrefer-suprimentos`; adaptar `suprimentos-homolog.service` para produção na porta local **13067**, `UMask=0077` e `ReadWritePaths` privado. Instalar timer de fechamento, timer de NF e worker com os mesmos limites e identidade; manter o provedor IA sem chave para digitação manual. Copiar apenas frontend/PWA do módulo, sem dados DEMO. Nenhuma tabela `tbl_est_*`, proxy `usinas_legacy_read.py` ou VPS antiga entra nesta implantação.
4. **Casca e gateway.** Aplicar os patches 01–03 **sobre nova cópia dos arquivos de produção**, na ordem, só depois de `git apply --check` e validação de sintaxe. Aplicar 04 à fonte correspondente no Git e reconstruir o Modelo A em uma árvore limpa para conferência; não substituir o bundle produtivo por um build da árvore misturada. Adicionar ao vhost ativo a location de autenticação, renovação, API e arquivos estáticos do Suprimentos, adaptadas de `suprimentos-homolog.nginx.conf`. Usar **`client_max_body_size 16M` em `/api/suprimentos/` e em `/unificado/suprimentos-auth`**, proxy de autenticação em 127.0.0.1:13052 e API em 127.0.0.1:13067. Conferir os `error_page` e named locations existentes no vhost ativo. `nginx -t` antes de reload. Reiniciar `mapa-unificado-auth.service` só depois de configurar a chave compartilhada. Manter donos root/www-data e arquivos 0644/0755; nenhum 777/666.
5. **Versão e flags.** Definir um único número novo para `VERSION`, `APP_VERSION`, cache do `sw.js` da casca, SW do PWA e referências dos HTMLs. Com **todas as flags desligadas**, testar health interna, menu oculto, login e telas dos módulos atuais. Carregar os CSVs da seção 4, conferir contagens e inventário físico. Ativar Campinas por ordem S0 → S1 → S2 → S3A → S3B → S5, com smoke e papéis reais após cada passo. Deixar **S4 e `S3A_EMAIL` desligadas**; push e NF por IA também desligados até suas integrações serem configuradas. Conceder acesso por caixas de tela aos usuários definidos, preservando os acessos anteriores; ADMIN não ganha alçada de aprovação sem APROVADOR do nível correspondente.
6. **Smoke e observação.** Repetir os 43 checks autenticados com contas de produção de teste controladas, sem enviar e-mail nem criar pedido real irreversível; verificar sessão/PWA, 401/403, unidades/CC, anexos privados, upload de 4 e 12 MB com caso controlado, gráficos S5 e menu Modelo A. Medir 5xx, latência das listas/indicadores, fila NF, logs do serviço e nginx por 30 minutos. Comparar snapshot de acessos dos cinco perfis com o backup. Treinar gestores com o manual antes de abrir a usuários finais.
7. **Retorno.** Se qualquer gate falhar, desligar S0–S5 imediatamente, parar serviço/timers novos, restaurar arquivos, catálogo, vhost, drop-ins e permissões a partir do backup da janela, `nginx -t` e reload, reiniciar Mapa, confirmar versão e smoke dos módulos existentes. Preservar o banco Suprimentos e anexos para investigação; **não executar downgrade em banco com dados reais**. Se já houver escrita real, reconciliar os registros antes de nova tentativa. Registrar hora, operador, hashes e resultado.

## 4. Modelos de carga inicial

Os sete [CSV de Campinas](pacote-producao/cargas/) têm cabeçalhos válidos, delimitador `;` e **zero linhas de negócio**: são modelos para preencher, não dados fictícios para importar. O validador [validate-f8-cargas.py](../../../unificado/suprimentos/deploy/validate-f8-cargas.py) passou `F8_CSV_TEMPLATE_OK`; enquanto informar `pronto_para_carga False`, não há carga a executar. Após preencher cópias, executar `python unificado/suprimentos/deploy/validate-f8-cargas.py <pasta>` e conferir IDs/referências no banco antes de gravar. Ordem: centros de custo → materiais e parâmetros por unidade → fornecedores → colaboradores → papéis → alçadas → parâmetros gerais. `un_estoque_sigla` deve corresponder a unidade de medida cadastrada; `cc_codigo` vazio em papéis significa todos os CCs da unidade (D7), e em alçadas significa regra geral. `categorias` de fornecedores usa `|` entre códigos. Booleanos usam `true/false`, números sem separador de milhar. Não carregar `INSUMO_USINA` pelo Suprimentos antes de S4.

## 5. Checklist de liberação para Ricardo e gestores

| Item | Estado para a entrada em produção |
|---|---|
| Alçadas e aprovadores N1/N2 por CC/categoria; limites de pedido e inventário | `a_confirmar`; preencher CSV e cadastro com nome/login do responsável por nível. |
| Responsáveis de Campinas | Definir solicitantes, comprador, almoxarife, Qualidade e Admin. Validar IAM e centros de custo de cada um. |
| Parâmetros | Confirmar 48 h de fechamento, três cotações acima de R$ 1.000, 10% de tolerância da OC, inventário R$ 200/2%, validade de homologação, IQF, lead time e tratamento fiscal ICMS/IPI com contabilidade. Valores de ensaio não são aprovação de negócio. |
| Estoque de abertura | Fazer contagem física assinada por responsável e segundo conferente; carregar materiais/endereço, lotes e custos, reconciliar saldo antes de S2. |
| Treinamento | Usar [manual HTML](manual/manual-suprimentos.html), [PDF](manual/manual-suprimentos.pdf) e [fluxograma](manual/fluxo-pedidos-simplificado.svg); registrar presença dos gestores. |
| Celular real | Instalar e testar PWA em iPhone Safari físico e Android, foto, offline, reenvio e renovação de sessão. |
| Integrações desligadas | S4 aguarda contrato/migração do Laboratório; NC automática, e-mail, push e provedor de NF por IA aguardam chaves/serviços e testes próprios. |
| DEMO | Após a liberação e sem copiar o banco da homologação, executar a limpeza **somente na homologação** com `cleanup-f6-demo-homolog.py` após novo backup; remover contas `e2e-*` e concessões de teste. Não executar essa limpeza antes da conferência final. |
| Segurança do repositório | Resolver `.env.production` legado rastreado e revisar os DSNs estáticos da F7 antes de qualquer deploy integral da branch. |

## 6. Entrega para teste

- [Casca do Suprimentos](https://concrefer.concretrack.com.br:18446/unificado/?module=suprimentos)
- [Painel](https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos%2Fpainel%2F)
- [Solicitações](https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos%2Fsolicitacoes%2F)
- [Compras e pedidos](https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos%2Fcotacoes%2F)
- [Almoxarifado](https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos%2Falmoxarifado%2F)
- [Recebimento](https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos%2Frecebimento%2F)
- [Indicadores](https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos%2Fanalises%2F)
- [PWA próprio](https://concrefer.concretrack.com.br:18446/unificado/suprimentos/pwa/)

**Usuários de teste por papel:** `e2e-suprimentos-sol` (Solicitante), `e2e-suprimentos-aprov1` (Aprovador N1), `e2e-suprimentos-aprov2` (N2), `e2e-suprimentos-almox` (Almoxarife), `e2e-suprimentos-compras` (Comprador), `e2e-suprimentos-qualidade` (Qualidade) e `ricardo.teste` (Admin sem aprovação automática). As credenciais estão no arquivo protegido entregue na E7, fora deste repositório; nenhuma senha é publicada neste documento.

**Roteiro PC/tablet/celular:** entrar pela casca; abrir solicitação livre e catalogada; conferir CC permitido, preço e status; aprovar N1/N2 com as contas correspondentes; cotar com três fornecedores; emitir pedido de teste; receber NF/inspecionar; registrar entrada, reserva, entrega/EPI e divergência de inventário; comparar KPIs em Indicadores. No tablet, testar trilho e painel recolhível; no celular, menu superior/inferior e instalação do PWA, inclusive fila offline. Repetir com papel sem permissão para confirmar 403 e ausência das telas. Dados DEMO existentes em homologação cobrem esses estados e podem ser consultados sem repetir escritas.
