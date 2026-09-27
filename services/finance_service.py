from datetime import datetime, date
from sqlalchemy import extract, func
from models import db
from models.transaction import Transaction
from models.budget import Budget

class FinanceService:
    @staticmethod
    def get_dashboard_summary(target_month=None, target_year=None):
        today = date.today()
        month = target_month if target_month else today.month
        year = target_year if target_year else today.year

        # Overall totals
        income_query = db.session.query(func.coalesce(func.sum(Transaction.amount), 0.0))\
            .filter(Transaction.transaction_type == 'income').scalar()
        expense_query = db.session.query(func.coalesce(func.sum(Transaction.amount), 0.0))\
            .filter(Transaction.transaction_type == 'expense').scalar()

        total_income = round(float(income_query), 2)
        total_expenses = round(float(expense_query), 2)
        current_balance = round(total_income - total_expenses, 2)
        
        # Savings calculation: Total Income - Total Expenses
        estimated_savings = round(total_income - total_expenses, 2)
        savings_percentage = round((estimated_savings / total_income * 100), 1) if total_income > 0 else 0.0

        # Monthly Budget calculation
        budget_obj = Budget.query.filter_by(month=month, year=year).first()
        monthly_budget = round(budget_obj.amount, 2) if budget_obj else 0.0

        monthly_expense_query = db.session.query(func.coalesce(func.sum(Transaction.amount), 0.0))\
            .filter(
                Transaction.transaction_type == 'expense',
                extract('month', Transaction.date) == month,
                extract('year', Transaction.date) == year
            ).scalar()
        monthly_expenses = round(float(monthly_expense_query), 2)

        monthly_income_query = db.session.query(func.coalesce(func.sum(Transaction.amount), 0.0))\
            .filter(
                Transaction.transaction_type == 'income',
                extract('month', Transaction.date) == month,
                extract('year', Transaction.date) == year
            ).scalar()
        monthly_income = round(float(monthly_income_query), 2)

        remaining_budget = round(monthly_budget - monthly_expenses, 2)
        budget_usage_percent = round((monthly_expenses / monthly_budget * 100), 1) if monthly_budget > 0 else 0.0

        # Recent 5 transactions
        recent_transactions = [
            t.to_dict() for t in Transaction.query.order_by(Transaction.date.desc(), Transaction.id.desc()).limit(5).all()
        ]

        # Expense by category
        category_rows = db.session.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        ).filter(Transaction.transaction_type == 'expense')\
         .group_by(Transaction.category)\
         .order_by(func.sum(Transaction.amount).desc()).all()

        expense_by_category = {row.category: round(float(row.total), 2) for row in category_rows}

        return {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'current_balance': current_balance,
            'estimated_savings': estimated_savings,
            'savings_percentage': savings_percentage,
            'monthly_budget': monthly_budget,
            'monthly_expenses': monthly_expenses,
            'monthly_income': monthly_income,
            'remaining_budget': remaining_budget,
            'budget_usage_percent': budget_usage_percent,
            'month': month,
            'year': year,
            'recent_transactions': recent_transactions,
            'expense_by_category': expense_by_category
        }

    @staticmethod
    def get_analytics_data(target_month=None, target_year=None):
        today = date.today()
        month = target_month if target_month else None
        year = target_year if target_year else today.year

        # Base queries
        expense_query = db.session.query(
            Transaction.category,
            func.sum(Transaction.amount).label('total')
        ).filter(Transaction.transaction_type == 'expense')

        if year:
            expense_query = expense_query.filter(extract('year', Transaction.date) == year)
        if month:
            expense_query = expense_query.filter(extract('month', Transaction.date) == month)

        category_rows = expense_query.group_by(Transaction.category)\
            .order_by(func.sum(Transaction.amount).desc()).all()
        expense_by_category = {row.category: round(float(row.total), 2) for row in category_rows}

        # Monthly Spending Trends (past 6 or 12 months in specified year)
        trends_income = db.session.query(
            extract('month', Transaction.date).label('m'),
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.transaction_type == 'income',
            extract('year', Transaction.date) == year
        ).group_by(extract('month', Transaction.date)).all()

        trends_expense = db.session.query(
            extract('month', Transaction.date).label('m'),
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.transaction_type == 'expense',
            extract('year', Transaction.date) == year
        ).group_by(extract('month', Transaction.date)).all()

        income_by_month = {int(row.m): round(float(row.total), 2) for row in trends_income}
        expense_by_month = {int(row.m): round(float(row.total), 2) for row in trends_expense}

        months_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_trends = []
        for i in range(1, 13):
            inc = income_by_month.get(i, 0.0)
            exp = expense_by_month.get(i, 0.0)
            sav = round(inc - exp, 2)
            monthly_trends.append({
                'month_num': i,
                'month_name': months_labels[i-1],
                'income': inc,
                'expense': exp,
                'savings': sav
            })

        return {
            'year': year,
            'month': month,
            'expense_by_category': expense_by_category,
            'monthly_trends': monthly_trends
        }
