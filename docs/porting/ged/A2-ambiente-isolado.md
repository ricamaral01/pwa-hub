# A2 — GED isolado na VPS nova

**Executado:** 15/10/2026. **Origem:** `31.97.241.84`; **destino:** `2.25.163.32`. **Estado:** ambiente isolado para aprovação G-A2/A3. O domínio público e o Nginx não foram alterados. O GED antigo continua a origem de escrita. Aplicam-se as [decisões de 15/10/2026](../decisoes-2026-10-15.md).

## Imagens e código

As três imagens **em execução** na origem foram transportadas por `docker save | gzip` e `gzip -d | docker load`. Não houve build nem atualização de dependência nesta etapa. Os IDs SHA-256 antes/depois são idênticos:

| Serviço/imagem | ID SHA-256 na origem e no destino |
|---|---|
| `ged_concrefer-frontend:latest` | `eea213db38b5c4a575aa03e5b746cdd937783deaea56b644de35978c4ec5dfbb` |
| `ged_concrefer-backend:latest` | `ed3385564b4fa4656562a87641dd41305901a9a66d0ce1ca8f01debe407e52ae` |
| `postgres:16-alpine` | `93d55776e04376e19adb2733e3ccebb4392ee7dd86d8ff238503b30fe719c84f` |

O código congelado da origem foi copiado para `/opt/ged_concrefer` no destino, excluindo `.env`, credenciais, uploads, backups, `node_modules`, `.next` e `.git`; os artefatos de dados foram restaurados separadamente da A1. Os lockfiles de produção foram incluídos: SHA-256 `frontend/package-lock.json` = `70ddcec0efc73521fcf06a463aaff980bec538ded8ff1b0ba5b6e24dcfcfda6e`; `backend/package-lock.json` = `2754512e2fadaffb996291a009e831294029d7b5e2cfde9de74300d1a8dd68e9`. Os hashes batem com a origem. As versões congeladas são Next 16.2.4, React 18.3.1, Express 4.22.1 e Node 20.20.2. Na A3, o primeiro build deve usar `npm ci`, esses lockfiles e `node:20-alpine` pelo digest atual; falha por versão interrompe o build.

## Comparação dos Compose da origem e revisão no destino

| Aspecto | `docker-compose.yml` antigo | `docker-compose.prod.yml` antigo | Compose único no destino |
|---|---|---|---|
| Restart | `unless-stopped` nos três | Sobrescreve com `always` nos três | `unless-stopped` nos três |
| Imagens | PostgreSQL por `image`; frontend/backend por `build` | Não altera | As três por `image`, carregadas por `docker load` |
| Banco | Volume nomeado; monta `migrations.sql` e `seed.sql` na inicialização | Não altera | Volume nomeado; **sem** scripts de inicialização; dump A1 restaurado |
| Portas | Frontend `127.0.0.1:3000`, backend `127.0.0.1:4000`; banco sem porta publicada | Mantém as portas | Frontend `127.0.0.1:13070`, backend `127.0.0.1:13071`; banco sem porta publicada |
| Ambiente frontend | URL pública como argumento de build | Define URL pública no contêiner | URL pública mantida no ambiente; imagem ainda contém build anterior, a adaptação `/unificado/ged/` é A3 |
| E-mail | Credenciais da origem e alerta de prazo na inicialização/24 h | Não altera | SMTP isolado em localhost sem credenciais e alerta desabilitado por overlay somente desta etapa |

O [Compose revisado](../../../infra/ged/docker-compose.yml) foi validado com `docker compose config --quiet` e instalado em `/opt/ged_concrefer/docker-compose.yml` (SHA-256 `d791629105ffd3dd1193c0c40209086a51c3982b204c1485cd0ab8992e4b5adc`). Como as imagens não foram reconstruídas, o [overlay de inicialização](../../../infra/ged/server.a2-isolated.js) é montado somente no backend da A2: ele obedece `GED_DISABLE_EMAIL_ALERTS=1` e evita a chamada inicial e o timer de `checkExpiringDocuments`. SHA-256 do overlay `45c4e3f17ba42afbddf750260190e5549092df18ca01c6133bb39ad87f8462df`. Na A3 essa guarda deve entrar no código da imagem reconstruída antes de remover o bind mount. Os logs após início tiveram zero chamadas de `alertService` e zero referências a SMTP.

