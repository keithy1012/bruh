from dataclasses import dataclass, field
from typing import List, Dict
from models.SpendingInsight import SpendingInsight
from models.Transaction import Transaction

@dataclass
class SpendingReport:
    user_id: str
    report_id: str
    period: str
    total_spending: float
    total_income: float = 0.0
    category_breakdown: Dict[str, float] = field(default_factory=dict)
    subscriptions: List[Dict] = field(default_factory=list)
    repeat_purchases: List[Dict] = field(default_factory=list)
    insights: List[SpendingInsight] = field(default_factory=list)
    optimization_score: float = 0.0
    transactions: List[Transaction] = field(default_factory=list)
