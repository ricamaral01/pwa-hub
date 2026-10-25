# Prompt para o Codex — Ajustes do menu lateral + commit da concessão pendente

```text
TUDO APROVADO PELO RICARDO. EXECUÇÃO AUTÔNOMA — não me pergunte nada. Trabalhe na branch
feat/unificado-consolidado-20261025. Ordem: commit pendente → ajustes → :18446 → produção (procedimento
de sempre: backup, snapshot de permissões, www-data, nenhum 777/666, smoke, gate 7/7, retorno automático
se falhar) → push → relatório.

0. COMMIT DA CONCESSÃO PENDENTE (fazer primeiro)
   - A concessão `labUsinasRelatorios` do serviço do Mapa está publicada em produção, mas só existe na
     árvore de trabalho sem commit. Faça o commit dela na feat/unificado-consolidado-20261025,
     comparando com o arquivo em produção (devem ficar iguais, após normalizar CRLF/LF).
   - Leve somente esse arquivo/trecho. As outras alterações não commitadas da árvore de trabalho ficam
     como estão: liste-as no relatório, sem descartar nem incluir.
   - Depois do commit, confirme que um deploy integral da branch consolidada não seria mais regressivo
     para o Mapa. Registre o resultado em docs/navegacao/consolidacao-branches.md.

1. LOGO
   - Volte a imagem do logo Concrefer no topo do menu lateral (desktop, tablet e menu do celular), usando
     o mesmo arquivo de logo usado no sistema antes da navegação nova. Com o menu recolhido, mostre o
     símbolo reduzido. Não use o texto "CONCREFER" no lugar do logo.

2. BOTÃO "ATUALIZAR" SEMPRE VISÍVEL
   - Rodapé do menu: botão "Atualizar", com ícone de recarregar, largura total, 44 px de altura e SEMPRE
     habilitado. Abaixo, em texto pequeno: "Versão X".
   - Ao clicar, consultar /unificado/VERSION sem cache:
     a) Versão nova: executar o fluxo atual de atualização do service worker e recarregar.
     b) Sem versão nova: registration.update(), recarregar a página com os arquivos atuais e mostrar um
        aviso rápido "Você já está na versão mais recente (X)".
   - Quando a verificação automática detectar versão nova, o botão fica laranja com o texto
     "Nova versão Y — atualizar". Mantenha a faixa laranja no celular.
   - Os estados "Atualizando…" e "Falhou — tentar de novo" (com limpeza de cache após 2 falhas) continuam.
   - Remova a caixinha "Versão · em dia · Verificar".
   - O mesmo comportamento vale no trilho do tablet e em Conta no celular.

3. RODAPÉ COMPACTO
   - Juntar "Como funciona" e "Relatar problema" num único item "Ajuda", com ícone. Ao tocar, abre um
     pequeno menu com as duas opções: "Como funciona" e "Relatar problema". Links e permissões não mudam.
   - "Ajuda" e "Usuários" (este só para quem tem permissão) ficam lado a lado numa única linha (ícone +
     rótulo), sem ocupar uma linha cada.
   - Linha do usuário (avatar, nome e Sair) numa linha só.
   - Meta: rodapé inteiro com no máximo ~150 px. Nas capturas 1440×900 e 1180×820, devem aparecer pelo
     menos 10 itens de tela sem rolar.

4. BOTÃO DO TOPO DO MENU
   - No desktop: "recolher menu" com chevron para a esquerda. O X fica só no menu do celular e no painel
     do tablet.

5. TESTES E ENTREGA
   - Playwright em 390×844, 820×1180, 1180×820 e 1440×900:
     - logo visível (aberto e recolhido);
     - botão Atualizar nos casos com e sem versão nova, falha e recuperação;
     - menu Ajuda abrindo as duas opções;
     - Usuários oculto para quem não tem permissão;
     - pelo menos 10 itens visíveis no desktop e no tablet;
     - sem rolagem horizontal.
   - Capturas antes × depois em docs/navegacao/capturas/.
   - Versão nova (VERSION = APP_VERSION = chave de cache do sw.js), deploy e gate 7/7.
   - Push da feat/unificado-consolidado-20261025. Não mexa em main.
   - Atualize docs/navegacao/relatorio-execucao.md com os itens 0 a 4.
```
