import argparse
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Configura codificação UTF-8 no console do Windows para evitar erros com acentos/emojis.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except AttributeError:
    pass

# Permite execução tanto pela raiz do projeto quanto dentro da pasta do agente.
sys.path.append(str(Path(__file__).resolve().parent))

import config
from comparator import Comparator
from concretrack_client import ConcretrackClient
from git_publisher import GitPublisher
from google_sheets_client import GoogleSheetsClient
from html_report import HtmlReportGenerator
from whatsapp_sender import WhatsAppSender

logger = logging.getLogger("pcp_producao_agent")
logger.setLevel(logging.INFO)
logger.handlers.clear()

formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

log_file = Path(__file__).resolve().parent / "agent_execution.log"
file_handler = logging.FileHandler(log_file, encoding="utf-8")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)


def parse_date(date_arg):
    if not date_arg or date_arg.lower() == "hoje":
        return datetime.now().strftime("%Y-%m-%d")
    if date_arg.lower() == "ontem":
        return (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    try:
        datetime.strptime(date_arg, "%Y-%m-%d")
        return date_arg
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"Data inválida: '{date_arg}'. Use o formato YYYY-MM-DD, 'hoje' ou 'ontem'."
        )


def check_config():
    logger.info("Verificando configuração do Agente PCP x Produção...")
    for line in config.env_status_lines():
        logger.info(line)

    missing = config.missing_required_settings(include_google=True)
    if missing:
        logger.error("Configuração incompleta:")
        for item in missing:
            logger.error(f"- {item}")
        logger.error(
            "Crie pcp_producao_agent/.env a partir de pcp_producao_agent/.env.example "
            "e preencha os valores obrigatórios."
        )
        return 1

    logger.info("Configuração mínima OK.")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Agente de Comparação Diária PCP x Produção ConcreTrack")
    parser.add_argument("--data", type=str, default="ontem", help="Data a ser analisada: YYYY-MM-DD, 'hoje' ou 'ontem'")
    parser.add_argument("--dry-run", action="store_true", help="Executa em simulação, sem enviar mensagem para WhatsApp")
    parser.add_argument("--check-config", action="store_true", help="Valida o ambiente sem executar consultas externas")

    args = parser.parse_args()

    if args.dry_run:
        config.DRY_RUN = True

    if args.check_config:
        sys.exit(check_config())

    date_str = parse_date(args.data)

    logger.info("==================================================================")
    logger.info(f"Iniciando ciclo do Agente PCP x Produção para a data: {date_str}")
    logger.info(f"Modo Dry-Run: {config.DRY_RUN}")
    logger.info(f"Arquivo .env carregado: {config.LOADED_ENV_PATH if config.LOADED_ENV_PATH else 'nenhum'}")
    logger.info("==================================================================")

    missing = config.missing_required_settings(include_google=False)
    if missing:
        logger.critical("Configuração obrigatória ausente:")
        for item in missing:
            logger.critical(f"- {item}")
        logger.critical(
            "Crie pcp_producao_agent/.env a partir de pcp_producao_agent/.env.example "
            "e preencha os valores obrigatórios."
        )
        sys.exit(1)

    try:
        client_ct = ConcretrackClient()
        prod_rows = client_ct.fetch_production(date_str)
        prod_month_rows = client_ct.fetch_production_month(date_str)
        massada_problems = client_ct.fetch_massada_problems(date_str)
    except Exception as e:
        logger.critical(f"Falha ao conectar ao ConcreTrack/Supabase: {e}")
        logger.critical("Execução abortada para evitar geração de relatório incompleto.")
        sys.exit(1)

    pcp_rows = []
    sheets_ok = False
    if config.PCP_PROGRAM_SOURCE == "none":
        logger.warning("PCP_PROGRAM_SOURCE=none. Programação oficial considerada zerada para esta execução.")
    else:
        try:
            client_sheets = GoogleSheetsClient()
            pcp_rows = client_sheets.fetch_pcp_programacao(date_str)
            sheets_ok = True
        except Exception as e:
            logger.error(f"Erro ao acessar planilha do PCP (Google Sheets): {e}")
            logger.warning("Prosseguindo com comparação parcial (PCP programado = 0).")

    comparator = Comparator()
    comparison_data = comparator.compare(pcp_rows, prod_rows)
    comparison_data["qualidade"] = comparator.build_quality_analysis(prod_rows, prod_month_rows, date_str)
    comparison_data["massada_problems"] = massada_problems

    if not sheets_ok:
        comparison_data["analise"]["recomendacoes"].insert(
            0,
            "⚠️ Aviso: programação oficial de PCP não foi carregada nesta execução. "
            "Os dados programados aparecem zerados.",
        )

    report_gen = HtmlReportGenerator()
    report_path = report_gen.generate(comparison_data, date_str)

    publisher = GitPublisher()
    public_url = publisher.publish(report_path, date_str)
    if not public_url and not config.DRY_RUN:
        logger.critical("Publicação do relatório falhou; envio do WhatsApp cancelado.")
        sys.exit(1)
    report_link = public_url or str(report_path)

    whatsapp = WhatsAppSender()
    if not whatsapp.send_summary(comparison_data, date_str, report_link):
        logger.critical("Envio do WhatsApp falhou.")
        sys.exit(1)

    logger.info("Ciclo do Agente PCP x Produção finalizado com sucesso.")
    logger.info("==================================================================")


if __name__ == "__main__":
    main()
