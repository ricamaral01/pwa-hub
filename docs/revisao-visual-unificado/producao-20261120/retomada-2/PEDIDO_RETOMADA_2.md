# Segunda retomada: corrigir a busca de Armação e tratar a prévia do CQ

Complementa `PROMPT_CODEX_PRODUCAO.md` e `PROMPT_CODEX_PRODUCAO_RETOMADA.md`. Continua valendo tudo o que eles dizem, inclusive a autorização de publicar hoje. A homologação fica como está agora: Armação habilitada e FCK 25.

## 1. Busca de Armação: corrigir (é regressão real)

Você encontrou a causa: as telas de Armação chegam pelo endpoint nativo depois que o índice da busca é montado, então não entram no índice.

**Correção, só no frontend:**
- Inclua no índice de `busca.js` os mesmos links dinâmicos de Armação que o menu e a página de módulo já recebem, com unidade, ação e perfil.
- Quando os links chegarem depois que a busca já estiver aberta ou o índice já estiver montado, atualize o índice. Sem recarregar a página e sem pedido novo ao servidor.
- **Nenhuma permissão nova.** A busca mostra exatamente o que o menu já mostra para aquele perfil.
- O atalho "Fechamento do dia" e a tela da Banca de cada unidade não podem aparecer duplicados na busca: um resultado por tela e unidade.

**Provas:**
- A comparação dos 9 perfis: menu, página de módulo e busca de Armação iguais entre a 1.4.6 de produção e a candidata (para `alex` e `Ricardo`, a busca volta a mostrar as telas de Armação, descontando a duplicata do atalho).
- Teste automático novo que falha se uma tela do menu dinâmico não estiver na busca. Aplique a Armação e a qualquer outro módulo que monte menu dinâmico; verifique se há outro.
- Acrescente ao conjunto de referência pelo menos 4 buscas de Armação (com unidade, sem acento e com erro de digitação), além das 48.
- Abrir um resultado de Armação pela busca leva à tela certa da unidade certa.
- Gate 7/7, matriz de 9 perfis e 72 casos.

**Versão e congelamento:** 1.4.31 (VERSION, `?v=` e cache do service worker), commit próprio, nova tag local `candidata-producao-1.4.31`, novo manifesto e novo pacote. Ajuste o `rollback.sh` e o plano de publicação ao novo manifesto. O backup da produção continua o mesmo, pois a produção não mudou: confira os hashes antes.

## 2. Prévia PDF do CQ: não bloqueia, vira prova na produção

O 503 vem do bloqueio de rede da homologação (`IPAddressDeny`), não do FCK 25 nem do pacote. A publicação não toca o backend do CQ. **Não monte a fonte JSON local e não abra saída de rede na homologação.**

Em vez disso:
1. **Antes de publicar**, confirme em **leitura** que o pacote não altera nada de que a prévia depende:
   - liste os arquivos do frontend do CQ e do Laboratório que mudam da 1.4.6 para a 1.4.31 e o que muda em cada um;
   - se a chamada da prévia ou do PDF (URL, parâmetros, cabeçalhos) mudou, **pare e me avise**.
2. **Linha de base na produção 1.4.6, só leitura:** abra o histórico do CQ e um PDF já emitido. Se existir rascunho na produção, abra a prévia dele, só com GET. Registre status e tempo. Não crie nada na produção.
3. **Depois de publicar**, repita exatamente as mesmas leituras na 1.4.31. Se alguma que funcionava na 1.4.6 falhar, execute o `rollback.sh` e me avise.

O rascunho `TESTE-RETOMADA-FCK25` (ID 35) da homologação pode ficar onde está.

## Ponto de verificação

Siga direto para a Fase 3 se:
- os itens do checkpoint original e da primeira retomada continuam OK;
- a 1.4.31 passou em todas as provas do item 1;
- o item 2.1 não encontrou mudança na chamada da prévia ou do PDF;
- a linha de base 2.2 foi registrada;
- nada mudou na produção desde o inventário.

Se algo falhar, pare antes de tocar a produção e me explique.

A publicação continua sendo **só frontend**, com o manifesto da 1.4.31. Depois, siga as Fases 4 e 5 do prompt original, incluindo o item 2.3. O login com senha fica pendente para eu testar com a minha conta.
