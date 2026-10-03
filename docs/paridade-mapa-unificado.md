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

O serviço publicado em `/unificado/mapa/` permite apenas consulta histórica. Nenhum fluxo de apontamento está aprovado para uso operacional no PostgreSQL neste momento.

## Preparação já feita

`scripts/build_unificado_mapa_tablet.py` monta uma cópia de trabalho em `.work-mapa-unificado/tablet/`, fora da árvore publicada. Ela parte da interface atual, preserva os modos e os eventos dos cartões, usa a sessão unificada para entrada e saída, aceita o parâmetro `?tela=` dos atalhos e substitui os endereços operacionais externos por rotas do ambiente de testes. O service worker da origem fica desativado nessa cópia para não misturar caches. As rotas de escrita, fotos, RPCs e integrações PCP ainda precisam ser implementadas antes de publicar a cópia.

`unificado/mapa/database/api_formas_status.sql` reproduz no PostgreSQL o contrato de leitura `vw_formas_status` usado para colorir os cartões. A visão foi aplicada somente ao banco de testes; a API autenticada a expõe em `/unificado/mapa/api/rest/v1/vw_formas_status`.

## Avanço do contrato de leitura — 03/10/2026

O `app.js` original chama `rpc_dashboard_produtividade_resumo_v1` com três parâmetros. A RPC foi reproduzida em `api.rpc_dashboard_produtividade_resumo_v1` no PostgreSQL de testes e exposta em `/unificado/mapa/api/rest/v1/rpc/rpc_dashboard_produtividade_resumo_v1` por GET e POST, com a sessão Mapa. Ela lê apenas `api.producao`. `tests/mapa/contrato.py` comparou **21 combinações** de datas e escopos consultadas via GET no Supabase oficial com GET e POST da cópia: **42/42 pares** tiveram status e corpo equivalentes, desconsiderando apenas `generated_at` depois de validar que é timestamp ISO. A requisição sem sessão continua negada. As demais 31 capturas do navegador permanecem rascunhos, com respostas sintéticas, e ainda não contam como contrato aprovado.

`docs/diferencas-estrutura-mapa.md` compara as sete tabelas operacionais expostas pela OpenAPI oficial com o catálogo do PostgreSQL de testes. Há a troca deliberada de `usuarios.senha` por `senha_hash`, além de diferenças em padrões ou obrigatoriedade que precisam ser resolvidas ou validadas por contrato antes de habilitar escrita. A origem não expõe índices únicos adicionais, gatilhos e sequências pelo recurso REST usado; a equivalência desses itens segue pendente.
