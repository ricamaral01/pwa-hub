# API da Dosagem v2

## Transporte

O Web App do Apps Script recebe `POST` com `Content-Type: text/plain;charset=utf-8`. O corpo é JSON e inclui `acao`, `token` da sessão do Hub, `requestId` UUID e `dados`. O token nunca é salvo em planilhas. `GET` é apenas verificação de saúde: `{ "ok": true, "versao": "2.0.0" }`.

```json
{ "acao": "tracos.salvarVersao", "token": "<access_token>", "requestId": "f1fa4ec6-f101-4d15-9c96-3bb2daf04d55", "dados": { "id": "<uuid>", "unidade": "campinas", "revisao": 0, "nome": "C40", "objetivo": { "fckMPa": 40, "sdMPa": 4 }, "arIncorporadoPct": 1.5, "itens": [{ "id": "<uuid>", "nome": "Cimento", "categoria": "cimento", "massaKgM3": 350, "massaEspecificaKgDm3": 3.1 }] } }
```

O exemplo ilustra o envelope. Um traço completo segue `src/core/model.ts` e precisa incluir os demais campos do modelo. A resposta de sucesso inclui confirmação do servidor:

```json
{ "ok": true, "dados": { "id": "<uuid>", "codigo": "TR-0001", "versao": 1, "revisao": 1, "documento": {} }, "servidorEm": "2026-10-17T23:41:00.000Z" }
```

Uma falha devolve `{ "ok": false, "erro": { "codigo": "CONFLITO_REVISAO", "mensagem": "Este traço foi alterado por outra pessoa.", "detalhe": { "atual": {} } }, "servidorEm": "..." }`. Códigos possíveis: `NAO_AUTENTICADO`, `SEM_PERMISSAO`, `VALIDACAO`, `CONFLITO_REVISAO`, `NAO_ENCONTRADO`, `LIMITE`, `INTERNO`.

## Ações existentes

| Ação | Dados principais | Papel mínimo | Resultado |
|---|---|---|---|
| `usuarios.listar` | `{}` | usuário ativo | Seu próprio perfil; admin vê todos |
| `usuarios.salvar` | e-mail, nome, papel, unidades, ativo | admin | confirmação |
| `tracos.listar` | unidade opcional | usuário ativo | versões acessíveis |
| `tracos.obter` | id, versao opcional | usuário ativo | documento |
| `tracos.salvarVersao` | `Traco` completo | laboratório, engenheiro ou admin | id, código, versão, revisão, documento |
| `tracos.enviarAprovacao` | id, versao, revisao | laboratório, engenheiro ou admin | documento em teste |
| `tracos.aprovar` | id, versao, revisao, parecer | engenheiro ou admin | documento aprovado |
| `materiais`, `fornecedores`, `ensaios`, `custos` + `.listar` / `.obter` | filtros ou id | usuário ativo | documentos |
| `materiais`, `fornecedores`, `ensaios`, `custos` + `.salvar` | documento com id e unidade | laboratório, engenheiro ou admin | confirmação |
| `custos.excluir` | id, confirmação com nome do produto | admin | confirmação |
| `importacao.legado` | `simulacao` (padrão true) | admin | contagens e amostras ou documentos importados |
| `importacao.documentos` | documentos convertidos | admin | contagens |

Todas as listas e mutações filtram por unidade. Admin pode acessar todas. A primeira execução reconhece `ADMIN_EMAIL` quando a aba de usuários está vazia; a criação do cadastro ocorre na primeira gravação autenticada. Mutações usam `LockService` e deduplicação por `requestId` na aba `requisicoes`.

## Observações de implantação

O navegador só pode chamar a API depois de configurar `VITE_API_URL` e autenticar no Hub. O build entregue sem URL serve para exploração local e rascunhos, mas não confirma gravações. O Web App e as planilhas ainda precisam ser criados e testados com contas reais; as validações de papel e conflito foram inspecionadas no código, sem teste em Apps Script implantado.
