# Correções intencionais na cópia unificada

## Ocorrências de defeitos por inspeção (04/10/2026)

O Mapa oficial permanece intacto. Na cópia de testes, uma ocorrência do mesmo
defeito na mesma peça e inspeção conta uma vez. A chave usa o identificador da
peça, setor, início e fim da inspeção (horários normalizados) e o conjunto de
defeitos. Inspeções com horários distintos, inclusive uma nova inspeção após RR,
continuam sendo eventos separados. Linhas sem horários suficientes são mantidas.

O patch isolado está em `scripts/patch_mapa_defects_unificado.py` e é aplicado
por `scripts/build_unificado_mapa_operacao.py` somente ao `app.js` publicado em
`/unificado/mapa/operacao/`. A função alterada é
`removerReprovacoesDuplicadasDashboard`. Essa função alimenta o Dashboard
Defeitos, os indicadores de Montagem, Tratativa de Defeitos e a base das
exportações CSV/XLSX correspondentes. O build falha se a função original mudar.

Comparação em navegador real na URL publicada, com o `app.js` original servido
offline para o lado oficial e as mesmas respostas congeladas da fotografia para
ambos os lados. Evidência detalhada:
`docs/capturas-ricardo-20261004/dashboard-defects-source-parity.json`.
O ensaio baixa o CSV em cada período e verifica que o campo
`Ocorrencias de NC` coincide com o total exibido. Os totais e linhas por
defeito e por setor também são comparados no JSON de evidência.

| Período | Original | Unificado |
|---|---:|---:|
| 01/10/2026 | 14 | 7 |
| 02/10/2026 | 14 | 7 |
| 01–04/10/2026 | 28 | 14 |

Para 01–04/10, Setor 1 caiu de 8 para 4 e Setor 2 de 20 para 10;
Setores 3 e 4 permaneceram em zero. As 14 ocorrências finais correspondem às
14 chaves distintas de peça, inspeção e defeito observadas na fotografia.

O teste anterior comparava os dois lados carregando o `app.js` da cópia
publicada. Por isso reproduziu a mesma contagem nos dois lados e não detectou
o desvio. `tests/mapa/e2e/dashboard_defects_source_parity.py` agora entrega o
arquivo original para o lado oficial e exige a contagem por inspeção na cópia.

## Segunda inspeção de poste reprovado (04/10/2026)

No Mapa original, tocar em um poste reprovado abre diretamente o relatório. Os
comandos antigos de resultado da segunda inspeção ficam no fim desse relatório,
abaixo da primeira área visível, e gravam o resultado sem repetir o checklist.
Isso foi reproduzido com a mesma conta de gerência, o mesmo registro `SC31` de
29/06/2026 e a mesma fotografia tanto no HTML original quanto no unificado.

Na cópia unificada, o toque passa a mostrar duas escolhas explícitas:
`Segunda inspeção (retrabalho)` e `Ver relatório`. A segunda inspeção abre o
checklist já existente, preserva a primeira inspeção em
`HISTORICO_REPROVACAO`, exige novamente as respostas e fotos aplicáveis e grava
na mesma linha de `montagem_poste`. Nenhuma tabela, coluna ou enumeração foi
criada. O resultado aprovado usa o status existente `RR` e aparece como
`Retrabalhado e aprovado`; o resultado reprovado continua usando `R`, com o
marcador já existente `__segunda_inspecao.resultado=SEGREGADO`, e aparece como
`Perda do poste`.

O patch isolado está em
`scripts/patch_mapa_second_inspection_unificado.py` e é aplicado somente pelo
build da cópia. O `app.js` original permanece intacto. O teste anterior dos
fluxos 11 e 12 chamou `abrirVisualizacaoChecklist` diretamente e acionou os
botões no fim do relatório; por isso validou banco e resultado final, mas não
exercitou o toque real na linha nem a posição visível dos comandos.
# Mensagens neutras de banco de dados e UTF-8 (05/10/2026)

O `app.js` original continua intacto. O build da cópia troca somente mensagens
visíveis e de diagnóstico que citavam o fornecedor anterior por termos neutros:
`Falha ao verificar o banco de dados`, `Conectado`, `servidor` e
`Erro ao sincronizar com o servidor`. A ponte repete a neutralização em texto,
tooltip e rótulo criado dinamicamente. A configuração continua apontando o SDK
para `/unificado/mapa/api`, que usa o PostgreSQL novo.

O erro de APONTADOR vinha da sondagem `usuarios?select=id&limit=1`: a API tratava
essa leitura mínima como abertura da administração de usuários e devolvia 403.
A rota permite agora somente essa combinação de leitura para qualquer conta
Mapa ativa. Consultas adicionais e gravações de usuários continuam exigindo
GERENCIA. Nenhum filtro por setor foi adicionado.

`scripts/utf8_guard_unificado.py` corrige automaticamente dupla conversão de
UTF-8 e reprova o preparo de uma publicação se encontrar nova ocorrência ou uma
página sem `meta charset="utf-8"`. A biblioteca XLSX é excluída apenas dessa
heurística porque contém tabelas literais de páginas de código; seu conteúdo não
é texto de interface. O primeiro saneamento encontrou 158 ocorrências em
arquivos próprios e terminou com zero.


## Compatibilidade de inspe??o e r?tulo local (05/10/2026)

A matriz por toque real encontrou que o PostgreSQL novo n?o tinha os campos
`codigo_poste`, `descricao_poste` e `codigo_produto` j? enviados pelos fluxos
originais de inspe??o e montagem. A migra??o idempotente em
`unificado/mapa/database/schema.sql` adiciona esses campos; o PostgREST foi
recarregado e a inspe??o passou a persistir sem o erro `PGRST204`.

No frontend do PCP, o build troca o t?tulo vis?vel `Producao Realizada --
Supabase` por `Producao Realizada -- banco local`. A rota interna mant?m o nome
legado porque os 47 arquivos do backend PCP devem continuar id?nticos, mas ela
aponta para o adaptador PostgreSQL local e n?o faz chamada ao fornecedor.
