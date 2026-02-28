from typing import Optional, TYPE_CHECKING
from sqlmodel import Relationship, SQLModel
from app.model.base import Auditable
from app.model.itemcategorylink import ItemCategoryLink

if TYPE_CHECKING:
    from app.model.items import Item

class CategoryBase(SQLModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(SQLModel):
    pass

class Category(CategoryBase, Auditable, table=True):
    items: list["Item"] = Relationship(back_populates="categories", link_model=ItemCategoryLink)

class CategoryResponse(CategoryBase, Auditable):
    pass