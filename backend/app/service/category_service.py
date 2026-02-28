from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from ..crud.base import CRUDBase
from ..model.category import Category, CategoryBase, CategoryUpdate
from ..model.itemcategorylink import ItemCategoryLink
from ..model.items import Item


class CRUDCategory(CRUDBase[Category, CategoryBase, CategoryUpdate]):

    def remove(self, db: Session, id: int) -> Category:

        db_category = self.get(db, id=id)
        if not db_category:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        statement = (
            select(func.count(ItemCategoryLink.item_id))
            .join(Item)
            .where(
                ItemCategoryLink.category_id == id,
                Item.active == True
            )
        )
        count = db.exec(statement).one()

        if count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar: existen ítems activos vinculados a esta categoría."
            )
        return super().remove(db, id=id)


category_service = CRUDCategory(Category)
