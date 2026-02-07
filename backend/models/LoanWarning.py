from pydantic import BaseModel
from typing import Optional

class LoanWarning(BaseModel):
    has_upcoming_loan: bool
    loan_type: Optional[str] = None
    recommended_action: str
    reasoning: str
    timeline: str
