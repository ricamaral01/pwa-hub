# Decisões aprovadas — Suprimentos S0–S1

Fonte: `prompt-execucao-s0-s1.md`, aprovado por Ricardo em 25/10/2026. Esta página registra decisões; a execução e as verificações ficam nas evidências E1–E7.

| ID | Decisão |
|---|---|
| D1 | Serviço FastAPI isolado no padrão Qualidade, systemd próprio, loopback, ambiente fora do repositório e assertion curta `X-Suprimentos-Assertion` emitida pelo gateway com `auth_request`. |
| D2 | Banco dedicado, schema `suprimentos`, tabelas `sup_*` e migrations somente por Alembic, sem `create_all`. |
| D3 | Unidade de medida, conversão, material, CA e fornecedor globais. `sup_material_unidade`, local, endereço, centro de custo, alçada, parâmetro, papel, flag e documentos por unidade. |
| D4 | `sup_unidade` própria com ID smallint, código único e seed `campinas`. Nenhuma FK entre bancos; API aceita código. |
| D5 | UUIDv7 gerado no serviço para cadastros/documentos, número `SOL-00001` por unidade; bigint identity apenas no livro de movimentos futuro. |
| D6 | Usuário referenciado por `iam_user_id` textual e nome exibido guardado na ação; sem tabela local de usuários. |
| D7 | Papéis SOLICITANTE, APROVADOR, ALMOXARIFE, COMPRADOR, QUALIDADE e ADMIN em `sup_usuario_papel`, sempre com controle por ação, unidade e CC. `cc_id NULL` vale para todos os CCs da unidade; CC preenchido vale somente para aquele CC, inclusive para SOLICITANTE e ADMIN. O ADMIN tem todas as ações da unidade dentro do próprio escopo de CC, mas só aprova/devolve/reprova se também tiver APROVADOR do nível exigido. A alçada monetária permanece separada. Esclarecimento aprovado em 25/10/2026. |
| D8 | `sup_flag` por unidade/fase consultada por API e casca. Campinas S0/S1 habilitadas somente em homologação. |
| D9 | Auditoria de criação/edição; cadastros desativados logicamente; toda transição documental em `sup_evento`. |
| D10 | Compras, recebimento, IA, jobs de NF, GED, NC, estoque e integração Laboratório ficam fora de S0–S1. |
| D11 | Até três fotos por solicitação, até 2 MB cada após compressão; armazenamento privado, SHA-256 e download autenticado/autorizado. |
| D12 | PWA usa sessão do Unificado, renovação própria e revogável no escopo de Suprimentos, sem token PCP; expiração pausa a fila sem apagá-la. |
| D13 | Valores e alçadas provisórios marcados `a_confirmar=true` e editáveis em Cadastros e alçadas. |
| D14 | Notificações nesta fase só em badge/lista interna; push posterior. |

Os itens D1–D14 são vinculantes. A implementação deve registrar qualquer impossibilidade real em `progresso.md` antes de parar.

## Decisões F1 — compras e fornecedores

| ID | Decisão |
|---|---|
| D15 | A fase S3A funciona em Campinas na homologação sem depender de estoque. O destino `COMPRA` do item aprovado alimenta a fila de cotação e o recebimento simples atende diretamente à solicitação de origem. |
| D16 | Homologação de fornecedor exige parecer da QUALIDADE; somente `HOMOLOGADO` ou `HOMOLOGADO_CONDICIONAL` pode receber OC. Exceção emergencial requer aprovação da QUALIDADE no evento da cotação. |
| D17 | Validade de homologação de 12 meses, mínimo de três propostas acima de R$ 1.000, retorno à alçada quando a OC excede o aprovado em 10%, pesos e faixas de IQF são parâmetros `a_confirmar` editáveis em Cadastros e alçadas. |
| D18 | O envio de OC por e-mail permanece desligado por `S3A_EMAIL` até configuração e validação de SMTP. O envio manual registra o evento e preserva o PDF do pedido. |
| D19 | O custo posto da proposta inclui preço líquido, IPI, ICMS-ST e frete FOB rateado; a recuperação fiscal de tributos depende de definição contábil futura e não é presumida. |

## Decisões F2 — almoxarifado

| ID | Decisão |
|---|---|
| D20 | `sup_movimento` é livro imutável com ID `bigint identity`, chave de idempotência por unidade e estorno vinculando o lançamento original. Saldo, reserva e custo médio são projeções transacionais; saída não consome estoque reservado para outra solicitação. |
| D21 | A aprovação final da solicitação reserva o saldo disponível em ordem estável por endereço. O restante usa a coluna `qtd_comprar` já existente em S1 e só esse restante entra na cotação. A reserva é liberada no cancelamento do item ou da solicitação. |
| D22 | Inventário cíclico é cego até o corte; movimentos posteriores permanecem. Diferença de EPI exige aprovação por outro almoxarife; para os demais, diferença acima de R$ 200 e fora da tolerância de 2% exige aprovação. Os dois valores estão em `sup_parametro` com `a_confirmar=true`. |
| D23 | O ponto de pedido usa consumo dos últimos 30 dias × (lead time + dias de segurança). A sugestão reaproveita `sup_sugestao_ressuprimento`; o comprador informa o CC ao confirmar, criando uma solicitação em rascunho que segue à aprovação normal. Sugestões ativas ou já confirmadas com solicitação aberta não se duplicam. |
| D24 | A valoração definitiva do recebimento de NF (item + IPI + frete rateado, sem crédito presumido de ICMS) entra na F3; a entrada manual da F2 exige custo unitário informado e mantém o custo médio móvel. O tratamento fiscal permanece `a_confirmar` pela contabilidade. |

## Decisões F3 — recebimento, NF e inspeção

| ID | Decisão |
|---|---|
| D25 | Leitura de NF usa a fila transacional `sup_nf_job` e um timer próprio de um minuto. Provedor é configurado por URL e chave de ambiente. Sem ambos, o job fica `DESLIGADO` e o fluxo manual segue. O JSON sugerido nunca altera campos confirmados sem ação humana. |
| D26 | O frete total da NF é rateado pelo valor `quantidade contada × preço da NF` de cada item liberado, arredondado a centavos com resíduo no último item. Custo de entrada = item + IPI + frete; não presume crédito de ICMS. A regra fiscal continua provisória para validação contábil. |
| D27 | O IQF automático usa prazo, quantidade, qualidade e documentação do recebimento. Atendimento começa com nota provisória 3/5 e é confirmado manualmente, com evento e recálculo da média móvel de 12 meses. A avaliação estornada permanece no histórico, excluída da média vigente. |
| D28 | Reprovação gera `sup_nc_pendente` com chave idempotente e fila visível à Qualidade. A integração automática serviço a serviço aguarda contrato de autenticação da Qualidade; não será usada a sessão privilegiada do operador. |
| D29 | Recebimento confirmado só é corrigido por estorno e documento de versão seguinte. Movimentos do estoque são compensados, a entrega histórica recebe marca de estorno e a avaliação IQF é preservada como estornada. Não há exclusão física. |
