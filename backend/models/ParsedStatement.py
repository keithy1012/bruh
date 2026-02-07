from pydantic import BaseModel
from datetime import date
from typing import List, Dict
from .Transaction import Transaction

class ParsedStatement(BaseModel):
    user_id: str
    statement_id: str
    period_start: date
    period_end: date
    transactions: List[Transaction]
    total_income: float
    total_expenses: float
    categories: Dict[str, float]
