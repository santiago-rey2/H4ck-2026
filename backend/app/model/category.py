from typing import Optional, TYPE_CHECKING
from sqlmodel import Relationship, SQLModel
from app.model.base import Auditable

if TYPE_CHECKING:
    from app.model.items import Item

class CategoryBase(SQLModel):
    name: str
    description: Optional[str] = None

class Category(CategoryBase, Auditable, table=True):
    items: list["Item"] = Relationship(back_populates="category")

class CategoryResponse(CategoryBase, Auditable):
    pass