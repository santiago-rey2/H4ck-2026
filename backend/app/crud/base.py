from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from sqlmodel import Session, SQLModel, select
from datetime import datetime, timezone

ModelType = TypeVar("ModelType", bound=SQLModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=SQLModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=SQLModel)  # Nuevo Genérico


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: int) -> Optional[ModelType]:
        return db.get(self.model, id)

    def get_multi(self,db: Session,*,skip: int = 0,limit: int = 100,
                  options: list = None,criteria: list = None,**filters) -> List[ModelType]:
        statement = select(self.model).where(self.model.active == True)

        for field, value in filters.items():
            if value is not None and hasattr(self.model, field):
                statement = statement.where(getattr(self.model, field) == value)

        if criteria:
            for condition in criteria:
                statement = statement.where(condition)

        if options:
            for option in options:
                statement = statement.options(option)

        statement = statement.offset(skip).limit(limit)
        return list(db.exec(statement).all())

    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        db_obj = self.model.model_validate(obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
            self,
            db: Session,
            *,
            db_obj: ModelType,
            obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        obj_data = db_obj.model_dump()
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])

        if hasattr(db_obj, "updated_at"):
            db_obj.updated_at = datetime.now(timezone.utc)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> Optional[ModelType]:
        db_obj = db.get(self.model, id)
        if db_obj:
            db_obj.active = False
            if hasattr(db_obj, "deactivated_at"):
                db_obj.deactivated_at = datetime.now(timezone.utc)

            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj