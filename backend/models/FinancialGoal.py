from pydantic import BaseModel
from datetime import date

class FinancialGoal(BaseModel):
    goal_id: str
    user_id: str
    title: str
    description: str
    target_amount: float
    target_date: date
    priority: str  # high, medium, low
    category: str  # retirement, house, travel, emergency_fund, etc.
