from datetime import date
from flask import Flask
from config import Config
from models import db
from models.transaction import Transaction
from models.budget import Budget
from routes.main_routes import main_bp
from routes.transaction_routes import transaction_bp
from routes.budget_routes import budget_bp
from routes.summary_routes import summary_bp
from routes.ai_routes import ai_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(summary_bp)
    app.register_blueprint(ai_bp)

    # Initialize Database & Seed Data
    with app.app_context():
        db.create_all()
        if not app.config.get('TESTING'):
            seed_initial_data()

    return app

def seed_initial_data():
    """Seeds sample financial records if database is empty."""
    if Transaction.query.first() is None:
        today = date.today()
        sample_transactions = [
            Transaction(transaction_type='income', amount=30000.0, category='Salary', description='Monthly Salary', date=today),
            Transaction(transaction_type='income', amount=5000.0, category='Freelance', description='Web Design Project', date=today),
            Transaction(transaction_type='expense', amount=4500.0, category='Food', description='Groceries & Dining', date=today),
            Transaction(transaction_type='expense', amount=3200.0, category='Bills', description='Electricity & Internet', date=today),
            Transaction(transaction_type='expense', amount=2500.0, category='Education', description='Course Books', date=today),
            Transaction(transaction_type='expense', amount=1800.0, category='Transport', description='Metro & Fuel', date=today),
            Transaction(transaction_type='expense', amount=2000.0, category='Shopping', description='Clothing', date=today),
            Transaction(transaction_type='expense', amount=1000.0, category='Entertainment', description='Movie & Gaming', date=today)
        ]
        for t in sample_transactions:
            db.session.add(t)

        # Add sample budget for current month
        if Budget.query.filter_by(month=today.month, year=today.year).first() is None:
            sample_budget = Budget(amount=20000.0, month=today.month, year=today.year)
            db.session.add(sample_budget)

        db.session.commit()
        print("Database initialized and seeded with sample financial records.")

app = create_app()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
