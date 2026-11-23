# Fase 1 — base visual

Versão **1.4.7**, publicada somente na porta 18446. Tokens extraídos de
`telas/base.css`, Geist local e números tabulares. Referência de tokens ligada
às entradas HTML publicadas e ao CSS de incorporação dos módulos. O login usa
o arquivo novo somente a partir de 1025px. Os módulos serão convertidos para
os componentes nas fases próprias; esta fase estabelece a base compartilhada.

O código-fonte React do menu substitui IBM Plex por variáveis de Geist e remove
o import Google. `npm ci` e `npm run build` passaram; a saída `menu.js/css` foi
gerada pelo Vite, sem edição manual. Não houve alteração de APIs ou bancos.

- 20 capturas antes e 20 depois em `antes/` e `depois/`.
- Sem erro de JavaScript, HTTP >=400 ou rolagem lateral no corpo nas quatro
  larguras. Nenhuma fonte externa requisitada nas capturas depois.
- Login em 1024, 820 e 390 idêntico pixel a pixel, exceto o rodapé de versão.
- Sintaxe dos quatro JS do manifesto validada com Node; build tipado aprovado.
- Gate 7/7: `gate.txt`. Implantação, hashes e backup: `deploy-results.json`.
- Lista de arquivos públicos: `arquivos-alterados.txt` e `manifest.json`.
- Produção: arquivos, PIDs e configuração do vhost comparados e inalterados.

Reconhecimento adicional: a árvore efetivamente publicada 1.4.6 já carrega
`navigation.js`, que fornece a navegação visível e a barra inferior móvel.
Isso diverge da descrição do pedido, mas não foi reativado por esta revisão.
A estrutura publicada será preservada. O componente React Modelo A também é
recompilado como solicitado; nenhuma navegação inferior será criada.
