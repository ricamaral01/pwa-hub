# Home do Unificado — cabeçalho compacto

## Origem e implementação

- Hero: `unificado/index.html`, bloco `.welcome.opening-hero` da Home `/unificado/`.
- CSS anterior: `unificado/shell/shell.css`, especialmente `.welcome`, `.opening-hero` e `.opening-update`.
- CSS novo, limitado ao hero: `unificado/shell/home-header-compact.css`.
- Personalização: `unificado/shell/home-header-compact.js`. Usa o nome de exibição da sessão Mapa/IAM; para contas PCP, o nome da sessão PCP. Na falta de nome, tenta o login/ID. Sem ambos, exibe `Bem-vindo.`. A data usa o fuso `America/Sao_Paulo`.
- A atualização continua no botão original `#platform-update` com a ação de `unificado/shell/shell.js`. Sem versão disponível, o botão não aparece no desktop/tablet.

## Antes e depois

Capturas do hero com HTML e CSS da Home publicada como base, Chrome headless em escala 1×, sessão de teste isolada e versão disponível simulada (`1.0.49`). Para o “antes”, os novos assets foram desativados na captura. APIs de dados e autenticação foram isoladas; a evidência mede o cabeçalho, não os cards.

| Janela | Antes | Depois | Altura do hero |
| --- | --- | --- | --- |
| 1920px | ![Antes em 1920px](home-cabecalho-compacto/antes-1920.png) | ![Depois em 1920px](home-cabecalho-compacto/depois-1920.png) | 262,05px → **72px** |
| 1366px | ![Antes em 1366px](home-cabecalho-compacto/antes-1366.png) | ![Depois em 1366px](home-cabecalho-compacto/depois-1366.png) | 262,05px → **72px** |
| 1024px | ![Antes em 1024px](home-cabecalho-compacto/antes-1024.png) | ![Depois em 1024px](home-cabecalho-compacto/depois-1024.png) | 246,05px → **72px** |

O bloco tem `margin-bottom:20px` até “Módulos”. No tablet, o trecho final do subtítulo fica oculto.

### Conta sem nome

[Captura do fallback em 1366px](home-cabecalho-compacto/depois-1366-fallback.png): a sessão sem `name`, com login/ID `francisco`, mostra **“Bem-vindo, francisco.”**. Com ambos vazios, o título é **“Bem-vindo.”**.

## Verificações

- HTML e CSS da Home de produção usados como base; nenhuma alteração nos cards, menu, rotas ou atualização do service worker.
- 1920px, 1366px e 1024px: altura medida de 72px.
- Abaixo de 768px, o hero anterior permanece visível e o novo bloco fica oculto.
- A pílula mostra a versão simulada quando disponível e desaparece quando o botão fica desabilitado.
- `node --check` no script e `git diff --check` passaram.

## Arquivos alterados

- `unificado/index.html`
- `unificado/shell/home-header-compact.css`
- `unificado/shell/home-header-compact.js`
- `docs/qualidade/home-cabecalho-compacto.md` e suas capturas em `docs/qualidade/home-cabecalho-compacto/`
