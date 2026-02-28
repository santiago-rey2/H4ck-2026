from sqlmodel import Field, SQLModel

class ItemCategoryLink(SQLModel, table=True):
    item_id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    category_id: int | None = Field(default=None, foreign_key="category.id", primary_key=True)