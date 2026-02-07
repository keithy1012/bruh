from typing import List
from datetime import datetime, date
from models.UserProfile import UserProfile
from models.FinancialGoal import FinancialGoal
from models.SpendingReport import SpendingReport
from models.Mission import Mission
from models.MissionType import MissionType

# TODO: actually implement
class MissionGenerationAgent:
    """Generate weekly/monthly financial missions"""
    
    @staticmethod
    async def generate_missions(
        user_profile: UserProfile,
        goals: List[FinancialGoal],
        spending_report: SpendingReport
    ) -> List[Mission]:
        """
        Generate personalized missions based on goals and spending patterns
        """
        
        missions = []
        current_date = datetime.now().date()
        
        # Savings mission based on goals
        for goal in goals:
            if goal.category == "emergency_fund":
                missions.append(Mission(
                    mission_id=f"mission_{len(missions)+1}",
                    user_id=user_profile.user_id,
                    title="Emergency Fund Contribution",
                    description=f"Save $500 toward your {goal.title}",
                    mission_type=MissionType.SAVINGS,
                    target_value=500.0,
                    deadline=date(current_date.year, current_date.month + 1, 1),
                    points=100
                ))
        
        # Spending optimization mission
        if spending_report.optimization_score < 80:
            missions.append(Mission(
                mission_id=f"mission_{len(missions)+1}",
                user_id=user_profile.user_id,
                title="Subscription Audit",
                description="Review and cancel at least one unused subscription",
                mission_type=MissionType.SPENDING,
                deadline=date(current_date.year, current_date.month, current_date.day + 7),
                points=50
            ))
        
        # Learning mission
        missions.append(Mission(
            mission_id=f"mission_{len(missions)+1}",
            user_id=user_profile.user_id,
            title="Financial Literacy",
            description="Read one article about investing basics",
            mission_type=MissionType.LEARNING,
            deadline=date(current_date.year, current_date.month, current_date.day + 7),
            points=25
        ))
        
        return missions