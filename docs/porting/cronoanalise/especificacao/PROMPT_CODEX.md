# Prompt para o Codex · Laboratório › Cronoanálise no Unificado

Você vai construir o submódulo **Cronoanálise** dentro do módulo **Laboratório** do Unificado ConcreTrack/Concrefer, no repositório `C:\Users\Admin\Documents\pwa-hub-fase1`, e publicá-lo na **VPS nova 2.25.163.32**, pelo mesmo processo de publicação do Unificado. **Não instale nem altere nada na VPS antiga 31.97.241.84.**

O submódulo faz três coisas: cronoanálise (várias pessoas cronometrando no celular/tablet, gravando no banco), dimensionamento de mão de obra (tempo padrão e número de pessoas) e simulação da fábrica de postes (dia de produção, sequência de concretagem, gargalos).

Copie esta pasta para `docs/porting/cronoanalise/especificacao/` no repositório e leia nesta ordem:

1. `docs/00-contexto-processo.md` — a fábrica e as regras (fonte de verdade).
2. `docs/01-integracao-unificado.md` — o que reaproveitar do Unificado e as regras de não interferência.
3. `docs/02-banco-de-dados.sql` — schema `cronoanalise`.
4. `docs/03-api.md` e `docs/04-acesso-permissoes.md` — API e permissões.
5. `docs/05-frontend-telas-responsivo.md` — telas dentro da casca do Unificado.
6. `docs/06-motor-calculo-simulacao.md` — cálculos e paridade do motor.
7. `docs/07-testes-aceite.md` — o que precisa passar.
8. `reference/` e `seeds/`.

## Formato de execução: uma tarefa, uma evidência

Execute as tarefas abaixo **em sequência, numa só rodada**. Cada uma termina com um arquivo de evidência em `docs/porting/cronoanalise/T<n>-<nome>.md` (o que foi feito, arquivos alterados, comandos e saídas de teste, prints quando houver tela). Só pare antes do fim se encontrar um bloqueio listado em "Pare e pergunte".

| # | Tarefa | Evidência |
| --- | --- | --- |
| T0 | Descoberta: mapear no repositório onde ficam os módulos do Laboratório (backend e frontend), o modelo de usuários/permissões, a tabela de unidades, a auditoria, o menu lateral, o padrão PWA e o processo de deploy para a 2.25.163.32. Rodar `deploy/00_inventario.sh` na VPS e salvar como "antes". | Mapa de caminhos reais + inventário antes |
| T1 | Migração Alembic aditiva: schema `cronoanalise`, tabelas de `docs/02` (ajustando as referências a usuários/unidades aos nomes e tipos reais), seeds de `seeds/` (catálogo 40 atividades, layout dos 4 setores, parâmetros, listas). | `alembic upgrade head` e `downgrade -1` em banco de teste; contagem de linhas dos seeds |
| T2 | Permissões `laboratorio.cronoanalise.{ver,coletar,analisar,configurar}` e caixas no cadastro de usuários (submódulo liberável sem liberar o Laboratório inteiro). Ricardo recebe todas. | Testes 401/403; print do cadastro |
| T3 | API (`docs/03`): catálogo, medições (lote idempotente, invalidar/restaurar, exportar, importar CSV do protótipo), estatística, dimensionamento, simulação (config, layout, tempos, cenários, rodadas). Cálculos em Python batendo com `tests/golden.json → estatistica`. | pytest verde (novos + suíte existente) |
| T4 | Motor TypeScript: port 1:1 de `reference/engine.js`, Web Worker, teste de paridade com `tests/golden.json → casos`. | vitest verde, 18/18 casos |
| T5 | Telas (`docs/05`) na casca do Unificado: Início, Coletar (vários cronômetros, pausas com motivo, finalizar, IndexedDB e fila offline), Medições, Catálogo, Dimensionar, Simular (base × cenário, 6 sequências, layout, tempos, histórico), Metodologia. Modos PC, tablet e PWA. | Prints nas 3 larguras; Playwright offline |
| T6 | Publicar na 2.25.163.32 pelo processo do Unificado. Rodar `deploy/00_inventario.sh` "depois" e comparar. Roteiro rápido de PCP, Mapa, GED e Laboratório. | Diff antes/depois; prints dos outros módulos |
| T7 | Aceite: todos os itens de `docs/07`. | `relatorio-aceite.md` |

## Regras

1. **Reaproveitar o Unificado:** login, usuários, permissões, unidade, menu, casca visual, PWA, banco, auditoria, deploy e backup são os do Unificado. Nada de serviço, porta, NGINX, banco, tela de login ou cadastro de usuários próprios.
2. **Não interferir:** não alterar telas, rotas, tabelas ou permissões de outros módulos; não mudar os modos PWA existentes; migração só aditiva.
3. **Motor:** port 1:1 de `reference/engine.js` (mesma ordem de sorteios). A paridade com `tests/golden.json` precisa passar antes de qualquer melhoria.
4. **Estatística e dimensionamento** só no backend, testados com os exemplos de `tests/golden.json → estatistica`.
5. **Visual:** casca do Unificado + conteúdo dos mockups (`reference/mockups/`, abrir os `.dc.html` no navegador). Textos em português do Brasil, iguais aos do protótipo e da metodologia.
6. **Sem dados inventados:** o schema começa só com os seeds. Telas sem dados mostram estado vazio com instrução.
7. **Commits pequenos**, um ou mais por tarefa, com o número da tarefa na mensagem.

## Pare e pergunte (não decida sozinho)

- O modelo de permissões do Unificado não permite liberar um submódulo sem liberar o módulo inteiro, e a mudança afetaria permissões já gravadas.
- A revisão Alembic `head` do repositório não bate com a do banco da VPS.
- O deploy exigiria mudar porta, NGINX, serviço ou qualquer outro módulo.
- Algum teste da suíte existente do Unificado já falhava antes de você começar (registre e pergunte antes de seguir).

## Pronto quando

O Ricardo entra no Unificado, abre Laboratório › Cronoanálise, libera "Cronoanálise: coletar" para um cronometrista; os dois cronometram em aparelhos diferentes (um sem internet por alguns minutos); as medições aparecem sem duplicar; Dimensionar e Simular rodam; e PCP, Mapa, GED e o resto do Laboratório seguem exatamente como estavam.
