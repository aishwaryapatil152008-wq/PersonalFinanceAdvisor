from datetime import date
from flask import Blueprint, request, jsonify
from services.finance_service import FinanceService

summary_bp = Blueprint('summary_bp', __name__, url_prefix='/api')

@summary_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    today = date.today()
    month = request.args.get('month', today.month, type=int)
    year = request.args.get('year', today.year, type=int)

    summary_data = FinanceService.get_dashboard_summary(target_month=month, target_year=year)
    return jsonify({
        'success': True,
        'data': summary_data
    }), 200

@summary_bp.route('/analytics', methods=['GET'])
def get_analytics():
    today = date.today()
    month = request.args.get('month', None, type=int)
    year = request.args.get('year', today.year, type=int)

    analytics_data = FinanceService.get_analytics_data(target_month=month, target_year=year)
    return jsonify({
        'success': True,
        'data': analytics_data
    }), 200
