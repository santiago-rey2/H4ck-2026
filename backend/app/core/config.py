from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_SERVER: str
    DB_NAME: str
    DB_PORT: int = 5432

    LINK_PREVIEW_CONNECT_TIMEOUT: float = 4.0
    LINK_PREVIEW_READ_TIMEOUT: float = 8.0
    LINK_PREVIEW_MAX_REDIRECTS: int = 5
    LINK_PREVIEW_MAX_HTML_BYTES: int = 1_500_000
    LINK_PREVIEW_CACHE_TTL_SECONDS: int = 900
    LINK_PREVIEW_USER_AGENT: str = "HackUDC2026-LinkPreview/1.0"
    LINK_PREVIEW_YTDLP_ENABLED: bool = True
    LINK_PREVIEW_YTDLP_SOCKET_TIMEOUT: float = 8.0
    LINK_PREVIEW_YTDLP_ALLOWED_DOMAINS: str = "youtube.com,youtu.be,vimeo.com,twitch.tv,tiktok.com,x.com,twitter.com,instagram.com"

    SEED_ENABLED: bool = False
    SEED_MIN_ITEMS: int = 100
    SEED_RANDOM_SEED: int = 2026

    # El decorador @computed_field es la CLAVE en Pydantic V2
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_SERVER}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def LINK_PREVIEW_YTDLP_ALLOWED_DOMAIN_SET(self) -> set[str]:
        return {
            domain.strip().lower().lstrip(".")
            for domain in self.LINK_PREVIEW_YTDLP_ALLOWED_DOMAINS.split(",")
            if domain.strip()
        }

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",  # Para que no de error por variables extra en el .env
    )


settings = Settings()
