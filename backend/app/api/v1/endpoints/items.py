from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.utils import COMMON_RESPONSES
from app.core.database import get_session
from app.model.items import ItemResponse, ItemBase
from app.service.item_service import item_service

router = APIRouter()
SessionDep = Annotated[Session, Depends(get_session)]

@router.post("/", response_model=ItemResponse)
def create_item(payload: ItemBase, db: SessionDep):
    return item_service.create(db, obj_in=payload)

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
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return item