# Mão de Obra — versão mobile (PWA)

**Estado:** proposta para aprovação. Nada nesta entrega altera a aplicação ou produção.
**Rota atual:** `https://concrefer.concretrack.com.br/unificado/?view=pcp%2Fmaodeobra%2F`

## 1. Objetivo

No celular, o gestor abre **Mão de Obra** e cai direto num lançamento diário com cara de aplicativo:
escolhe a data e o grupo (S1/S2 ou S3/S4), informa pessoas por atividade, confere MOD + MOI = Total e envia.
O computador continua com a tabela atual. Mesma conta, mesmas permissões, mesma API.

**Escopo: só a interface mobile muda.** A estrutura do desktop é mantida como está: mesmas atividades e
ordem, mesmos grupos (S1/S2, S3/S4), mesma classificação MOD/MOI, mesmas regras, mesma API e mesmo banco.
O que muda é a apresentação no celular e a existência de um instalador próprio para esta página.
**Não há banco novo nem segunda lógica de cálculo.**

### Classificação confirmada

| Grupo | MOD | MOI |
|-------|-----|-----|
| S1/S2 | Produção Setor 1 e 2 | Usina de Concreto, Fab Armação Padrão, Fab Estribo, Encarregado Produção, Sacador núcleo, Desbobinadeira |
| S3/S4 | Produção Setor 3, Produção Setor 4 | Usina de Concreto, **Fab Armação setor 3**, **Fab Armação setor 4**, Fab Estribo, Encarregado Produção, Sacador núcleo, Desbobinadeira |

Fab Armação entra como **MOI** nos dois grupos. A lista vem do cadastro atual; a tela mobile não fixa atividades no código.

## 2. Telas (ver mockups)

| # | Tela | O que mostra |
|---|------|--------------|
| 0 | **Instalar app** | Ícone e nome próprios ("Mão de Obra"), botão **Instalar** no Android e passo a passo no iPhone; opção de continuar no navegador. |
| 1 | **Lançamento** | Data (padrão hoje, fuso São Paulo), seletor S1/S2 · S3/S4, selo de situação do dia, cartões por atividade com botões − / + (passo 0,5) e campo decimal. Seções MOD e MOI com subtotal. Rodapé fixo com Total e botão **Conferir e enviar**. |
| 2 | **Conferência** | Folha inferior com data, grupo, MOD + MOI = Total e lista do que foi alterado. Aviso de substituição quando o dia já estava lançado. Botões **Voltar e corrigir** / **Enviar**. |
| 3 | **Enviado** | Confirmação somente após resposta da API, com hora. Atalhos: **Lançar outro grupo** (já sugere o grupo pendente) e **Ver histórico**. |
| 4 | **Erro de envio** | Números preservados, faixa "Não enviado. Verifique a conexão e tente novamente." e botão **Tentar de novo**. Nunca mostra sucesso sem o servidor. |
| 5 | **Sem produção** | Confirmação explícita de data e grupo antes de gravar o dia como sem produção. |
| 6 | **Histórico** | Cartões compactos por dia com S1/S2 e S3/S4 (lançado, pendente, sem produção) e total. Tocar abre o dia para editar. |

### Estados do dia (sempre perto da data)

- ⚪ **Não lançado** — nunca enviado
- 🟢 **Lançado** — com hora; botão vira "Editar e reenviar"
- ⚫ **Sem produção** — gravado pela ação específica
- 🔴 **Não enviado** — erro local, digitação preservada

### Regras de interação

- Alvo de toque ≥ 44 px, teclado `inputmode="decimal"`, aceita vírgula, passo 0,5, sem valores negativos.
- Responsável e fator (ex.: *Elias · fator 0,5*) aparecem como informação auxiliar; **não** multiplicam o total.
- Rodapé não cobre o campo em edição quando o teclado abre.
- Duplo toque em Enviar não dispara duas requisições (botão bloqueado até a resposta).
- Rascunho local por **data + grupo**, apagado após envio com sucesso; nunca enviado automaticamente.
- Sem rolagem horizontal entre 360 e 430 px.

