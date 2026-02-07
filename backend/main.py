from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
import json
import asyncio
from decimal import Decimal
import uvicorn
from pydantic import BaseModel

from models.UserProfile import UserProfile
from models.FinancialGoal import FinancialGoal
from models.ParsedStatement import ParsedStatement
from models.Mission import Mission
from models.SocialFeed import SocialFeed
from models.SpendingReport import SpendingReport
from agents.GoalPlanningAgent import GoalPlanningAgent
from agents.StatementParsingAgent import StatementParsingAgent
from agents.CreditOptimizationAgent import CreditOptimizationAgent
from agents.MissionGenerationAgent import MissionGenerationAgent


# Initialize FastAPI app
app = FastAPI(title="MoneyTree")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# API ENDPOINTS
# ============================================================================

# In-memory storage
users_db: Dict[str, UserProfile] = {}
goals_db: Dict[str, List[FinancialGoal]] = {}
statements_db: Dict[str, ParsedStatement] = {}
missions_db: Dict[str, List[Mission]] = {}
social_feed: List[SocialFeed] = []
spending_reports_db: Dict[str, SpendingReport] = {}  


class OnboardRequest(BaseModel):
    age: int
    annual_income: float
    debts: List[Dict[str, Any]] = []

@app.post("/api/users/onboard")
async def onboard_user(
    age: int = Form(...),
    annual_income: float = Form(...),
    debts: str = Form("[]"),  # JSON string
    transactions_csv: Optional[UploadFile] = File(None)
):
    """
    Initial user onboarding: basic info (age, income, debts) + optional CSV upload
    Accepts both FormData (with CSV) and JSON (without CSV) for backward compatibility
    """
    user_id = f"user_{datetime.now().timestamp()}"
    
    # Parse debts from JSON string
    try:
        debts_list = json.loads(debts)
    except json.JSONDecodeError:
        debts_list = []
    
    # Create user profile
    user_profile = UserProfile(
        user_id=user_id,
        age=age,
        annual_income=annual_income,
        debts=debts_list
    )
    users_db[user_id] = user_profile

    # Process CSV if uploaded
    spending_report = None
    if transactions_csv:
        try:
            # Read file content
            file_content = await transactions_csv.read()
            
            # Parse CSV using the agent
            spending_report = await StatementParsingAgent.parse_csv_statement(
                file_content, 
                user_id
            )
            
            # Store spending report
            spending_reports_db[user_id] = spending_report
        except Exception as e:
            # Log error but don't fail onboarding
            print(f"Error processing CSV: {str(e)}")
            # Optionally return a warning in the response

    return {
        "user_id": user_id,
        "message": "Onboarding successful",
        "next_step": "goal_planning",
        "has_spending_data": spending_report is not None
    }

