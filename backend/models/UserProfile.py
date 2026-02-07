from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime, date

class UserProfile(BaseModel):
    user_id: str
    age: int
    annual_income: float
    debts: List[Dict[str, Any]]
    created_at: datetime = Field(default_factory=datetime.now)