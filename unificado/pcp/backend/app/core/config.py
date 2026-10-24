from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Banco de dados
    DATABASE_URL: str = "postgresql://pcp_user:pcp_pass@localhost:5432/pcp_concrefer"

    # JWT
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_STRONG_RANDOM_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas

    # Segurança HTTP/CORS
    CORS_ALLOW_ORIGINS: str = "https://pcp.concretrack.com.br,http://localhost:8000,http://127.0.0.1:8000"
    TRUSTED_HOSTS: str = "pcp.concretrack.com.br,localhost,127.0.0.1"
    FORCE_HTTPS: bool = False
    SECURITY_HSTS_SECONDS: int = 31536000
    ENABLE_DOCS: bool = True

    # App
    APP_NAME: str = "PCP Concrefer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Supabase - apontamentos de producao realizada
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_PRODUCAO_TABLE: str = "producao"

    # Google Sheets - alocacao automatica de formas
    GOOGLE_CREDENTIALS: str = ""
    SPREADSHEET_ID: str = ""
    SPREADSHEET_ID_09: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
