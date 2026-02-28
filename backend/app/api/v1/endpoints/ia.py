from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.service.ia_service import classify_content_semantically

router = APIRouter()


@router.get("/test-gemini")
async def test_ai(text: str, db: Session = Depends(get_session)):
    # Pasamos la sesión 'db' al servicio
    result = await classify_content_semantically(text, db)
    return result