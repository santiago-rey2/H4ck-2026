import os
import json

from dotenv import load_dotenv
from google import genai
from typing import List

from sqlmodel import Session

from app.service.category_service import category_service

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def get_category_names_for_ai(db: Session) -> List[str]:
    categories = category_service.get_multi(db, limit=100)
    category_names = [cat.name for cat in categories]
    return category_names

async def classify_content_semantically(content: str,format: str, db: Session) -> dict:
    """
    Le envía el texto a Gemini y le pide que elija categorías.
    """

    available_categories= get_category_names_for_ai(db)
    print(available_categories)
    prompt = f"""
    Analiza el siguiente contenido con formato {format}: "{content}"

    Tengo estas categorías disponibles: {available_categories}

    Tu tarea:
    1. Basándote en que es un {format}, elige las categorías que mejor encajen.
    2. Responde ÚNICAMENTE en formato JSON: {{"categories": ["Cat1", "Cat2", "Cat3"]}}
    """

    try:
        response = client.models.generate_content(
            model="models/gemma-3-27b-it",
            contents=prompt
        )

        text_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(text_response)
    except Exception as e:
        return {"error": str(e), "categories": ["Otros"]}