## 3. Instalador dedicado (PWA próprio da Mão de Obra)

A página ganha **um app instalável só dela**, separado do PWA do Unificado: ícone, nome e janela próprios,
abrindo direto no lançamento. Para isso ela precisa de um caminho e um manifesto próprios, porque um
atalho dentro do manifesto do Unificado não gera um ícone independente (no iPhone, nem aparece).

1. **Entrada dedicada:** `/unificado/m/maodeobra/` — página fina que carrega a mesma vista mobile e os
   mesmos scripts de Mão de Obra (sem duplicar lógica), já autenticada pela sessão do Unificado.
2. **Manifesto próprio:** `/unificado/m/maodeobra/manifest.webmanifest` com
   `id: "/unificado/m/maodeobra/"`, `name: "Mão de Obra — Concrefer"`, `short_name: "Mão de Obra"`,
   `start_url` e `scope` em `/unificado/m/maodeobra/`, `display: "standalone"`, `theme_color: #0F2C4C`,
   ícones 192/512 e versão *maskable*. Na página: `apple-touch-icon` e `apple-mobile-web-app-title`.
3. **Service worker próprio** com escopo `/unificado/m/maodeobra/`: guarda só a casca e os estáticos.
   **API, token e dados de pessoal não vão para o cache.** Não interfere no `sw.js` do Unificado.
4. **Tela "Instalar app"** (mockup 0): no Android, botão **Instalar** via `beforeinstallprompt`; no iPhone,
   passo a passo do "Adicionar à Tela de Início". Some quando o app já está instalado
   (`display-mode: standalone`). Também acessível por um link "Instalar no celular" na versão atual.
5. **Rota atual continua valendo:** `/unificado/?view=pcp%2Fmaodeobra%2F` no celular mostra a mesma vista
   mobile e oferece o instalador; no desktop/tablet segue a tabela atual.
6. Sessão expirada → login do Unificado → volta para `/unificado/m/maodeobra/`.
7. Testar instalação, ícone e abertura no Android (Chrome) e iPhone (Safari), inclusive com o PWA do
   Unificado já instalado no mesmo aparelho.

### Compatibilidade Android × iPhone (obrigatório nos dois)

| Ponto | Android | iPhone |
|-------|---------|--------|
| Como instala | Botão **Instalar** na própria tela (`beforeinstallprompt`) no Chrome, Edge e Samsung Internet. | Não há botão programático. A tela mostra o passo a passo: **Compartilhar → Adicionar à Tela de Início** (Safari; no iOS 16.4+ também pelo Chrome). |
| Detectar o sistema | Mostrar o botão só quando o evento `beforeinstallprompt` chegar. | Detectar iOS e mostrar as instruções no lugar do botão. |
| Ícone e nome | `icons` 192/512 + `maskable` no manifesto. | `<link rel="apple-touch-icon" sizes="180x180">` e `<meta name="apple-mobile-web-app-title" content="Mão de Obra">`; o iPhone ignora os ícones do manifesto. |
| Janela de app | `display: "standalone"` no manifesto. | Também `<meta name="apple-mobile-web-app-capable" content="yes">` e `apple-mobile-web-app-status-bar-style`. |
| Login / sessão | O app instalado compartilha a sessão do Chrome. | **O app instalado tem armazenamento e cookies separados do Safari**: o gestor faz login uma vez dentro do app. O login precisa funcionar em modo standalone e a sessão deve durar o suficiente para não pedir senha todo dia. |
| Rodapé fixo | Respeitar a barra de navegação. | `viewport-fit=cover` e `padding-bottom: env(safe-area-inset-bottom)` para o botão Enviar não ficar sob a barra do iPhone. |
| Teclado numérico | `inputmode="decimal"`. | Idem; o teclado em pt-BR mostra vírgula, então a validação aceita `,` e `.`. |
| Rascunho local | Persiste normalmente. | O iOS pode apagar dados de apps pouco usados; o rascunho é só conveniência, o que vale é o que o servidor confirmou. |
| Requisitos | HTTPS, manifesto válido e service worker com `fetch`. | HTTPS e as metas acima. |

