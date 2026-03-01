import mimetypes
import os
import tempfile
from dataclasses import dataclass
from typing import Annotated, Optional

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.core.config import settings
from app.core.database import get_session
from app.model.items import ItemCreate
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
    from_: Optional[TelegramUser] = None
    text: Optional[str] = None
    caption: Optional[str] = None
    voice: Optional["TelegramVoice"] = None
    audio: Optional["TelegramAudio"] = None
    document: Optional["TelegramDocument"] = None

    class Config:
        populate_by_name = True


class TelegramVoice(BaseModel):
    file_id: str
    mime_type: Optional[str] = None
    duration: Optional[int] = None
    file_size: Optional[int] = None


class TelegramAudio(BaseModel):
    file_id: str
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    duration: Optional[int] = None
    performer: Optional[str] = None
    title: Optional[str] = None
    file_size: Optional[int] = None


class TelegramDocument(BaseModel):
    file_id: str
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None


class TelegramUpdate(BaseModel):
    update_id: int
    message: Optional[TelegramMessage] = None


@dataclass
class TelegramAudioReference:
    source: str
    file_id: str
    mime_type: Optional[str] = None
    file_name: Optional[str] = None


def _extract_audio_reference(
    message: TelegramMessage,
) -> Optional[TelegramAudioReference]:
    if message.voice and message.voice.file_id:
        return TelegramAudioReference(
            source="voice",
            file_id=message.voice.file_id,
            mime_type=message.voice.mime_type,
            file_name="telegram_voice.ogg",
        )

    if message.audio and message.audio.file_id:
        return TelegramAudioReference(
            source="audio",
            file_id=message.audio.file_id,
            mime_type=message.audio.mime_type,
            file_name=message.audio.file_name,
        )

    if (
        message.document
        and message.document.file_id
        and (message.document.mime_type or "").lower().startswith("audio/")
    ):
        return TelegramAudioReference(
            source="document",
            file_id=message.document.file_id,
            mime_type=message.document.mime_type,
            file_name=message.document.file_name,
        )

    return None


def _extract_file_extension(raw_name: Optional[str]) -> Optional[str]:
    if not raw_name:
        return None

    _, extension = os.path.splitext(raw_name)
    normalized = extension.lower().strip()
    if not normalized:
        return None

    if len(normalized) > 10:
        return None

    return normalized


def _guess_temp_suffix(
    audio_reference: TelegramAudioReference,
    telegram_file_path: str,
) -> str:
    name_extension = _extract_file_extension(audio_reference.file_name)
    if name_extension:
        return name_extension

    path_extension = _extract_file_extension(telegram_file_path)
    if path_extension:
        return path_extension

    if audio_reference.mime_type:
        normalized_mime = audio_reference.mime_type.split(";", 1)[0].strip().lower()
        guessed_extension = mimetypes.guess_extension(normalized_mime)
        if guessed_extension:
            return guessed_extension

    return ".ogg" if audio_reference.source == "voice" else ".bin"


def _resolve_telegram_file_path(file_id: str) -> str:
    if not settings.TELEGRAM_TOKEN:
        raise HTTPException(status_code=400, detail="TELEGRAM_TOKEN no configurado")

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_TOKEN}/getFile"

    try:
        response = requests.get(url, params={"file_id": file_id}, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"No se pudo consultar getFile en Telegram: {exc}",
        ) from exc

    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="Respuesta inválida de Telegram al consultar getFile",
        ) from exc

    if not payload.get("ok"):
        description = payload.get("description", "Error desconocido")
        raise HTTPException(
            status_code=502,
            detail=f"Error de Telegram en getFile: {description}",
        )

    result = payload.get("result") or {}
    file_path = result.get("file_path")
    if not isinstance(file_path, str) or not file_path.strip():
        raise HTTPException(
            status_code=502,
            detail="Telegram no devolvió file_path para el audio solicitado",
        )

    return file_path.strip()


