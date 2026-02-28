from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import create_db_and_tables
from app.api.v1.endpoints import items, categories
from fastapi.middleware.cors import CORSMiddleware
from app.scripts.seed import run_seed_if_enabled


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    run_seed_if_enabled()

    yield
    print("Limpiando recursos...")


app = FastAPI(title="HackUDC2026", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

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