@app.get("/api/budget/{user_id}")
async def get_budget_data(user_id: str):
    """
    Get budget and spending data for a user based on uploaded CSV
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_id]
    spending_report = spending_reports_db.get(user_id)
    
    if not spending_report:
        # Return default data if no CSV was uploaded
        return {
            "has_data": False,
            "message": "No spending data available. Upload a CSV to see your budget analysis."
        }
    
    # Transform spending report into frontend format
    # Map categories to frontend format with icons
    category_mapping = {
        "Housing": {"icon": "Home", "color": "#1e3a5f"},
        "Transportation": {"icon": "Car", "color": "#2d4f7f"},
        "Food & Dining": {"icon": "ShoppingCart", "color": "#4a6fa5"},
        "Entertainment": {"icon": "Coffee", "color": "#6b8fc9"},
        "Utilities": {"icon": "Zap", "color": "#8cafed"},
        "Shopping": {"icon": "ShoppingCart", "color": "#9db8d9"},
        "Other": {"icon": "DollarSign", "color": "#b3d1ff"}
    }
    
    spending_categories = []
    for category, amount in spending_report.category_breakdown.items():
        cat_info = category_mapping.get(category, {"icon": "DollarSign", "color": "#b3d1ff"})
        spending_categories.append({
            "name": category,
            "amount": round(amount, 2),
            "color": cat_info["color"],
            "icon": cat_info["icon"]
        })
    
    # Convert insights to frontend format
    insights = []
    for insight in spending_report.insights:
        insight_type_mapping = {
            "opportunity": "suggestion",
            "warning": "warning",
            "suggestion": "suggestion"
        }
        
        insights.append({
            "title": insight.title,
            "description": insight.description,
            "type": insight_type_mapping.get(insight.insight_type, "suggestion"),
            "icon": "Lightbulb" if insight.insight_type == "opportunity" else "TrendingDown"
        })
    
    # Convert transactions to frontend format
    recent_transactions = []
    for transaction in sorted(spending_report.transactions, key=lambda x: x.date, reverse=True)[:10]:
        recent_transactions.append({
            "date": transaction.date.strftime("%b %d"),
            "description": transaction.description,
            "category": transaction.category,
            "amount": transaction.amount
        })
    
    # Calculate savings
    savings = spending_report.total_income - spending_report.total_spending
    
    return {
        "has_data": True,
        "summary": {
            "income": round(spending_report.total_income, 2),
            "expenses": round(spending_report.total_spending, 2),
            "savings": round(savings, 2)
        },
        "spending_categories": spending_categories,
        "insights": insights,
        "recent_transactions": recent_transactions,
        "period": spending_report.period,
        "optimization_score": spending_report.optimization_score
    }

class GoalChatRequest(BaseModel):
    message: Optional[str] = None
    conversation_history: Optional[List[Dict[str, Any]]] = None

# In-memory storage for goal conversations
goal_conversations_db: Dict[str, List[Dict]] = {}

@app.get("/api/goals/chat/{user_id}")
async def get_goal_conversation(user_id: str):
    """
    Get existing conversation history for goals.
    Returns empty list if no conversation exists.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    conversation_history = goal_conversations_db.get(user_id, [])
    return {"conversation_history": conversation_history}

@app.post("/api/goals/chat/{user_id}")
async def goal_planning_chat(user_id: str, request: GoalChatRequest = GoalChatRequest()):
    """
    Chat with Goal Planning Agent to collect user goals.
    Pass message=None to start a new conversation.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_profile = users_db[user_id]
    conversation_history = goal_conversations_db.get(user_id, [])
    
    result = await GoalPlanningAgent.chat(user_profile, conversation_history, request.message)
    goal_conversations_db[user_id] = result["conversation_history"]
    return result

@app.post("/api/goals/finalize/{user_id}")
async def finalize_goals(user_id: str):
    """
    Finalize goals after conversation with Goal Planning Agent.
    Extracts goals from conversation and appends them to existing goals.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    if user_id not in goal_conversations_db:
        raise HTTPException(status_code=400, detail="No conversation history found. Please chat first.")
    
    conversation_history = goal_conversations_db[user_id]
    new_goals = await GoalPlanningAgent.finalize_goals(conversation_history)
    
    # Clear conversation history after finalizing
    goal_conversations_db[user_id] = []
    
    # Assign user_id to each goal
    for goal in new_goals:
        goal.user_id = user_id
    
    # Append new goals to existing goals instead of replacing
    existing_goals = goals_db.get(user_id, [])
    existing_goals.extend(new_goals)
    goals_db[user_id] = existing_goals
    
    return {
        "goals": existing_goals,
        "message": "Goals saved successfully"
    }

@app.get("/api/goals/{user_id}")
async def get_goals(user_id: str):
    """
    Get all goals for a user
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    goals = goals_db.get(user_id, [])
    return {"goals": goals}

class UpdateGoalRequest(BaseModel):
    current_amount: Optional[float] = None
    on_roadmap: Optional[bool] = None

@app.patch("/api/goals/{user_id}/{goal_id}")
async def update_goal(user_id: str, goal_id: str, request: UpdateGoalRequest):
    """
    Update a goal's progress or roadmap status
    """
    if user_id not in goals_db:
        raise HTTPException(status_code=404, detail="No goals found for user")
    
    goals = goals_db[user_id]
    goal = next((g for g in goals if g.goal_id == goal_id), None)
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if request.current_amount is not None:
        goal.current_amount = request.current_amount
    if request.on_roadmap is not None:
        goal.on_roadmap = request.on_roadmap
    
    return {"goal": goal, "message": "Goal updated successfully"}

@app.delete("/api/goals/{user_id}/{goal_id}")
async def delete_goal(user_id: str, goal_id: str):
    """
    Delete a goal
    """
    if user_id not in goals_db:
        raise HTTPException(status_code=404, detail="No goals found for user")
    
    goals = goals_db[user_id]
    goal = next((g for g in goals if g.goal_id == goal_id), None)
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goals_db[user_id] = [g for g in goals if g.goal_id != goal_id]
    return {"message": "Goal deleted successfully"}

# In-memory storage for generated missions per goal
missions_db: Dict[str, Dict[str, List[Mission]]] = {}  # user_id -> goal_id -> missions

@app.get("/api/goals/{user_id}/{goal_id}")
async def get_goal_detail(user_id: str, goal_id: str):
    """
    Get a specific goal with its details
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    if user_id not in goals_db:
        raise HTTPException(status_code=404, detail="No goals found for user")
    
    goals = goals_db[user_id]
    goal = next((g for g in goals if g.goal_id == goal_id), None)
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return {"goal": goal}

