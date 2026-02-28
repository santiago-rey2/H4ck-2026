from typing import TYPE_CHECKING, Optional, List, Any

from pydantic import model_validator, TypeAdapter, HttpUrl, AnyHttpUrl
from sqlmodel import Field, SQLModel, Relationship
from app.model.base import Auditable
from app.model.enums import ItemFormat
from app.model.itemcategorylink import ItemCategoryLink

if TYPE_CHECKING:
    from app.model.category import Category, CategoryResponse

class ItemBase(SQLModel):
    name: str
    description: Optional[str] = None
    format: Optional[ItemFormat] = None

    @model_validator(mode="before")
    @classmethod
    def classify_format(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        text_to_classify = data.get("name")

        if text_to_classify and isinstance(text_to_classify, str):
            url_adapter = TypeAdapter(AnyHttpUrl)
            try:
                url_adapter.validate_strings(text_to_classify)
                data["format"] = ItemFormat.LINK
            except Exception:
                if len(text_to_classify) < 150:
                    data["format"] = ItemFormat.SHORT_TEXT
                else:
                    data["format"] = ItemFormat.LONG_TEXT

        return data

class Item(ItemBase, Auditable, table=True):
    categories: List["Category"] = Relationship(
        back_populates="items",
        link_model=ItemCategoryLink
    )

class ItemUpdate(ItemBase):
    category_ids: List[int] = []

class ItemCreate(ItemBase):
    category_ids: List[int] = []

class ItemResponse(ItemBase, Auditable):
    categories: List["CategoryResponse"] = []

from app.model.category import Category, CategoryResponse

Item.model_rebuild()
ItemResponse.model_rebuild()