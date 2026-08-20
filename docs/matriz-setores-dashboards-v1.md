# Matriz de Setores - Dashboards V1

Status: release candidate para homologacao
Ambiente: `mapa-concretagem-teste`

## Mapeamento oficial

| Valor de origem | Codigo oficial | Entra no Total | Observacao |
|---|---|---:|---|
| `Setor 1` | `S1` | Sim | Setor operacional |
| `Setor 2` | `S2` | Sim | Setor operacional |
| `Setor 3` | `S3` | Sim | Setor operacional |
| `Setor 4` | `S4` | Sim | Setor operacional |
| `Setores 1 e 2` | `S1_S2` | Nao como setor | Escopo consolidado, nao valor de banco |
| `Todos os Setores` | `TOTAL` | Nao como setor | Escopo de UI |
| `Todos` | `UNCLASSIFIED` | Nao | Valor de permissao/usuario, nao operacional |
| `Setor de Testes` | `UNCLASSIFIED` | Nao | Pendente de regra de negocio |
| vazio/nulo | `UNCLASSIFIED` | Nao | Deve gerar warning de qualidade |

## Regras de agregacao

- `TOTAL = S1 + S2 + S3 + S4`.
- `S1_S2 = S1 + S2`, recalculando percentuais a partir das somas.
- Nunca calcular consolidado por media simples de percentuais.
- Valores `UNCLASSIFIED` devem aparecer em qualidade de dados, nao em indicador oficial.

## Evidencias

Arquivo de dataset:

- `docs/dataset-ouro-dashboards-v1.json`

Arquivo de execucao:

- `docs/evidencias-execucao-dashboards-v1.md`
