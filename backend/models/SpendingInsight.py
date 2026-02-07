from pydantic import BaseModel
from typing import List, Optional

class SpendingInsight(BaseModel):
    category: str
    insight_type: str  # subscription, repeat_purchase, opportunity, warning
    title: str
    description: str
    potential_savings: Optional[float] = None
    action_items: List[str]
