# Personal Finance Advisor Bot 💰🤖

A full-stack, responsive, AI-powered personal finance management web application built as an **AI-ML Engineering Capstone Project**.

The application helps users record income and expenses, set and monitor monthly budgets, visualize spending patterns through interactive Chart.js analytics, and receive personalized educational financial advice powered by **Google Gemini API**.
Live Demo - https://drive.google.com/file/d/1B7joln8UZU2pFHf6TgrS7jpZ2TCr7A9_/view?usp=sharing
Documentation - https://drive.google.com/file/d/1x70UGVPvaWckEYUHKx4J_cW13eC_AR4c/view?usp=sharing

---

## 🌟 Key Features

1. **Live Dynamic Dashboard**: Real-time calculations of Total Income, Total Expenses, Net Balance, Estimated Savings, Savings %, Monthly Budget, and Remaining Budget computed directly from database records.
2. **Transaction Ledger**: Complete CRUD operations for income and expense transactions, featuring live search description filtering, category selection, type filtering, and date range filtering.
3. **Monthly Budget Management**: Set custom monthly target budgets with dynamic utilization progress bars, approaching limit warnings (>=80%), and exceeded budget alerts (>=100%).
4. **Interactive Financial Analytics**: 4 Chart.js visual graphs for Income vs. Expense comparison, Category-wise Expense distribution, Monthly Spending Trends, and Net Savings Trends.
5. **AI Finance Advisor Chatbot**: Google Gemini API (`google-genai` Python SDK) integration with summarized user financial context and a robust educational fallback engine when credentials or internet are unavailable.
6. **Educational & Regulatory Safety**: Strict system instructions ensuring non-guaranteed profit disclaimers, encouraging professional advisor consultation, and avoiding hallucinated account details.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Modern Glassmorphic Navy Theme), JavaScript (ES6+), Chart.js CDN, FontAwesome 6 CDN.
- **Backend**: Python 3.13, Flask 3.1, Flask-SQLAlchemy ORM, RESTful JSON API endpoints.
- **Database**: SQLite3 (`instance/finance.db`).
- **AI Integration**: Google Gemini API via official `google-genai` SDK with fallback logic.
- **Testing**: `pytest` automated integration & unit test suite.

---

## 📁 Project Architecture & Directory Structure

```text
PersonalFinanceAdvisor/
├── app.py                      # Flask app entry point, blueprint registration & database seeding
├── config.py                   # Configuration setup (SQLite URI, Secret Key, Gemini API Key)
├── requirements.txt            # Python dependencies (Flask, Flask-SQLAlchemy, google-genai, pytest, etc.)
├── README.md                   # Repository documentation & guide
├── PROJECT_REPORT.md           # Comprehensive Capstone Project Report
├── .env.example                # Template environment variables
├── .gitignore                  # Git ignore configuration
├── models/                     # SQLAlchemy Database Models
│   ├── __init__.py
│   ├── transaction.py          # Transaction model (Income & Expense records)
│   └── budget.py               # Budget model (Monthly target limits)
├── routes/                     # Flask REST & HTML Blueprints
│   ├── __init__.py
│   ├── main_routes.py          # Page rendering routes (/, /dashboard, /transactions, /budget, /analytics, /chatbot)
│   ├── transaction_routes.py   # REST API for Transaction CRUD (/api/transactions)
│   ├── budget_routes.py        # REST API for Budget management (/api/budget)
│   ├── summary_routes.py       # REST API for Dashboard & Analytics data (/api/dashboard, /api/analytics)
│   └── ai_routes.py            # REST API for AI Chatbot (/api/chat)
├── services/                   # Core Business Logic Services
│   ├── __init__.py
│   ├── finance_service.py      # Financial aggregations, budget utilization & trend calculations
│   └── ai_service.py           # Gemini API SDK handler, prompt context builder & educational fallback
├── templates/                  # Jinja2 HTML Templates
│   ├── base.html               # Main layout header, nav, footer
│   ├── index.html              # Landing hero page
│   ├── dashboard.html          # Financial metrics dashboard & quick-add modal
│   ├── transactions.html       # Full ledger table, search, multi-filters & CRUD modals
│   ├── budget.html             # Budget target form, progress indicator & alert banners
│   ├── analytics.html          # 4 Interactive Chart.js visual graphs
│   └── chatbot.html            # AI Financial Assistant chat interface & prompt chips
├── static/                     # Web Static Assets
│   ├── css/
│   │   └── style.css           # Master CSS stylesheet (Navy palette, responsive design)
│   └── js/
│       ├── dashboard.js        # Dashboard metric updater & preview chart
│       ├── transactions.js     # Transaction ledger filter, search & modal handlers
│       ├── budget.js           # Budget manager & real-time progress calculator
│       ├── analytics.js        # Chart.js initialization & year filter handler
│       └── chatbot.js          # Interactive chat UI, typing indicators & markdown parser
└── tests/
    └── test_app.py             # Pytest automated test suite
```

---

## 🚀 Installation & Running Instructions

### Step 1: Clone or Navigate to Directory
```bash
cd PersonalFinanceAdvisor
```

### Step 2: Create and Activate Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional)* Add your Gemini API Key in `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
> **Note**: If `GEMINI_API_KEY` is not provided, the application will automatically fall back to its built-in rule-based educational finance engine without throwing errors!

### Step 5: Start the Flask Application
```bash
python app.py
```

Open your browser and navigate to: **`http://127.0.0.1:5000`**

---

## 🧪 Running Automated Tests

To run the automated `pytest` test suite:
```bash
venv\Scripts\python -m pytest tests/test_app.py -v
```

---

## 📊 Summary of Verified Test Cases

| Test Case | Description | Input | Expected Result | Status |
|---|---|---|---|---|
| TC-01 | Add Valid Income | Income ₹25,000, Salary | Record saved in DB (201 Created) | PASSED |
| TC-02 | Add Valid Expense | Expense ₹5,000, Food | Record saved in DB (201 Created) | PASSED |
| TC-03 | Reject Negative Amount | Amount = -500 | Validation error 400 Bad Request | PASSED |
| TC-04 | Reject Empty Form | Category = "" | Validation error 400 Bad Request | PASSED |
| TC-05 | Dashboard Metrics | Income ₹30k, Expense ₹18k | Balance = ₹12k, Savings = ₹12k (40%) | PASSED |
| TC-06 | Set Budget Target | Budget = ₹20,000 | Budget set for month (200 OK) | PASSED |
| TC-07 | Budget Usage & Warning | Expense = ₹16,000 | Usage = 80%, Remaining = ₹4,000 | PASSED |
| TC-08 | Edit Transaction | Amount 1000 -> 1500 | Record updated in DB (200 OK) | PASSED |
| TC-09 | Delete Transaction | DELETE /api/transactions/id | Record removed, return 404 on GET | PASSED |
| TC-10 | Filter Transactions | Search = "Web" | Returns only matching records | PASSED |
| TC-11 | AI Chatbot Advice | Question = "How to reduce expenses?" | Returns structured Markdown advice | PASSED |

---

## 🔒 Security & Limitations

- **Educational Capstone**: Designed as a capstone project MVP.
- **Environment Isolation**: API keys and secrets stored exclusively in `.env`. `.env` is listed in `.gitignore`.
- **Validation**: Strict server-side and client-side input validation on numeric amounts, categories, and dates.
- **Financial Advice Disclaimer**: All AI responses clearly state that guidance is educational and does not constitute certified professional financial advice.

---

## 📄 License & Attribution

Developed for **AI-ML Engineering Capstone Project**. Built with Python, Flask, SQLite, and Google Gemini.
