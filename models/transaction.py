from datetime import datetime, date, timezone
from models import db

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    transaction_type = db.Column(db.String(10), nullable=False) # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    date = db.Column(db.Date, nullable=False, default=date.today)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    VALID_TYPES = ['income', 'expense']
    INCOME_CATEGORIES = ['Salary', 'Scholarship', 'Freelance', 'Business', 'Investment', 'Other']
    EXPENSE_CATEGORIES = ['Food', 'Transport', 'Education', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Other']

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_type': self.transaction_type,
            'amount': round(self.amount, 2),
            'category': self.category,
            'description': self.description or '',
            'date': self.date.strftime('%Y-%m-%d') if self.date else '',
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }
