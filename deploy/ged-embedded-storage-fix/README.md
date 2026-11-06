# GED incorporado: sessão com armazenamento local cheio

Correção publicada em 2026-11-06 na imagem `ged-concrefer-frontend:embedded-memory-v1` do servidor de produção. A imagem anterior era `ged-concrefer-frontend:blink-v1`. O Compose anterior está em `/opt/concrefer-unificado/releases/20261106T-ged-storage-1/docker-compose.yml.before`.

## Causa

O endpoint `/unificado/ged/api/auth/unified-session` respondia 200 para Ricardo. Em seguida, o frontend tentava salvar o token no `localStorage`. Quando o armazenamento estava cheio, `setItem` lançava `QuotaExceededError`, capturado como se fosse recusa de autorização. Isso produzia o texto vermelho da imagem do usuário apesar do vínculo ativo. O problema foi reproduzido em navegador com sessão real de teste e armazenamento no limite.

## Alteração

Os arquivos `AuthContext.tsx` e `api.ts` guardam o token da sessão GED incorporada em memória e o usam nas chamadas de dados. Essa sessão é obtida novamente ao recarregar o iframe; ela não depende do espaço livre no `localStorage`. O login próprio do GED mantém o fluxo existente. `frontend-source.tar.gz` é o contexto completo usado na construção da imagem, SHA-256 `f8de61f6aa2c909ffee802701d11a3d5758b2ede5b675456ae04f82a73f00a46`.

## Verificação

`npm run build` concluiu com TypeScript válido. `test-local.cjs` abriu Calibrações com o armazenamento cheio e confirmou que as chamadas de dados receberam o token em memória. Após a publicação, `test-production.py` abriu Calibrações para Ricardo e Ilson sob a mesma condição. O smoke de Marcelo abriu as cinco rotas do GED e recarregou cada uma. O container ficou ativo e a rota de Calibrações respondeu HTTP 200.
