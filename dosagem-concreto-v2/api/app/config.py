from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ambiente: str = "prod"
    database_url: str
    supabase_url: str = ""
    supabase_anon_key: str = ""
    jwt_secret: str = ""
    jwt_audience: str = ""
    admin_email: str = ""
    porta: int = 18300


@lru_cache
def get_config() -> Config:
    return Config()
