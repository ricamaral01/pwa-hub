# Agente de Comparação Diária PCP x Produção

Este agente em Python automatiza a comparação diária entre o planejado na planilha **Google PCP - DIÁRIO** (preenchido pelo encarregado) e o realizado apontado no **Mapa de Concretagem** (salvo no Supabase pelos operadores). 

Após a consolidação, o agente gera um relatório HTML executivo de alta fidelidade e envia um resumo contendo a porcentagem de aderência e as principais pendências para o WhatsApp do gestor.

---

## Estrutura do Agente

* `agent_pcp_producao.py`: Ponto de entrada que orquestra a execução e aceita parâmetros de data por CLI.
* `google_sheets_client.py`: Módulo responsável pela leitura de dados da planilha Google via API.
* `concretrack_client.py`: Módulo que consulta os apontamentos de produção diretamente no Supabase.
* `comparator.py`: Motor de regras que associa as programações e define os status (`REALIZADO`, `PARCIAL`, `EXCEDENTE`, `NÃO PRODUZIDO`, `NÃO PROGRAMADO`).
* `html_report.py`: Gerador do relatório em HTML responsivo.
* `whatsapp_sender.py`: Módulo de envio de mensagens para o WhatsApp.
* `config.py`: Carregador de configurações locais e do arquivo `.env`.

---

## Requisitos e Instalação

1. Certifique-se de possuir o **Python 3.8+** instalado.
2. Navegue até a pasta do agente e instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

---

## Configuração de Ambiente (.env)

Crie um arquivo `.env` na pasta do agente (ou use as configurações globais do projeto na pasta raiz) com as seguintes chaves:

```env
# Banco de Dados Supabase (ConcreTrack)
SUPABASE_URL=https://fbvvdyirhtgvycullsqy.supabase.co
SUPABASE_KEY=sua_chave_anon_aqui

# Caminho para o JSON de Credenciais da API do Google Sheets
GOOGLE_CREDS_PATH=G:\Outros computadores\Meu laptop\Concrefer\Relatórios Automatizados\Credenciais\sheetsautomacao-477114-9b74d04e460f.json
SPREADSHEET_ID=1nEqNCdk-LoCq8lNeA5t02W3AJIvyfhtX0IeWSYHYEgY

# WhatsApp Business / Webhook de Integração (Opcional)
WHATSAPP_API_URL=https://seu-provedor.com/v1/messages
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_PHONE=5511999999999

# Configurações do Agente
DRY_RUN=true
```

---

## Como Rodar Manualmente

### 1. Testar em Modo de Simulação (Dry-Run / Sem Enviar WhatsApp)
Para testar a conexão com o Google Sheets, Supabase e verificar o relatório gerado sem disparar mensagens, rode:
```bash
python agent_pcp_producao.py --data ontem --dry-run
```
*(Você também pode definir a data como `hoje` ou passar uma data específica no formato `YYYY-MM-DD`)*.

### 2. Executar Envio Completamente (Produção)
Para rodar de forma definitiva enviando a notificação de WhatsApp, certifique-se de que a variável `DRY_RUN` no `.env` está configurada como `false` (ou não passe o argumento `--dry-run`):
```bash
python agent_pcp_producao.py --data ontem
```

---

## Destino dos Relatórios

Os relatórios HTML gerados são salvos automaticamente no diretório:
`relatorios/pcp-producao/relatorio_pcp_producao_YYYY-MM-DD.html`

---

## Agendamento da Execução Diária (Cron / Windows Task Scheduler)

### Linux (Cron)
Para rodar o agente automaticamente todos os dias às **07:00 da manhã** analisando o dia anterior (`ontem`):
1. Abra o editor de tarefas:
   ```bash
   crontab -e
   ```
2. Adicione a seguinte linha (ajustando os caminhos de ambiente):
   ```cron
   0 7 * * * /usr/bin/python3 /caminho/do/projeto/pcp_producao_agent/agent_pcp_producao.py --data ontem >> /caminho/do/projeto/pcp_producao_agent/cron_execution.log 2>&1
   ```

### Windows (Agendador de Tarefas)
1. Abra o **Agendador de Tarefas** (Task Scheduler) do Windows.
2. Crie uma **Nova Tarefa Básica**.
3. Defina o disparador para **Diário**, às **07:00**.
4. En Ação, selecione **Iniciar um programa**:
   * **Programa/script:** `python.exe` (ou o caminho completo do seu binário python)
   * **Adicionar argumentos:** `agent_pcp_producao.py --data ontem`
   * **Iniciar em:** `C:\Users\Admin\Documents\pwa-hub\pcp_producao_agent` (ou caminho correto da pasta)
