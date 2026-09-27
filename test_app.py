import pytest
from datetime import date
from flask import Flask
from models import db
from models.transaction import Transaction
from models.budget import Budget
from routes.main_routes import main_bp
from routes.transaction_routes import transaction_bp
from routes.budget_routes import budget_bp
from routes.summary_routes import summary_bp
from routes.ai_routes import ai_bp

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config.update({
        "TESTING": True,
        "SECRET_KEY": "test-key-123",
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "GEMINI_API_KEY": ""
    })

    db.init_app(app)
    app.register_blueprint(main_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(summary_bp)
    app.register_blueprint(ai_bp)

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_add_valid_income_and_expense(client, app):
    """Test 1 & 2: Add valid income and expense records via REST API."""
    res_inc = client.post('/api/transactions', json={
        'transaction_type': 'income',
        'amount': 25000.0,
        'category': 'Salary',
        'description': 'Monthly Stipend',
        'date': '2026-09-01'
    })
    assert res_inc.status_code == 201
    data_inc = res_inc.get_json()
    assert data_inc['success'] is True
    assert data_inc['data']['amount'] == 25000.0

    res_exp = client.post('/api/transactions', json={
        'transaction_type': 'expense',
        'amount': 5000.0,
        'category': 'Food',
        'description': 'Groceries',
        'date': '2026-09-05'
    })
    assert res_exp.status_code == 201
    data_exp = res_exp.get_json()
    assert data_exp['success'] is True
    assert data_exp['data']['amount'] == 5000.0

def test_reject_negative_and_empty_form(client):
    """Test 3 & 4: Reject negative amount and empty submissions."""
    res1 = client.post('/api/transactions', json={
        'transaction_type': 'expense',
        'amount': -500.0,
        'category': 'Food',
        'description': 'Invalid'
    })
    assert res1.status_code == 400
    assert 'positive' in res1.get_json()['message']

    res2 = client.post('/api/transactions', json={
        'transaction_type': 'income',
        'amount': 1000.0,
        'category': '',
        'description': 'No category'
    })
    assert res2.status_code == 400

def test_dashboard_calculations(client, app):
    """Test 5: Verify dashboard mathematical calculations."""
    with app.app_context():
        t1 = Transaction(transaction_type='income', amount=30000.0, category='Salary', date=date(2026, 9, 1))
        t2 = Transaction(transaction_type='expense', amount=18000.0, category='Food', date=date(2026, 9, 5))
        db.session.add_all([t1, t2])
        db.session.commit()

    res = client.get('/api/dashboard?month=9&year=2026')
    assert res.status_code == 200
    data = res.get_json()['data']
    assert data['total_income'] == 30000.0
    assert data['total_expenses'] == 18000.0
    assert data['current_balance'] == 12000.0
    assert data['estimated_savings'] == 12000.0
    assert data['savings_percentage'] == 40.0

def test_set_budget_and_usage(client, app):
    """Test 6 & 7: Set budget and verify usage percentage and remaining budget."""
    res_b = client.post('/api/budget', json={
        'amount': 20000.0,
        'month': 9,
        'year': 2026
    })
    assert res_b.status_code == 200

    with app.app_context():
        t = Transaction(transaction_type='expense', amount=16000.0, category='Bills', date=date(2026, 9, 10))
        db.session.add(t)
        db.session.commit()

    res_summary = client.get('/api/budget?month=9&year=2026')
    assert res_summary.status_code == 200
    data = res_summary.get_json()['data']
    assert data['monthly_budget'] == 20000.0
    assert data['monthly_expenses'] == 16000.0
    assert data['remaining_budget'] == 4000.0
    assert data['budget_usage_percent'] == 80.0

def test_edit_and_delete_transaction(client, app):
    """Test 8 & 9: Edit and Delete transaction operations."""
    with app.app_context():
        t = Transaction(transaction_type='expense', amount=1000.0, category='Transport', description='Taxi', date=date(2026, 9, 2))
        db.session.add(t)
        db.session.commit()
        t_id = t.id

    # Edit
    res_edit = client.put(f'/api/transactions/{t_id}', json={
        'transaction_type': 'expense',
        'amount': 1500.0,
        'category': 'Transport',
        'description': 'Taxi & Fuel',
        'date': '2026-09-02'
    })
    assert res_edit.status_code == 200
    assert res_edit.get_json()['data']['amount'] == 1500.0

    # Delete
    res_del = client.delete(f'/api/transactions/{t_id}')
    assert res_del.status_code == 200

    # Verify deleted
    res_check = client.get(f'/api/transactions/{t_id}')
    assert res_check.status_code == 404

def test_filter_transactions(client, app):
    """Test 10: Filter transactions by search, category, type."""
    with app.app_context():
        t1 = Transaction(transaction_type='income', amount=5000.0, category='Freelance', description='Web App Design', date=date(2026, 9, 1))
        t2 = Transaction(transaction_type='expense', amount=300.0, category='Food', description='Pizza', date=date(2026, 9, 2))
        db.session.add_all([t1, t2])
        db.session.commit()

    # Search filter
    res_s = client.get('/api/transactions?search=Web')
    assert res_s.status_code == 200
    assert res_s.get_json()['count'] == 1

    # Type filter
    res_t = client.get('/api/transactions?type=expense')
    assert res_t.status_code == 200
    assert res_t.get_json()['count'] == 1

def test_ai_chatbot_response_and_empty_question(client):
    """Test 13 & 14: Test AI Chatbot endpoint and fallback response."""
    res_ai = client.post('/api/chat', json={
        'question': 'How can I reduce my monthly expenses?'
    })
    assert res_ai.status_code == 200
    data = res_ai.get_json()
    assert data['success'] is True
    assert 'response' in data

    res_empty = client.post('/api/chat', json={'question': ''})
    assert res_empty.status_code == 400
