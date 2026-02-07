from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from .MissionType import MissionType

class Mission(BaseModel):
    mission_id: str
    user_id: str
    title: str
    description: str
    mission_type: MissionType
    target_value: Optional[float] = None
    deadline: date
    points: int
    status: str = "active"  # active, completed, failed
    created_at: datetime = Field(default_factory=datetime.now)
