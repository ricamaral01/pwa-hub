import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega o .env local
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# Se não encontrar o .env local do agente, carrega o .env raiz da pasta mapa-concretagem
if not env_path.exists():
    root_env_path = Path(__file__).resolve().parents[2] / "mapa-concretagem" / ".env"
    load_dotenv(dotenv_path=root_env_path)

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fbvvdyirhtgvycullsqy.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Google Sheets
GOOGLE_CREDS_PATH = os.getenv(
    "GOOGLE_CREDS_PATH",
    r"G:\Outros computadores\Meu laptop\Concrefer\Relatórios Automatizados\Credenciais\sheetsautomacao-477114-9b74d04e460f.json"
)
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID", "1nEqNCdk-LoCq8lNeA5t02W3AJIvyfhtX0IeWSYHYEgY")

# WhatsApp
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE = os.getenv("WHATSAPP_PHONE", "")

# Agent settings
DRY_RUN = os.getenv("DRY_RUN", "true").lower() in ("true", "1", "yes")

# Base directory for reports
REPORTS_DIR = Path(__file__).resolve().parents[2] / "relatorios" / "pcp-producao"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
