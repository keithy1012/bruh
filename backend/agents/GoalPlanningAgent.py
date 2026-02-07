
from typing import List, Dict
from datetime import date
import json
from dotenv import load_dotenv
import os
from models.UserProfile import UserProfile
from models.FinancialGoal import FinancialGoal
from dedalus_labs import AsyncDedalus

load_dotenv()

class GoalPlanningAgent:
    """Long-term financial goal modeling agent with Financial Planner MCP integration"""

    @staticmethod
    async def chat(
        user_profile: UserProfile,
        conversation_history: List[Dict] = None,
        user_message: str = None
    ) -> Dict:
        """
        Chat with the user to collect their financial goals.
        Pass user_message as None to start the conversation.
        Returns the AI response and updated conversation_history.
        """
        today = date.today().isoformat()
        system_prompt = (
            f"You are a friendly financial planning assistant with access to a financial planning tool. "
            f"Today's date is {today}. "
            "You have the user's profile information. "
            "Your job is to ask about their short and long term financial goals (such as retirement, buying a house, travel, emergency fund, etc.). "
            "Ask one or two questions at a time. Be conversational and helpful. "
            "For each goal, try to understand: the target amount, target date, and priority. "
            "IMPORTANT: All target dates must be in the future (after today's date). "
            "Once you have gathered all the information, summarize and confirm with the user. "
            "You can use the financial_planner tool to calculate SIP requirements, investment planning, and goal achievement strategies."
        )

        if conversation_history is None:
            conversation_history = []

        # Start conversation if empty - personalize with user info
        if not conversation_history:
            debts_summary = ", ".join([f"{d.get('type', 'debt')}: ${d.get('amount', 0):,.0f}" for d in user_profile.debts]) if user_profile.debts else "no debts"
            first_prompt = (
                f"Hi! I'm here to help you plan your financial future. "
                f"I see you're {user_profile.age} years old with an annual income of ${user_profile.annual_income:,.0f}"
                f"{f' and {debts_summary}' if user_profile.debts else ''}. "
                f"What financial goals would you like to work towards? For example, saving for retirement, building an emergency fund, buying a home, or planning a vacation?"
            )
            conversation_history.append({"role": "assistant", "content": first_prompt})
            return {"response": first_prompt, "conversation_history": conversation_history}

        # Add user message to history
        if user_message:
            conversation_history.append({"role": "user", "content": user_message})

        # Build context for LLM
        context = (
            f"User profile: Age {user_profile.age}, Income ${user_profile.annual_income:,.2f}, "
            f"Debts: {json.dumps(user_profile.debts)}.\n"
        )

        messages = [{"role": "system", "content": system_prompt + "\n\n" + context}] + conversation_history

        client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
        chat_completion = await client.chat.completions.create(
            model="openai/gpt-4-turbo",
            messages=messages,
            mcp_servers=["mohanputti/financial-planner-mcp"]
        )
        ai_content = chat_completion.choices[0].message.content
        conversation_history.append({"role": "assistant", "content": ai_content})
        return {"response": ai_content, "conversation_history": conversation_history}

    @staticmethod
    async def finalize_goals(conversation_history: List[Dict]) -> List[FinancialGoal]:
        """
        After gathering info via chat, extract and return a list of FinancialGoal objects.
        Uses the Financial Planner MCP for enhanced goal calculations.
        """
        today = date.today().isoformat()
        system_prompt = (
            f"You are a financial planning assistant with access to a financial planning tool. "
            f"Today's date is {today}. "
            "Based on the conversation below, extract all the user's short and long-term financial goals and return them as a JSON array. "
            "Each goal should have: goal_id (string), user_id (leave blank), title, description, "
            "target_amount (float), target_date (YYYY-MM-DD), priority (high/medium/low), category. "
            f"IMPORTANT: All target_date values MUST be in the future (after {today}). If the user mentioned a relative timeframe like '2 years' or 'in 5 years', calculate the actual date from today. "
            "You can use the financial_planner tool to calculate investment requirements for each goal."
        )

        messages = [{"role": "system", "content": system_prompt}] + conversation_history
        messages.append({"role": "user", "content": "Please return the list of goals as JSON."})

        client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))

        chat_completion = await client.chat.completions.create(
            model="openai/gpt-4-turbo",
            messages=messages,
            mcp_servers=["mohanputti/financial-planner-mcp"]
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
