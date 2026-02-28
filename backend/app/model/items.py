from typing import TYPE_CHECKING, Optional, List
from sqlmodel import Field, SQLModel, Relationship
from app.model.base import Auditable
from app.model.itemcategorylink import ItemCategoryLink

if TYPE_CHECKING:
    from app.model.category import Category, CategoryResponse

class ItemBase(SQLModel):
    name: str
    description: Optional[str] = None
    format: Optional[str] = None

class Item(ItemBase, Auditable, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    categories: List["Category"] = Relationship(
        back_populates="items",
        link_model=ItemCategoryLink
    )

class ItemUpdate(ItemBase):
    category_ids: List[int] = []

class ItemCreate(ItemBase):
    category_ids: List[int] = []

class ItemResponse(ItemBase, Auditable):
    id: int
    categories: List["CategoryResponse"] = []

from app.model.category import Category, CategoryResponse

Item.model_rebuild()
ItemResponse.model_rebuild()