A cópia de `docker-compose.prod.yml` trazida com o código foi removida **somente no destino** após a comparação, deixando um único Compose operacional. Os arquivos originais permanecem na VPS antiga.

As portas `13070` e `13071` foram reconferidas livres no dia e, após subir, `ss -ltn` mostrou ambas **somente em 127.0.0.1**. O contêiner PostgreSQL expõe 5432 apenas na rede Docker. Nenhuma rota Nginx aponta para este ambiente nesta etapa. `.env` e `google-credentials.json` foram recuperados da cópia cifrada A1 diretamente no destino, com acesso root e modo 600; os valores de SMTP foram neutralizados no `.env` de destino. Nenhum segredo foi versionado.

## Restauração e ensaio local

- Dump A1 restaurado em volume novo, sem `seed.sql` ou `migrations.sql`; os 29 nomes de tabelas, 656 registros por tabela, view, enums, funções, triggers, extensões e sequências coincidem com a origem.
- Os **52 arquivos** do tar A1 foram extraídos com proprietário, permissões e datas preservados; o SHA-256 de cada um coincide com o manifesto. Incluem os 10 arquivos sem referência direta, sem descarte.
- `GET http://127.0.0.1:13071/health` → 200; `GET http://127.0.0.1:13070/` → 200. Uma consulta **autenticada e somente leitura** a `/api/documents/stats` no contêiner retornou HTTP 200 e total 32 (`APROVADO` 28, `EM_REVISAO` 4), igual à contagem restaurada.
- Download local de uma amostra de `calibrations/`, `em_revisao/`, `obsoletos/` e `vigentes/` pela API retornou conteúdo com SHA-256 igual ao manifesto. A segurança do caminho `/uploads` é tarefa A4, antes do corte.
- Os serviços `ged_postgres`, `ged_backend` e `ged_frontend` estão em execução. A resposta 200 da página inicial não equivale à navegação completa: a imagem Next ainda foi construída com a URL antiga da API. Prefixo, links e validação no navegador são A3/A5.

## Duas referências antigas com caminho ausente

As duas versões apontam para `vigentes/`, mas os arquivos de **mesmo nome** estão em `obsoletos/` no backup. As duas são revisões anteriores; `documents.current_version_id` aponta para outra versão. O status abaixo é o do documento, não um status próprio da linha `versions`.

| Código | Revisão da versão | Revisão atual do documento | Status do documento | Versão vigente? | Tamanho no banco e no arquivo homônimo | SHA-256 do homônimo em `obsoletos/` |
|---|---:|---:|---|---|---:|---|
| `IT-CQC-03` | 1 | 2 | `APROVADO` | Não | 408.064 bytes | `7238547560e4cca0340354025f85c88681644ffc3a5759740df5c6dfa0ab40be` |
| `IT-CQC-10` | 0 | 1 | `APROVADO` | Não | 630.272 bytes | `56ae3489d7c062f24f30f59b622174faa6eb1183f2e2e54a06998dae51e493db` |

Os dois arquivos são `application/msword` (`.doc`), então **não há cabeçalho PDF** para conferir revisão. Nome e tamanho correspondem; o hash acima identifica o arquivo no backup, mas não existe hash original da versão no banco para provar igualdade de conteúdo. **Nenhuma correção de caminho foi feita**, na origem ou no destino. Na A3, preparar script idempotente que só atualize o destino depois da confirmação de Ricardo **documento a documento**.

## Próximo gate

A2 entregou transporte sem build, Compose único, restauração, isolamento e ensaio local. A3 é o prefixo `/unificado/ged/`, o primeiro build controlado e a validação das rotas antigas. O complemento A1 exige, **antes da A6**, segunda proteção por senha da chave de backup, segunda cópia cifrada na VPS de destino com acesso só root e teste de restauração sem DPAPI; essa condição permanece aberta e não bloqueia A3–A5.
