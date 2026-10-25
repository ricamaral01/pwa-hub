# Prompt para o Codex — Mão de Obra mobile (PWA dedicado)

Copie o bloco abaixo para o Codex, com esta pasta (`docs/maodeobra-mobile/`) já dentro do repositório.

---

Leia `docs/maodeobra-mobile/maodeobra-mobile-pwa.md` (especificação) e veja os mockups em
`docs/maodeobra-mobile/mockups/png/` (00 a 06). O HTML de referência de cada tela está em
`docs/maodeobra-mobile/mockups/fonte/` — use como referência visual de layout, cores e textos, **não copie o
formato `.dc.html` nem o script `support.js`**; implemente com o padrão de código atual do Unificado.

Tarefa: criar a versão mobile da tela **Planejamento › Mão de Obra** e um **PWA instalável dedicado** a ela.

Regras obrigatórias:
1. **Não altere a versão desktop** nem a estrutura do módulo: mesmas atividades e ordem (vindas do cadastro),
   mesmos grupos S1/S2 e S3/S4, mesma classificação MOD/MOI (Fab Armação = MOI), mesma API e mesmo banco.
2. **Enviar (mobile) = Salvar lançamentos (desktop)**: os dois usam a mesma função e o mesmo
   `POST /api/maodeobra/grupo`. Extraia essa lógica (leitura, validação 0,5 em 0,5 com vírgula, totais MOD/MOI,
   envio) para uma camada comum usada pelas duas vistas. Nenhuma migração de banco.
3. Entrada dedicada `/unificado/m/maodeobra/` com `manifest.webmanifest` e `sw.js` próprios (escopo dessa pasta),
   ícones 192/512 + maskable, `apple-touch-icon` 180, metas iOS, `viewport-fit=cover` e safe-area no rodapé.
   **Não altere** o manifesto nem o service worker do Unificado.
4. Tela "Instalar app": botão Instalar via `beforeinstallprompt` no Android; passo a passo
   "Compartilhar → Adicionar à Tela de Início" no iPhone; oculta quando já em `display-mode: standalone`.
5. Login: sessão do Unificado; expirada → login → volta para `/unificado/m/maodeobra/`. Precisa funcionar dentro
   do app instalado no iPhone (cookies separados do Safari).
6. Service worker guarda só casca e estáticos. Nunca cachear respostas da API, token ou dados de pessoal.
   Sucesso só depois da resposta do servidor; erro de rede preserva os valores digitados.
7. `todayISO()` deve usar `America/Sao_Paulo`.
8. Na rota atual `/unificado/?view=pcp%2Fmaodeobra%2F`, em largura de celular, mostrar a vista mobile e o link
   para instalar; desktop/tablet seguem iguais.

Ordem de trabalho: siga a seção "Plano de refatoração" do MD, etapa por etapa. Comece pela etapa 1
(protótipo com dados de exemplo em 360/390/430 px) e **pare para aprovação** antes de ligar o envio real.
Publique primeiro no ambiente de teste `:18446`. Não publique em produção sem aprovação.

Entregue ao final de cada etapa: lista de arquivos alterados/criados, capturas no celular e o que foi testado
conforme os critérios de aprovação do MD.
