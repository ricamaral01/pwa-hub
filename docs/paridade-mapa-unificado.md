# Paridade funcional do Mapa unificado

Fonte de comportamento: `mapa-concretagem/` em 02/10/2026. Em 03/10/2026, o `app.js` local apresentou o mesmo SHA-256 do arquivo publicado em `https://usina.concretrack.com.br/mapa-concretagem/app.js`; o `index.html` não apresentou diferenças textuais na comparação com a página publicada. A cópia `current-mapa/` é anterior. Este documento orienta a substituição do backend e do layout sem mudar a operação.

## Fluxos que precisam permanecer iguais

| Fluxo existente | Interação atual | Dados/serviços envolvidos |
|---|---|---|
| Programação de formas | Ativar **Programar Formas** no quiosque e tocar nos cartões das formas; tocar novamente para desprogramar | `programacao_pcp`, programação oficial do PCP |
| Liberação | Ativar **Modo Liberação** e tocar no cartão; a forma muda de cor e mantém o colaborador e horário | `liberacao_formas` |
| Concretagem | Tocar na forma liberada, escolher o tipo de concreto no fluxo atual e registrar o apontamento | `producao` |
| Cancelamento e manutenção | Usar **Modo ODIN** ou **Modo Manutenção** nos cartões existentes | `programacao_pcp`, `liberacao_formas`, `producao`, `formas_manutencao` |
| Inspeção e montagem | Abrir a forma nas listas atuais, responder aos checklists e concluir com os estados existentes, inclusive segunda inspeção e `RR` | `montagem_poste`, fotos e API de fotos |
| Consultas e administração | Manter hubs, filtros, gráficos, relatórios, dashboard, usuários e permissões por perfil | Tabelas migradas, RPCs, PCP, API de fotos |

Os modos de toque e a sequência de telas têm prioridade sobre qualquer reorganização visual. Os formulários genéricos criados no protótipo de testes não correspondem a esse fluxo e foram retirados do site.

## Trabalho de backend antes da publicação operacional

1. Mapear cada leitura, escrita e RPC de `mapa-concretagem/app.js` para uma API com sessão no domínio unificado, sem acesso direto do navegador ao Supabase de produção.
2. Reproduzir as transições atuais por forma e por setor no PostgreSQL, inclusive desprogramar, cancelar, manutenção, inspeção, montagem, segunda inspeção e retrabalho.
3. Migrar o armazenamento e a consulta das fotos para o ambiente isolado e manter os mesmos botões e prévias.
4. Comparar o fluxo completo no tablet com o Mapa atual, incluindo cores dos cartões, cliques, respostas offline e sincronização; liberar escrita somente após essa conferência.

O serviço publicado em `/unificado/mapa/` permite apenas consulta histórica. A rota separada `/unificado/mapa/operacao/` está aberta somente no PostgreSQL de testes, com faixa fixa de ambiente de teste. O roteiro completo de 24 fluxos ainda não foi certificado para uso de produção.

## E2E na rota operacional de testes — 03/10/2026

`tests/mapa/e2e/live_navigation.py` confirmou 288/288 combinações de quatro perfis, quatro setores e 18 modos contra a captura original, sem host externo. `live_captured_flows.py` executou 30 roteiros de funções no site publicado, sem exceção e sem host externo na rodada limpa; o PDF dependente de biblioteca simulada não foi executado. Estes números mostram alcance de código, não conferem sozinhos os três critérios por ação (requisição, linha gravada, cartão). `first_writes.py` comparou programação/desprogramação do Setor 1; `card_actions.py` comparou liberação e concretagem em Setores 1–3 com GERENCIA. Depois de cada rodada de escrita, a fotografia dos bancos de testes foi restaurada.

Para esta tabela, **igual** exige todos os critérios aplicáveis e todos os perfis/setores previstos; **não executado** também abrange fluxos parcialmente exercitados, com a limitação descrita.

