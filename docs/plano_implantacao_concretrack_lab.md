# Plano de Implantação: CONCRETRACK LAB 🧪

## Visão Geral
O **CONCRETRACK LAB** é um Sistema de Gestão de Laboratório (LIMS) especializado em concreto e química do concreto. O sistema acompanhará toda a "vida do laboratório", desde a solicitação inicial até a emissão do laudo técnico e análise do histórico.

## Fases de Implantação

Para garantir uma entrega de valor contínua e mitigar riscos, a implantação será dividida em três grandes fases:

### Fase 1: MVP (Produto Mínimo Viável) - O Core do Laboratório
**Objetivo:** Estabelecer o fluxo operacional básico de ponta a ponta para que o laboratório possa abandonar planilhas e processos manuais críticos.

1. **Autenticação e Perfis (Base)**
   - Login e controle de acesso.
   - Perfis: Técnico de Laboratório, Supervisor/Engenheiro, Cliente.
2. **Dashboard Inicial (Visão Operacional)**
   - Painel com OS em aberto, concluídas e vencidas.
   - Alertas de amostras aguardando rompimento na data de hoje.
3. **Solicitação de Trabalho e Ordem de Serviço (OS)**
   - Cadastro simplificado de Obras e Clientes.
   - Abertura de solicitação de ensaios e geração da OS.
   - Tela de gestão de status de OS.
4. **Controle de Entrada de Amostras**
   - Registro de novas amostras com código único de identificação.
   - Vínculo direto com a OS e a Obra.
5. **Ensaios Normativos e ITs (Instruções de Trabalho)**
   - Catálogo de ensaios (Abatimento, Resistência à compressão, etc.).
   - Exibição de instrução de trabalho (passo a passo) para padronização.
   - Tela de lançamento de resultados para cada ensaio.
6. **Controle de Rompimentos (Coração do Sistema)**
   - Gestão de Corpos de Prova (CPs) organizados por idade (7, 14, 28 dias).
   - Tela de registro de cargas da prensa com cálculo automático para MPa.
   - Gráfico simples de evolução da resistência.
7. **Relatórios Técnicos**
   - Geração do laudo de Resistência à Compressão e Granulometria em formato PDF, com logotipo do laboratório.

---

### Fase 2: Módulos de Engenharia e Qualidade
**Objetivo:** Trazer inteligência técnica, controle de insumos e conformidade normativa para o sistema.

1. **Módulo de Dosagem e Curva A/C**
   - Inserção de métodos de dosagem (ABCP, ACI, etc.).
   - Calculadora para geração de traços em kg/m³ e saca/m³.
   - Lançamento de tentativas de argamassa e ajuste dinâmico da relação água/cimento (curva A/C) com base no histórico de rompimentos.
2. **Canal de Normas (Biblioteca)**
   - Módulo para upload e organização de normas (ABNT, ASTM, DNIT).
   - Vínculo visual da norma na tela de execução do ensaio.
3. **Controle de Produtos e Materiais**
   - Cadastro de lotes de insumos (cimento, agregados, aditivos).
   - Rastreabilidade: saber qual lote de cimento foi usado em qual amostra.
4. **Gestão de Equipamentos do Laboratório**
   - Cadastro de equipamentos (prensas, balanças) com número de patrimônio.
   - Alertas automáticos para vencimento de calibrações.
5. **Dashboard Gerencial Avançado**
   - Métricas avançadas: fck estimado, desvio padrão, eficiência do traço e taxa de reprovação.

---

### Fase 3: Integrações e Campo
**Objetivo:** Conectar o laboratório com a produção e escalar o controle tecnológico.

1. **Identificação por QR Code**
   - Geração de etiquetas QR Code para moldes de corpos de prova.
   - Leitura via celular para abrir a tela de lançamento de rompimento.
2. **Integração com Usina**
   - Sincronização do sistema do laboratório com o software de automação da usina de concreto.
3. **Portal do Cliente e Automações**
   - Envio automático de relatórios em PDF via e-mail.
   - Acesso externo para o cliente visualizar apenas os dados de sua obra.

---

## Backlog Priorizado (Foco MVP)

Abaixo estão as histórias de usuário iniciais para orientar o desenvolvimento da Fase 1:

| ID | História de Usuário (Como um... eu quero... para...) | Módulo | Prioridade |
|---|---|---|---|
| **US01** | ...técnico, quero registrar uma nova OS com múltiplos ensaios, para manter todo o histórico vinculado à obra. | Gestão de OS | **Alta** |
| **US02** | ...técnico, quero registrar o rompimento de um corpo‑de‑prova com leitura direta, para evitar erros de digitação. | Rompimentos | **Alta** |
| **US03** | ...supervisor, quero consultar o dashboard diariamente, para identificar amostras atrasadas. | Dashboard | **Alta** |
| **US04** | ...cliente/obra, quero solicitar novos ensaios via app, para agilizar a abertura de OS. | Solicitação | **Alta** |
| **US05** | ...laboratório, quero exportar um relatório de resistência em PDF com norma citada, para apresentar ao cliente. | Relatórios | **Alta** |
| **US06** | ...supervisor, quero vincular a norma aplicável a cada ensaio, para padronizar a documentação técnica. | Ensaios / Normas | **Alta** |
| **US07** | ...técnico, quero registrar uma nova amostra de concreto com código único, para facilitar o rastreamento. | Entrada | Média |
| **US08** | ...técnico, quero consultar a instrução de trabalho na tela, para seguir o procedimento corretamente. | Ensaios / IT | Média |
| **US09** | ...laboratório, quero salvar um traço de concreto calculado como padrão, para reutilizá‑lo em novas obras. | Dosagem | Média |
| **US10** | ...supervisor, quero receber alertas de calibração de equipamentos, para evitar riscos de medição. | Equipamentos | Média |
| **US11** | ...engenheiro, quero comparar a curva de resistência de obras, para avaliar a qualidade. | Dashboard/Dosagem | Média |
| **US12** | ...técnico, quero lançar tentativas de argamassa para ajustar o traço, otimizando a trabalhabilidade. | Dosagem | Baixa |
| **US13** | ...supervisor, quero gerenciar o estoque de consumíveis, para evitar falta de materiais. | Gestão de Lab | Baixa |

---

## Diretrizes de Arquitetura e Design Sugeridas

1. **Stack Tecnológica (Sugestão)**: 
   - **Frontend:** React.js ou Vue.js (para interfaces dinâmicas) ou Next.js (para um PWA robusto).
   - **Backend/Database:** Supabase (PostgreSQL + Auth) ou Node.js (se desejar criar APIs próprias). Ideal para escalar de forma rápida.
2. **Padrão de Design (UI/UX)**: 
   - Interface limpa e industrial ("padrão ConcreTrack").
   - Foco na usabilidade do técnico (botões grandes, campos otimizados para digitação rápida ou uso em tablet).
   - Cores de status muito claras (ex: Verde para Conforme, Vermelho para < fck).
3. **Modelagem de Dados Inicial (Passo Zero do Código)**:
   - Antes de criar telas, será necessário criar o diagrama de banco de dados interligando `Usuarios`, `Obras`, `OrdemServico`, `Amostras`, `Ensaios` e `Rompimentos`.
