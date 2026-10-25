# Mão de Obra mobile — ratificação do dia (etapa 3)

**Ambiente:** [teste isolado `:18446`](https://concrefer.concretrack.com.br:18446/unificado/?view=pcp%2Fmaodeobra%2F). **Produção não foi alterada.** A nova regra permite lançar no meio do dia e confirmar depois, por data e grupo.

## Comportamento entregue

- Situação por dia/grupo: não lançado → lançado, aguardando confirmação → confirmado. Sem produção continua como encerramento próprio do grupo.
- `POST /api/maodeobra/grupo` aceita `confirmar` opcional, padrão `false`. Com `true`, salva os valores e a confirmação na mesma transação. Novo salvamento com `false` limpa a confirmação anterior.
- `POST /api/maodeobra/grupo/confirmar` recebe `data`, `grupo_setor` e `salvo_em`, marca somente a confirmação e devolve **409** quando o lançamento mudou. A tela mobile recarrega o dia e apresenta o aviso; os valores alterados no desktop passam a ser exibidos.
- `GET /dia` e `GET /resumo` incluem `confirmado`, `confirmado_em` e `confirmado_por {id,nome}`. Registros antigos sem `salvo_em` precisam ser salvos novamente antes da confirmação otimista; a interface oferece “Salvar e confirmar”.
- No mobile, um lançamento sem edição mostra “Confirmar mão de obra” e uma folha com MOD, MOI, total e hora do salvamento. Alterar um valor mostra “Salvar e confirmar”; a conferência exibe **anterior → novo**. O histórico distingue aguardando, confirmado e sem produção, destacando a pendência.
- No desktop, a situação aparece no cartão do dia. “Confirmar mão de obra” só fica disponível para valores já salvos e ainda não confirmados. Se o usuário editar um campo, deve salvar antes de confirmar. “Salvar lançamentos” continua usando o mesmo POST e volta a deixar o grupo aguardando confirmação.

## Banco, backup e reversão

Migração apenas aditiva em `maodeobra_dias`: `confirmado_em timestamptz NULL` e `confirmado_por_usuario_id integer NULL`, FK `usuarios.id ON DELETE SET NULL`. Foi aplicada **somente** no banco `pcp_unificado_homolog_20261016`. A reversão está em `unificado/pcp/backend/migrations/20261017_maodeobra_confirmacao_rollback.psql` e remove apenas essas colunas e a FK; não foi executada.

Antes da migração: `/root/backups/pcp-homolog-maodeobra-confirm-before-20261017.dump` (SHA-256 `ee59628bad914540c55a7260a0718306c18a1493c9c1c0c45a05387d7c9ebca4`) e `/root/backups/pcp-homolog-maodeobra-confirm-files-before-20261017.tgz`. A migração criou colunas nulas e a FK esperada. O serviço isolado PCP reiniciou sem erro. A rota nova responde **401** sem autenticação.

O lançamento real feito pelo Ricardo em **17/10/2026, S1/S2** segue no teste, sem confirmação automática. Os lançamentos de teste nas datas 22 a 25/10/2099 foram removidos após os cenários. Nenhum usuário, permissão ou dado de produção foi alterado.

## Testes no `:18446`

| Cenário | Resultado |
|---|---|
| POST sem confirmar → confirmar sem alterar valores | Confirmado; `salvo_em` e quantidades preservados, `confirmado_em/por` preenchidos. |
| Salvar novamente sem confirmar | Confirmação removida, situação aguardando. |
| Salvar e confirmar em um POST | Valores e confirmação gravados juntos; resumo retorna os três campos novos. |
| Mobile com folha aberta; desktop salva outro valor | `POST /confirmar` retorna **409**; mobile recarrega o valor e avisa. |
| Mobile edita depois do conflito | Botão “Salvar e confirmar”; conferência mostra `13 → 13,5`; resultado confirmado. |
| Desktop | Salvar, confirmar, editar e salvar novamente passaram; último salvamento volta a aguardar. Regressão anterior de salvar, reenviar e sem produção também passou. |
| iPhone WebKit emulado | Lançar, abrir folha, confirmar e verificar “Confirmado” no histórico passaram. |
| Core comum | `node --test tests/pcp/maodeobra-core.test.cjs`: **5/5**. |

Scripts: `tests/pcp/maodeobra_confirm_homolog.py`, `maodeobra_confirm_ios_homolog.py` e regressão `maodeobra_stage2_homolog.py`. Sintaxe dos scripts JS e compilação dos arquivos Python passaram. Os testes em Android e iPhone reais da vista funcional anterior já haviam sido informados como validados pelo Ricardo; **a nova folha de confirmação** foi verificada aqui por emulação e está disponível no teste para seu aceite visual.

## Capturas do teste

- [Desktop — aguardando confirmação](capturas-confirmacao-teste/desktop-aguardando.png)
- [Mobile — lançamento aguardando](capturas-confirmacao-teste/mobile-aguardando.png)
- [Mobile — folha de confirmação](capturas-confirmacao-teste/mobile-confirmar.png)
- [Mobile — conflito 409 e valores recarregados](capturas-confirmacao-teste/mobile-conflito.png)
- [Mobile — anterior → novo](capturas-confirmacao-teste/mobile-diferencas.png)
- [Mobile — confirmado](capturas-confirmacao-teste/mobile-confirmado.png)
- [iPhone WebKit — folha](capturas-confirmacao-teste/iphone-confirmar.png) e [histórico](capturas-confirmacao-teste/iphone-historico-confirmado.png)

## Arquivos alterados ou criados

- Backend: `unificado/pcp/backend/app/models/producao.py`, `app/schemas/producao.py`, `app/api/routers/pcp.py` e as duas migrations `20261017_maodeobra_confirmacao*.psql`.
- Frontend: `unificado/pcp/static/js/maodeobra-core.js`, `maodeobra-mobile.js`, `maodeobra-grupos.js`, `app.js`, `static/css/maodeobra-mobile.css` e `maodeobra/index.html`. A página publicada preserva o bootstrap e o bridge específicos da homologação; seus assets usam `?v=20261017-confirm1` para renovar o cache.
- Testes e evidência: os dois scripts de integração, `tests/pcp/maodeobra-core.test.cjs`, esta nota e as capturas acima.

**Gate:** implementação concluída no teste. Aguardando aprovação do Ricardo. Nenhuma publicação em produção foi feita.
