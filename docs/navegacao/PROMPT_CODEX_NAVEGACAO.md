# Prompt para o Codex — Navegação do Unificado (todo o sistema)

```text
EXECUÇÃO AUTÔNOMA — não me pergunte nada. Execute análise, código, testes, commit, push e deploy
(:18446 primeiro, depois produção) com o procedimento já ensaiado.

REFERÊNCIA VISUAL (aprovada): docs/navegacao/mockups/png/
  01-desktop.png · 02-tablet.png · 03-celular.png · 04-celular-menu.png · 05-atualizacao-estados.png
e HTML de referência em docs/navegacao/mockups/fonte/. Implemente no padrão do Unificado (menu Modelo A,
shell.js, router.js, menu.config.js); não copie o formato .dc.html.

PRIORIDADE 1 — PROBLEMA ATUAL EM PRODUÇÃO: o botão "Nova versão — atualizar" (service worker) NÃO está
mais disponível para os usuários. Comece pelo item 5: descubra a causa, corrija e publique essa correção
antes do restante da navegação (pode ir em um deploy separado, primeiro no :18446).

ESCOPO: navegação de TODOS os módulos. Agrupamento por unidade SOMENTE em Produção; nos demais, apenas
expandir/recolher grupos e subgrupos.

1. MENU — DUAS REGRAS
   A) PRODUÇÃO: AGRUPAR POR UNIDADE (somente neste módulo)
   - Estrutura: Produção › Unidade › Grupo › Tela.
   - Os grupos atuais "Campinas · Produção/Montagem/Controle/Indicadores" viram o bloco Campinas com os
     grupos Produção, Montagem, Controle e Indicadores; o grupo "Pederneiras" vira o bloco Pederneiras
     (sem subgrupo). Igual ao mockup 01/04.
   - Cada bloco de unidade e cada grupo abre e fecha; contador de telas por unidade e por grupo;
     breadcrumb Produção › Unidade › Grupo › Tela com a unidade em destaque.

   B) DEMAIS MÓDULOS (Planejamento, Qualidade, Usinas, Laboratório e outros): SEM unidade
   - NÃO criar blocos Campinas/Pederneiras nem mudar a estrutura de grupos atual.
   - Apenas tornar cada grupo (item) e cada subgrupo (subitem), quando existir, expansível/recolhível,
     com chevron, aria-expanded e contador de telas. Itens sem grupo continuam soltos.
   - Breadcrumb Módulo › Grupo › Tela.

   COMUM A TODOS OS MÓDULOS
   - "Expandir tudo / Recolher tudo" no topo do menu e campo "Buscar tela" (procura em todos os módulos
     permitidos, mostrando o caminho de cada resultado).
   - Ao abrir: o grupo (e a unidade, em Produção) da tela atual vem aberto; o resto segue o último estado
     do usuário (por usuário e por módulo; localStorage com try/catch).
   - Permissões atuais valem: item sem acesso não aparece; grupo/unidade vazio não aparece.
   - IDs, rotas, URLs e permissões dos itens NÃO mudam (só a apresentação).
   - Registre em docs/navegacao/estrutura-menu.md a árvore final de cada módulo.

2. CELULAR (até 767 px)
   - Barra superior: botão de menu (48 px), nome da tela com o contexto acima ("Unidade · Grupo" em
     Produção; "Grupo" nos demais módulos), botão de busca.
   - Barra inferior fixa: Início · Telas · Recentes · Conta (alvos ≥ 48 px, safe-area no iPhone).
     "Telas" abre o menu em tela cheia; "Recentes" lista as últimas 8 telas abertas pelo usuário.
   - Menu em tela cheia: módulos em chips roláveis no topo, depois busca e os grupos (com unidades só em Produção),
     itens com 48 px de altura e fonte 15 px; fechar com botão X e com o gesto/tecla voltar.
   - Atalhos em chips com as telas do mesmo grupo logo abaixo do topo da tela.
   - Nenhuma rolagem horizontal da página; conteúdo em largura total.
   - Respeitar as PWAs dedicadas (ex.: /unificado/m/maodeobra/) sem alterá-las.

3. TABLET (768–1279 px)
   - Trilho fixo à esquerda (~84 px) com os módulos (ícone + nome) e botão de menu no topo.
   - Painel do menu (~300 px) que abre/fecha sobre ou ao lado do conteúdo; o estado aberto/fechado é
     lembrado; fechado, o conteúdo usa a largura toda. Alvos de toque ≥ 44 px.
   - Retrato e paisagem testados.

4. DESKTOP (≥ 1280 px)
   - Menu lateral atual com o novo agrupamento; botão de recolher o menu continua funcionando.

5. BOTÃO DE ATUALIZAÇÃO (service worker) — SUMIU, corrigir a causa e o comportamento
   - Investigue por que "Nova versão — atualizar" sumiu: comparação entre /unificado/VERSION e APP_VERSION
     do shell.js, cache do sw.js servindo shell antigo, o Modelo A recebendo updateAvailable, ordem do
     deploy. Registre a causa em docs/navegacao/causa-botao-atualizacao.md.
   - Novo comportamento (sempre visível no rodapé do menu, no trilho do tablet e na conta do celular):
       a) Em dia: "Versão X · em dia" + link "Verificar" (consulta na hora, sem cache).
       b) Nova versão: card laranja "Nova versão Y — toque para atualizar"; no celular, também faixa
          laranja abaixo da barra superior.
       c) Atualizando: indicador + "Atualizando… não feche"; recarrega quando o novo SW assumir.
       d) Falhou: "Não atualizou — tentar de novo"; após 2 falhas, oferecer "Recarregar e limpar cache".
   - Verificação automática ao abrir, a cada 15 min e ao voltar para a aba (visibilitychange).
   - VERSION gerado pelo deploy a partir da mesma fonte da versão do shell (uma única fonte de verdade);
     o deploy falha se as duas divergirem.
   - Não alterar o comportamento das PWAs dedicadas além de exibirem o mesmo aviso se já tiverem.

6. ACESSIBILIDADE E QUALIDADE
   - Teclado (Tab/Enter/Espaço/Esc), foco visível, aria-current na tela ativa, contraste ≥ 4,5:1.
   - Testes: Playwright em 390×844, 820×1180, 1180×820 e 1440×900 para cada módulo: abrir/fechar
     unidade (Produção), grupo e subgrupo, busca, breadcrumb, barra inferior, recentes, sem rolagem horizontal, persistência
     do estado, permissões (usuário sem acesso não vê itens) e os 4 estados do botão de atualização
     (simular VERSION maior, falha de rede e sucesso).
   - Capturas antes × depois de cada módulo em docs/navegacao/capturas/.

7. ENTREGA
   - Branch feat/navegacao-unidades a partir da branch de produção atual do Unificado (a mesma usada no
     módulo de certificados), sem merge em main.
   - Deploy :18446 → produção com snapshot de permissões, backup, www-data, nenhum 777/666, smoke e
     gate 7/7; retorno automático se falhar.
   - Relatório docs/navegacao/relatorio-execucao.md com a estrutura do menu, causa do botão, testes,
     capturas, commits e deploy.
```
