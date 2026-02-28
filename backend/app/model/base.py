from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


def get_utc_now():
    return datetime.now(timezone.utc)

class Auditable(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)

    created_at: datetime = Field(
        default_factory=get_utc_now,
        nullable=False
    )

    updated_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column_kwargs={"onupdate": get_utc_now}
    )

    deactivated_at: Optional[datetime] = Field(default=None)

    active: bool = Field(default=True)