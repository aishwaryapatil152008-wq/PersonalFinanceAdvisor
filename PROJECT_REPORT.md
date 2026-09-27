# CAPSTONE PROJECT REPORT: PERSONAL FINANCE ADVISOR BOT

**Course**: AI-ML Engineering Capstone Project  
**Project Title**: Personal Finance Advisor Bot  
**Technologies Used**: Python, Flask, SQLite, HTML5, CSS3, JavaScript, Chart.js, Google Gemini API  
**Date**: September 2026  

---

## 1. Abstract

Managing personal finances, tracking monthly budgets, and maintaining discipline over spending habits present significant challenges for students, young professionals, and individuals. Existing commercial financial management tools are often complex, subscription-based, or lack beginner-friendly educational guidance.

The **Personal Finance Advisor Bot** is a web-based financial management and educational counseling application built to solve this problem. It allows users to log income and expense transactions, categorize spending, establish monthly budgets, observe visual financial trends via interactive Chart.js graphs, and receive personalized educational financial guidance through an integrated **Google Gemini API** chatbot. The system is engineered using Python Flask, SQLAlchemy ORM, SQLite database, RESTful APIs, and a modern glassmorphic responsive user interface.

---

## 2. Problem Statement

Many students and individuals struggle to manage their income, expenses, savings, and monthly budgets. They frequently experience difficulty understanding where their money is spent or how to construct a sustainable financial plan.

Traditional financial platforms are complicated for beginners, require bank account linking, or fail to provide educational guidance tailored to user spending habits. There is a need for an intuitive, accessible, AI-powered Personal Finance Advisor Bot that helps users record transactions, monitor budget boundaries, analyze spending patterns, and receive educational guidance in simple English.

---

## 3. Proposed Solution

The proposed web application provides an end-to-end personal finance management platform enabling users to:
1. **Record Income & Expenses**: Log financial transactions with amounts, categories, dates, and descriptions.
2. **Dynamic Dashboard Metrics**: View live, calculated metrics for Total Income, Total Expenses, Net Balance, Estimated Savings, Savings %, and Monthly Budget Status computed dynamically from database records.
3. **Transaction Management**: Perform full CRUD operations, search transactions by keyword, filter by category, transaction type, or date ranges.
4. **Monthly Budgeting**: Define monthly budget targets, track spending utilization with percentage progress bars, receive color-coded warnings when spending reaches 80%, and alerts when budget is exceeded.
5. **Interactive Financial Analytics**: View 4 visual graphs (Income vs. Expense, Expense by Category, Monthly Spending Trends, Net Savings Trends) using Chart.js.
6. **AI Financial Counseling Chatbot**: Engage with an AI assistant powered by Google Gemini to learn budgeting strategies, savings habits, emergency fund concepts, and expense reduction tips based on actual user financial summaries.

---

## 4. System Architecture & Data Flow

### 4.1 High-Level Architecture Diagram Description

```text
+-------------------------------------------------------------------+
|                        USER / BROWSER CLIENT                      |
| (HTML5, CSS3 Glassmorphism, Vanilla JS, Chart.js, FontAwesome)    |
+-------------------------------------------------------------------+
                                  |
                                  | HTTP Requests (REST / JSON)
                                  v
+-------------------------------------------------------------------+
|                        FLASK BACKEND SYSTEM                       |
|                                                                   |
|  +------------------------+   +--------------------------------+  |
|  |     Main Blueprint     |   |         API Blueprints         |  |
|  | (Page HTML Renderers)  |   | (Transactions, Budget, AI)     |  |
|  +------------------------+   +--------------------------------+  |
|               |                               |                   |
|               v                               v                   |
|  +-------------------------------------------------------------+  |
|  |                 Finance & AI Service Layer                  |  |
|  |  - FinanceService: Aggregations, Savings %, Usage %         |  |
|  |  - AIService: Google Gemini SDK & Fallback Engine           |  |
|  +-------------------------------------------------------------+  |
|               |                               |                   |
+---------------+-------------------------------+-------------------+
                |                               |
                v                               v
+-------------------------------+   +-------------------------------+
|        SQLITE DATABASE        |   |       GOOGLE GEMINI API       |
|    (instance/finance.db)      |   |   (google-genai Python SDK)   |
+-------------------------------+   +-------------------------------+
```

### 4.2 Data Flow Narrative

1. **User Interaction**: The user enters an income/expense record or sets a budget through HTML5 forms on the frontend.
2. **Client-Side Validation & API Request**: JavaScript intercepts the submission, validates positive numeric inputs, and executes an asynchronous `fetch()` API call (POST/PUT/DELETE) to the Flask backend.
3. **Backend Validation & Processing**: The Flask API route validates incoming JSON parameters, delegates computational logic to `FinanceService`, and persists records to SQLite via SQLAlchemy ORM.
4. **Dashboard & Analytics Calculation**: Whenever the frontend requests `/api/dashboard` or `/api/analytics`, `FinanceService` executes aggregate queries (`SUM`, `GROUP BY`, date filtering) directly on SQLite tables to return live JSON metrics.
5. **AI Chatbot Pipeline**: When a question is submitted to `/api/chat`, `AIService` constructs a detailed context prompt incorporating the user's current financial summary (Total Income, Total Expenses, Balance, Top Expense Category). It attempts to query `google-genai` SDK using `gemini-3.8-flash`. If offline or missing credentials, it safely triggers its internal educational rule engine.

---

## 5. Database Schema & Data Models

The SQLite database (`instance/finance.db`) utilizes SQLAlchemy ORM models:

