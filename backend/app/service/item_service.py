from typing import Optional, Any, Dict

from fastapi import HTTPException
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.model.items import Item, ItemCreate, ItemUpdate
from app.model.category import Category
from sqlmodel import Session, select

from app.service.ia_service import classify_content_semantically


class CRUDItem(CRUDBase[Item, ItemCreate, ItemUpdate]):
    async def create_with_categories(self, db: Session, *, obj_in: ItemCreate) -> Item:
        item_data = obj_in.model_dump()
        category_ids = item_data.pop("category_ids", [])
        db_item = Item(**item_data)
        if category_ids:
            statement = select(Category).where(Category.id.in_(category_ids))
            db_categories = db.exec(statement).all()
            db_item.categories = list(db_categories)

        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        ai_result = await classify_content_semantically(
            content=db_item.name,
            format=db_item.format,
            db=db
        )

        suggested_names = ai_result.get("categories", [])
        if suggested_names:
            statement = select(Category).where(Category.name.in_(suggested_names))
            db_item.categories = db.exec(statement).all()

            db.add(db_item)
            db.commit()
            db.refresh(db_item)
        return db_item

    def update(self, db: Session, *, db_obj: Item, obj_in: ItemUpdate) -> Item:
        update_data = obj_in.model_dump(exclude_unset=True)
        category_ids = update_data.pop("category_ids", None)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        if category_ids is not None:
            statement = select(Category).where(
                Category.id.in_(category_ids),
                Category.active == True
            )
            db_categories = db.exec(statement).all()

            if len(db_categories) != len(set(category_ids)):
                found_ids = [c.id for c in db_categories]
                missing_ids = [cid for cid in category_ids if cid not in found_ids]

                raise HTTPException(
                    status_code=400,
                    detail=f"Las siguientes categorías no están disponibles: {missing_ids}"
                )

            db_obj.categories = list(db_categories)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        return db_obj

    def get_by_format(
            self, db: Session, *, format_name: Optional[str] = None
    ) -> Any:
        statement = select(Item).where(Item.active == True).options(selectinload(Item.categories))

        if format_name:
            statement = statement.where(Item.format == format_name)
            return db.exec(statement).all()

        all_items = db.exec(statement).all()
        grouped: Dict[str, list[Item]] = {}

        for item in all_items:
            fmt = item.format or "Sin Formato"
            if fmt not in grouped:
                grouped[fmt] = []
            grouped[fmt].append(item)

        return grouped

    def get_uncategorized(self, db: Session, skip: int = 0, limit: int = 100) -> list[Item]:
        statement = (
            select(Item)
            .where(Item.active == True)
            .where(~Item.categories.any())
            .offset(skip)
            .limit(limit)
        )
        return list(db.exec(statement).all())


item_service = CRUDItem(Item)
