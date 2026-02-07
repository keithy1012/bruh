
from datetime import datetime, date
import json
from dotenv import load_dotenv
import os
import csv
import io
import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from models.Transaction import Transaction
from models.SpendingReport import SpendingReport
from models.SpendingInsight import SpendingInsight
from dedalus_labs import AsyncDedalus

load_dotenv()

# Initialize AWS Comprehend client
comprehend_client = None
try:
    comprehend_client = boto3.client(
        'comprehend',
        region_name=os.environ.get('AWS_REGION', 'us-east-2'),
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
    )
    # Test the connection
    comprehend_client.detect_dominant_language(Text="test")
    print("AWS Comprehend connected successfully")
except Exception as e:
    print(f"AWS Comprehend not available, will use Dedalus fallback: {e}")
    comprehend_client = None

class StatementParsingAgent:
    """PDF and CSV ingestion and financial data extraction using Dedalus LLM and AWS Comprehend"""
    
    @staticmethod
    def _analyze_with_comprehend(text: str) -> dict:
        """
        Use AWS Comprehend to analyze transaction text.
        Returns entities, key phrases, and sentiment.
        """
        try:
            # Detect entities (organizations, locations, etc.)
            entities_response = comprehend_client.detect_entities(
                Text=text,
                LanguageCode='en'
            )
            
            # Detect key phrases
            key_phrases_response = comprehend_client.detect_key_phrases(
                Text=text,
                LanguageCode='en'
            )
            
            return {
                "entities": entities_response.get("Entities", []),
                "key_phrases": [kp["Text"] for kp in key_phrases_response.get("KeyPhrases", [])],
            }
        except Exception as e:
            print(f"AWS Comprehend error: {e}")
            return None  # Return None to trigger fallback
    
    @staticmethod
    def _batch_analyze_with_comprehend(texts: list) -> list | None:
        """
        Batch analyze multiple transaction descriptions with AWS Comprehend.
        More efficient for processing many transactions.
        Returns None if Comprehend is not available or fails.
        """
        if not texts:
            return []
        
        if comprehend_client is None:
            return None  # Comprehend not available, trigger fallback
        
        try:
            # AWS Comprehend batch limit is 25 documents
            results = []
            batch_size = 25
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                
                # Batch detect entities
                entities_response = comprehend_client.batch_detect_entities(
                    TextList=batch,
                    LanguageCode='en'
                )
                
                # Batch detect key phrases
                key_phrases_response = comprehend_client.batch_detect_key_phrases(
                    TextList=batch,
                    LanguageCode='en'
                )
                
                for j, (entity_result, kp_result) in enumerate(zip(
                    entities_response.get("ResultList", []),
                    key_phrases_response.get("ResultList", [])
                )):
                    results.append({
                        "entities": entity_result.get("Entities", []),
                        "key_phrases": [kp["Text"] for kp in kp_result.get("KeyPhrases", [])]
                    })
            
            return results
        except (BotoCoreError, ClientError, NoCredentialsError) as e:
            print(f"AWS Comprehend batch error: {e}")
            return None  # Return None to trigger fallback
        except Exception as e:
            print(f"AWS Comprehend unexpected error: {e}")
            return None
    
    @staticmethod
    def _categorize_from_comprehend(comprehend_result: dict, description: str) -> str:
        """
        Use AWS Comprehend results to help categorize a transaction.
        """
        entities = comprehend_result.get("entities", [])
        key_phrases = comprehend_result.get("key_phrases", [])
        description_lower = description.lower()
        
        # Check for organization entities that might indicate category
        org_names = [e["Text"].lower() for e in entities if e["Type"] == "ORGANIZATION"]
        
        # Food & Dining detection
        food_keywords = ['grocery', 'supermarket', 'whole foods', 'trader joe', 'safeway', 
                         'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'chipotle',
                         'doordash', 'uber eats', 'grubhub']
        if any(word in description_lower for word in food_keywords) or \
           any(word in ' '.join(org_names) for word in food_keywords):
            return 'Food & Dining'
        
        # Transportation detection
        transport_keywords = ['gas', 'shell', 'chevron', 'exxon', 'uber', 'lyft', 'transit', 'parking']
        if any(word in description_lower for word in transport_keywords):
            return 'Transportation'
        
        # Housing detection
        housing_keywords = ['rent', 'mortgage', 'apartment', 'property', 'hoa']
        if any(word in description_lower for word in housing_keywords):
            return 'Housing'
        
        # Utilities detection
        utility_keywords = ['electric', 'utility', 'water', 'internet', 'phone', 'comcast', 'verizon', 'at&t']
        if any(word in description_lower for word in utility_keywords):
            return 'Utilities'
        
        # Entertainment detection
        entertainment_keywords = ['netflix', 'spotify', 'hulu', 'amazon prime', 'disney', 'hbo', 'apple tv', 
                                  'movie', 'theater', 'gaming', 'playstation', 'xbox']
        if any(word in description_lower for word in entertainment_keywords):
            return 'Entertainment'
        
        # Shopping detection
        shopping_keywords = ['target', 'walmart', 'amazon', 'shopping', 'best buy', 'costco', 'home depot']
        if any(word in description_lower for word in shopping_keywords) or \
           any(word in ' '.join(org_names) for word in shopping_keywords):
            return 'Shopping'
        
        # Health detection
        health_keywords = ['pharmacy', 'cvs', 'walgreens', 'doctor', 'medical', 'hospital', 'dental', 'health']
        if any(word in description_lower for word in health_keywords):
            return 'Health & Medical'
        
        # Travel detection
        travel_keywords = ['airline', 'hotel', 'airbnb', 'expedia', 'booking', 'flight', 'marriott', 'hilton']
        if any(word in description_lower for word in travel_keywords):
            return 'Travel'
        
        # Use key phrases as additional context
        for phrase in key_phrases:
            phrase_lower = phrase.lower()
            if any(word in phrase_lower for word in food_keywords):
                return 'Food & Dining'
            if any(word in phrase_lower for word in entertainment_keywords):
                return 'Entertainment'
        
        return 'Other'
    
    @staticmethod
    async def parse_csv_statement(file_content: bytes, user_id: str) -> SpendingReport:
        """Parse CSV bank statement with AWS Comprehend enhancement"""
        # Decode bytes to string
        csv_string = file_content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_string))
        
        # First pass: collect all rows
        raw_rows = []
        for row in csv_reader:
            date_str = row.get('Date') or row.get('date') or row.get('Transaction Date')
            description = row.get('Description') or row.get('description') or row.get('Memo')
            amount_str = row.get('Amount') or row.get('amount') or row.get('Debit') or row.get('Credit')
            category = row.get('Category') or row.get('category') or ''
            
            if not date_str or not amount_str:
                continue
            
            raw_rows.append({
                'date_str': date_str,
                'description': description or '',
                'amount_str': amount_str,
                'category': category
            })
        
        # Use AWS Comprehend to batch analyze all descriptions that need categorization
        descriptions_to_analyze = [
            row['description'] for row in raw_rows 
            if not row['category'] or row['category'] == 'Other'
        ]
        
        # Batch analyze with Comprehend (returns None if unavailable)
        comprehend_results = None
        use_comprehend = False
        if descriptions_to_analyze:
            comprehend_results = StatementParsingAgent._batch_analyze_with_comprehend(descriptions_to_analyze)
            use_comprehend = comprehend_results is not None
        
        if not use_comprehend and descriptions_to_analyze:
            print("Falling back to Dedalus for transaction categorization")
        
        # Build transactions with Comprehend-enhanced or Dedalus categorization
        transactions = []
        total_income = 0.0
        total_expenses = 0.0
        categories = {}
        comprehend_idx = 0
        
        for row in raw_rows:
            # Parse date
            try:
                tx_date = datetime.strptime(row['date_str'], '%Y-%m-%d').date()
            except:
                try:
                    tx_date = datetime.strptime(row['date_str'], '%m/%d/%Y').date()
                except:
                    tx_date = datetime.now().date()
            
            # Parse amount
            amount = float(row['amount_str'].replace('$', '').replace(',', '').strip())
            
            # Determine category
            category = row['category']
            if not category or category == 'Other':
                if use_comprehend and comprehend_idx < len(comprehend_results):
                    # Use Comprehend result for categorization
                    category = StatementParsingAgent._categorize_from_comprehend(
                        comprehend_results[comprehend_idx], 
                        row['description']
                    )
                    comprehend_idx += 1
                else:
                    # Fall back to Dedalus-based categorization
                    category = await StatementParsingAgent._categorize_transaction_with_dedalus(row['description'])
            
            transactions.append(Transaction(
                date=tx_date,
                description=row['description'],
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
    async def _categorize_transaction_with_dedalus(description: str) -> str:
        """Use Dedalus LLM to categorize a transaction based on description"""
        try:
            client = AsyncDedalus(api_key=os.environ.get("DEDALUS_API_KEY"))
            
            prompt = (
                f"Categorize this bank transaction into ONE of these categories: "
                f"Food & Dining, Transportation, Housing, Utilities, Entertainment, Shopping, Health & Medical, Travel, Other.\n\n"
                f"Transaction: {description}\n\n"
                f"Respond with ONLY the category name, nothing else."
            )
            
            chat_completion = await client.chat.completions.create(
                model="openai/gpt-4-turbo",
                messages=[
                    {"role": "system", "content": "You are a financial transaction categorizer. Respond with only the category name."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            category = chat_completion.choices[0].message.content.strip()
            
            # Validate the category
            valid_categories = ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 
                              'Entertainment', 'Shopping', 'Health & Medical', 'Travel', 'Other']
            if category in valid_categories:
                return category
            
            # Try to match partial category names
            for valid_cat in valid_categories:
                if valid_cat.lower() in category.lower() or category.lower() in valid_cat.lower():
                    return valid_cat
            
            return 'Other'
        except Exception as e:
            print(f"Dedalus categorization error: {e}")
            # Fall back to simple rule-based categorization
            return await StatementParsingAgent._categorize_transaction(description)
    
    @staticmethod
    async def _categorize_transaction(description: str) -> str:
        """Use simple rules to categorize a transaction based on description"""
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
