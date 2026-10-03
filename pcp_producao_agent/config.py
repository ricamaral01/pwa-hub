import os
from pathlib import Path

from dotenv import load_dotenv

AGENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = AGENT_DIR.parent

# Ordem de precedência:
# 1. .env local do agente
# 2. .env da raiz do projeto
# 3. .env legado em mapa-concretagem
ENV_CANDIDATES = [
    AGENT_DIR / ".env",
    PROJECT_ROOT / ".env",
    PROJECT_ROOT / "mapa-concretagem" / ".env",
]

LOADED_ENV_PATH = None
for candidate in ENV_CANDIDATES:
    if candidate.exists():
        load_dotenv(dotenv_path=candidate, override=False)
        LOADED_ENV_PATH = candidate
        break

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fbvvdyirhtgvycullsqy.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Google Sheets
GOOGLE_CREDS_PATH = os.getenv(
    "GOOGLE_CREDS_PATH",
    r"G:\Outros computadores\Meu laptop\Concrefer\Relatórios Automatizados\Credenciais\sheetsautomacao-477114-9b74d04e460f.json",
)
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID", "1nEqNCdk-LoCq8lNeA5t02W3AJIvyfhtX0IeWSYHYEgY")

# WhatsApp
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE = os.getenv("WHATSAPP_PHONE", "")

# URL base pública dos relatórios (GitHub Pages / servidor)
# O caminho relativo ao repositório é concatenado automaticamente.
REPORT_BASE_URL = os.getenv("REPORT_BASE_URL", "https://usina.concretrack.com.br")

# Agent settings
DRY_RUN = os.getenv("DRY_RUN", "true").lower() in ("true", "1", "yes")
PCP_PROGRAM_SOURCE = os.getenv("PCP_PROGRAM_SOURCE", "none").strip().lower()
META_FORA_PADRAO_DIARIA = float(os.getenv("META_FORA_PADRAO_DIARIA", "0.02"))

# Base directory for reports. In production this can point to the ERP public
# directory, e.g. /var/www/concretrack-erp/public/relatorios/reports-diarios/generated/pcp-producao.
REPORTS_DIR = Path(
    os.getenv(
        "REPORTS_DIR",
        str(PROJECT_ROOT / "relatorios" / "defeitos-concreto" / "diario"),
    )
).expanduser()
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def missing_required_settings(include_google=True):
    """Retorna configurações obrigatórias ausentes ou inválidas."""
    missing = []

    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_KEY:
        missing.append("SUPABASE_KEY")

    if include_google:
        if not GOOGLE_CREDS_PATH:
            missing.append("GOOGLE_CREDS_PATH")
        elif not Path(GOOGLE_CREDS_PATH).expanduser().exists():
            missing.append(f"GOOGLE_CREDS_PATH não encontrado: {GOOGLE_CREDS_PATH}")

        if not SPREADSHEET_ID:
            missing.append("SPREADSHEET_ID")

    return missing


def env_status_lines():
    """Resumo seguro da configuração, sem imprimir segredos."""
    google_creds_ok = bool(GOOGLE_CREDS_PATH and Path(GOOGLE_CREDS_PATH).expanduser().exists())

    return [
        f"Arquivo .env carregado: {LOADED_ENV_PATH if LOADED_ENV_PATH else 'nenhum'}",
        f"SUPABASE_URL: {'OK' if SUPABASE_URL else 'ausente'}",
        f"SUPABASE_KEY: {'OK' if SUPABASE_KEY else 'ausente'}",
        f"GOOGLE_CREDS_PATH: {'OK' if google_creds_ok else 'ausente ou caminho inválido'}",
        f"SPREADSHEET_ID: {'OK' if SPREADSHEET_ID else 'ausente'}",
        f"WHATSAPP_API_URL: {'OK' if WHATSAPP_API_URL else 'ausente/opcional'}",
        f"WHATSAPP_PHONE: {'OK' if WHATSAPP_PHONE else 'ausente/opcional'}",
        f"DRY_RUN: {DRY_RUN}",
        f"PCP_PROGRAM_SOURCE: {PCP_PROGRAM_SOURCE}",
        f"REPORTS_DIR: {REPORTS_DIR}",
    ]