Homologação: testar em **um Android real e um iPhone real**, instalando do zero, fazendo login dentro do app
instalado, lançando, fechando e reabrindo pelo ícone.

## 4. Plano de refatoração

| Etapa | Trabalho | Aceite |
|-------|----------|--------|
| 1. Protótipo | Vista mobile com dados de exemplo em 360, 390 e 430 px. | Aprovação visual das 7 telas (0 a 6). |
| 2. Lógica comum | Extrair de `maodeobra-grupos.js` uma única camada de leitura, validação, totalização e envio usada por desktop e mobile. | Totais idênticos à versão atual para os mesmos dados. |
| 3. Vista mobile | HTML/CSS mobile (`maodeobra-mobile.css`), stepper ± 0,5, rodapé fixo, conferência, sucesso, erro, sem produção, histórico em cartões. | Nenhuma rolagem horizontal; acessível por teclado e leitor de tela. |
| 4. Correções compartilhadas | `todayISO()` passa a usar `America/Sao_Paulo`. | À noite abre o dia correto. |
| 5. Instalador dedicado | Entrada `/unificado/m/maodeobra/`, manifesto e service worker próprios, ícones (incl. `apple-touch-icon`), metas iOS, safe-area, tela Instalar com botão (Android) e instruções (iPhone), login dentro do app instalado. | Ícone "Mão de Obra" separado do Unificado em Android e iPhone reais; abre direto no lançamento; login funciona no app instalado do iPhone. |
| 6. Homologação | Ambiente de teste `:18446`: os dois grupos, data anterior, edição, 0,5, vírgula, zeros, sem produção, falha de rede, sessão expirada, permissões PCP/PRODUCAO/ADMIN. | Capturas e vídeo no celular; valores conferidos no banco de teste; desktop inalterado. |
| 7. Produção | Backup dos arquivos, publicação, smoke test, gate de regressão. | Lançamento confirmado pelo celular instalado. |

**Arquivos previstos:** `unificado/pcp/maodeobra/index.html` e `maodeobra-grupos.js` (só para servir a vista
mobile e expor a camada comum), novo `maodeobra-mobile.css`, e a pasta nova `unificado/m/maodeobra/`
(`index.html`, `manifest.webmanifest`, `sw.js`, ícones). O manifesto e o `sw.js` do Unificado não mudam.
A versão desktop não muda.
**Sem migração de banco**: o `POST /api/maodeobra/grupo` atual atende.

## 5. Critérios de aprovação

- Do ícone ao formulário em um toque; lançar S1/S2 ou S3/S4 sem tabela larga.
- Data e grupo visíveis na conferência e no sucesso; Total = MOD + MOI; aceita `12,5`.
- Reenvio no mesmo dia/grupo atualiza, não duplica.
- Não lançado, lançado com zero e sem produção são estados distintos.
- Erro de rede não perde digitação nem afirma envio.
- Permissões e versão de computador sem mudança.

## 6. Decisão (confirmada pelo Ricardo em 17/10/2026)

**Enviar (celular) = Salvar lançamentos (desktop).** Os dois botões chamam a mesma função e o mesmo
`POST /api/maodeobra/grupo`, gravando o grupo do dia no banco. Não há fechamento do dia nem aprovação:
o gestor pode corrigir e reenviar, e o reenvio substitui os valores daquele dia/grupo (upsert).

Consequências para a implementação:
- Uma única função `salvarGrupo(data, grupo, valores)` na camada comum, usada pelos dois botões.
- Mesmas validações (0,5 em 0,5, vírgula, não negativo) e mesma resposta de erro nos dois.
- O rótulo muda só na interface: "Salvar lançamentos" no desktop, "Enviar" no celular.
- Nenhuma mudança de backend ou de banco.
