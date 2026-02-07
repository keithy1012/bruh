from typing import List, Optional, Dict, Any
import json
from dotenv import load_dotenv
import os
from models.UserProfile import UserProfile
from models.FinancialGoal import FinancialGoal
from dedalus_labs import AsyncDedalus

load_dotenv()

class CreditOptimizationAgent:
    """Credit card recommendations and stack optimization"""

    @staticmethod
    async def extract_current_loadout(conversation_history: List[Dict]) -> Dict:
        """
        Extract any credit cards mentioned so far in the conversation to build a live loadout.
        Returns a partial credit stack based on cards discussed.
        """
        if not conversation_history or len(conversation_history) < 3:
            return {"cards": [], "tree_name": None}
        
        system_prompt = (
            "Analyze the conversation below and extract any credit cards that have been recommended or discussed. "
            "Return a JSON object with the following structure:\n"
            "{\n"
            '  "tree_name": "A creative name for this card stack based on spending patterns discussed (or null if not enough info)",\n'
            '  "cards": [\n'
            '    {\n'
            '      "name": "Card Name",\n'
            '      "issuer": "Bank/Issuer Name",\n'
            '      "reason": "Brief reason why this card was mentioned",\n'
            '      "best_categories": ["category1", "category2"]\n'
            '    }\n'
            '  ]\n'
            "}\n"
            "If no specific cards have been recommended yet, return {\"cards\": [], \"tree_name\": null}. "
            "Only include cards that were explicitly recommended by the assistant, not just mentioned in passing."
        )
        
        messages = [
            {"role": "system", "content": system_prompt},
        ] + conversation_history
        messages.append({"role": "user", "content": "Extract the credit cards recommended so far as JSON."})
        
        try:
            client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
            chat_completion = await client.chat.completions.create(
                model="openai/gpt-4-turbo",
                messages=messages
            )
            ai_content = chat_completion.choices[0].message.content
            
            try:
                loadout = json.loads(ai_content)
            except:
                import re
                match = re.search(r'\{.*\}', ai_content, re.DOTALL)
                if match:
                    loadout = json.loads(match.group(0))
                else:
                    loadout = {"cards": [], "tree_name": None}
            
            return loadout
        except Exception as e:
            print(f"Error extracting loadout: {e}")
            return {"cards": [], "tree_name": None}

    @staticmethod
    async def chat(
        user_profile: UserProfile,
        goals: List[FinancialGoal],
        conversation_history: List[Dict] = None,
        user_message: str = None
    ) -> Dict:
        """
        Chat with the user to learn about their lifestyle (travel, food, groceries, etc.)
        and recommend a credit card stack.
        Pass user_message=None and conversation_history=None to start the conversation.
        """
        if conversation_history is None:
            conversation_history = []

        system_prompt = (
            "You are a credit card optimization expert. "
            "You have been given the user's profile and financial goals. "
            "Ask the user about their lifestyle: how often they travel, how much they spend on dining out, "
            "groceries, gas, online shopping, subscriptions, etc. "
            "Ask one or two questions at a time. Be friendly and conversational. "
            "Once you have enough information, recommend a credit card stack (2-4 cards) that maximizes their rewards. "
            "IMPORTANT: When you mention a specific credit card by name, ALWAYS format it as a markdown link "
            "using the official card application or info page URL. For example: "
            "[Chase Sapphire Preferred](https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred) "
            "or [Amex Gold Card](https://www.americanexpress.com/us/credit-cards/card/gold-card/). "
            "This helps the user learn more about the cards you recommend."
        )

        # If conversation is empty, start with an intro
        if not conversation_history:
            intro = (
                f"Hi! I see you're {user_profile.age} years old with an annual income of ${user_profile.annual_income:,.2f}. "
                "Let's find the best credit cards for you! First, how often do you travel (flights, hotels) in a year?"
            )
            conversation_history.append({"role": "assistant", "content": intro})
            return {
                "response": intro, 
                "conversation_history": conversation_history,
                "current_loadout": {"cards": [], "tree_name": None}
            }

        # Add user message to history
        if user_message:
            conversation_history.append({"role": "user", "content": user_message})

        # Build context for LLM
        context = (
            f"User profile: Age {user_profile.age}, Income ${user_profile.annual_income:,.2f}, Debts: {json.dumps(user_profile.debts)}.\n"
            f"Goals: {json.dumps([g.dict() for g in goals], default=str)}.\n"
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context}
        ] + conversation_history

        client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
        chat_completion = await client.chat.completions.create(
            model="openai/gpt-4-turbo",
            messages=messages
        )
        ai_content = chat_completion.choices[0].message.content
        conversation_history.append({"role": "assistant", "content": ai_content})
        
        # Extract current loadout from conversation
        current_loadout = await CreditOptimizationAgent.extract_current_loadout(conversation_history)
        
        return {
            "response": ai_content, 
            "conversation_history": conversation_history,
            "current_loadout": current_loadout
        }

    @staticmethod
    async def finalize_stack(
        user_profile: UserProfile,
        goals: List[FinancialGoal],
        conversation_history: List[Dict]
    ) -> Dict:
        """
        After gathering lifestyle info via chat, generate and return the recommended credit card stack.
        """
        system_prompt = (
            "You are a credit card optimization expert. Based on the conversation below, "
            "recommend a credit card stack (2-4 cards) for the user. "
            "Return a JSON object with the following structure:\n"
            "{\n"
            '  "tree_name": "A creative tree name that reflects the user\'s spending style (e.g., Traveler\'s Tree, Foodie\'s Grove, Cashback Oak, Points Harvester)",\n'
            '  "cards": [\n'
            '    {\n'
            '      "name": "Card Name",\n'
            '      "issuer": "Bank/Issuer Name",\n'
            '      "reason": "Why this card is recommended",\n'
            '      "annual_fee": 0,\n'
            '      "best_categories": ["category1", "category2"],\n'
            '      "url": "https://official-card-application-or-info-page-url"\n'
            '    }\n'
            '  ],\n'
            '  "total_estimated_annual_value": 500.0,\n'
            '  "summary": "Overall strategy explanation",\n'
            '  "strategy": "How to use these cards together"\n'
            "}\n"
            "IMPORTANT: For the url field, provide the official application or product page URL for each credit card. "
            "Use real URLs from the card issuer's website (e.g., chase.com, americanexpress.com, etc.). "
            "The tree_name should be creative and reflect the user's primary spending categories or lifestyle."
        )
        context = (
            f"User profile: Age {user_profile.age}, Income ${user_profile.annual_income:,.2f}, Debts: {json.dumps(user_profile.debts)}.\n"
            f"Goals: {json.dumps([g.dict() for g in goals], default=str)}.\n"
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context}
        ] + conversation_history
        messages.append({"role": "user", "content": "Please return the recommended credit card stack as JSON."})

        client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
        chat_completion = await client.chat.completions.create(
            model="openai/gpt-4-turbo",
            messages=messages
        )
        ai_content = chat_completion.choices[0].message.content

        try:
            stack = json.loads(ai_content)
        except Exception:
            import re
            match = re.search(r'\{.*\}', ai_content, re.DOTALL)
            if match:
                stack = json.loads(match.group(0))
            else:
                raise ValueError("AI response could not be parsed as JSON: " + ai_content)

        return stack
