# API da Dosagem v2 — contrato local 4.1

Base prevista: `https://dosagem.concretrack.com.br`. SPA e API usam o mesmo domínio. O serviço FastAPI fica em `127.0.0.1:18300` ou na primeira porta livre até 18399; nginx publica a aplicação. A Etapa 0 da VPS foi concluída sob o adendo 4.2; a implantação aguarda os portões locais F1–F4.

## Autenticação 4.1

- `POST /api/v1/auth/hub/iniciar`: `{estado, code_challenge}`; armazena o desafio PKCE por 5 minutos e devolve a URL da ponte estática no Hub.
- `POST /api/v1/auth/hub/ticket`: recebe `Authorization: Bearer <token do Hub>`, `{estado}` e `Origin: https://usina.concretrack.com.br`. É o **único endpoint com CORS**. Confere o token no Supabase e devolve ticket opaco válido por 60 segundos, armazenado apenas como SHA-256.
- `POST /api/v1/auth/hub/trocar`: `{ticket, estado, code_verifier, manter_conectado}`. Consome o ticket uma vez, verifica PKCE S256 e cria o cookie `ct_dosagem_sessao`, `HttpOnly; Secure; SameSite=Lax`.
- `POST /api/v1/auth/local/login`: e-mail, senha e opção de permanência. Senha Argon2id; cinco falhas bloqueiam por 15 minutos. A conta de emergência exige troca de senha no primeiro acesso via `POST /api/v1/auth/local/trocar-senha`.
- `GET /api/v1/auth/sessao`: identidade, papel, unidades e indicador de troca obrigatória; renova a validade da sessão. `POST /api/v1/auth/sair` encerra a sessão.

O token do Hub nunca é enviado ao RPC. A ponte é `auth/ponte-dosagem.html`, arquivo novo e estático no Hub. Em produção, RPC exige cookie próprio; Bearer antigo é aceito somente em `AMBIENTE=dev` para testes de compatibilidade. A gravação com cookie exige `X-Requested-With: dosagem` e `Origin` igual ao host.

## Saúde

`GET /api/v1/saude` não exige autenticação. Retorna HTTP 200 com `{"ok":true,"versao":"2.0.0","banco":"ok"}` ou HTTP 503 com `banco:"erro"`. Não inclui dados privados.

## RPC

`POST /api/v1/rpc`, `Content-Type: application/json`, cookie de sessão, `X-Requested-With: dosagem`, `Idempotency-Key: <requestId UUID>`.

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

O exemplo demonstra o envelope legado; métodos 4.1 usam `principal_abrams` ou `alternativo_concrefer`, `balanco`, `metodoDados`, `planoExperimental` e recebem `resultadoCalculado`, `resumoCalculado` e `itens` recalculados no servidor. `Idempotency-Key` deve coincidir com `requestId`; repetir ambos com os mesmos dados devolve a resposta original sem nova gravação.

Sucesso: `{"ok":true,"dados":{"id":"...","codigo":"TR-0001","versao":1,"revisao":1,"documento":{}},"servidorEm":"2026-10-17T00:00:00Z"}`. Erro: `{"ok":false,"erro":{"codigo":"CONFLITO_REVISAO","mensagem":"...","detalhe":{"atual":{}}},"servidorEm":"..."}`. Códigos: `NAO_AUTENTICADO` (401), `SEM_PERMISSAO` (403), `VALIDACAO` (422), `CONFLITO_REVISAO` (409), `NAO_ENCONTRADO` (404), `LIMITE` (429), `INTERNO` (500).

| Ação | Dados | Papel mínimo |
|---|---|---|
| `usuarios.listar` | `{}` | usuário ativo |
| `usuarios.salvar` | usuário com e-mail, nome, papel, unidades e ativo | admin |
| `tracos.listar` / `.obter` | filtro de unidade; ID e versão | usuário ativo, limitado à unidade |
| `tracos.salvarVersao` | traço completo | laboratório |
| `tracos.enviarAprovacao` | ID, versão, revisão | laboratório |
| `tracos.aprovar` | ID, versão, revisão, parecer | engenheiro |
| `avaliacoes.listar` | `tracoVersaoChave` | usuário ativo, limitado à unidade |
| `avaliacoes.decidir` | ID, `decisao` (`revisar` ou `liberar`), justificativa de ao menos 10 caracteres | engenheiro |
| `producoes.salvar` | ID, `tracoVersaoChave`, volume e dados da betonada | produção |
| `materiais`, `fornecedores`, `ensaios`, `custos`: `.listar` / `.obter` | filtros ou ID | usuário ativo, limitado à unidade |
| Os mesmos: `.salvar` | documento com ID e unidade | laboratório |
| `custos.excluir` | ID e confirmação | admin |
| `importacao.legado` | `simulacao`, `registros`, `unidadePadrao` | admin |

Importação recebe documentos **já convertidos no navegador**; não lê planilhas no servidor. Cada registro usa `{tipo, origem, id_antigo, documento}`. O lote comporta até 500 registros. A simulação é padrão e informa `lidos`, `convertidos`, `duplicados`, `gravados`, `avisos`, `amostras`; a efetivação usa `simulacao:false`. A chave `(origem,id_antigo)` evita duplicação. A interface exige simulação antes da efetivação.

CORS é liberado somente em `/api/v1/auth/hub/ticket` para `https://usina.concretrack.com.br`; os demais endpoints exigem a mesma origem, salvo a exceção de desenvolvimento local.

## Identidade e persistência

O endpoint de ticket consulta `{SUPABASE_URL}/auth/v1/user` e descarta o token após identificar o e-mail. Usuário desconhecido ou inativo recebe `SEM_PERMISSAO`. Tickets, sessões e credenciais locais ficam em tabelas separadas; apenas hashes de tickets e sessões são persistidos. Cada mutação roda em transação, audita e verifica revisão. Os filtros principais são colunas SQL e o documento integral fica em JSONB. Migrações Alembic versionam o esquema. O fluxo antigo de Bearer/JWT permanece exclusivamente para desenvolvimento e compatibilidade da release anterior.
