from ..crud.base import CRUDBase
from ..model.items import Item, ItemBase
from sqlmodel import Session, select

class CRUDItem(CRUDBase[Item, ItemBase]):
    def get_by_category(self, db: Session, category_id: int):
        return db.exec(select(self.model).where(self.model.category_id == category_id)).all()

item_service = CRUDItem(Item)