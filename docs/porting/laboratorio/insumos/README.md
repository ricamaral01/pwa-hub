# Laboratório › Insumos — Carta Traço + Estoque (VPS nova, PostgreSQL)

| Arquivo | Para quê |
|---|---|
| `PROMPT_CODEX.md` | Prompt por etapas para o Codex executar a migração |
| `ESCOPO.md` | O que muda de lugar, o que fica na VPS antiga, os três cortes, telas e aceite |
| `REVISAO_CALCULOS.md` | Revisão de todas as regras de cálculo, melhorias feitas e decisões em aberto |
| `pacote/sql/` | Schemas `insumos` (cadastros comuns), `estoque`, `carta_traco` — idempotentes |
| `pacote/carga/` | Sheets → Carta Traço (com reconciliação de MCC) e espelho do ERP → Estoque |
| `pacote/api/` | Routers FastAPI para o serviço do Laboratório, cálculos puros e leitura de NF |
| `pacote/infra/` | Timers systemd: espelho (antes dos cortes) e baixa automática (depois do corte 3) |
| `pacote/tests/` | 26 testes contra PostgreSQL real, incluindo um espelho falso do ERP |

Nada aqui altera o sistema em produção. O app antigo da Carta Traço (`carta-traco/`) e o ERP continuam oficiais
até os cortes descritos em `ESCOPO.md`.

## Rodar os testes
```bash
pip install fastapi sqlalchemy "psycopg[binary]" openpyxl python-multipart pytest httpx
export PG_TEST_DSN="postgresql://postgres@localhost:5432/lab_teste"   # banco DESCARTÁVEL
cd pacote && pytest -q tests/
```
