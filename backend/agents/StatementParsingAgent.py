
from datetime import datetime, date
import json
from dotenv import load_dotenv
import os
from models.Transaction import Transaction
from models.SpendingReport import SpendingReport
from models.SpendingInsight import SpendingInsight
from dedalus_labs import AsyncDedalus

load_dotenv()

class StatementParsingAgent:
    """PDF ingestion and financial data extraction using Dedalus LLM"""
    @staticmethod
    async def parse_statement(file_content: bytes, user_id: str) -> SpendingReport:
        prompt = (
            "You are a financial assistant. Analyze the following bank statement PDF. "
            "Extract all transactions (date, description, amount, category), "
            "summarize total income, total expenses, and provide a breakdown by category. "
            "Also, identify places for improvement in spending, subscriptions, and recurring expenses. "
            "Return a JSON object with: transactions (list), total_income, total_expenses, categories (dict), "
            "and improvements (list of suggestions)."
        )

        messages = [
            {"role": "system", "content": "You are a helpful financial assistant."},
            {"role": "user", "content": prompt}
        ]

        client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
        chat_completion = await client.chat.completions.create(
            model="openai/gpt-4-turbo",
            messages=messages,
            files=[{"file": file_content, "filename": "statement.pdf"}]
        )
        ai_content = chat_completion.choices[0].message.content

        try:
            data = json.loads(ai_content)
        except Exception:
            import re
            match = re.search(r'\{.*\}', ai_content, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
            else:
                raise ValueError("AI response could not be parsed as JSON: " + ai_content)

        transactions = []
        for t in data.get("transactions", []):
            try:
                tx_date = date.fromisoformat(t["date"])
            except Exception:
                tx_date = datetime.now().date()
            transactions.append(Transaction(
                date=tx_date,
                description=t.get("description", ""),
                amount=float(t.get("amount", 0.0)),
                category=t.get("category", "other")
            ))

        # --- Spending Analysis Logic ---
        subscriptions = []
        repeat_purchases = []
        for transaction in transactions:
            if "subscription" in transaction.category.lower() or transaction.description.lower() in ["netflix", "spotify", "hulu"]:
                subscriptions.append({
                    "name": transaction.description,
                    "amount": abs(transaction.amount),
                    "frequency": "monthly"
                })

        insights = []
        if len(subscriptions) > 5:
            total_sub = sum(s["amount"] for s in subscriptions)
            insights.append(SpendingInsight(
                category="subscriptions",
                insight_type="opportunity",
                title="High Subscription Spending",
                description=f"You're spending ${total_sub:.2f}/month on {len(subscriptions)} subscriptions",
                potential_savings=total_sub * 0.3,
                action_items=[
                    "Review and cancel unused subscriptions",
                    "Look for annual plans to save 15-20%",
                    "Consider family plans to split costs"
                ]
            ))

        categories = data.get("categories", {})
        if categories.get("dining", 0) > 500:
            insights.append(SpendingInsight(
                category="dining",
                insight_type="opportunity",
                title="High Dining Expenses",
                description=f"Dining spending is above average at ${categories['dining']:.2f}",
                potential_savings=150.0,
                action_items=[
                    "Meal prep for 2-3 days per week",
                    "Use dining rewards credit card",
                    "Set a weekly dining budget"
                ]
            ))

        optimization_score = 75.0  # Mock score or could be improved

        return SpendingReport(
            user_id=user_id,
            report_id=f"report_{datetime.now().timestamp()}",
            period=f"{datetime.now().date()} to {datetime.now().date()}",
            total_spending=float(data.get("total_expenses", 0.0)),
            category_breakdown=categories,
            subscriptions=subscriptions,
            repeat_purchases=repeat_purchases,
            insights=insights,
            optimization_score=optimization_score
        )
