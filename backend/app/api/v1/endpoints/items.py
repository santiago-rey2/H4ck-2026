import os
import uuid
from typing import Annotated, Optional
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select
from app.api.utils import COMMON_RESPONSES
from app.core.database import get_session
from app.model.category import Category
from app.model.items import (
    ItemResponse,
    ItemCreate,
    ItemUpdate,
    Item,
    LinkPreviewResponse,
    PaginatedItemsResponse,
)
from app.service.ia_service import process_audio_to_text_and_ai
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
        file: UploadFile = File(...),
        db: Session = Depends(get_session)
):
    temp_filename = f"{uuid.uuid4()}_{file.filename}"

    async with aiofiles.open(temp_filename, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    try:
        ai_data = await process_audio_to_text_and_ai(temp_filename, db)

        new_item = Item(
            name=ai_data["refined_text"],
            format=ai_data.get("format", "NOTA"),
            description=f"Transcripción original: {ai_data.get('raw_transcription', '')}"
        )

        suggested_names = ai_data.get("categories", [])
        if suggested_names:
            statement = select(Category).where(Category.name.in_(suggested_names))
            new_item.categories = db.exec(statement).all()

        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return new_item

    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


@router.get("/", response_model=PaginatedItemsResponse)
def read_items_paginated(
    db: SessionDep,
    skip: int = 0,
    limit: int = 20,
    name: Optional[str] = None,
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
    format: Optional[str] = None,
    has_categories: Optional[bool] = None,
    category_id: Optional[int] = None,
):
    extra_criteria = []

    if category_id is not None:
        extra_criteria.append(Item.categories.any(Category.id == category_id))
    elif has_categories is True:
        extra_criteria.append(Item.categories.any())
    elif has_categories is False:
        extra_criteria.append(~Item.categories.any())

    return item_service.get_multi(
        db,
        skip=skip,
        limit=limit,
        name=name,
        format=format,
        criteria=extra_criteria,
        options=[selectinload(Item.categories)],
    )


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
