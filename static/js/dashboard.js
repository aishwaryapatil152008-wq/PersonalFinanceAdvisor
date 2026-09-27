document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setupQuickAddModal();
});

let categoryChartInstance = null;

async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        const result = await response.json();

        if (!result.success) {
            console.error('Failed to load dashboard:', result.message);
            return;
        }

        const data = result.data;

        // Metric Card Updates
        document.getElementById('total-income').innerText = `₹${data.total_income.toLocaleString('en-IN')}`;
        document.getElementById('total-expenses').innerText = `₹${data.total_expenses.toLocaleString('en-IN')}`;
        document.getElementById('current-balance').innerText = `₹${data.current_balance.toLocaleString('en-IN')}`;
        document.getElementById('estimated-savings').innerText = `₹${data.estimated_savings.toLocaleString('en-IN')}`;
        document.getElementById('savings-percentage').innerText = `${data.savings_percentage}% of income saved`;

        document.getElementById('monthly-budget').innerText = `₹${data.monthly_budget.toLocaleString('en-IN')}`;
        document.getElementById('remaining-budget').innerText = `₹${data.remaining_budget.toLocaleString('en-IN')}`;
        document.getElementById('budget-percent').innerText = `${data.budget_usage_percent}%`;

        // Update Budget Progress Bar & Alert
        const progressBar = document.getElementById('dashboard-budget-bar');
        if (progressBar) {
            const pct = Math.min(data.budget_usage_percent, 100);
            progressBar.style.width = `${pct}%`;
            progressBar.className = 'progress-bar ' + (pct >= 100 ? 'danger' : (pct >= 80 ? 'warning' : 'safe'));
        }

        const budgetAlert = document.getElementById('dashboard-budget-alert');
        if (budgetAlert) {
            if (data.monthly_budget === 0) {
                budgetAlert.className = 'badge badge-warning';
                budgetAlert.innerHTML = '<i class="fas fa-info-circle"></i> No budget set';
            } else if (data.budget_usage_percent >= 100) {
                budgetAlert.className = 'badge badge-danger';
                budgetAlert.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Budget Exceeded!';
            } else if (data.budget_usage_percent >= 80) {
                budgetAlert.className = 'badge badge-warning';
                budgetAlert.innerHTML = '<i class="fas fa-exclamation-circle"></i> Approaching Limit';
            } else {
                budgetAlert.className = 'badge badge-income';
                budgetAlert.innerHTML = '<i class="fas fa-check-circle"></i> Within Budget';
            }
        }

        // Render Recent Transactions & Chart
        renderRecentTransactions(data.recent_transactions);
        renderCategoryChart(data.expense_by_category);

    } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
    }
}

function renderRecentTransactions(transactions) {
    const tbody = document.getElementById('recent-transactions-body');
    if (!tbody) return;

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent transactions recorded.</td></tr>`;
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const isIncome = t.transaction_type === 'income';
        const badgeClass = isIncome ? 'badge-income' : 'badge-expense';
        const amountClass = isIncome ? 'income' : 'expense';
        const sign = isIncome ? '+' : '-';

        return `
            <tr>
                <td><strong>${t.date}</strong></td>
                <td><span class="badge ${badgeClass}">${t.transaction_type.toUpperCase()}</span></td>
                <td>${t.category}</td>
                <td>${t.description || '-'}</td>
                <td class="amount-display ${amountClass}">${sign}₹${t.amount.toLocaleString('en-IN')}</td>
            </tr>
        `;
    }).join('');
}

function renderCategoryChart(categoryData) {
    const canvas = document.getElementById('dashboardCategoryChart');
    if (!canvas) return;

    const categories = Object.keys(categoryData || {});
    const values = Object.values(categoryData || {});

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    if (categories.length === 0) {
        canvas.parentElement.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 3rem;">No expense data available yet.</p>`;
        return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ctx = canvas.getContext('2d');
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
                    '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'
                ],
                borderWidth: 2,
                borderColor: isDark ? '#111c38' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Inter', size: 12, weight: '600' },
                        color: isDark ? '#cbd5e1' : '#475569'
                    }
                }
            }
        }
    });
}

function setupQuickAddModal() {
    const quickModal = document.getElementById('quickAddModal');
    const openBtn = document.getElementById('openQuickAddBtn');
    const closeBtn = document.getElementById('closeQuickAddBtn');
    const form = document.getElementById('quickAddForm');
    const typeSelect = document.getElementById('quickType');
    const categorySelect = document.getElementById('quickCategory');

    if (!quickModal) return;

    const incomeCategories = ['Salary', 'Scholarship', 'Freelance', 'Business', 'Investment', 'Other'];
    const expenseCategories = ['Food', 'Transport', 'Education', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Other'];

    function updateCategoryOptions() {
        const selectedType = typeSelect.value;
        const cats = selectedType === 'income' ? incomeCategories : expenseCategories;
        categorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', updateCategoryOptions);
        updateCategoryOptions();
    }

    if (openBtn) openBtn.addEventListener('click', () => quickModal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => quickModal.classList.remove('active'));

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                transaction_type: document.getElementById('quickType').value,
                amount: parseFloat(document.getElementById('quickAmount').value),
                category: document.getElementById('quickCategory').value,
                date: document.getElementById('quickDate').value || new Date().toISOString().split('T')[0],
                description: document.getElementById('quickDescription').value
            };

            try {
                const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (result.success) {
                    quickModal.classList.remove('active');
                    form.reset();
                    loadDashboardData();
                } else {
                    alert(result.message || 'Failed to add transaction.');
                }
            } catch (err) {
                console.error('Error adding transaction:', err);
            }
        });
    }
}
