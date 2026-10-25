# Mapeamento técnico do ConcreTrack para Usinas

**Levantamento:** 22/10/2026. **Estado atual:** inventário concluído e primeira leitura de `tbl_receitas` Campinas publicada no Unificado oficial, após homologação. Este resumo preserva a fotografia do levantamento; a execução está em [07-plano-migracao.md](07-plano-migracao.md) e [execucao/fases/00-indice.md](execucao/fases/00-indice.md).

## O que existe

O endereço `dautomacao.com/concretrack/` reúne 44 arquivos HTML ativos, uma API FastAPI com 69 rotas declaradas e o PostgreSQL `supervisorio_db`. O NGINX entrega o frontend estático e encaminha `/concretrack/api/` à API na porta 8010. Há uma implantação paralela para Pederneiras (`supervisorio_db_pede`, API 8011, 57 rotas). O trabalho não cabe em uma cópia de telas: relatórios e CEC dependem de Dashboard Usina, Google Sheets, Mapa de Produção, serviço estatístico na porta 3086, etiquetas na porta 5050 e dados gerados pelo supervisório.

O banco principal tem 21 tabelas; Pederneiras, 23; o CEC canônico, 8. Foram capturados esquemas, GRANTs, contagens, tamanhos e intervalos de datas em [04-banco-de-dados.md](04-banco-de-dados.md). A maior tabela observada, `rompimentos_eventos`, tinha 6.431.676 linhas no instante da consulta. Nenhum registro individual foi copiado.

## Destino e lacuna

No levantamento inicial, Usinas continha apenas uma página de apresentação e o item “Visão geral” no menu. A página oficial agora consulta o espelho de receitas Campinas com a sessão e a permissão `usinasInicio`; as demais áreas ainda não têm paridade funcional. A matriz está em [06-matriz-paridade.md](06-matriz-paridade.md).

## Direção proposta

Criar o domínio PostgreSQL `usinas` na VPS nova como **espelho de leitura**, com `unidade_id`, chave de origem e sincronização a cada 1 minuto. A VPS antiga permanece fonte oficial das tabelas ESPELHO e MISTAS; API e CLP seguem lendo e gravando nelas sem alterações. O sincronizador é o único escritor do espelho. Reusar o IAM e as permissões por tela/ação, vinculando `ct_usuarios` a contas verificadas. Telas CEC e etiquetas podem entrar na navegação Usinas, mantendo seus dados oficiais na origem.

Para edição humana de uma tabela MISTA aprovada, o Unificado enviará a escrita por outbox à **VPS antiga**, usando primeiro o endpoint existente. Após confirmação, o sincronizador atualizará imediatamente o registro no espelho. O [plano](07-plano-migracao.md) e a [evidência de write-through](execucao/write-through-evidencia.md) detalham as ações, os bloqueios técnicos, os testes e o rollback. Nenhuma tabela foi aprovada ou habilitada para escrita neste levantamento.

## Limites deste levantamento

As capturas de layout usaram identidade simulada **apenas no navegador** porque não houve credencial de aplicação; elas não validam dados reais. A relação de escritores de tabelas foi extraída de código e precisa da confirmação do fornecedor da automação para processos externos. Esses pontos estão explicitados como gates antes da promessa de paridade 100% e do corte.

## Documentos

- [Infraestrutura](01-infraestrutura.md), [rotas](02-backend-rotas.md), [telas e capturas](03-frontend-telas.md), [bancos](04-banco-de-dados.md), [integrações](05-integracoes.md), [matriz](06-matriz-paridade.md), [plano](07-plano-migracao.md) e [write-through](execucao/write-through-evidencia.md).
- [Versão HTML autocontida](mapeamento-usinas.html) para revisão no navegador.

**A API, o CLP e as tabelas da VPS legada não foram alterados.** Após o levantamento, foi criado um papel de leitura e uma regra HBA restrita para o sincronizador, conforme a evidência de execução. Não houve gravação nas tabelas oficiais.
