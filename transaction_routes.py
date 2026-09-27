from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db
from models.transaction import Transaction

transaction_bp = Blueprint('transaction_bp', __name__, url_prefix='/api/transactions')

@transaction_bp.route('', methods=['GET'])
def get_transactions():
    search_query = request.args.get('search', '', type=str).strip()
    category = request.args.get('category', '', type=str).strip()
    t_type = request.args.get('type', '', type=str).strip().lower()
    start_date = request.args.get('start_date', '', type=str).strip()
    end_date = request.args.get('end_date', '', type=str).strip()

    query = Transaction.query

    if search_query:
        query = query.filter(Transaction.description.ilike(f'%{search_query}%'))
    if category:
        query = query.filter(Transaction.category == category)
    if t_type in Transaction.VALID_TYPES:
        query = query.filter(Transaction.transaction_type == t_type)
    if start_date:
        try:
            sd = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Transaction.date >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Transaction.date <= ed)
        except ValueError:
            pass

    transactions = query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()
    return jsonify({
        'success': True,
        'count': len(transactions),
        'data': [t.to_dict() for t in transactions]
    }), 200

@transaction_bp.route('', methods=['POST'])
def add_transaction():
    data = request.get_json() or {}

    t_type = str(data.get('transaction_type', '')).strip().lower()
    amount = data.get('amount')
    category = str(data.get('category', '')).strip()
    description = str(data.get('description', '')).strip()
    date_str = str(data.get('date', '')).strip()

    # Server-side validation
    if t_type not in Transaction.VALID_TYPES:
        return jsonify({'success': False, 'message': 'Invalid transaction type. Must be income or expense.'}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Amount must be a positive number.'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Please enter a valid numeric amount.'}), 400

    if not category:
        return jsonify({'success': False, 'message': 'Category is required.'}), 400

    if t_type == 'income' and category not in Transaction.INCOME_CATEGORIES:
        # Allow category if valid or standard
        pass
    elif t_type == 'expense' and category not in Transaction.EXPENSE_CATEGORIES:
        pass

    try:
        t_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.utcnow().date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    new_t = Transaction(
        transaction_type=t_type,
        amount=amount,
        category=category,
        description=description,
        date=t_date
    )

    try:
        db.session.add(new_t)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Transaction recorded successfully.', 'data': new_t.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Database error occurred.', 'error': str(e)}), 500

@transaction_bp.route('/<int:t_id>', methods=['GET'])
def get_single_transaction(t_id):
    t = db.session.get(Transaction, t_id)
    if not t:
        return jsonify({'success': False, 'message': 'Transaction not found.'}), 404
    return jsonify({'success': True, 'data': t.to_dict()}), 200

@transaction_bp.route('/<int:t_id>', methods=['PUT'])
def update_transaction(t_id):
    t = db.session.get(Transaction, t_id)
    if not t:
        return jsonify({'success': False, 'message': 'Transaction not found.'}), 404

    data = request.get_json() or {}

    t_type = str(data.get('transaction_type', t.transaction_type)).strip().lower()
    amount = data.get('amount', t.amount)
    category = str(data.get('category', t.category)).strip()
    description = str(data.get('description', t.description or '')).strip()
    date_str = str(data.get('date', '')).strip()

    if t_type not in Transaction.VALID_TYPES:
        return jsonify({'success': False, 'message': 'Invalid transaction type.'}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Amount must be positive.'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid amount.'}), 400

    if not category:
        return jsonify({'success': False, 'message': 'Category is required.'}), 400

    if date_str:
        try:
            t.date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid date format.'}), 400

    t.transaction_type = t_type
    t.amount = amount
    t.category = category
    t.description = description

    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Transaction updated successfully.', 'data': t.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to update transaction.', 'error': str(e)}), 500

@transaction_bp.route('/<int:t_id>', methods=['DELETE'])
def delete_transaction(t_id):
    t = db.session.get(Transaction, t_id)
    if not t:
        return jsonify({'success': False, 'message': 'Transaction not found.'}), 404

    try:
        db.session.delete(t)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Transaction deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to delete transaction.', 'error': str(e)}), 500
