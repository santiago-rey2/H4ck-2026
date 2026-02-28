import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from app.core.database import create_db_and_tables
from app.api.v1.endpoints import items, categories, ia
from fastapi.middleware.cors import CORSMiddleware
from google import genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY no configurada en las variables de entorno")
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

app.include_router(items.router, prefix="/items", tags=["Items"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(ia.router, prefix="/ia", tags=["IA"])
