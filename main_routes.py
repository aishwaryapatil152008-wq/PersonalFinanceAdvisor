from flask import Blueprint, render_template

main_bp = Blueprint('main_bp', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/transactions')
def transactions():
    return render_template('transactions.html')

@main_bp.route('/budget')
def budget():
    return render_template('budget.html')

@main_bp.route('/analytics')
def analytics():
    return render_template('analytics.html')

@main_bp.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')
