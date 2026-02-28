from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.utils import COMMON_RESPONSES
from app.core.database import get_session
from app.model.items import ItemResponse, ItemBase, ItemCreate, ItemUpdate
from app.service.item_service import item_service

router = APIRouter()
SessionDep = Annotated[Session, Depends(get_session)]


@router.post("/", response_model=ItemResponse)
def create_item(item_in: ItemCreate, db: SessionDep):
    return item_service.create_with_categories(db, obj_in=item_in)

@router.get("/all", response_model=list[ItemResponse])
def read_items(db: SessionDep, skip: int = 0, limit: int = 100):
    return item_service.get_multi(db, skip=skip, limit=limit)

@router.get("/by-format")
def get_items_by_format(
        db: SessionDep,
        format_name: Optional[str] = None
):
    """
    Si pasas ?format_name=juan, devuelve lista de ítems de ese formato.
    Si no pasas nada, devuelve un objeto agrupado por formatos.
    """
    return item_service.get_by_format(db, format_name=format_name)

@router.get(
    "/{item_id}",
    response_model=ItemResponse,
    responses={**COMMON_RESPONSES}
)
def read_item(
        item_id: int,
        db: SessionDep
):
    item = item_service.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item



@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(
        *,
        db: SessionDep,
        item_id: int,
        item_in: ItemUpdate
):
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
