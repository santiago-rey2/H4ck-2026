import os
import json

from dotenv import load_dotenv
from google import genai
from typing import List

from sqlmodel import Session

from app.service.category_service import category_service


load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        print("✅ Cliente de Gemini configurado correctamente.")
    except Exception as e:
        print(f"⚠️ Error al inicializar el cliente de IA: {e}")
else:
    print("⚠️ ADVERTENCIA: GEMINI_API_KEY no encontrada. Categorización automática desactivada.")

def get_category_names_for_ai(db: Session) -> List[str]:
    categories = category_service.get_multi(db, limit=100)
    category_names = [cat.name for cat in categories]
    return category_names

async def classify_content_semantically(content: str,format: str, db: Session):
    """
    Clasifica el contenido usando IA.
    Si no hay API Key, devuelve una lista vacía de forma silenciosa.
    """
    if not client:
        return {"categories": []}

    available_categories = get_category_names_for_ai(db)

    prompt = f"""
    Analiza el siguiente contenido con formato {format}: "{content}"
    Categorías disponibles: {available_categories}
    Tarea:
    1. Elige las categorías que mejor encajen.
    2. Responde ÚNICAMENTE en formato JSON: {{"categories": ["Cat1", "Cat2"]}}
    """

    try:
        response = client.models.generate_content(
            model="models/gemma-3-27b-it",
            contents=prompt,
            config={"temperature": 0.0}
        )
        clean_json = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(clean_json)
    except Exception as e:
        print(f"Error en clasificación IA: {e}")
        return {"categories": []}