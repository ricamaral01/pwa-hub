import argparse
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Configura codificação UTF-8 no console do Windows para evitar erros com emojis
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# Adiciona o diretório atual ao path para importações relativas funcionarem
sys.path.append(str(Path(__file__).resolve().parent))

from config import REPORTS_DIR
from google_sheets_client import GoogleSheetsClient
from concretrack_client import ConcretrackClient
from comparator import Comparator
from html_report import HtmlReportGenerator
from whatsapp_sender import WhatsAppSender
import config

# Configura o logger do agente
logger = logging.getLogger("pcp_producao_agent")
logger.setLevel(logging.INFO)

# Formato dos logs
formatter = logging.Formatter('[%(asctime)s] %(levelname)s - %(message)s')

# Handler para console
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Handler para arquivo de logs na pasta do agente
log_file = Path(__file__).resolve().parent / "agent_execution.log"
file_handler = logging.FileHandler(log_file, encoding="utf-8")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

def parse_date(date_arg):
    if not date_arg or date_arg.lower() == "hoje":
        return datetime.now().strftime("%Y-%m-%d")
    if date_arg.lower() == "ontem":
        return (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Valida formato YYYY-MM-DD
    try:
        datetime.strptime(date_arg, "%Y-%m-%d")
        return date_arg
    except ValueError:
        raise argparse.ArgumentTypeError(f"Data inválida: '{date_arg}'. Use o formato YYYY-MM-DD, 'hoje' ou 'ontem'.")

def main():
    parser = argparse.ArgumentParser(description="Agente de Comparação Diária PCP x Produção ConcreTrack")
    parser.add_argument("--data", type=str, default="ontem", help="Data a ser analisada (YYYY-MM-DD, 'hoje' ou 'ontem')")
    parser.add_argument("--dry-run", action="store_true", help="Executa o agente em modo simulação, sem enviar mensagem para o WhatsApp")
    
    args = parser.parse_args()
    date_str = parse_date(args.data)
    
    # Sobrescreve configuração de dry_run se passado por argumento
    if args.dry_run:
        config.DRY_RUN = True

    logger.info("==================================================================")
    logger.info(f"Iniciando ciclo do Agente PCP x Produção para a data: {date_str}")
    logger.info(f"Modo Dry-Run: {config.DRY_RUN}")
    logger.info("==================================================================")

    # 1. Obter produção realizada do ConcreTrack (Supabase)
    prod_rows = []
    concretrack_ok = False
    try:
        client_ct = ConcretrackClient()
        prod_rows = client_ct.fetch_production(date_str)
        concretrack_ok = True
    except Exception as e:
        logger.critical(f"Falha ao conectar ao ConcreTrack/Supabase: {e}")
        logger.critical("Execução abortada para evitar a geração de relatório incompleto.")
        sys.exit(1)

    # 2. Obter programação planejada do Google Sheets
    pcp_rows = []
    sheets_ok = False
    try:
        client_sheets = GoogleSheetsClient()
        pcp_rows = client_sheets.fetch_pcp_programacao(date_str)
        sheets_ok = True
    except Exception as e:
        logger.error(f"Erro ao acessar planilha do PCP (Google Sheets): {e}")
        logger.warning("Prosseguindo com comparação parcial (PCP programado = 0)...")

    # 3. Executar correspondência e comparação de dados
    comparator = Comparator()
    comparison_data = comparator.compare(pcp_rows, prod_rows)

    # Adiciona aviso de erro de conexão caso a planilha do Sheets tenha falhado
    if not sheets_ok:
        comparison_data["analise"]["recomendacoes"].insert(
            0, "⚠️ Aviso: Não foi possível acessar a planilha Google PCP - DIÁRIO. Os dados programados aparecem zerados."
        )

    # 4. Gerar relatório executivo em HTML
    report_gen = HtmlReportGenerator()
    report_path = report_gen.generate(comparison_data, date_str)

    # 5. Enviar resumo executivo via WhatsApp
    whatsapp = WhatsAppSender()
    whatsapp.send_summary(comparison_data, date_str, report_path)

    logger.info("Ciclo do Agente PCP x Produção finalizado com sucesso.")
    logger.info("==================================================================")

if __name__ == "__main__":
    main()
