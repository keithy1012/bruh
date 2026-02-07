from typing import List, Dict
from datetime import datetime, date, timedelta
import json
import os
from dotenv import load_dotenv
from models.UserProfile import UserProfile
from models.FinancialGoal import FinancialGoal
from models.Mission import Mission
from models.MissionType import MissionType
from dedalus_labs import AsyncDedalus

load_dotenv()


class MissionGenerationAgent:
    """Generate a complete roadmap of missions to achieve long-term financial goals"""

    @staticmethod
    async def generate_mission_roadmap(
        user_profile: UserProfile,
        goal: FinancialGoal,
    ) -> List[Mission]:
        """
        Generate a complete roadmap of personalized missions spaced appropriately
        from now until the goal's target date.
        
        Args:
            user_profile: The user's profile information
            goal: The long-term financial goal to create missions for
            
        Returns:
            List of Mission objects forming a complete roadmap
        """
        
        current_date = datetime.now().date()
        target_date = goal.target_date if isinstance(goal.target_date, date) else date.fromisoformat(str(goal.target_date))
        
        # Calculate the time span
        days_until_goal = (target_date - current_date).days
        if days_until_goal <= 0:
            days_until_goal = 30  # Default to 30 days if goal is past or today
        
        # Determine mission frequency based on goal timeline
        if days_until_goal <= 90:
            mission_interval_days = 7  # Weekly for medium-term goals
            num_missions = min(12, days_until_goal // 7)
        elif days_until_goal <= 365:
            mission_interval_days = 14  # Bi-weekly for longer goals
            num_missions = min(20, days_until_goal // 14)
        elif days_until_goal <= 720:
            mission_interval_days = 30  # Monthly for 2-year goals
            num_missions = min(24, days_until_goal // 30)
        else:
            mission_interval_days = 180  #
            num_missions = min(24, days_until_goal // 180)
        
        num_missions = max(5, num_missions)  # At least 5 missions
        num_missions = min(30, num_missions) # At most 20
        
        # Calculate monthly savings needed
        months_until_goal = max(1, days_until_goal / 30)
        current_amount = goal.current_amount if hasattr(goal, 'current_amount') and goal.current_amount else 0
        remaining_amount = goal.target_amount - current_amount
        monthly_savings_needed = remaining_amount / months_until_goal
        
        system_prompt = f"""You are a financial mission planner. Generate a roadmap of {num_missions} missions 
to help a user achieve their financial goal.

USER PROFILE:
- Age: {user_profile.age}
- Annual Income: ${user_profile.annual_income:,.0f}
- Monthly Income: ${user_profile.annual_income / 12:,.0f}
- Debts: {json.dumps(user_profile.debts) if user_profile.debts else 'None'}

GOAL DETAILS:
- Goal: {goal.title}
- Description: {goal.description}
- Target Amount: ${goal.target_amount:,.0f}
- Current Progress: ${current_amount:,.0f}
- Remaining: ${remaining_amount:,.0f}
- Target Date: {target_date}
- Days Until Goal: {days_until_goal}
- Estimated Monthly Savings Needed: ${monthly_savings_needed:,.0f}
- Priority: {goal.priority}
- Category: {goal.category}

Generate exactly {num_missions} missions that:
1. Start simple and increase in complexity/commitment over time
2. Are spaced approximately {mission_interval_days} days apart
3. Mix different mission types: SAVINGS, SPENDING_REDUCTION, LEARNING, CHALLENGE, INVESTMENT
4. Include specific, actionable tasks with measurable outcomes
5. Build financial habits progressively
6. Include milestones that celebrate progress (e.g., 25%, 50%, 75% of goal)

Mission types available:
- SAVINGS: Direct saving tasks (e.g., "Save $X this week")
- SPENDING_REDUCTION: Cut unnecessary expenses (e.g., "Skip dining out 3 times")
- LEARNING: Financial education (e.g., "Research investment options for your goal")
- CHALLENGE: Behavioral challenges (e.g., "No-spend weekend")
- INVESTMENT: Investment-related tasks (e.g., "Set up automatic transfers")

Return a JSON array of missions with this structure:
[
  {{
    "title": "Mission title (short, action-oriented)",
    "description": "Detailed description of what to do and why",
    "mission_type": "SAVINGS|SPENDING|LEARNING|INVESTMENT|DEBT",
    "days_from_start": 0,
    "points": 10-100,
    "milestone_percent": null or 25/50/75/100
  }}
]

Points should reflect difficulty:
- Easy tasks: 10-25 points
- Medium tasks: 30-50 points
- Hard tasks: 60-100 points
- Milestone celebrations: 50-100 bonus points

Order missions chronologically with days_from_start indicating when each mission should start."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate a complete mission roadmap for achieving the goal: {goal.title}"}
        ]

        client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
        chat_completion = await client.chat.completions.create(
            model="openai/gpt-4-turbo",
            messages=messages
        )
        
        ai_content = chat_completion.choices[0].message.content
        
        # Parse the JSON response
        try:
            missions_data = json.loads(ai_content)
        except json.JSONDecodeError:
            import re
            match = re.search(r'\[.*\]', ai_content, re.DOTALL)
            if match:
                missions_data = json.loads(match.group(0))
            else:
                # Fallback to basic missions if parsing fails
                return MissionGenerationAgent._generate_fallback_missions(
                    user_profile, goal, current_date, num_missions, mission_interval_days
                )
        
        # Convert to Mission objects
        missions = []
        for i, m in enumerate(missions_data):
            days_offset = m.get("days_from_start", i * mission_interval_days)
            mission_date = current_date + timedelta(days=days_offset)
            deadline = mission_date + timedelta(days=mission_interval_days)
            
            # Map string to MissionType enum
            mission_type_str = m.get("mission_type", "LEARNING").upper()
            mission_type_map = {
                "SAVINGS": MissionType.SAVINGS,
                "SPENDING": MissionType.SPENDING,
                "LEARNING": MissionType.LEARNING,
                "INVESTMENT": MissionType.INVESTMENT,
                "DEBT": MissionType.DEBT
            }
            mission_type = mission_type_map.get(mission_type_str, MissionType.LEARNING)
            
            missions.append(Mission(
                mission_id=f"mission_{goal.goal_id}_{i+1}",
                user_id=user_profile.user_id,
                title=m.get("title", f"Mission {i+1}"),
                description=m.get("description", "Complete this mission to progress toward your goal."),
                mission_type=mission_type,
                deadline=deadline,
                points=m.get("points", 25),
                goal_id=goal.goal_id,
                milestone_percent=m.get("milestone_percent")
            ))
        
        return missions

    @staticmethod
    def _generate_fallback_missions(
        user_profile: UserProfile,
        goal: FinancialGoal,
        start_date: date,
        num_missions: int,
        interval_days: int
    ) -> List[Mission]:
        """Generate basic fallback missions if AI generation fails"""
        
        missions = []
        mission_templates = [
            ("Set Up Your Savings Plan", "Review your budget and identify how much you can save toward this goal each month.", MissionType.LEARNING, 25),
            ("First Savings Deposit", "Make your first dedicated deposit toward this goal.", MissionType.SAVINGS, 50),
            ("Track Your Spending", "Log all expenses for one week to identify savings opportunities.", MissionType.LEARNING, 30),
            ("No-Spend Day Challenge", "Complete one full day without any non-essential spending.", MissionType.CHALLENGE, 20),
            ("Automate Your Savings", "Set up an automatic transfer to your savings account.", MissionType.INVESTMENT, 40),
            ("Review and Adjust", "Check your progress and adjust your savings plan if needed.", MissionType.LEARNING, 25),
            ("Savings Boost Week", "Find one extra way to save money this week.", MissionType.SPENDING_REDUCTION, 35),
            ("Celebrate Progress", "You're making great progress! Review how far you've come.", MissionType.LEARNING, 50),
        ]
        
        for i in range(min(num_missions, len(mission_templates))):
            template = mission_templates[i % len(mission_templates)]
            mission_date = start_date + timedelta(days=i * interval_days)
            
            missions.append(Mission(
                mission_id=f"mission_{goal.goal_id}_{i+1}",
                user_id=user_profile.user_id,
                title=template[0],
                description=template[1],
                mission_type=template[2],
                deadline=mission_date + timedelta(days=interval_days),
                points=template[3],
                goal_id=goal.goal_id
            ))
        
        return missions

    @staticmethod
    async def generate_weekly_missions(
        user_profile: UserProfile,
        goals: List[FinancialGoal],
    ) -> List[Mission]:
        """
        Generate a focused set of missions for the current week based on active goals.
        This is useful for showing users their immediate tasks.
        """
        
        current_date = datetime.now().date()
        weekly_missions = []
        
        # Get 1-2 missions per active goal for this week
        for goal in goals[:3]:  # Limit to top 3 goals to avoid overwhelming user
            system_prompt = f"""Generate 2 actionable missions for this week to help achieve the goal: {goal.title}.

Goal details:
- Target: ${goal.target_amount:,.0f}
- Target Date: {goal.target_date}
- Priority: {goal.priority}

User's monthly income: ${user_profile.annual_income / 12:,.0f}

Return a JSON array with 2 missions:
[
  {{
    "title": "Short action title",
    "description": "What to do this week",
    "mission_type": "SAVINGS|SPENDING_REDUCTION|LEARNING|CHALLENGE|INVESTMENT",
    "points": 20-50
  }}
]"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate 2 missions for this week."}
            ]

            client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
            chat_completion = await client.chat.completions.create(
                model="openai/gpt-4-turbo",
                messages=messages
            )
            
            ai_content = chat_completion.choices[0].message.content
            
            try:
                missions_data = json.loads(ai_content)
            except json.JSONDecodeError:
                import re
                match = re.search(r'\[.*\]', ai_content, re.DOTALL)
                if match:
                    missions_data = json.loads(match.group(0))
                else:
                    continue
            
            mission_type_map = {
                "SAVINGS": MissionType.SAVINGS,
                "SPENDING_REDUCTION": MissionType.SPENDING_REDUCTION,
                "LEARNING": MissionType.LEARNING,
                "CHALLENGE": MissionType.CHALLENGE,
                "INVESTMENT": MissionType.INVESTMENT,
            }
            
            for i, m in enumerate(missions_data[:2]):
                mission_type_str = m.get("mission_type", "LEARNING").upper()
                mission_type = mission_type_map.get(mission_type_str, MissionType.LEARNING)
                
                weekly_missions.append(Mission(
                    mission_id=f"weekly_{goal.goal_id}_{current_date.isoformat()}_{i+1}",
                    user_id=user_profile.user_id,
                    title=m.get("title", "Weekly Mission"),
                    description=m.get("description", "Complete this mission this week."),
                    mission_type=mission_type,
                    deadline=current_date + timedelta(days=7),
                    points=m.get("points", 25),
                    goal_id=goal.goal_id
                ))
        
        return weekly_missions
