from datetime import date
from flask import Blueprint, request, jsonify
from models import db
from models.budget import Budget
from services.finance_service import FinanceService

budget_bp = Blueprint('budget_bp', __name__, url_prefix='/api/budget')

@budget_bp.route('', methods=['GET'])
def get_budget():
    today = date.today()
    month = request.args.get('month', today.month, type=int)
    year = request.args.get('year', today.year, type=int)

    summary = FinanceService.get_dashboard_summary(target_month=month, target_year=year)
    budget_obj = Budget.query.filter_by(month=month, year=year).first()

    return jsonify({
        'success': True,
        'data': {
            'budget_id': budget_obj.id if budget_obj else None,
            'month': month,
            'year': year,
            'monthly_budget': summary['monthly_budget'],
            'monthly_expenses': summary['monthly_expenses'],
            'remaining_budget': summary['remaining_budget'],
            'budget_usage_percent': summary['budget_usage_percent']
        }
    }), 200

@budget_bp.route('', methods=['POST'])
def set_budget():
    data = request.get_json() or {}

    amount = data.get('amount')
    today = date.today()
    month = data.get('month', today.month)
    year = data.get('year', today.year)

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Budget amount must be a positive number.'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Please enter a valid numeric budget amount.'}), 400

    try:
        month = int(month)
        year = int(year)
        if month < 1 or month > 12:
            return jsonify({'success': False, 'message': 'Month must be between 1 and 12.'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid month or year.'}), 400

    # Upsert logic (insert or update existing month/year budget)
    budget_obj = Budget.query.filter_by(month=month, year=year).first()
    if budget_obj:
        budget_obj.amount = amount
    else:
        budget_obj = Budget(amount=amount, month=month, year=year)
        db.session.add(budget_obj)

    try:
        db.session.commit()
        summary = FinanceService.get_dashboard_summary(target_month=month, target_year=year)
        return jsonify({
            'success': True,
            'message': f'Budget set successfully for {month}/{year}.',
            'data': {
                'budget_id': budget_obj.id,
                'amount': budget_obj.amount,
                'month': budget_obj.month,
                'year': budget_obj.year,
                'summary': summary
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Database error occurred while setting budget.', 'error': str(e)}), 500

@budget_bp.route('/<int:b_id>', methods=['PUT'])
def update_budget(b_id):
    budget_obj = Budget.query.get(b_id)
    if not budget_obj:
        return jsonify({'success': False, 'message': 'Budget record not found.'}), 404

    data = request.get_json() or {}
    amount = data.get('amount')

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Budget amount must be positive.'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid budget amount.'}), 400

    budget_obj.amount = amount
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Budget updated successfully.', 'data': budget_obj.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Database error.', 'error': str(e)}), 500
