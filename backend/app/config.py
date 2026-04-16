from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str = "postgresql://ainews:ainews_rag_2026@192.168.68.200:5432/ai_news_rag"
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()
