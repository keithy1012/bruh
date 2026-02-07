from pydantic import BaseModel
from typing import List, Dict, Any
from .SpendingInsight import SpendingInsight

class SpendingReport(BaseModel):
    user_id: str
    report_id: str
    period: str
    total_spending: float
    category_breakdown: Dict[str, float]
    subscriptions: List[Dict[str, Any]]
    repeat_purchases: List[Dict[str, Any]]
    insights: List[SpendingInsight]
    optimization_score: float  # 0-100
