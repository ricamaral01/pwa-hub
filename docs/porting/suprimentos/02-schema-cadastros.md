# E1 — serviço isolado e cadastros

**Estado:** concluída em 25/10/2026, somente na branch local. Nenhuma alteração na VPS ou em produção.

## Entrega

- Serviço FastAPI em `unificado/suprimentos/service/suprimentos/`: `main.py`, `db.py`, `auth.py`, `ids.py`, `schemas.py`, `api/cadastros.py`. A conexão exige banco dedicado e nunca chama `create_all`.
- Migrations Alembic `sup_0001`/`sup_0002` em `unificado/suprimentos/migrations/`: schema `suprimentos`, 15 tabelas de cadastro/auditoria, unidade Campinas, 15 unidades de medida, 6 parâmetros editáveis com `a_confirmar`, duas alçadas provisórias e flags S0/S1. A seed de flag só habilita quando `SUPRIMENTOS_ENVIRONMENT=homolog`; em outro ambiente inicia desligada. Materiais e fornecedores ficam vazios.
- UUIDv7 gerado no serviço; movimento de estoque com bigint fica para S2. `sup_usuario_papel` usa `iam_user_id` textual, unidade, papel, CC e nível opcional.
- `GET /api/suprimentos/health` e `/me`; CRUD lógico paginado de unidades, medidas, materiais, conversões, CA, fornecedores, material/unidade, locais, endereços, centros de custo, alçadas, parâmetros, papéis e flags. Não há rota HTTP DELETE. Importações CSV atômicas em `/cadastros/materiais/importar` e `/cadastros/fornecedores/importar`, com relatório por linha.
- Modelos de importação (exemplos, sem carga real) em `docs/porting/suprimentos/modelos/`. Decisões D1–D14 registradas em `decisoes.md`.

## Proteções verificadas

O gateway assina assertion com `iss=unificado`, `aud=suprimentos`, expiração de até 20 segundos; o serviço aceita a identidade apenas em loopback. As concessões efetivas são lidas de `sup_usuario_papel` no banco, por unidade. `check_action(..., write=True)` exige ação e flag da fase. CNPJ é validado por dígitos verificadores na API, além do formato no banco. Chaves/códigos são únicos e as FKs de endereço/centro de custo impedem vínculos de outra unidade.

## Testes

PostgreSQL 16 descartável local em `127.0.0.1:55443`, banco temporário criado e excluído pelo teste; nenhuma credencial real usada. Comando:

```powershell
$env:SUPRIMENTOS_TEST_ADMIN_URL='postgresql+psycopg://sup_test@127.0.0.1:55443/postgres'
$env:PYTHONPATH=(Resolve-Path 'unificado/suprimentos/service').Path
python -m pytest unificado/suprimentos/service/tests/test_e1.py -q --disable-warnings
```

**Resultado final:** `5 passed`. O teste percorreu upgrade/downgrade, conferiu seeds e UUIDv7, criou/editou/desativou cadastro, negou CNPJ inválido e duplicado, negou uma ação proibida para cada um dos cinco papéis não administradores, negou unidade errada, bloqueou escrita com S0 desligada, confirmou ausência de DELETE e confirmou que CSV com uma linha inválida grava zero linhas. A primeira execução falhou apenas no teardown porque o dado de teste ainda referenciava Campinas; o fixture passou a limpar esses dados do banco descartável antes do downgrade. Segunda execução passou.

## Limites desta etapa

Não há materiais ou fornecedores reais, nem interface de cadastros, workflow de solicitação ou serviço instalado em homologação. O diretório privado de fotos, o timer e as telas entram nas etapas seguintes. A flag de Campinas foi habilitada apenas no banco temporário com `SUPRIMENTOS_ENVIRONMENT=homolog`; a VPS de homologação permanece intacta até E7.
