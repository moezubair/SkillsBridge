import enum
from datetime import datetime

from pydantic import BaseModel


class TimestampMixin(BaseModel):
    created_at: datetime | None = None
    updated_at: datetime | None = None


class StatusEnum(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
