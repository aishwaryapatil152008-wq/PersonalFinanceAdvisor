from flask import Blueprint, request, jsonify
from services.ai_service import AIService

ai_bp = Blueprint('ai_bp', __name__, url_prefix='/api/chat')

@ai_bp.route('', methods=['POST'])
def chat():
    data = request.get_json() or {}
    question = str(data.get('question', '')).strip()

    if not question:
        return jsonify({
            'success': False,
            'message': 'Please provide a valid financial question.'
        }), 400

    result = AIService.get_advice(question)
    return jsonify(result), 200
