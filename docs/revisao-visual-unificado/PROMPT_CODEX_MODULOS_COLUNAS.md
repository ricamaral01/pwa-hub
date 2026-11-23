# Páginas de módulo sem blocos vazios — somente na homologação (18446)

Reorganize as páginas iniciais de módulo (Planejamento, Produção, Laboratório, Qualidade, Usinas, Suprimentos, Logística, GED) para não sobrarem espaços vazios entre os grupos. Tudo somente na 18446. Produção só com "aprovado, publicar em produção".

## Referência

- Mockup: `docs/revisao-visual-unificado/telas/f3-modulo-planejamento.html`
- Imagem: `docs/revisao-visual-unificado/img/f3/modulo-planejamento-1180.png`
- Código atual: `unificado/shell/module-pages.js` e as folhas de estilo da página de módulo.

## 1. Layout em colunas independentes

**Problema:** os grupos estão numa grade de linhas. Cada linha tem a altura do grupo mais alto, então sobra espaço embaixo do grupo menor (ex.: "Geral" com 2 telas ao lado de "Programação" com 6).

**Correção:**
- Use colunas independentes, por exemplo `columns: 2 420px; column-gap: 16px`.
- Cada grupo com `break-inside: avoid`, encostado no de cima.
- Abaixo de cerca de 900px, uma coluna só. O celular continua com o layout próprio de `module-pages-mobile.js`; não altere o celular.
- Ordem dos grupos: a do `menu.config.js`. Confira em cada módulo que a leitura de cima para baixo continua lógica e que as colunas terminam com altura parecida.
  - Se em algum módulo a divisão automática separar grupos que deveriam ficar juntos, ou deixar diferença grande de altura, me mostre antes de forçar a ordem.
- A busca "Buscar tela ou atividade" continua funcionando. Quando ela esconde itens e grupos, as colunas se reorganizam sem buracos.

## 2. Consistência dos itens

- **Ícones:** todo item tem ícone, seguindo a regra de ícone por tipo de tela (`UnificadoIcons.forScreen`). Hoje "Produção PCP" e "Formas por setor" aparecem sem ícone. Procure em todos os módulos.
- **Descrições:** todo item tem a linha cinza de descrição, para que todos tenham a mesma altura.
  - No Planejamento faltam 14: Acompanhamento, Etiquetas e Produção e apoio.
  - O mockup traz sugestões marcadas com "*". **Não as copie sem conferir:** abra cada tela, veja o que ela faz e escreva uma frase curta (verbo + objeto, até cerca de 45 caracteres, sem ponto final), no mesmo estilo das existentes ("Programar a produção diária", "Emitir PDF do setor 3").
  - Faça o mesmo em todos os módulos.
  - Entregue no relatório a **tabela de todas as descrições novas** (módulo, tela, descrição) para eu revisar.
- **Contagem:** número discreto à direita do título de cada grupo, em cinza e com números tabulares.
- Visual igual ao mockup:
  - cartão branco com borda #e1e5eb e raio de 6px;
  - título do grupo 13px/600;
  - linhas de no mínimo 44px com separador fino;
  - sem barra colorida, sem cor por módulo, sem seta.

## 3. "Teste programação"

É uma tela do ambiente de teste.
- Ela continua aparecendo **somente na homologação**.
- Em produção, ela não pode aparecer no menu, na página do módulo, na busca, nos favoritos ou recentes, nem no catálogo.
- Resolva por configuração de ambiente ou marcação no catálogo (`ambiente: "homolog"` ou equivalente), não apagando a tela.
- Procure outras telas de teste ("teste", "test", "demo", "rascunho") em todos os módulos e liste-as no relatório, com a mesma proposta.

## 4. Provas

- Capturas antes e depois de **todas as páginas de módulo** em 1440, 1280 e 1024. O tablet em 820 deve ficar em uma coluna, sem quebra.
- Para cada módulo, prova automática: nenhum grupo com espaço vertical vazio maior que 16px acima dele, exceto a diferença final entre as colunas.
- Teste da busca: digitar um termo que esconda grupos e mostrar que não sobram buracos.
- Prova de que "Teste programação" aparece na 18446 e de que a regra a esconderia em produção (teste com a configuração de produção, sem publicar).
- Versão nova (1.4.28, ou a seguinte à do login), gate 7/7, matriz das páginas de módulo de todos os perfis e auditoria de produção sem alteração.
- Commit próprio e relatório com capturas e a tabela de descrições. Pare e me entregue. Sem push, PR ou produção.