@app.get("/api/goals/{user_id}/{goal_id}/missions")
async def get_goal_missions(user_id: str, goal_id: str):
    """
    Get missions for a specific goal. Returns cached missions if they exist.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if missions already exist for this goal
    if user_id in missions_db and goal_id in missions_db[user_id]:
        return {"missions": missions_db[user_id][goal_id]}
    
    return {"missions": []}

@app.post("/api/goals/{user_id}/{goal_id}/missions/generate")
async def generate_goal_missions(user_id: str, goal_id: str):
    """
    Generate a mission roadmap for a specific goal using MissionGenerationAgent
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    if user_id not in goals_db:
        raise HTTPException(status_code=404, detail="No goals found for user")
    
    user_profile = users_db[user_id]
    goals = goals_db[user_id]
    goal = next((g for g in goals if g.goal_id == goal_id), None)
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Generate missions using the agent
    missions = await MissionGenerationAgent.generate_mission_roadmap(user_profile, goal)
    
    # Store missions in database
    if user_id not in missions_db:
        missions_db[user_id] = {}
    missions_db[user_id][goal_id] = missions
    
    return {"missions": missions, "message": "Missions generated successfully"}

class UpdateMissionRequest(BaseModel):
    status: Optional[str] = None  # "active", "completed", "failed"

@app.patch("/api/goals/{user_id}/{goal_id}/missions/{mission_id}")
async def update_mission(user_id: str, goal_id: str, mission_id: str, request: UpdateMissionRequest):
    """
    Update a mission's status (e.g., mark as completed)
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_id not in missions_db or goal_id not in missions_db[user_id]:
        raise HTTPException(status_code=404, detail="No missions found for this goal")
    
    missions = missions_db[user_id][goal_id]
    mission = next((m for m in missions if m.mission_id == mission_id), None)
    
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    if request.status is not None:
        mission.status = request.status
    
    return {"mission": mission, "message": "Mission updated successfully"}

# In-memory storage for credit optimization conversations and finalized stacks
credit_conversations_db: Dict[str, List[Dict]] = {}
credit_stacks_db: Dict[str, Dict] = {}

class CreditChatRequest(BaseModel):
    message: Optional[str] = None

@app.get("/api/credit/chat/{user_id}")
async def get_credit_conversation(user_id: str):
    """
    Get existing conversation history for credit optimization.
    Returns empty list if no conversation exists.
    Also returns finalized stack if one exists.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    conversation_history = credit_conversations_db.get(user_id, [])
    finalized_stack = credit_stacks_db.get(user_id, None)
    return {"conversation_history": conversation_history, "finalized_stack": finalized_stack}

