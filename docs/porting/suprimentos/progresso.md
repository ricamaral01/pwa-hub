# Progresso — Suprimentos S0–S1

| Etapa | Estado | Testes/evidência | Pendências |
|---|---|---|---|
| E1 · Serviço e cadastros | **Concluída** | [02-schema-cadastros.md](02-schema-cadastros.md); pytest E1 `5 passed`, upgrade/downgrade em PostgreSQL descartável | Dados reais de Campinas e UI entram depois; alçadas/valores seguem `a_confirmar` |
| E2 · Solicitação e aprovação | **Concluída** | [03-solicitacao-backend.md](03-solicitacao-backend.md); E1+E2 `12 passed` em 3 execuções consecutivas; downgrade em banco vazio separado | Valores de alçada/SLA ainda `a_confirmar`; timer será instalado na E7 |
| E3 · Casca, menu, permissões | **Concluída** | [04-casca-permissoes.md](04-casca-permissoes.md); 4 testes gateway, 5 perfis com IDs antigos preservados, typecheck/build do menu | Snapshot de 5 contas reais e instalação nginx/serviço serão verificados na E7 |
| E4 · Telas desktop/tablet | **Concluída** | [05-telas-desktop.md](05-telas-desktop.md); Playwright fluxo completo, 12 capturas, 1440/820 sem rolagem horizontal; regressão E1–E4 `17 passed` | Validação com sessão/dados reais fica para E7 |
| E5 · PWA Solicitação | **Concluída** | [06-pwa-solicitacao.md](06-pwa-solicitacao.md); E1–E5 `21 passed`, mobile Pixel/iPhone, Lighthouse PWA 1,00 | Instalação HTTPS e API real na homologação E7 |
| E6 · Revisão integrada | **Concluída** | [07-revisao-integrada.md](07-revisao-integrada.md); `21 passed`, revisão de rotas/CC/fotos/segredos, check JS/Python | Validação de nginx, permissões e usuários reais na E7 |
| E7 · Homologação | **Concluída** | [08-homologacao.md](08-homologacao.md); smoke HTTPS `43/43`, Playwright PC/tablet/celular e PWA offline, snapshot de acessos 5/5, retorno testado e reinstalação | Alçadas/SLA `a_confirmar`, cadastros reais e instalação iOS físico para fases posteriores |
| Pós E7 · Correção de layout na casca | **Concluída em homologação** | [09-correcao-layout.md](09-correcao-layout.md); matriz autenticada `676/676` antes/depois, E1–E7 `21 passed`, retorno e reinstalação, smoke `43/43` | Homologação para conferência de Ricardo; nenhuma publicação em produção |

**Limite operacional:** nenhuma alteração em produção ou na VPS antiga; nenhum push.

## Histórico de bloqueio da E2 e retomada — 25/10/2026

- A primeira execução após criar a migration 0003 falhou na FK composta de `sup_reserva` para `sup_endereco`. A correção adicionou `UNIQUE(id, unidade_id)` na migration 0003; as migrações passaram na execução seguinte.
- Após a primeira tentativa de correção dos testes E2, o pytest E1+E2 terminou em `5 passed, 4 failed, 1 error`. A solicitação com `client_uuid` era barrada por uma verificação de papel sem CC, e o teardown deixava CC dependente da unidade seed.
- Após a segunda tentativa, o pytest E1+E2 ainda terminou em `5 passed, 4 failed, 1 error`. A criação idempotente passou; os 403 seguintes decorrem provavelmente do override global de identidade compartilhado entre os clientes de teste. O teardown ainda deixa eventos referenciando a unidade seed. Esta hipótese não foi validada por novo teste, pois a regra de parada foi atingida.
- Ricardo substituiu a regra 0.3: falhas de infraestrutura de teste não contam como tentativas; defeito real só bloqueia após cinco correções documentadas. A fixture passou a assinar cada requisição e a limpar dados sem usar downgrade. A E2 ficou verde, incluindo as três execuções consecutivas exigidas.
- O único defeito real encontrado após isolar a infraestrutura foi a precedência do retorno 409 sobre a verificação de autorização. Foi corrigido na primeira tentativa e passou no teste seguinte.
- A E2 foi concluída nessa retomada; as E3–E7 foram executadas em seguida. Ao concluir a E7, somente a homologação `:18446` havia sido alterada. Produção não foi alterada e nenhum `git push` foi feito.
