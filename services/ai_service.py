import os
from flask import current_app
from services.finance_service import FinanceService

# Try importing official Google GenAI SDK
try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

SYSTEM_INSTRUCTION = (
    "You are Personal Finance Advisor Bot, an empathetic, clear, and encouraging financial education assistant. "
    "Your goal is to help users (including students and young adults) understand basic budgeting, saving habits, "
    "expense tracking, emergency funds, and basic financial concepts.\n\n"
    "SAFETY & REGULATORY RULES:\n"
    "1. Provide general educational guidance ONLY. Never guarantee investment profits or returns.\n"
    "2. Do not present high-risk financial actions as safe or certain.\n"
    "3. Encourage users to verify important financial decisions with a qualified professional.\n"
    "4. Clearly state when information is incomplete or when additional facts are required.\n"
    "5. Do not invent fake account balances or non-existent transactions.\n"
    "6. Keep responses structured, encouraging, concise, and easy to read (use bullet points where helpful)."
)

DISCLAIMER = (
    "\n\n*Note: This response is for educational purposes only and does not constitute certified professional financial advice.*"
)

class AIService:
    @staticmethod
    def get_advice(user_question):
        if not user_question or not user_question.strip():
            return {
                'success': False,
                'message': 'Question cannot be empty.',
                'response': 'Please enter a valid financial question.'
            }

        # Retrieve current user financial context safely
        summary = FinanceService.get_dashboard_summary()
        context_str = (
            f"User Financial Summary:\n"
            f"- Total Income Recorded: ₹{summary['total_income']}\n"
            f"- Total Expenses Recorded: ₹{summary['total_expenses']}\n"
            f"- Net Balance: ₹{summary['current_balance']}\n"
            f"- Monthly Budget: ₹{summary['monthly_budget']}\n"
            f"- Monthly Expenses: ₹{summary['monthly_expenses']} ({summary['budget_usage_percent']}% used)\n"
            f"- Top Expense Categories: {', '.join(list(summary['expense_by_category'].keys())[:3]) if summary['expense_by_category'] else 'None'}\n"
        )

        full_prompt = (
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"{context_str}\n\n"
            f"User Question: {user_question.strip()}\n"
        )

        api_key = current_app.config.get('GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY', '')

        if GENAI_AVAILABLE and api_key and api_key.strip():
            try:
                client = genai.Client(api_key=api_key)
                interaction = client.interactions.create(
                    model="gemini-3.8-flash",
                    input=full_prompt
                )
                answer = interaction.output_text if interaction.output_text else ""
                if answer:
                    return {
                        'success': True,
                        'source': 'gemini_api',
                        'response': answer + DISCLAIMER
                    }
            except Exception as e:
                current_app.logger.warning(f"Gemini API call error: {str(e)}. Falling back to educational response engine.")

        # Fallback educational response engine
        fallback_answer = AIService._generate_fallback_response(user_question, summary)
        return {
            'success': True,
            'source': 'educational_fallback',
            'response': fallback_answer + DISCLAIMER
        }

    @staticmethod
    def _generate_fallback_response(question, summary):
        q = question.lower()
        inc = summary['total_income']
        exp = summary['total_expenses']
        bal = summary['current_balance']

        if 'reduce' in q or 'cut' in q or 'save' in q or 'expense' in q:
            top_cats = list(summary['expense_by_category'].items())
            cat_advice = f"Your highest expense category is **{top_cats[0][0]}** (₹{top_cats[0][1]}). " if top_cats else ""
            return (
                f"### How to Reduce Your Monthly Expenses\n\n"
                f"{cat_advice}Here are 4 practical steps to optimize your spending:\n\n"
                f"1. **Track Needs vs. Wants**: Separate fixed necessities (rent, utilities, groceries) from flexible desires (dining out, entertainment).\n"
                f"2. **Use the 50/30/20 Rule**: Allocate 50% of income to Needs, 30% to Wants, and 20% to Savings.\n"
                f"3. **Audit Subscriptions**: Cancel recurring memberships or services you rarely use.\n"
                f"4. **Set Category Limits**: Use our Budget page to cap spending in high-frequency categories."
            )

        elif 'budget' in q or 'plan' in q or 'student' in q:
            return (
                f"### Creating a Student-Friendly Budget\n\n"
                f"Building a budget keeps you in full control of your money:\n\n"
                f"1. **Calculate Fixed Monthly Income**: Include allowances, part-time jobs, or scholarships.\n"
                f"2. **List Mandatory Costs**: Books, fees, transport, rent, and internet.\n"
                f"3. **Set Up a Buffer**: Keep 10% of monthly income aside for unexpected study or living costs.\n"
                f"4. **Review Weekly**: Check your progress on the Dashboard to avoid end-of-month financial stress."
            )

        elif 'need' in q or 'want' in q or 'difference' in q:
            return (
                f"### Understanding Needs vs. Wants\n\n"
                f"- **Needs**: Essential items required for daily survival, health, and education (e.g. basic food, housing, medical supplies, transport).\n"
                f"- **Wants**: Non-essential items that upgrade lifestyle quality but can be postponed (e.g. luxury clothing, premium subscriptions, daily coffee shop runs).\n\n"
                f"*Tip*: Delay non-essential purchases by 48 hours to evaluate if it is a genuine priority."
            )

        elif 'emergency' in q or 'buffer' in q:
            return (
                f"### What is an Emergency Fund?\n\n"
                f"An **emergency fund** is a dedicated cash reserve set aside strictly for unplanned financial emergencies (medical bills, urgent laptop repair, unexpected travel).\n\n"
                f"- **Target Goal**: Aim to accumulate 3 to 6 months of basic living expenses.\n"
                f"- **Where to Keep It**: In an easily accessible high-yield savings account or liquid fund, separate from daily checking."
            )

        else:
            return (
                f"### Financial Guidance Overview\n\n"
                f"Based on your current recorded activity:\n"
                f"- **Income**: ₹{inc:,}\n"
                f"- **Expenses**: ₹{exp:,}\n"
                f"- **Current Balance**: ₹{bal:,}\n\n"
                f"Key Recommendations:\n"
                f"1. **Consistency**: Log income and expenses regularly to maintain accurate spending trends.\n"
                f"2. **Budget Discipline**: Monitor your monthly budget usage on the Budget page.\n"
                f"3. **Savings First**: Aim to automate savings as soon as income is logged.\n\n"
                f"Feel free to ask me specific questions about budgeting, emergency funds, or expense categories!"
            )
