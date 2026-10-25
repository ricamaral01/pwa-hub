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
| D7 | Papéis SOLICITANTE, APROVADOR, ALMOXARIFE, COMPRADOR, QUALIDADE e ADMIN em `sup_usuario_papel`, sempre com controle por ação, unidade e CC. Alçada monetária separada. |
| D8 | `sup_flag` por unidade/fase consultada por API e casca. Campinas S0/S1 habilitadas somente em homologação. |
| D9 | Auditoria de criação/edição; cadastros desativados logicamente; toda transição documental em `sup_evento`. |
| D10 | Compras, recebimento, IA, jobs de NF, GED, NC, estoque e integração Laboratório ficam fora de S0–S1. |
| D11 | Até três fotos por solicitação, até 2 MB cada após compressão; armazenamento privado, SHA-256 e download autenticado/autorizado. |
| D12 | PWA usa sessão do Unificado, renovação própria e revogável no escopo de Suprimentos, sem token PCP; expiração pausa a fila sem apagá-la. |
| D13 | Valores e alçadas provisórios marcados `a_confirmar=true` e editáveis em Cadastros e alçadas. |
| D14 | Notificações nesta fase só em badge/lista interna; push posterior. |

Os itens D1–D14 são vinculantes. A implementação deve registrar qualquer impossibilidade real em `progresso.md` antes de parar.
