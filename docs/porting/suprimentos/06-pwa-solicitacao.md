# E5 — PWA Solicitação

**Data:** 25/10/2026. **Branch:** `feat/suprimentos-s0-s1`. **Ambiente alterado:** somente árvore local.

## Entrega

- PWA independente em `unificado/suprimentos/pwa/`, com `manifest.webmanifest` de `id`, `start_url` e `scope` exclusivos, quatro ícones, visual standalone e cor `#0F766E`. O registro do service worker usa explicitamente o escopo `/unificado/suprimentos/pwa/`; o SW guarda somente os arquivos da shell. API e fotos permanecem fora do cache do SW.
- Instalador Android pelo evento `beforeinstallprompt`. A tela informa o caminho do Safari no iPhone: Compartilhar → Adicionar à Tela de Início.
- Início, Nova (itens e detalhes), Minhas, Acompanhar e Aprovar. A aba Aprovar aparece apenas para APROVADOR. Sem rede, decisões de aprovação ficam desabilitadas. A interface não apresenta saldo nem preço no fluxo do solicitante.
- Catálogo com busca e QR via `BarcodeDetector` quando suportado, com digitação como alternativa; atalho dos materiais mais pedidos no CC autorizado; item livre; urgência, data necessária e justificativa; até três fotos reduzidas a 1600 px, JPEG 80% e 2 MB.
- IndexedDB `suprimentos-pwa-<iam_user_id>-<unidade>` com catálogo e data de atualização, centros, medidas, solicitações, pendências e fila. A identidade mínima em `localStorage` permite abrir a fila durante uma reabertura offline; a API valida novamente identidade, papel, unidade e flag ao reconectar. A fila contém `client_uuid` e fotos Blob; só é removida após criação idempotente, fotos idempotentes e envio confirmado. A sessão expirada pausa a fila sem removê-la.
- Migration `0004_foto_idempotencia.py` adiciona UUID único por unidade/solicitação/foto. Repetições com os mesmos bytes retornam a mesma foto; reutilizar UUID com bytes diferentes retorna 409. O endpoint de materiais frequentes exige acesso ao CC da consulta.

## Verificação

| Verificação | Resultado |
|---|---|
| E1–E5, backend e Playwright | `21 passed` em 28,15 s |
| Repetir criação PWA 5 vezes | Um `sup_solicitacao`, coberto por teste PostgreSQL descartável |
| Repetir upload de foto 5 vezes, inclusive após envio | Um `sup_solicitacao_foto`; bytes diferentes 409 |
| Pixel e iPhone emulados, 390×844 | Offline → fechar → reabrir → sessão expirada → cinco falhas de transporte → reenvio → um registro; capturas em `capturas/e5/` |
| Aba Aprovar | Oculta para SOLICITANTE; visível para APROVADOR |
| Rolagem horizontal | Ausente em início e detalhes testados nos dois perfis móveis |
| Lighthouse 10 PWA local | Categoria PWA **1,00**; service worker, manifesto instalável, splash, tema e ícone maskable com pontuação 1. A CLI gerou JSON válido sem `runtimeError`; encerrou com EPERM ao limpar o perfil temporário do Chrome no Windows, após gravar o relatório. |

As capturas foram geradas por API simulada; as regras e a persistência foram verificadas separadamente no PostgreSQL descartável. A instalação em domínio HTTPS real será repetida na E7.

## Arquivos da etapa

`unificado/suprimentos/pwa/index.html`, `app.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icons/*`; `unificado/suprimentos/migrations/versions/0004_foto_idempotencia.py`; `unificado/suprimentos/service/suprimentos/api/solicitacoes.py`; `unificado/suprimentos/service/tests/test_e2.py`; `tests/suprimentos/test_e5_pwa.py`; capturas em `docs/porting/suprimentos/capturas/e5/`.
