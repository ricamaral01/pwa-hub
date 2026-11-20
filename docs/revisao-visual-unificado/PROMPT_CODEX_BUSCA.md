# Busca melhorada — somente na homologação (18446)

Melhore a busca de telas do Uni sem IA e sem custo de operação. Tudo roda no navegador, sem chamada nova ao servidor. Somente na 18446. Produção só com "aprovado, publicar em produção".

## Referência

- Mockups:
  - `docs/revisao-visual-unificado/telas/f3-busca.html` (computador)
  - `docs/revisao-visual-unificado/telas/f3-m-busca.html` (celular)
- Imagens: `img/f3/busca.png` e `img/f3/m-busca.png`.

## Situação atual (confirme no código)

Hoje há três buscas diferentes, e nenhuma tolera erro de digitação nem conhece sinônimos:

| Onde | Arquivo | Como compara |
|---|---|---|
| Barra lateral | `shell/navigation.js`, `renderTrees` | Só o nome e o caminho, sem ignorar acento. |
| Página de módulo | `shell/module-pages.js` | Nome e descrição, ignorando acento, mas só dentro do módulo. |
| Celular | `shell/module-pages-mobile.js` | Busca separada. |

Logística (`logistica/logistica-native.js`) tem a sua própria; avalie se entra.

## 1. Um motor de busca único

Crie `shell/busca.js`, usado pela barra lateral, pela página de módulo, pelo celular e pela nova janela de busca.

**Índice**
- Montado a partir do catálogo de telas que o usuário **pode acessar** (a mesma regra `canUse` de hoje). Telas sem permissão nunca aparecem.
- Telas marcadas como só de homologação (ver prompt das páginas de módulo) não aparecem em produção.
- Cada tela tem:
  - nome;
  - descrição (`UnificadoPresentation.descriptions`);
  - módulo;
  - unidade;
  - grupo;
  - sinônimos.

**Normalização**
- Minúsculas, sem acento ("compressão" = "compressao").
- Plural simples: s, es, ões/ão, ais/al.
- Várias palavras em qualquer ordem; todas precisam bater ("setor 3 etiqueta" = "etiqueta setor 3").

**Erro de digitação**
- Distância de edição de até 1 letra para palavras de 4 a 7 letras e até 2 letras para palavras de 8 ou mais. Troca de letras vizinhas conta como 1.
- Números e siglas curtas ("3", "CP", "NF") só batem exatos.
- Quando a busca corrigir, mostre "mostrando resultados para **etiqueta**".

**Sinônimos**
- Arquivo `shell/busca-sinonimos.json`, editável sem programar, no formato `{"termo": ["equivalente", ...]}`.
- Proponha a lista inicial a partir dos nomes das telas e dos termos usados na fábrica. Exemplos para conferir: CP ↔ corpo de prova; compressão ↔ rompimento; slump ↔ abatimento; traço ↔ dosagem; NF ↔ nota fiscal; etiqueta ↔ rótulo.
- **Entregue a lista para eu aprovar antes de publicar.** Não invente termos técnicos sem base nas telas.

**Ordem dos resultados**
1. Nome exato.
2. Nome começando pelo termo.
3. Palavra do nome.
4. Descrição.
5. Grupo ou módulo.
6. Sinônimo.
7. Correção de digitação.

Em caso de empate, vêm antes as telas favoritas ou recentes do usuário, se já existirem no sistema.

**Desempenho:** menos de 50 ms por tecla com todo o catálogo, sem rede.

## 2. Interface

**Computador e tablet com teclado**
- Janela de busca no centro da tela, aberta por **Ctrl+K** ou **/** (fora de campos de texto) e pelo botão "Buscar  Ctrl K" no topo da barra lateral, que substitui o campo atual. Ver o mockup.
- Resultados agrupados por "grupo · módulo", com a unidade na descrição quando houver mais de uma.
- Termo destacado em amarelo claro.
- Setas ↑↓ para navegar, Enter para abrir, Esc para fechar. Rodapé com essas teclas.
- No máximo cerca de 8 resultados visíveis, com rolagem.

**Celular**
- O botão de busca atual abre a busca em tela cheia, com voltar à esquerda. Ver o mockup.
- Resultado com nome, descrição e "módulo · unidade".
- Quando o resultado vier de sinônimo, mostre o selo com o sinônimo usado.

**Página de módulo:** o campo "Buscar tela ou atividade" continua filtrando o módulo, mas com o mesmo motor (sinônimos e erro de digitação).

**Buscas recentes**
- As 5 últimas, mostradas com o campo vazio.
- Guardadas em localStorage, com try/catch; só o texto buscado, por aparelho. Opção "Limpar".

**Nada encontrado**
- "Nenhuma tela encontrada para 'xyz'."
- Se houver termo parecido, "Você quis dizer: …".
- Sem tela técnica e sem erro.

**Acessibilidade**
- `role="combobox"` / `listbox` / `option`, com `aria-activedescendant`.
- Foco preso na janela enquanto ela estiver aberta.
- Funciona só com teclado.

## 3. Fora do escopo

- Nada de IA, nada de API nova, nada enviado ao servidor sobre o que as pessoas buscam.
- Não busca **dados** (número de série, nota, traço). Só **telas**. Se achar que vale buscar dados no futuro, registre como proposta no relatório.

## 4. Provas

- **Conjunto de referência** com pelo menos 40 buscas e o resultado esperado em primeiro lugar, incluindo:
  - sem acento ("producao");
  - erro de digitação ("etiqeta", "programacao setr 3");
  - palavras fora de ordem;
  - sinônimos;
  - sigla;
  - busca por unidade ("noroeste rompimento").
  O teste automático falha se o primeiro resultado mudar.
- **Permissão:** com cada perfil da matriz, a busca nunca mostra tela que o perfil não pode abrir.
- **Capturas** em 1440, 1024, 820 e 390: busca vazia com recentes, com resultados, com correção, com sinônimo e sem resultado.
- **Desempenho:** tempo por tecla medido no tablet de referência.
- **Fechamento:**
  - versão nova, depois das versões do login e das páginas de módulo;
  - gate 7/7;
  - matriz;
  - auditoria de produção sem alteração;
  - commit próprio e relatório com a lista de sinônimos para aprovação.
  Pare e me entregue. Sem push, PR ou produção.
