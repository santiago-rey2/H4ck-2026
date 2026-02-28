from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.utils import COMMON_RESPONSES
from app.core.database import get_session
from app.model.items import ItemResponse
from app.service.category_service import category_service
from app.model.category import CategoryResponse, CategoryBase

router = APIRouter()
SessionDep = Annotated[Session, Depends(get_session)]


@router.post("/", response_model=CategoryResponse)
def create_category(
        payload: CategoryBase,
        db: SessionDep
):
    """
    Crea una nueva categoría en el sistema.
    """
    return category_service.create(db, obj_in=payload)


@router.get(
    "/",
    response_model=list[CategoryResponse]
)
def read_categories(
        db: SessionDep,
        skip: int = 0,
        limit: int = 100
):
    """
    Recupera una lista de categorías con paginación.
    """
    return category_service.get_multi(db, skip=skip, limit=limit)


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    responses={**COMMON_RESPONSES}
)
def read_category(
        category_id: int,
        db: SessionDep
):
    """
    Obtiene los detalles de una categoría específica por su ID.
    """
    category = category_service.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return category


@router.get(
    "/{category_id}/items",
    response_model=list[ItemResponse],
    responses={**COMMON_RESPONSES}
)
def read_category_items(
        category_id: int,
        db: SessionDep
):
    """
    Recupera todos los ítems asociados a una categoría concreta.
    """
    category = category_service.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return category.items


@router.delete("/{category_id}", response_model=CategoryResponse)
def delete_category(
        category_id: int,
        db: SessionDep
):
    """
    Elimina una categoría del sistema por su ID.
    """
    category = category_service.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return category_service.remove(db, id=category_id)