def _download_telegram_audio_to_temp(audio_reference: TelegramAudioReference) -> str:
    telegram_file_path = _resolve_telegram_file_path(audio_reference.file_id)
    suffix = _guess_temp_suffix(audio_reference, telegram_file_path)

    file_url = f"https://api.telegram.org/file/bot{settings.TELEGRAM_TOKEN}/{telegram_file_path}"

    descriptor, temp_filename = tempfile.mkstemp(
        prefix="telegram_audio_",
        suffix=suffix,
    )
    os.close(descriptor)

    try:
        with requests.get(file_url, stream=True, timeout=(10, 90)) as response:
            response.raise_for_status()
            with open(temp_filename, "wb") as out_file:
                for chunk in response.iter_content(chunk_size=256 * 1024):
                    if chunk:
                        out_file.write(chunk)
    except requests.RequestException as exc:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        raise HTTPException(
            status_code=502,
            detail=f"No se pudo descargar el audio de Telegram: {exc}",
        ) from exc

    return temp_filename


TelegramMessage.model_rebuild()


# Simple in-memory storage para evitar duplicados en webhook
_processed_updates = set()


@router.post("/webhook")
async def telegram_webhook(update: TelegramUpdate, db: SessionDep):
    """
    Recibe updates del webhook de Telegram.
    Procesa mensajes de texto y audio (voice/audio/document audio/*).
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
    if not update.message:
        return {"ok": True}

    message_text = (update.message.text or "").strip()
    chat_id = update.message.chat.id

    audio_reference = _extract_audio_reference(update.message)
    if audio_reference:
        temp_filename: Optional[str] = None

        try:
            temp_filename = _download_telegram_audio_to_temp(audio_reference)

            source_description = f"Audio enviado por Telegram (chat: {chat_id}, tipo: {audio_reference.source})"
            caption = (update.message.caption or "").strip()
            if caption:
                source_description = f"{source_description}. Nota: {caption}"

            db_item = await item_service.create_from_audio_file(
                db,
                file_path=temp_filename,
                source_description=source_description,
            )

            return {
                "ok": True,
                "item_id": db_item.id,
                "format": db_item.format,
                "chat_id": chat_id,
                "source": audio_reference.source,
            }
        except HTTPException as e:
            print(f"Error HTTP procesando audio de Telegram: {e.detail}")
            return {
                "ok": False,
                "error": e.detail,
                "chat_id": chat_id,
                "source": audio_reference.source,
            }
        except Exception as e:
            print(f"Error procesando audio de Telegram: {str(e)}")
            return {
                "ok": False,
                "error": str(e),
                "chat_id": chat_id,
                "source": audio_reference.source,
            }
        finally:
            if temp_filename and os.path.exists(temp_filename):
                os.remove(temp_filename)

    if not message_text:
        return {
            "ok": True,
            "chat_id": chat_id,
            "skipped": True,
            "skipped_reason": "unsupported_message_type",
        }

    # Si empieza con /, ignorar (comandos del bot)
    if message_text.startswith("/"):
        return {
            "ok": True,
            "chat_id": chat_id,
            "skipped": True,
            "skipped_reason": "command",
        }

    try:
        # Crear item con el texto del mensaje
        item_in = ItemCreate(
            name=message_text,
            description=f"Enviado por Telegram (chat: {chat_id})",
            category_ids=[],
        )

        # Procesar igual que en POST /item
        db_item = await item_service.create_with_categories(db, obj_in=item_in)

        return {
            "ok": True,
            "item_id": db_item.id,
            "format": db_item.format,
            "chat_id": chat_id,
        }

    except Exception as e:
        print(f"Error procesando mensaje de Telegram: {str(e)}")
        return {"ok": False, "error": str(e), "chat_id": chat_id}


@router.post("/set-webhook")
async def set_webhook(webhook_url: str):
    """
    Endpoint para registrar/actualizar el webhook en Telegram.
    Uso: POST /telegram/set-webhook?webhook_url=https://tu-dominio.com/telegram/webhook

    Nota: Requiere BOT_TOKEN en el .env
    """
    if not settings.TELEGRAM_TOKEN:
        raise HTTPException(status_code=400, detail="TELEGRAM_TOKEN no configurado")

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_TOKEN}/setWebhook"

    try:
        response = requests.post(url, json={"url": webhook_url})
        result = response.json()

        if result.get("ok"):
            return {"status": "Webhook registrado correctamente", "url": webhook_url}
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Error de Telegram: {result.get('description', 'Unknown error')}",
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-webhook")
async def delete_webhook():
    """
    Elimina el webhook actual (vuelve a polling).
    """
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
                detail=f"Error de Telegram: {result.get('description', 'Unknown error')}",
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
