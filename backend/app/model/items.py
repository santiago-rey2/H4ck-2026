from typing import TYPE_CHECKING,Optional
from sqlmodel import Field, SQLModel, Relationship
from app.model.base import Auditable

if TYPE_CHECKING:
    from app.model.category import Category

class ItemBase(SQLModel):
    name: str
    description: Optional[str] = None
    category_id: int = Field(foreign_key="category.id")

class Item(ItemBase, Auditable, table=True):
    category: Optional["Category"] = Relationship(back_populates="items")

class ItemResponse(ItemBase, Auditable):
    category_id: int

Item.model_rebuild()