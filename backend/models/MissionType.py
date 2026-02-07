from enum import Enum

class MissionType(str, Enum):
    SAVINGS = "savings"
    SPENDING = "spending"
    INVESTMENT = "investment"
    DEBT = "debt"
    LEARNING = "learning"