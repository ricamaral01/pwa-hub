# Painel TV — conferência no ambiente de teste

**Ambiente:** `https://concrefer.concretrack.com.br:18446/unificado/tv/formas/`, VPS nova `2.25.163.32`. O serviço da TV lê `pcp_unificado_homolog_20261016` e `mapa_unificado_homolog_20261016` com a role `tv_homolog_reader`, concedida somente para `SELECT`. Esta conferência foi concluída antes da [publicação em produção](publicacao-2026-10-16.md).

O PCP é a programação oficial. Nos setores 1/2, ele registra quantidade por tipo sem identificação de forma; os códigos por forma do Mapa são usados apenas para pintar as formas. Quando as quantidades divergem, o painel avisa. Nos setores 3/4, sem programação por forma no PCP, os eventos do Mapa ficam em diagnóstico e não entram no total programado. O campo “Liberadas” conta a liberação **para concretar** de uma forma programada; o estado visual “Concretada” prevalece depois do apontamento. O volume realizado é estimado pelo volume cadastrado do produto, pois o apontamento não contém m³ efetivos.

## Consulta manual × API

Consulta manual somente leitura executada contra os dois bancos isolados: `scripts/painel-tv/inspect_homolog.py`. O numerador é a interseção das formas distintas do dia em `programacao_pcp` e `producao`; a liberação é a interseção com `liberacao_formas`. Quantidades oficiais são a soma de `programacoes.quantidade_programada` no PCP. A API usa exatamente essa regra e cache de 30 s.

| Dia | Setor | PCP oficial | Mapa por forma | Concretadas programadas: consulta / painel | Liberadas: consulta / painel | Observação |
|---|---:|---:|---:|---:|---:|---|
| 14/10 | 1 | 60 | 24 | 19 / 19 | 0 / 0 | Divergência PCP × Mapa avisada |
| 14/10 | 2 | 63 | 27 | 14 / 14 | 0 / 0 | Divergência PCP × Mapa avisada |
| 14/10 | 3 | 0 | 0 | 0 / 0 | 0 / 0 | Sem programação oficial |
| 14/10 | 4 | 0 | 12 | 0 / 0 | 0 / 0 | Doze eventos do Mapa fora da programação oficial |
| 15/10 | 1 | 60 | 48 | 44 / 44 | 42 / 42 | Divergência PCP × Mapa avisada |
| 15/10 | 2 | 63 | 51 | 42 / 42 | 40 / 40 | Divergência PCP × Mapa avisada |
| 15/10 | 3 | 0 | 0 | 0 / 0 | 0 / 0 | Sem programação oficial |
| 15/10 | 4 | 0 | 0 | 0 / 0 | 0 / 0 | Sem programação oficial |

**Totais do painel:** 14/10 = 123 programadas, 33 concretadas, 0 liberadas; 15/10 = 123 programadas, 86 concretadas, 82 liberadas. Em 15/10, o volume previsto é 29,116 m³ e o realizado estimado é 19,7 m³. Nenhuma contagem do Mapa foi acrescida à quantidade oficial do PCP. O Setor 2 mantém **86** formas ativas no cadastro PCP e mostra aviso sobre a 87ª forma confirmada por Ricardo, ainda sem código conhecido.

## Smoke e visual

- [Visão geral, 1920 × 1080](evidencias/visao-geral-1920x1080.png)
- [Setor 1, 1920 × 1080](evidencias/setor-1-1920x1080.png)
- `tv-producao` foi criado pelo fluxo de usuários **do teste**, como convidado com uma única tela `tvFormas` e ação `view`. TV e API retornam 200; PCP e Produção retornam 403; Qualidade retorna 401. O catálogo de telas expõe `Painel TV — Formas` para atribuição explícita. A entrada do GED pode devolver HTML 200, porém nenhuma permissão GED foi concedida.
- Troca para Ribeirão: 422, pois não há fonte de unidade confirmada. A API não atribui dados de Pederneiras a outra unidade.
- Serviço direto: resposta fria observada de 34–43 ms, resposta com cache de 2,5 ms, abaixo do limite de 500 ms.
- Interrupção simulada da API: a TV manteve os últimos números (123 e 86) após recarga e exibiu “Sem atualização desde HH:MM. HTTP 503”; nenhum erro JavaScript.

**Limites dos dados:** os identificadores físicos Mapa ↔ PCP não têm correspondência completa; por isso o painel não preenche por suposição as formas pendentes de cada tipo. Os setores 3/4 não têm programação oficial recente na cópia do teste. O painel indica essas lacunas em avisos e não infere programação nem volume real.