@app.post("/api/credit/chat/{user_id}")
async def credit_optimization_chat(user_id: str, request: CreditChatRequest = CreditChatRequest()):
    """
    Chat with Credit Optimization Agent to learn about lifestyle and recommend credit cards.
    Now uses actual spending data from CSV if available.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user_profile = users_db[user_id]
    goals = goals_db.get(user_id, [])
    conversation_history = credit_conversations_db.get(user_id, [])
    
    # Get spending report if available
    spending_report = spending_reports_db.get(user_id)
    
    # Pass spending report to the agent
    result = await CreditOptimizationAgent.chat(
        user_profile, 
        goals, 
        conversation_history, 
        request.message,
        spending_report=spending_report
    )
    credit_conversations_db[user_id] = result["conversation_history"]
    return result

@app.post("/api/credit/finalize/{user_id}")
async def credit_optimization_finalize(user_id: str):
    """
    Finalize credit card stack recommendation after chatting.
    Uses actual spending data from CSV if available for precise recommendations.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user_profile = users_db[user_id]
    goals = goals_db.get(user_id, [])
    conversation_history = credit_conversations_db.get(user_id, [])
    if not conversation_history:
        raise HTTPException(status_code=400, detail="No conversation history found. Please chat first.")
    
    # Get spending report if available
    spending_report = spending_reports_db.get(user_id)
    
    # Pass spending report to the agent
    result = await CreditOptimizationAgent.finalize_stack(
        user_profile, 
        goals, 
        conversation_history,
        spending_report=spending_report
    )
    return result

@app.get("/api/credit/paths/{user_id}")
async def get_credit_paths(user_id: str, upcoming_loan: Optional[str] = None):
    """
    Get credit card recommendation paths (legacy endpoint, consider using /api/credit/chat and /api/credit/finalize)
    """
    if user_id not in users_db or user_id not in statements_db:
        raise HTTPException(status_code=404, detail="User data not found")
    
    user_profile = users_db[user_id]
    parsed_statement = statements_db[user_id]
    goals = goals_db.get(user_id, [])
    
    loan_info = {"type": upcoming_loan} if upcoming_loan else None
    
    result = await CreditOptimizationAgent.generate_paths(
        user_profile,
        parsed_statement,
        goals,
        loan_info
    )
    
    return result

'''
@app.get("/api/spending/report/{user_id}")
async def get_spending_report(user_id: str):
    """
    Get detailed spending analysis report
    """
    if user_id not in statements_db:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    parsed_statement = statements_db[user_id]
    report = await SpendingAnalysisAgent.analyze_spending(parsed_statement)
    
    return report
'''

@app.get("/api/missions/{user_id}")
async def get_missions(user_id: str):
    """
    Get active missions for user
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if missions already exist
    if user_id not in missions_db:
        user_profile = users_db[user_id]
        goals = goals_db.get(user_id, [])
        '''
        # Need spending report for mission generation
        if user_id in statements_db:
            parsed_statement = statements_db[user_id]
            spending_report = await SpendingAnalysisAgent.analyze_spending(parsed_statement)
            missions = await MissionGenerationAgent.generate_missions(
                user_profile,
                goals,
                spending_report
            )
            missions_db[user_id] = missions
        else:
            return {"missions": []}
        '''
    return {"missions": missions_db[user_id]}

@app.post("/api/missions/{mission_id}/complete")
async def complete_mission(mission_id: str, user_id: str):
    """
    Mark a mission as complete and update
    """
    if user_id not in missions_db:
        raise HTTPException(status_code=404, detail="No missions found")
    
    missions = missions_db[user_id]
    mission = next((m for m in missions if m.mission_id == mission_id), None)
    
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    mission.status = "completed"
    
    return {
        "mission": mission,
    }


@app.get("/api/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    """
    Get dashboard data including aggregated missions from all goals
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_profile = users_db[user_id]
    goals = goals_db.get(user_id, [])
    
    # Aggregate all missions from all goals
    all_missions = []
    apples_collected = 0  # Count goals with all missions completed
    
    if user_id in missions_db:
        user_missions = missions_db[user_id]
        # Check if it's a nested dict (goal_id -> missions) or flat list
        if isinstance(user_missions, dict):
            for goal_id, goal_missions in user_missions.items():
                all_missions.extend(goal_missions)
                # Check if all missions for this goal are completed
                if goal_missions and all(m.status == "completed" for m in goal_missions):
                    apples_collected += 1
        elif isinstance(user_missions, list):
            all_missions.extend(user_missions)
    
    # Count completed missions
    completed_count = sum(1 for m in all_missions if m.status == "completed")
    
    # Stats including apples
    streak = {
        "current_streak": 0,
        "total_missions_completed": completed_count,
        "longest_streak": 0,
        "apples_collected": apples_collected
    }
    
    return {
        "user_profile": user_profile,
        "goals": goals,
        "missions": all_missions,
        "streak": streak,
        "spending_summary": {}
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)