| Nº | Fluxo | Estado E2E completo | Evidência / trabalho restante |
|---:|---|---|---|
| 1 | Login por perfil e setor | igual | Quatro perfis × quatro setores; navegação 288/288 conforme captura original. |
| 2 | Primeiro acesso | não executado | Falta comparação da troca de senha na rota operacional. |
| 3 | Programar/desprogramar | não executado | Setor 1 com GERENCIA teve POST/DELETE, linha e classe iguais; faltam setores/perfis. |
| 4 | Modo Liberação | não executado | Setores 1–3 com GERENCIA tiveram linha e cartão; Setor 4 preserva abertura de escolha de concreto; faltam perfis. |
| 5 | Concretar por tipo | não executado | Um tipo em Setores 1–4 com GERENCIA; faltam demais tipos/perfis. |
| 6 | Concreto vibrado | não executado | Tipo “Concreto Seco - Vibrado” no teste de cartão; falta matriz completa. |
| 7 | ODIN e refazer apontamento | não executado | Setor 3 com GERENCIA passou PATCH/DELETE com corpo de fixture, linha e cartão; faltam perfis e demais setores. |
| 8 | Modo Manutenção | não executado | Setor 3 com GERENCIA passou gravação, remoção e cartão de manutenção; faltam perfis e demais setores. |
| 9 | Mandril Circular | não executado | Ponte PCP passou criação/leitura/remoção sintética; falta E2E completo. |
| 10 | Inspeção, checklist e fotos | não executado | Funções e upload em rota real passaram com PNG válido; faltam fixture/linha/cartão por perfil. |
| 11 | Segunda inspeção | não executado | Abertura exercitada; falta conclusão E2E. |
| 12 | Retrabalho RR | não executado | Ramo de checklist exercitado; falta linha/cartão final. |
| 13 | Montagem Postes | não executado | Funções exercitadas; falta comparação de escrita e cartão. |
| 14 | Sequência S3 | não executado | Funções exercitadas; falta resultado final por perfil. |
| 15 | Relatório, PDF e WhatsApp | não executado | Texto do relatório conferido na diferença de ordem; PDF/WhatsApp pendentes. |
| 16 | Histórico | não executado | Apenas navegação conferida. |
| 17 | Acompanhamento, salvar/imprimir | não executado | Leitura/renderização exercitadas; escrita e impressão pendentes. |
| 18 | Manutenção Formas | não executado | Apenas navegação e leitura conferidas. |
| 19 | Tratativa de Defeitos | não executado | Apenas navegação conferida. |
| 20 | Três dashboards e filtros | não executado | Leitura e partes da renderização conferidas; todos os filtros pendentes. |
| 21 | Exportação XLSX | não executado | Base/lookup exercitados; arquivo final pendente. |
| 22 | Cadastro/edição de usuários | não executado | API em contrato anterior; ações da tela pendentes. |
| 23 | Sincronizar | não executado | Navegação e consulta exercitadas; sincronização final pendente. |
| 24 | Fila offline e reenvio | não executado | Um item S3 passou: fila local, reenvio conforme fixture `offline-199`, linha gravada e pendência removida; faltam montagem, liberação e inspeção, além dos perfis. Atualização de segundo tablet passou em teste separado. |

O visual foi capturado em 1024×768, 768×1024, quiosque, 1366×768 e 1920×1080 sem rolagem horizontal. Falta comparação de pixels tablet/quiosque com o original e falta a casca desktop nova. A rota operacional continua sendo ambiente de teste.

## Preparação já feita

`scripts/build_unificado_mapa_tablet.py` monta uma cópia de trabalho em `.work-mapa-unificado/tablet/`, fora da árvore publicada. Ela parte da interface atual, preserva os modos e os eventos dos cartões, usa a sessão unificada para entrada e saída, aceita o parâmetro `?tela=` dos atalhos e substitui os endereços operacionais externos por rotas do ambiente de testes. O service worker da origem fica desativado nessa cópia para não misturar caches. As rotas de escrita, fotos, RPCs e integrações PCP ainda precisam ser implementadas antes de publicar a cópia.

`unificado/mapa/database/api_formas_status.sql` reproduz no PostgreSQL o contrato de leitura `vw_formas_status` usado para colorir os cartões. A visão foi aplicada somente ao banco de testes; a API autenticada a expõe em `/unificado/mapa/api/rest/v1/vw_formas_status`.

## Avanço do contrato de leitura — 03/10/2026

O `app.js` original chama `rpc_dashboard_produtividade_resumo_v1` com três parâmetros. A RPC foi reproduzida em `api.rpc_dashboard_produtividade_resumo_v1` no PostgreSQL de testes e exposta em `/unificado/mapa/api/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1` por GET e POST, com a sessão Mapa. Ela lê apenas `api.producao`. `tests/mapa/contrato.py` comparou **21 combinações** de datas e escopos consultadas via GET no Supabase oficial com GET e POST da cópia: **42/42 pares** tiveram status e corpo equivalentes, desconsiderando apenas `generated_at` depois de validar que é timestamp ISO. A requisição sem sessão continua negada. As demais 31 capturas do navegador permanecem rascunhos, com respostas sintéticas, e ainda não contam como contrato aprovado.

**Decisão do Ricardo — preservar a liberação atual do Setor 4.** No `app.js` original, o clique no cartão dos Setores 1–3 testa `state.liberationMode` e chama `liberarFormaClicada`. O clique na célula da forma do Setor 4 (`createS4TableRow`) não testa esse modo: depois das verificações de manutenção, programação e ODIN, sempre chama `showConcreteTypePopup`. A captura local confirmou ausência de POST em `liberacao_formas` nesse fluxo. Ricardo decidiu preservar esse comportamento, sem corrigir o aplicativo. A evidência e os demais comportamentos suspeitos estão em `docs/comportamentos-atuais-suspeitos.md`.

`docs/diferencas-estrutura-mapa.md` compara as sete tabelas operacionais expostas pela OpenAPI oficial com o catálogo do PostgreSQL de testes. Após backup e migração de padrões/obrigatoriedade somente no banco de testes, as sete chaves primárias e todas as colunas comuns conferem. Resta a troca deliberada de `usuarios.senha` por `senha_hash`. A origem não expõe índices únicos adicionais, gatilhos e sequências pelo recurso REST usado; a equivalência desses itens segue pendente.
