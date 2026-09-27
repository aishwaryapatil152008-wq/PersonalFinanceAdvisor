from datetime import datetime, timezone
from models import db

class Budget(db.Model):
    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    month = db.Column(db.Integer, nullable=False) # 1 - 12
    year = db.Column(db.Integer, nullable=False)  # e.g. 2026
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('month', 'year', name='unique_month_year_budget'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'amount': round(self.amount, 2),
            'month': self.month,
            'year': self.year,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }
