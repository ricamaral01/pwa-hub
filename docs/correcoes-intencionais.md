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
