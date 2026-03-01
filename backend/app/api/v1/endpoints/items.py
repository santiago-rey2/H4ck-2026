import os
import uuid
from typing import Annotated, Optional

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session

from app.api.utils import COMMON_RESPONSES
from app.core.database import get_session
from app.model.items import (
    ItemCreate,
    LinkPreviewResponse,
    PaginatedItemsResponse,
    ItemResponse,
    ItemUpdate,
)
from app.service.item_service import item_service
from app.service.link_preview_service import link_preview_service

router = APIRouter()
SessionDep = Annotated[Session, Depends(get_session)]


@router.post("/", response_model=ItemResponse)
async def create_item(item_in: ItemCreate, db: SessionDep):
    db_item = await item_service.create_with_categories(db, obj_in=item_in)
    return db_item


@router.post("/from-audio", response_model=ItemResponse)
async def create_from_audio(
    file: UploadFile = File(...), db: Session = Depends(get_session)
):
    temp_filename = f"{uuid.uuid4()}_{file.filename}"

    async with aiofiles.open(temp_filename, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    try:
        db_item = await item_service.create_from_audio_file(
            db,
            file_path=temp_filename,
            source_description="Audio subido manualmente",
        )

        return db_item

    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


@router.get("/", response_model=PaginatedItemsResponse)
def read_items_paginated(
    db: SessionDep,
    skip: int = 0,
    limit: int = 20,
    name: Optional[str] = None,
    q: Optional[str] = None,
    format: Optional[str] = None,
    has_categories: Optional[bool] = None,
    category_id: Optional[int] = None,
):
    safe_skip = max(skip, 0)
    safe_limit = max(1, min(limit, 100))

    items, has_more = item_service.get_multi_paginated(
        db,
        skip=safe_skip,
        limit=safe_limit,
        name=name,
        search_query=q,
        format_name=format,
        has_categories=has_categories,
        category_id=category_id,
    )

    return PaginatedItemsResponse(
        items=items,
        skip=safe_skip,
        limit=safe_limit,
        has_more=has_more,
        next_skip=safe_skip + safe_limit if has_more else None,
    )


@router.get("/all", response_model=list[ItemResponse])
def read_items(
    db: SessionDep,
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    q: Optional[str] = None,
    format: Optional[str] = None,
    has_categories: Optional[bool] = None,
    category_id: Optional[int] = None,
):
    rows, _ = item_service.get_multi_paginated(
        db,
        skip=skip,
        limit=limit,
        name=name,
        search_query=q,
        format_name=format,
        has_categories=has_categories,
        category_id=category_id,
    )

    return rows


@router.get("/by-format")
def get_items_by_format(db: SessionDep, format_name: Optional[str] = None):
    """
    Si pasas ?format_name=juan, devuelve lista de ítems de ese formato.
    Si no pasas nada, devuelve un objeto agrupado por formatos.
    """
    return item_service.get_by_format(db, format_name=format_name)


@router.get("/{item_id}", response_model=ItemResponse, responses={**COMMON_RESPONSES})
def read_item(item_id: int, db: SessionDep):
    item = item_service.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.get(
    "/{item_id}/link-preview",
    response_model=LinkPreviewResponse,
    responses={
        **COMMON_RESPONSES,
        400: {"description": "El item no es de formato link"},
        422: {"description": "La URL del item no es valida"},
        502: {"description": "No se pudo extraer metadata del enlace"},
        504: {"description": "Timeout al obtener metadata del enlace"},
    },
)
def read_item_link_preview(item_id: int, db: SessionDep):
    item = item_service.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if (item.format or "").strip().lower() != "link":
        raise HTTPException(
            status_code=400,
            detail="Solo se puede generar preview para items de formato 'link'.",
        )

    return link_preview_service.get_preview(item_id=item_id, raw_url=item.name)


@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(*, db: SessionDep, item_id: int, item_in: ItemUpdate):
    db_item = item_service.get(db, id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item_service.update(db, db_obj=db_item, obj_in=item_in)


@router.delete("/{item_id}", response_model=ItemResponse)
def delete_item(item_id: int, db: SessionDep):
    db_item = item_service.get(db, id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item_service.remove(db, id=item_id)
