from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
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
from agents.GoalPlanningAgent import GoalPlanningAgent
from agents.StatementParsingAgent import StatementParsingAgent
from agents.CreditOptimizationAgent import CreditOptimizationAgent
from agents.MissionGenerationAgent import MissionGenerationAgent

# Initialize FastAPI app
app = FastAPI(title="MoneyMap")

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

class OnboardRequest(BaseModel):
    age: int
    annual_income: float
    debts: List[Dict[str, Any]] = []

@app.post("/api/users/onboard")
async def onboard_user(request: OnboardRequest):
    """
    Initial user onboarding: basic info (age, income, debts)
    """
    user_id = f"user_{datetime.now().timestamp()}"
    
    # Create user profile
    user_profile = UserProfile(
        user_id=user_id,
        age=request.age,
        annual_income=request.annual_income,
        debts=request.debts
    )
    users_db[user_id] = user_profile

    return {
        "user_id": user_id,
        "message": "Onboarding successful",
        "next_step": "goal_planning"
    }

@app.post("/api/goals/chat")
async def goal_planning_chat(message: Optional[str] = None, conversation_history: Optional[List[Dict]] = None):
    """
    Chat with Goal Planning Agent to collect user info and goals.
    Pass message=None and conversation_history=None to start a new conversation.
    """
    if conversation_history is None:
        conversation_history = []
    result = await GoalPlanningAgent.chat(conversation_history, message)
    return result

@app.post("/api/goals/finalize")
async def finalize_goals(user_id: str, conversation_history: List[Dict]):
    """
    Finalize goals after conversation with Goal Planning Agent.
    Extracts goals from conversation and saves them.
    """
    goals = await GoalPlanningAgent.finalize_goals(conversation_history)
    # Optionally assign user_id to each goal
    for goal in goals:
        goal.user_id = user_id
    goals_db[user_id] = goals
    return {
        "goals": goals,
        "message": "Goals saved successfully"
    }

# In-memory storage for credit optimization conversations
credit_conversations_db: Dict[str, List[Dict]] = {}

class CreditChatRequest(BaseModel):
    message: Optional[str] = None

@app.post("/api/credit/chat/{user_id}")
async def credit_optimization_chat(user_id: str, request: CreditChatRequest = CreditChatRequest()):
    """
    Chat with Credit Optimization Agent to learn about lifestyle and recommend credit cards.
    Pass message=None to start a new conversation.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user_profile = users_db[user_id]
    goals = goals_db.get(user_id, [])
    conversation_history = credit_conversations_db.get(user_id, [])
    result = await CreditOptimizationAgent.chat(user_profile, goals, conversation_history, request.message)
    credit_conversations_db[user_id] = result["conversation_history"]
    return result

@app.post("/api/credit/finalize/{user_id}")
async def credit_optimization_finalize(user_id: str):
    """
    Finalize credit card stack recommendation after chatting.
    """
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user_profile = users_db[user_id]
    goals = goals_db.get(user_id, [])
    conversation_history = credit_conversations_db.get(user_id, [])
    if not conversation_history:
        raise HTTPException(status_code=400, detail="No conversation history found. Please chat first.")
    result = await CreditOptimizationAgent.finalize_stack(user_profile, goals, conversation_history)
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

@app.get("/api/social/feed")
async def get_social_feed(limit: int = 20):
    """
    Get recent social feed activities
    """
    return {"feed": social_feed[-limit:]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)