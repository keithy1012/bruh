from pydantic import BaseModel
from datetime import date
from typing import Optional

class Transaction(BaseModel):
    date: date
    description: str
    amount: float
    category: str
    merchant: Optional[str] = None
