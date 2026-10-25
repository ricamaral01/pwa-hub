import os
from dotenv import load_dotenv


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


class Settings:
    def __init__(self) -> None:
        load_dotenv()
        self.POSTGRES_URL = _required("POSTGRES_URL")
        self.SECRET_KEY = _required("SECRET_KEY")
        self.ADMIN_USER = _required("ADMIN_USER")
        self.ADMIN_PASSWORD = _required("ADMIN_PASSWORD")
        self.SESSION_MAX_AGE = int(os.getenv("SESSION_MAX_AGE", "28800"))  # 8h default
        self.COOKIE_SECURE = _env_bool("COOKIE_SECURE", True)
        self.COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
        self.COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")


settings = Settings()