### 5.1 `Transaction` Model (`transactions` table)
- `id` (INTEGER, Primary Key, Autoincrement)
- `transaction_type` (VARCHAR(10), NOT NULL, 'income' or 'expense')
- `amount` (FLOAT, NOT NULL, Must be > 0)
- `category` (VARCHAR(50), NOT NULL)
- `description` (VARCHAR(255), NULLABLE)
- `date` (DATE, NOT NULL, Default: Current Date)
- `created_at` (DATETIME, NOT NULL, Default: UTC Timestamp)

### 5.2 `Budget` Model (`budgets` table)
- `id` (INTEGER, Primary Key, Autoincrement)
- `amount` (FLOAT, NOT NULL, Target limit)
- `month` (INTEGER, NOT NULL, 1 to 12)
- `year` (INTEGER, NOT NULL, e.g. 2026)
- `created_at` (DATETIME, NOT NULL, Default: UTC Timestamp)
- **Constraint**: `UniqueConstraint('month', 'year')`

---

## 6. REST API Endpoints Specification

| Method | Endpoint | Description | Query / Body Params | Response Code |
|---|---|---|---|---|
| GET | `/api/transactions` | Retrieve filterable transactions | `search`, `category`, `type`, `start_date`, `end_date` | 200 OK |
| POST | `/api/transactions` | Create income/expense record | `transaction_type`, `amount`, `category`, `date`, `description` | 201 Created |
| GET | `/api/transactions/<id>` | Fetch single transaction | None | 200 OK / 404 |
| PUT | `/api/transactions/<id>` | Update existing transaction | Updated field JSON | 200 OK / 404 |
| DELETE | `/api/transactions/<id>` | Delete transaction record | None | 200 OK / 404 |
| GET | `/api/dashboard` | Get calculated dashboard summary | `month`, `year` | 200 OK |
| GET | `/api/budget` | Get budget target & utilization | `month`, `year` | 200 OK |
| POST | `/api/budget` | Set or update monthly budget | `amount`, `month`, `year` | 200 OK |
| GET | `/api/analytics` | Get category & monthly trend data | `year`, `month` | 200 OK |
| POST | `/api/chat` | Send question to AI Chatbot | `question` | 200 OK / 400 |

---

## 7. AI Chatbot Integration & Safety Rules

The AI Chatbot uses the official Google GenAI SDK (`google-genai` version 2.24.0) with model `gemini-3.8-flash`.

### Safety System Prompt Rules:
1. **Educational Guidance Only**: Provide general educational advice; never guarantee investment returns or profits.
2. **Risk Transparency**: Do not present high-risk financial decisions as safe or certain.
3. **Professional Advisor Disclaimer**: Explicitly encourage users to consult certified financial advisors for major decisions.
4. **Context Grounding**: Use real user-provided financial summary totals without inventing fake account balances or transactions.
5. **Fallback Safety**: Provide instant, structured educational advice even if the Gemini API key is offline or unavailable.

---

## 8. Verification & Testing Matrix

Automated testing was conducted using `pytest` against SQLite in-memory database environments.

| Test Case ID | Feature Tested | Test Input / Description | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-01 | Add Income | Type: Income, Amount: 25000, Category: Salary | Record saved in DB, HTTP 201 | Record saved in DB | PASSED |
| TC-02 | Add Expense | Type: Expense, Amount: 5000, Category: Food | Record saved in DB, HTTP 201 | Record saved in DB | PASSED |
| TC-03 | Input Validation | Amount: -500 | Rejected with HTTP 400 | Error message returned | PASSED |
| TC-04 | Required Fields | Category: "" | Rejected with HTTP 400 | Error message returned | PASSED |
| TC-05 | Dashboard Math | Income: 30k, Expense: 18k | Balance: 12k, Savings: 12k (40%) | Balance = 12,000 (40%) | PASSED |
| TC-06 | Budget Creation | Budget: 20000, Month: 9, Year: 2026 | Budget created, HTTP 200 | Target set to 20,000 | PASSED |
| TC-07 | Budget Utilization | Expense: 16000 against 20000 | Usage: 80%, Remaining: 4000 | Usage = 80%, Warning shown | PASSED |
| TC-08 | Edit Transaction | Amount 1000 -> 1500 | Record updated in DB, HTTP 200 | Updated successfully | PASSED |
| TC-09 | Delete Transaction | DELETE /api/transactions/1 | Record deleted, subsequent GET is 404 | Deleted successfully | PASSED |
| TC-10 | Transaction Filter | Search query: "Web" | Returns matching record only | Matched records filtered | PASSED |
| TC-11 | AI Chatbot Advice | Question: "How to reduce expenses?" | Returns structured Markdown response | Returned response + disclaimer | PASSED |

---

## 9. Limitations and Future Scope

### Current Limitations:
- **Single-User MVP**: Designed as a single-user educational capstone MVP without multi-user password login authentication.
- **Manual Data Entry**: Financial transactions must be entered manually rather than synced via bank APIs.

### Future Improvements:
- **Multi-User Authentication**: Integrate Firebase Auth or Flask-Login with password hashing.
- **Bank CSV Import**: Support uploading monthly CSV bank statements for automated categorization.
- **Export Reports**: Add PDF / Excel financial report generation.
- **Recurring Transactions**: Support automated recurring monthly subscriptions and income logging.

---

## 10. Conclusion

The **Personal Finance Advisor Bot** successfully fulfills all project requirements. It provides a complete, modern, responsive, and robust web application for tracking finances, monitoring monthly budgets, visualizing spending patterns, and receiving educational financial guidance from Google Gemini. All core features have been implemented, connected, and verified through an automated test suite.
