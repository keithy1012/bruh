from pydantic import BaseModel
from datetime import date
from typing import Optional

class FinancialGoal(BaseModel):
    goal_id: str
    user_id: str
    title: str
    description: str
    target_amount: float
    current_amount: float = 0.0
    target_date: date
    priority: str  # high, medium, low
    category: str  # retirement, house, travel, emergency_fund, etc.
    on_roadmap: bool = True
