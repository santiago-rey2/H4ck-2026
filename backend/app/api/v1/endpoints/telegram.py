from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel

from app.core.database import get_session
from app.model.items import ItemCreate, ItemResponse
from app.service.item_service import item_service

router = APIRouter()
SessionDep = Annotated[Session, Depends(get_session)]


class TelegramUser(BaseModel):
    id: int
    is_bot: bool
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None


class TelegramChat(BaseModel):
    id: int
    type: str
    title: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = None


class TelegramMessage(BaseModel):
    message_id: int
    date: int
    chat: TelegramChat
    from_: TelegramUser = None
    text: Optional[str] = None

    class Config:
        populate_by_name = True


class TelegramUpdate(BaseModel):
    update_id: int
    message: Optional[TelegramMessage] = None


# Simple in-memory storage para evitar duplicados en webhook
_processed_updates = set()


@router.post("/webhook")
async def telegram_webhook(update: TelegramUpdate, db: SessionDep):
    """
    Recibe updates del webhook de Telegram.
    Procesa solo mensajes de texto y crea items igual que POST /item.
    """
    # Evitar procesar el mismo update dos veces
    if update.update_id in _processed_updates:
        return {"ok": True, "skipped": True}
    
    _processed_updates.add(update.update_id)
    
    # Limpiar updates antiguos (mantener últimos 1000)
    if len(_processed_updates) > 1000:
        # Convertir a lista, mantener últimos 1000
        sorted_updates = sorted(_processed_updates)
        _processed_updates.clear()
        _processed_updates.update(sorted_updates[-1000:])
    
    # Si no hay mensaje, ignorar
    if not update.message or not update.message.text:
        return {"ok": True}
    
    message_text = update.message.text.strip()
    chat_id = update.message.chat.id
    
    # Si empieza con /, ignorar (comandos del bot)
    if message_text.startswith("/"):
        return {"ok": True}
    
    try:
        # Crear item con el texto del mensaje
        item_in = ItemCreate(
            name=message_text,
            description=f"Enviado por Telegram (chat: {chat_id})",
            category_ids=[]
        )
        
        # Procesar igual que en POST /item
        db_item = await item_service.create_with_categories(db, obj_in=item_in)
        
        return {
            "ok": True,
            "item_id": db_item.id,
            "format": db_item.format,
            "chat_id": chat_id
        }
        
    except Exception as e:
        print(f"Error procesando mensaje de Telegram: {str(e)}")
        return {
            "ok": False,
            "error": str(e),
            "chat_id": chat_id
        }


@router.post("/set-webhook")
async def set_webhook(webhook_url: str):
    """
    Endpoint para registrar/actualizar el webhook en Telegram.
    Uso: POST /telegram/set-webhook?webhook_url=https://tu-dominio.com/telegram/webhook
    
    Nota: Requiere BOT_TOKEN en el .env
    """
    import requests
    from app.core.config import settings
    
    if not settings.TELEGRAM_TOKEN:
        raise HTTPException(status_code=400, detail="TELEGRAM_TOKEN no configurado")
    
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_TOKEN}/setWebhook"
    
    try:
        response = requests.post(
            url,
            json={"url": webhook_url}
        )
        result = response.json()
        
        if result.get("ok"):
            return {"status": "Webhook registrado correctamente", "url": webhook_url}
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error de Telegram: {result.get('description', 'Unknown error')}"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-webhook")
async def delete_webhook():
    """
    Elimina el webhook actual (vuelve a polling).
    """
    import requests
    from app.core.config import settings
    
    if not settings.TELEGRAM_TOKEN:
        raise HTTPException(status_code=400, detail="TELEGRAM_TOKEN no configurado")
    
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_TOKEN}/deleteWebhook"
    
    try:
        response = requests.post(url)
        result = response.json()
        
        if result.get("ok"):
            return {"status": "Webhook eliminado"}
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error de Telegram: {result.get('description', 'Unknown error')}"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
