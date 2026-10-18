# 03 · API do submódulo (FastAPI do Unificado, prefixo `<prefixo da API do Unificado>/laboratorio/cronoanalise`)

JSON em UTF-8, datas ISO 8601 com offset. Autenticação e permissões do Unificado (ver `docs/04`). Erros: `{"erro":"codigo","mensagem":"texto para o usuário"}` com status HTTP correto (400, 401, 403, 404, 409, 422, 429). Toda escrita grava em `auditoria`.

Permissões: **V** ver · **C** coletar · **A** analisar · **K** configurar (`docs/01`).

## Saúde
| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| GET | `/status` | V | `{schema:'cronoanalise', revisao_alembic, medicoes, ultima_medicao}` |

## Catálogo
| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| GET | `/atividades` | V | catálogo da unidade, ordenado por `ordem` |
| PUT | `/atividades/{codigo}` | K | altera nome, tipo, pessoas_padrao, estimativa_min, por_cacamba, pontos, ativo |
| POST | `/atividades` | K | nova atividade (código único) |

Código de atividade nunca é reaproveitado; desativar em vez de apagar.

## Medições
| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| POST | `/medicoes/importar-prototipo` | A | Recebe o CSV exportado pelo app protótipo (aba Medições → Exportar CSV: `;`, BOM, colunas `id;inicio;fim;processo;atividade_id;atividade_nome;setor;forma;tipo_poste;equipamento;batelada;pessoas;duracao_s;bruta_s;distancia_m;cronometrista;valido;invalid_motivo;obs`, decimal com vírgula) e grava como medições, idempotente pelo `id`. Pausas não vêm no CSV: registrar só a duração efetiva e a bruta. Código de atividade que não existe no catálogo → linha rejeitada com motivo. Responde `{gravadas, ja_existiam, rejeitadas}` |
| POST | `/medicoes/lote` | C | `{medicoes:[{id, atividade_codigo, setor, forma, tipo_poste, equipamento, batelada, pessoas, inicio, fim, bruta_s, duracao_s, pausas:[{inicio,fim,motivo}], distancia_m, observacao, cronometrista_nome, dispositivo_id, app_versao}]}` → `{gravadas:[ids], ja_existiam:[ids], rejeitadas:[{id, motivo}]}`. **Idempotente:** id repetido não duplica. `processo` vem do catálogo. Valida `fim ≥ inicio`, `duracao_s ≤ bruta_s + 1`, distância > 0 quando informada |
| GET | `/medicoes` | V | filtros `processo, atividade, setor, de, ate, valido, autor, tipo_poste`; paginação por cursor (`limite` até 500); ordenado por `inicio desc` |
| GET | `/medicoes/{id}` | V | detalhe com pausas e histórico de auditoria |
| POST | `/medicoes/{id}/invalidar` | A (C só as próprias, até 24 h) | `{motivo}` → `valido=false` |
| POST | `/medicoes/{id}/restaurar` | A | volta a válida |
| GET | `/medicoes/exportar.csv` · `.xlsx` | A | mesmos filtros; separador `;`, BOM UTF-8, decimal com vírgula no CSV |

Medições nunca são apagadas pela API.

## Estatística e dimensionamento (cálculo no backend, fonte única)
| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| GET | `/estatisticas` | V | por atividade: `n, n_excluidas, media_min, desvio_min, cv, n_necessario, pessoas_media, por_setor:{s:{n,media,cv}}, por_tipo_poste:{...}, velocidade_m_min (deslocamentos com distância)`. Usa `parametros_dimensionamento` (z, e, k) |
| GET | `/dimensionamento/parametros` · PUT | V · K | jornada, demanda, tolerâncias, η, z, e, k, `over` por atividade (ritmo, freq, usar) |
| GET | `/dimensionamento/resultado` | V | por atividade: TO, TN, TP, freq, HM; por etapa: HM e pessoas; totais: T_disp, takt, FT, HM, N teórico, N, capacidade, alertas (amostra insuficiente, TP×freq > takt). Fórmulas: `docs/06` |

## Simulação
| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| GET | `/simulacao/config` · PUT | V · K | parâmetros da base (horários, equipes, corredor, cura, pinos, reprovação, dias, sequência) |
| GET | `/simulacao/layout` · PUT | V · K | 4 linhas de `layout_setores`; valida ordem S3 < S2 < S1 na monovia |
| GET | `/simulacao/tempos` | V | para cada código usado no motor: `{media, cv, fonte:'medido'|'estimativa', n, por_setor}` (≥3 medições válidas = medido) |
| GET/POST | `/cenarios` · DELETE `/cenarios/{id}` | V · A | cenários salvos |
| POST | `/simulacoes` | A | grava uma rodada feita no navegador: `{tipo, replicacoes, entradas, resultado, motor_versao, nota}` |
| GET | `/simulacoes` · `/simulacoes/{id}` | V | histórico de rodadas (decisões rastreáveis) |

O motor roda no navegador (Web Worker) porque é rápido (≈0,1 s por dia simulado) e não carrega o servidor. Os tempos vêm de `/simulacao/tempos`, então base e cenário usam sempre os dados do banco.
