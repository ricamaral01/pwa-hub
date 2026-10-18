# API da Dosagem v2 — rodada 2

Base prevista: `https://api-dosagem.concretrack.com.br`. O serviço FastAPI fica em `127.0.0.1:18300` ou na primeira porta livre até 18399; o nginx publica apenas o domínio da API. Nesta rodada, a API foi testada localmente, sem deploy na VPS.

## Saúde

`GET /api/v1/saude` não exige autenticação. Retorna HTTP 200 com `{"ok":true,"versao":"2.0.0","banco":"ok"}` ou HTTP 503 com `banco:"erro"`. Não inclui dados privados.

## RPC

`POST /api/v1/rpc`, `Content-Type: application/json`, `Authorization: Bearer <access_token do Hub>`, `Idempotency-Key: <requestId UUID>`.

```json
{
  "acao": "tracos.salvarVersao",
  "requestId": "f1fa4ec6-f101-4d15-9c96-3bb2daf04d55",
  "dados": {
    "id": "af38bd52-7e85-4c9a-8796-c72125f35358",
    "nome": "C40",
    "unidade": "campinas",
    "versao": 0,
    "revisao": 0,
    "status": "rascunho",
    "metodo": "manual",
    "objetivo": {"fckMPa": 40, "sdMPa": 4, "classe": "III", "estrutura": "armado", "abatimentoMm": 100, "toleranciaMm": 20},
    "arIncorporadoPct": 1.5,
    "normalizarPara1m3": false,
    "experimentais": [],
    "itens": [
      {"id": "c", "nome": "Cimento", "categoria": "cimento", "massaKgM3": 350, "massaEspecificaKgDm3": 3.12},
      {"id": "a", "nome": "Areia", "categoria": "areia", "massaKgM3": 400, "massaEspecificaKgDm3": 2.6},
      {"id": "w", "nome": "Água", "categoria": "agua", "massaKgM3": 175, "massaEspecificaKgDm3": 1}
    ]
  }
}
```

O exemplo demonstra o envelope. As regras completas do documento estão em `dosagem-concreto-v2/src/core/model.ts` e na validação da API. O token fica somente no header. `Idempotency-Key` deve coincidir com `requestId`; repetir ambos com os mesmos dados devolve a resposta original sem nova gravação.

Sucesso: `{"ok":true,"dados":{"id":"...","codigo":"TR-0001","versao":1,"revisao":1,"documento":{}},"servidorEm":"2026-10-17T00:00:00Z"}`. Erro: `{"ok":false,"erro":{"codigo":"CONFLITO_REVISAO","mensagem":"...","detalhe":{"atual":{}}},"servidorEm":"..."}`. Códigos: `NAO_AUTENTICADO` (401), `SEM_PERMISSAO` (403), `VALIDACAO` (422), `CONFLITO_REVISAO` (409), `NAO_ENCONTRADO` (404), `LIMITE` (429), `INTERNO` (500).

| Ação | Dados | Papel mínimo |
|---|---|---|
| `usuarios.listar` | `{}` | usuário ativo |
| `usuarios.salvar` | usuário com e-mail, nome, papel, unidades e ativo | admin |
| `tracos.listar` / `.obter` | filtro de unidade; ID e versão | usuário ativo, limitado à unidade |
| `tracos.salvarVersao` | traço completo | laboratório |
| `tracos.enviarAprovacao` | ID, versão, revisão | laboratório |
| `tracos.aprovar` | ID, versão, revisão, parecer | engenheiro |
| `materiais`, `fornecedores`, `ensaios`, `custos`: `.listar` / `.obter` | filtros ou ID | usuário ativo, limitado à unidade |
| Os mesmos: `.salvar` | documento com ID e unidade | laboratório |
| `custos.excluir` | ID e confirmação | admin |
| `importacao.legado` | `simulacao`, `registros`, `unidadePadrao` | admin |

Importação recebe documentos **já convertidos no navegador**; não lê planilhas no servidor. Cada registro usa `{tipo, origem, id_antigo, documento}`. O lote comporta até 500 registros. A simulação é padrão e informa `lidos`, `convertidos`, `duplicados`, `gravados`, `avisos`, `amostras`; a efetivação usa `simulacao:false`. A chave `(origem,id_antigo)` evita duplicação. A interface exige simulação antes da efetivação.

CORS permite apenas `https://usina.concretrack.com.br` e, em `AMBIENTE=dev`, `http://localhost:5173`. Métodos `GET` e `POST`, headers `Authorization`, `Content-Type` e `Idempotency-Key`.

## Identidade e persistência

O token do Hub é conferido em `{SUPABASE_URL}/auth/v1/user` com timeout de 5 segundos e cache pelo hash SHA-256 por 5 minutos. Se configurado, JWT HS256 valida assinatura, expiração e audiência. Depois a API procura o e-mail em `usuarios`. Usuário desconhecido ou inativo recebe `SEM_PERMISSAO`. Com a tabela vazia, `ADMIN_EMAIL` cria o primeiro admin. Cada mutação roda em transação, audita e verifica revisão. Os filtros principais são colunas SQL e o documento integral fica em JSONB. Migrações Alembic versionam o esquema.
