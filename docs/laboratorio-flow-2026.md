# Flow 2026 — consulta, dados simulados e publicação

Publicado em 26/10/2026 no Laboratório do Unificado. A consulta fica em
`/unificado/laboratorio/slump/flow.html`, com acesso pela tela de registro de
Slump e Flow. Permite um dia, 5 dias, 15 dias, 1 mês e datas personalizadas
nesse limite; o botão de impressão usa o logo Concrefer e gera PDF pelo navegador.

Os valores de Flow são **simulados** (480–700 mm), não medições de laboratório.
Eles estão em `ensaio_postes.flow_simulado`, separados de
`ensaio_postes.slump_registro`. A consulta e o relatório mostram a quantidade
de registros medidos e simulados no resumo e a data de origem da série. O CSV
privado usado na carga foi extraído somente para leitura do espelho
`controle_est_concre_campinas.public.tbl_massadas` em 26/10/2026 e não é
enviado ao repositório público. O
gerador `generate_flow_2026.py` seleciona até duas séries válidas do mesmo dia,
preserva zeros à esquerda e usa dois horários fixos, 09:10 e 14:20. Quando havia
apenas uma série válida, ela foi usada nos dois exemplos do dia. A série zero
foi descartada por ser um marcador, não um número de série válido.

A base contém 320 exemplos em 160 dias úteis, de 24/02/2026 a 26/10/2026.
Há 261 dias de segunda a sexta em 2026; os 101 sem série válida na origem
ficaram vazios conforme decisão do solicitante. Não há geração automática
para novas massadas. A execução do gerador é idempotente para o mesmo snapshot.

Validação: 4 testes Python passaram; JavaScript e Python passaram na verificação
de sintaxe. Na VPS, a API autenticada retornou dois exemplos para 26/10,
e HTML, CSS, JavaScript e logo responderam 200. O banco confirmou 320 linhas,
2 por dia, valores mínimo/máximo 480/700, horários 09:10/14:20 e nenhum vínculo
com data de origem diferente. O serviço `laboratorio-unificado.service` ficou ativo.
Backup dos arquivos anteriores e SQL de geração:
`/opt/concrefer-unificado/backups/flow-20261026-161232`.

## Correção de acesso em 26/10/2026

A página `slump/flow.html` e a API `api/slump/flow` não estavam associadas à
permissão `labSlump` no gateway. A página retornava 403 e a API caía na
permissão de Monitoramento. `screen_access.py` agora associa todos os caminhos
sob `/unificado/laboratorio/slump/` e `/unificado/laboratorio/api/slump/` à
permissão existente. O arquivo anterior está em
`/opt/concrefer-unificado/backups/flow-access-20261026/screen_access.py`.

Os IDs IAM ativos `user-ricardo`, `philippe`, `alex` e `marcelo` são masters e
recebem automaticamente todos os IDs cadastrados no catálogo do Unificado,
inclusive telas novas. O teste `tests/auth/test_flow_screen_access.py` confere
essa regra e o vínculo das rotas do Flow. Em produção, sessões assinadas com
os dados atuais dessas quatro contas receberam 204 no gateway e 200 na página
e na API públicas. Uma conta sem concessão recebeu 403 nas duas rotas do gateway.
O serviço `mapa-unificado-auth.service` ficou ativo, sem erros no journal.

## Colaborador no relatório

Em 26/10/2026, a coluna visual “Natureza” foi substituída por “Colaborador”.
Os 320 exemplos receberam nomes de demonstração: **288 Philippe Augusto
(90%)** e **32 Josué Rodrigues (10%)**. A atribuição é determinística e fica
na coluna `flow_simulado.colaborador`; a API também a retorna. A página mantém
o aviso de que os valores e nomes atribuídos são simulados e o resumo continua
separando registros medidos e simulados. O relatório impresso mostra a nova
coluna. O backup anterior à migração está em
`/opt/concrefer-unificado/backups/flow-colaborador-20261026-172333`.
