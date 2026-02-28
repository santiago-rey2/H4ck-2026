import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import Session, text, select
from app.core.database import create_db_and_tables, engine
from app.api.v1.endpoints import items, categories, telegram
from fastapi.middleware.cors import CORSMiddleware

from app.model.category import Category
from app.scripts.load_categories import seed_categories

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("Verificando conexión con la base de datos...")

        with Session(engine) as session:
            session.exec(text("SELECT 1"))
            create_db_and_tables()
            category_count = session.exec(select(Category)).first()
            if not category_count:
                logger.info("Tabla de categorías vacía. Iniciando carga automática...")
                seed_categories()
                logger.info("✅ Categorías cargadas exitosamente.")
            else:
                logger.info("Categorías detectadas, saltando carga inicial.")

        logger.info("Aplicación lista y operativa.")

    except Exception as e:
        logger.error(f"ERROR CRÍTICO: {e}")
        import os
        os._exit(1)

    yield

app = FastAPI(title="HackUDC2026", lifespan=lifespan)

origins = ["http://localhost:3000", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz", tags=["Health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(items.router, prefix="/items", tags=["Items"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(telegram.router, prefix="/telegram", tags=["Telegram"])