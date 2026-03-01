from typing import Optional, Any, Dict

from fastapi import HTTPException
from sqlalchemy import String, cast, or_
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.model.items import Item, ItemCreate, ItemUpdate
from app.model.category import Category
from sqlmodel import Session, select

from app.service.ia_service import (
    classify_content_semantically,
    process_audio_to_text_and_ai,
)


class CRUDItem(CRUDBase[Item, ItemCreate, ItemUpdate]):
    async def create_with_categories(self, db: Session, *, obj_in: ItemCreate) -> Item:
        item_data = obj_in.model_dump()
        category_ids = item_data.pop("category_ids", [])
        db_item = Item(**item_data)

        if category_ids:
            print("Asignando categorías manuales...")
            statement = select(Category).where(Category.id.in_(category_ids))
            db_item.categories = list(db.exec(statement).all())

            db.add(db_item)
            db.commit()
            db.refresh(db_item)
            return db_item

        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        print("Iniciando clasificación por IA...")
        ai_result = await classify_content_semantically(
            content=db_item.name, format=db_item.format, db=db
        )

        suggested_names = ai_result.get("categories", [])
        if suggested_names:
            statement = select(Category).where(Category.name.in_(suggested_names))
            db_item.categories = list(db.exec(statement).all())

            db.add(db_item)
            db.commit()
            db.refresh(db_item)

        return db_item

    async def create_from_audio_file(
        self,
        db: Session,
        *,
        file_path: str,
        source_description: Optional[str] = None,
    ) -> Item:
        ai_data = await process_audio_to_text_and_ai(file_path, db)

        refined_text = str(
            ai_data.get("refined_text") or ai_data.get("name") or ""
        ).strip()
        if not refined_text:
            refined_text = "Audio vacío"

        raw_transcription = str(ai_data.get("raw_transcription") or "").strip()
        format_value = str(ai_data.get("format") or "NOTA").strip() or "NOTA"

        description_parts: list[str] = []
        if source_description:
            description_parts.append(source_description)
        if raw_transcription:
            description_parts.append(f"Transcripción original: {raw_transcription}")
        if not description_parts:
            description_parts.append("Transcripción de audio")

        new_item = Item(
            name=refined_text,
            format=format_value,
            description=" | ".join(description_parts),
        )

        suggested_names_raw = ai_data.get("categories", [])
        suggested_names = (
            [
                category_name.strip()
                for category_name in suggested_names_raw
                if isinstance(category_name, str) and category_name.strip()
            ]
            if isinstance(suggested_names_raw, list)
            else []
        )
        if suggested_names:
            statement = select(Category).where(Category.name.in_(suggested_names))
            new_item.categories = list(db.exec(statement).all())

        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return new_item

    def update(self, db: Session, *, db_obj: Item, obj_in: ItemUpdate) -> Item:
        update_data = obj_in.model_dump(exclude_unset=True)
        category_ids = update_data.pop("category_ids", None)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        if category_ids is not None:
            statement = select(Category).where(
                Category.id.in_(category_ids), Category.active == True
            )
            db_categories = db.exec(statement).all()

            if len(db_categories) != len(set(category_ids)):
                found_ids = [c.id for c in db_categories]
                missing_ids = [cid for cid in category_ids if cid not in found_ids]

                raise HTTPException(
                    status_code=400,
                    detail=f"Las siguientes categorías no están disponibles: {missing_ids}",
                )

            db_obj.categories = list(db_categories)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        return db_obj

    def get_by_format(self, db: Session, *, format_name: Optional[str] = None) -> Any:
        statement = (
            select(Item)
            .where(Item.active == True)
            .options(selectinload(Item.categories))
        )

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

    def get_multi_paginated(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        name: Optional[str] = None,
        search_query: Optional[str] = None,
        format_name: Optional[str] = None,
        has_categories: Optional[bool] = None,
        category_id: Optional[int] = None,
    ) -> tuple[list[Item], bool]:
        statement = (
            select(Item)
            .where(Item.active == True)
            .options(selectinload(Item.categories))
        )

        normalized_search_query = (search_query or name or "").strip()
        if normalized_search_query:
            search_tokens = [
                token.strip()
                for token in normalized_search_query.split()
                if token.strip()
            ]

            for token in search_tokens:
                token_pattern = f"%{token}%"
                statement = statement.where(
                    or_(
                        Item.name.ilike(token_pattern),
                        Item.description.ilike(token_pattern),
                        cast(Item.format, String).ilike(token_pattern),
                        cast(Item.id, String).ilike(token_pattern),
                        cast(Item.created_at, String).ilike(token_pattern),
                        cast(Item.updated_at, String).ilike(token_pattern),
                        Item.categories.any(Category.name.ilike(token_pattern)),
                        Item.categories.any(Category.description.ilike(token_pattern)),
                    )
                )

        if format_name:
            statement = statement.where(Item.format == format_name)

        if category_id is not None:
            statement = statement.where(Item.categories.any(Category.id == category_id))
        elif has_categories is True:
            statement = statement.where(Item.categories.any())
        elif has_categories is False:
            statement = statement.where(~Item.categories.any())

        statement = statement.order_by(Item.created_at.desc(), Item.id.desc())

        rows = list(db.exec(statement.offset(skip).limit(limit + 1)).all())
        has_more = len(rows) > limit

        if has_more:
            rows = rows[:limit]

        return rows, has_more

    def get_uncategorized(
        self, db: Session, skip: int = 0, limit: int = 100
    ) -> list[Item]:
        statement = (
            select(Item)
            .where(Item.active == True)
            .where(~Item.categories.any())
            .offset(skip)
            .limit(limit)
        )
        return list(db.exec(statement).all())


item_service = CRUDItem(Item)
