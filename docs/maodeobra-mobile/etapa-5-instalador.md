# Etapa 5 — instalador dedicado da Mão de Obra

**Ambiente:** homologação `https://concrefer.concretrack.com.br:18446/unificado/m/maodeobra/`. Produção não foi alterada.

## Entrega

- Entrada própria da Mão de Obra com tela “Instalar app”. No Android, o botão aparece quando o navegador emite `beforeinstallprompt`; no iPhone, aparecem as instruções **Compartilhar → Adicionar à Tela de Início**. Em modo standalone, o app abre direto no lançamento.
- Manifesto, service worker e identificador próprios, com escopo limitado a `/unificado/m/maodeobra/`. Ícones 192, 512, maskable 512 e apple-touch-icon 180. Metas iOS, `viewport-fit=cover` e rodapé com safe area.
- O service worker mantém somente HTML da casca, scripts, estilos e ícones em lista explícita. Requisições da API e respostas com dados não são interceptadas nem armazenadas. O cache `maodeobra-shell-*` é separado do cache do Unificado.
- A tela funcional usa os mesmos `maodeobra-core.js`, `maodeobra-mobile.js`, `app.js`, endpoints e banco da etapa 3. O login é o do Unificado, apresentado em uma página dentro do escopo do app para não sair da janela instalada no iPhone. Após o login, retorna a `?launch=1`. A rota mobile existente oferece o link **Instalar no celular**.

## Arquivos

| Arquivo | Mudança |
| --- | --- |
| `unificado/m/maodeobra/index.html`, `entry.js`, `entry.css` | Entrada e instalador |
| `unificado/m/maodeobra/login.html` | Visual e autenticação do Unificado dentro do escopo instalado |
| `unificado/m/maodeobra/manifest.webmanifest`, `sw.js`, `icons/*.png` | PWA dedicado |
| `unificado/shell/auth.js` | Aceita somente o retorno `m/maodeobra/?launch=1` para conta com PCP |
| `unificado/pcp/static/js/maodeobra-mobile.js`, `static/css/maodeobra-mobile.css`, `maodeobra/index.html` | Link de instalação na vista mobile e versão dos ativos |
| `scripts/generate_maodeobra_pwa_icons.py` | Fonte reprodutível dos ícones |
| `tests/pcp/maodeobra_installer_homolog.py` | Smoke de login, abertura, recarga, manifesto e cache |

No servidor de teste, o HTML de `pcp/maodeobra/` manteve o preâmbulo de isolamento já publicado; apenas as versões do JS e CSS mobile foram atualizadas. O vhost de teste recebeu dois `location` exatos para servir o manifesto como `application/manifest+json` e o service worker com `no-store`. `nginx -t` passou antes do reload. Backup: `/root/backups/20261017-maodeobra-installer-before.tgz` e `/root/backups/20261017-maodeobra-installer-nginx-before.conf`.

## Testes executados

| Verificação no `:18446` | Resultado |
| --- | --- |
| Sintaxe de `entry.js`, `sw.js`, `maodeobra-mobile.js` e `auth.js` | Passou |
| Android Chromium emulado: instalador → login → tela funcional → reload | Passou |
| Evento `beforeinstallprompt` simulado: botão Instalar aparece | Passou |
| iPhone WebKit emulado: instruções iOS → login no escopo do app → tela funcional → reload | Passou |
| Manifesto com ID/escopo próprios e resposta `application/manifest+json` | Passou |
| Cache do service worker sem URL de API ou token | Passou |
| Rota atual em largura de celular: link “Instalar no celular” | Passou |
| Instalação real, ícone separado, login e lançamento após abrir pelo ícone | **Pendente nos aparelhos reais** |

### Capturas do teste

- [Android — instalar](capturas-instalador-teste/android-instalar.png)
- [Android — lançamento aberto](capturas-instalador-teste/android-aberto.png)
- [iPhone — instalar](capturas-instalador-teste/iphone-instalar.png)
- [iPhone — lançamento aberto](capturas-instalador-teste/iphone-aberto.png)

## Validação nos aparelhos reais

Instalar do zero no Android e no iPhone a partir da entrada acima. Confirmar que o ícone **Mão de Obra** aparece separado do Unificado, abrir por ele, entrar com o login do Unificado dentro do app, lançar e confirmar um grupo de teste, fechar completamente e reabrir pelo ícone. Enviar captura ou vídeo curto de cada aparelho e informar qualquer erro. Esta etapa fica aguardando essa evidência antes da aprovação; nenhuma publicação em produção foi feita.
