from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_SERVER: str
    DB_NAME: str
    DB_PORT: int = 5432

    # El decorador @computed_field es la CLAVE en Pydantic V2
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_SERVER}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # Para que no de error por variables extra en el .env
    )

settings = Settings()