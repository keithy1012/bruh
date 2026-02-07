
from datetime import datetime, date
import json
from dotenv import load_dotenv
import os
import csv
import io
from models.Transaction import Transaction
from models.SpendingReport import SpendingReport
from models.SpendingInsight import SpendingInsight
from dedalus_labs import AsyncDedalus

load_dotenv()

class StatementParsingAgent:
    """PDF and CSV ingestion and financial data extraction using Dedalus LLM"""
    
    @staticmethod
    async def parse_csv_statement(file_content: bytes, user_id: str) -> SpendingReport:
        """Parse CSV bank statement"""
        # Decode bytes to string
        csv_string = file_content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_string))
        
        transactions = []
        total_income = 0.0
        total_expenses = 0.0
        categories = {}
        
        for row in csv_reader:
            # Common CSV formats - adjust field names based on your CSV structure
            # Try different common column names
            date_str = row.get('Date') or row.get('date') or row.get('Transaction Date')
            description = row.get('Description') or row.get('description') or row.get('Memo')
            amount_str = row.get('Amount') or row.get('amount') or row.get('Debit') or row.get('Credit')
            category = row.get('Category') or row.get('category') or 'Other'
            
            if not date_str or not amount_str:
                continue
                
            # Parse date
            try:
                tx_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except:
                try:
                    tx_date = datetime.strptime(date_str, '%m/%d/%Y').date()
                except:
                    tx_date = datetime.now().date()
            
            # Parse amount
            amount = float(amount_str.replace('$', '').replace(',', '').strip())
            
            # If no category provided, use AI to categorize
            if category == 'Other' or not category:
                category = await StatementParsingAgent._categorize_transaction(description)
            
            transactions.append(Transaction(
                date=tx_date,
                description=description,
                amount=amount,
                category=category
            ))
            
            # Track income vs expenses
            if amount > 0:
                total_income += amount
            else:
                total_expenses += abs(amount)
                
            # Aggregate by category
            if category not in categories:
                categories[category] = 0
            categories[category] += abs(amount)
        
        # Generate insights
        insights = await StatementParsingAgent._generate_insights(
            transactions, categories, total_expenses
        )
        
        # Calculate optimization score
        optimization_score = StatementParsingAgent._calculate_optimization_score(
            total_income, total_expenses, len(insights)
        )
        
        return SpendingReport(
            user_id=user_id,
            report_id=f"report_{datetime.now().timestamp()}",
            period=f"{min(t.date for t in transactions)} to {max(t.date for t in transactions)}" if transactions else f"{datetime.now().date()}",
            total_spending=total_expenses,
            total_income=total_income,
            category_breakdown=categories,
            subscriptions=StatementParsingAgent._extract_subscriptions(transactions),
            repeat_purchases=[],
            insights=insights,
            optimization_score=optimization_score,
            transactions=transactions
        )
    
    @staticmethod
    async def _categorize_transaction(description: str) -> str:
        """Use AI to categorize a transaction based on description"""
        description_lower = description.lower()
        
        # Simple rule-based categorization (can be enhanced with AI)
        if any(word in description_lower for word in ['grocery', 'supermarket', 'whole foods', 'trader joe', 'safeway']):
            return 'Food & Dining'
        elif any(word in description_lower for word in ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald']):
            return 'Food & Dining'
        elif any(word in description_lower for word in ['gas', 'shell', 'chevron', 'exxon', 'uber', 'lyft']):
            return 'Transportation'
        elif any(word in description_lower for word in ['rent', 'mortgage', 'apartment']):
            return 'Housing'
        elif any(word in description_lower for word in ['electric', 'utility', 'water', 'internet', 'phone']):
            return 'Utilities'
        elif any(word in description_lower for word in ['netflix', 'spotify', 'hulu', 'amazon prime', 'disney']):
            return 'Entertainment'
        elif any(word in description_lower for word in ['target', 'walmart', 'amazon', 'shopping']):
            return 'Shopping'
        else:
            return 'Other'
    
    @staticmethod
    def _extract_subscriptions(transactions: list) -> list:
        """Extract recurring subscriptions from transactions"""
        subscriptions = []
        subscription_keywords = ['netflix', 'spotify', 'hulu', 'amazon prime', 'disney', 
                                'apple music', 'youtube premium', 'gym', 'membership']
        
        for transaction in transactions:
            desc_lower = transaction.description.lower()
            if any(keyword in desc_lower for keyword in subscription_keywords):
                subscriptions.append({
                    "name": transaction.description,
                    "amount": abs(transaction.amount),
                    "frequency": "monthly"
                })
        
        # Remove duplicates
        seen = set()
        unique_subscriptions = []
        for sub in subscriptions:
            if sub["name"] not in seen:
                seen.add(sub["name"])
                unique_subscriptions.append(sub)
        
        return unique_subscriptions
    
    @staticmethod
    async def _generate_insights(transactions: list, categories: dict, total_expenses: float) -> list:
        """Generate spending insights"""
        insights = []
        
        # Subscription insight
        subscriptions = StatementParsingAgent._extract_subscriptions(transactions)
        if len(subscriptions) > 3:
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
        
        # Dining insight
        dining_spend = categories.get("Food & Dining", 0)
        if dining_spend > 500:
            insights.append(SpendingInsight(
                category="dining",
                insight_type="warning",
                title="High Dining Expenses",
                description=f"Dining spending is above average at ${dining_spend:.2f}",
                potential_savings=150.0,
                action_items=[
                    "Meal prep for 2-3 days per week",
                    "Use dining rewards credit card",
                    "Set a weekly dining budget"
                ]
            ))
        
        # Transportation insight
        transport_spend = categories.get("Transportation", 0)
        if transport_spend > 400:
            insights.append(SpendingInsight(
                category="transportation",
                insight_type="suggestion",
                title="Transportation Costs",
                description=f"Transportation spending is ${transport_spend:.2f}",
                potential_savings=100.0,
                action_items=[
                    "Consider carpooling or public transit",
                    "Optimize routes to save on gas",
                    "Look into fuel rewards programs"
                ]
            ))
        
        return insights
    
    @staticmethod
    def _calculate_optimization_score(total_income: float, total_expenses: float, num_insights: int) -> float:
        """Calculate a financial optimization score (0-100)"""
        if total_income == 0:
            return 50.0
        
        savings_rate = (total_income - total_expenses) / total_income
        base_score = min(savings_rate * 100, 100)
        
        # Deduct points for insights (more insights = more room for improvement)
        penalty = min(num_insights * 5, 25)
        
        return max(base_score - penalty, 0)
    
    @staticmethod
    async def parse_statement(file_content: bytes, user_id: str) -> SpendingReport:
        """Original PDF parsing method - kept for backward compatibility"""
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

        optimization_score = 75.0

        return SpendingReport(
            user_id=user_id,
            report_id=f"report_{datetime.now().timestamp()}",
            period=f"{datetime.now().date()} to {datetime.now().date()}",
            total_spending=float(data.get("total_expenses", 0.0)),
            category_breakdown=categories,
            subscriptions=subscriptions,
            repeat_purchases=[],
            insights=insights,
            optimization_score=optimization_score
        )
