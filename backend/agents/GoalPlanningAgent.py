
from typing import List, Dict
from datetime import date
import os
import json
from models.UserProfile import UserProfile
from models.FinancialGoal import FinancialGoal
from dedalus_labs import AsyncDedalus

class GoalPlanningAgent:
    """Long-term financial goal modeling agent"""

    @staticmethod
    async def chat(conversation_history: List[Dict], user_message: str = None) -> Dict:
        """
        Chat with the user to collect age, income, debts, and goals.
        Pass user_message as None to start the conversation.
        Returns the AI response and updated conversation_history.
        """
        system_prompt = (
            "You are a friendly financial planning assistant. "
            "Your job is to ask the user for their age, annual income, any debts (type and amount), "
            "and then ask about their long-term financial goals (such as retirement, buying a house, travel, etc.). "
            "Ask one or two questions at a time. Be conversational and helpful. "
            "Once you have gathered all the information, summarize and confirm with the user."
        )

        if conversation_history is None:
            conversation_history = []

        # Start conversation if empty
        if not conversation_history:
            first_prompt = "Hi! I'm here to help you plan your financial future. Let's start — how old are you?"
            conversation_history.append({"role": "assistant", "content": first_prompt})
            return {"response": first_prompt, "conversation_history": conversation_history}

        # Add user message to history
        if user_message:
            conversation_history.append({"role": "user", "content": user_message})

        messages = [{"role": "system", "content": system_prompt}] + conversation_history

        client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
        chat_completion = await client.chat.completions.create(
            model="openai/gpt-4-turbo",
            messages=messages
        )
        ai_content = chat_completion.choices[0].message.content
        conversation_history.append({"role": "assistant", "content": ai_content})
        return {"response": ai_content, "conversation_history": conversation_history}

    @staticmethod
    async def finalize_goals(conversation_history: List[Dict]) -> List[FinancialGoal]:
        """
        After gathering info via chat, extract and return a list of FinancialGoal objects.
        """
        system_prompt = (
            "You are a financial planning assistant. Based on the conversation below, "
            "extract all the user's long-term financial goals and return them as a JSON array. "
            "Each goal should have: goal_id (string), user_id (leave blank), title, description, "
            "target_amount (float), target_date (YYYY-MM-DD), priority (high/medium/low), category."
        )

        messages = [{"role": "system", "content": system_prompt}] + conversation_history
        messages.append({"role": "user", "content": "Please return the list of goals as JSON."})

        client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
        chat_completion = await client.chat.completions.create(
            model="openai/gpt-4-turbo",
            messages=messages
        )
        ai_content = chat_completion.choices[0].message.content

        try:
            goals_data = json.loads(ai_content)
        except Exception:
            import re
            match = re.search(r'\[.*\]', ai_content, re.DOTALL)
            if match:
                goals_data = json.loads(match.group(0))
            else:
                raise ValueError("AI response could not be parsed as JSON: " + ai_content)

        goals = []
        for g in goals_data:
            goals.append(FinancialGoal(
                goal_id=g.get("goal_id", ""),
                user_id=g.get("user_id", ""),
                title=g.get("title", ""),
                description=g.get("description", ""),
                target_amount=float(g.get("target_amount", 0.0)),
                target_date=date.fromisoformat(g.get("target_date")) if g.get("target_date") else date.today(),
                priority=g.get("priority", "medium"),
                category=g.get("category", "other")
            ))
        return goals
