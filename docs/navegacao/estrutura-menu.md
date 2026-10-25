# Estrutura final do menu do Unificado

Fonte: configuração de produção em `unificado/shell/menu.config.js`, com apresentação feita por `navigation.js`. Itens sem permissão não são exibidos. IDs, URLs e regras IAM permanecem na configuração original.

Em Produção, apenas a exibição agrupa as telas por unidade. Nos outros módulos, os grupos originais são mantidos. A configuração atual não contém subgrupos adicionais; quando existirem, a hierarquia pode ser estendida sem mudar rotas.

## Planejamento

- Itens diretos: Dashboard, Programado vs Realizado.
- Programação (5): Setor 1 e 2, Setor 3 e 4, Circular Setor 3, DT Setor 4, Programação Final.
- Relatórios de Programação (3): Setor 1 e 2, Setor 3, Setor 4.
- Etiquetas (3): Padrão, SC-Prod., Armaduras.
- Acompanhamento (5): PCP Diário, Acompanhamento Mensal, Acompanhamento Mensal Setor 3 e 4, Apontamento Mega, Fechamento Diário.
- Produção e apoio (5): Produção PCP, Mão de Obra, Rateio de Mão de Obra, Formas por Setor, Teste Programação.

## Produção

- Campinas (18 telas em 4 grupos):

  - Produção (6): Produção / Liberação, Setor 1, Setor 2, Setor 3, Setor 4, Mandril Circular.
  - Montagem (3): Inspeção Setor 3 e 4, Montagem Postes, Sequência Setor 3.
  - Controle (5): Relatório Enc. Produção, Histórico, Acmp. Concretagem, Manutenção Formas, Tratativa Defeitos.
  - Indicadores (4): Dashboard Montagem, Dashboard Defeitos, Dashboard Concretagem Matriz, Painel TV — Formas.
- Pederneiras (5 telas, sem subgrupo): Apontamento do dia, Mão de obra, Produção Pederneiras, Indicadores, Cadastro de produtos.

## Qualidade

- Não conformidades (4): Painel, Abrir NC, Resultados de bancada, Cadastros.

## Usinas

- Geral (4): Cartas de traço, Controle estatístico, Relatórios gerenciais, Controle de estoque.

## Laboratório

- Corpos de Prova (3): Etiquetas QR, Leitura de CP, Resultados dos corpos de prova.
- Controle estatístico (3): Visão geral, Análise estatística, Relatório CEC.
- Dosagem (14): Visão geral, Empacotamento, Volume, Comparação dos métodos, Traços, Materiais, Fornecedores, Ensaios, Ferramentas, Custos, Referência, Produção, Importação, Configurações.
- Concreto fresco (1): Registro de slump / flow.
- Usina de Campinas (1): Relatórios e custos.
- Cura térmica (3): Monitoramento, Histórico de medições, Dispositivo.
- Postes (6): Certificados de qualidade, Ensaio de postes, Absorção, Histórico de ensaios, Cadastros, Critérios.
- Cronoanálise (7): Início, Coletar, Medições, Catálogo, Dimensionar, Simular, Metodologia.
- Itens diretos: Como funciona.

## GED

- Gestão documental (5): Painel, Documentos, Aprovações, Tarefas, Calibrações.

## Comportamento comum

- Busca global em todos os módulos permitidos, com caminho completo do resultado.
- Expandir tudo e Recolher tudo atuam sobre a árvore do módulo atual.
- Estado de cada unidade e grupo em `localStorage`, separado por usuário e módulo; o caminho ativo abre automaticamente.
- O filtro do IAM remove itens sem acesso e grupos vazios.
- Links de rodapé existentes: Como funciona (quando permitido), Usuários (quando permitido), Relatar problema.
