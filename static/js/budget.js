document.addEventListener('DOMContentLoaded', () => {
    loadBudgetData();
    setupBudgetForm();
});

async function loadBudgetData() {
    const monthSelect = document.getElementById('budget-month-select');
    const yearSelect = document.getElementById('budget-year-select');

    const month = monthSelect ? monthSelect.value : new Date().getMonth() + 1;
    const year = yearSelect ? yearSelect.value : new Date().getFullYear();

    try {
        const response = await fetch(`/api/budget?month=${month}&year=${year}`);
        const result = await response.json();

        if (!result.success) {
            console.error('Failed to load budget data:', result.message);
            return;
        }

        const data = result.data;

        document.getElementById('display-monthly-budget').innerText = `₹${data.monthly_budget.toLocaleString('en-IN')}`;
        document.getElementById('display-monthly-expenses').innerText = `₹${data.monthly_expenses.toLocaleString('en-IN')}`;
        document.getElementById('display-remaining-budget').innerText = `₹${data.remaining_budget.toLocaleString('en-IN')}`;
        document.getElementById('display-budget-percentage').innerText = `${data.budget_usage_percent}%`;

        // Update progress bar
        const progressBar = document.getElementById('budget-progress-bar');
        if (progressBar) {
            const pct = Math.min(data.budget_usage_percent, 100);
            progressBar.style.width = `${pct}%`;
            progressBar.className = 'progress-bar ' + (pct >= 100 ? 'danger' : (pct >= 80 ? 'warning' : 'safe'));
        }

        // Update Alert Banner
        const alertBox = document.getElementById('budget-status-alert');
        if (alertBox) {
            if (data.monthly_budget === 0) {
                alertBox.style.display = 'block';
                alertBox.className = 'badge badge-warning';
                alertBox.style.fontSize = '0.95rem';
                alertBox.style.padding = '0.75rem 1.25rem';
                alertBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> No budget target has been configured for this month. Set a budget below to track your goals!';
            } else if (data.budget_usage_percent >= 100) {
                alertBox.style.display = 'block';
                alertBox.className = 'badge badge-expense';
                alertBox.style.fontSize = '0.95rem';
                alertBox.style.padding = '0.75rem 1.25rem';
                alertBox.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Budget Exceeded!</strong> You have spent ₹${Math.abs(data.remaining_budget).toLocaleString('en-IN')} over your monthly limit.`;
            } else if (data.budget_usage_percent >= 80) {
                alertBox.style.display = 'block';
                alertBox.className = 'badge badge-warning';
                alertBox.style.fontSize = '0.95rem';
                alertBox.style.padding = '0.75rem 1.25rem';
                alertBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> <strong>Warning!</strong> You have used ${data.budget_usage_percent}% of your monthly budget. Only ₹${data.remaining_budget.toLocaleString('en-IN')} remaining.`;
            } else {
                alertBox.style.display = 'block';
                alertBox.className = 'badge badge-income';
                alertBox.style.fontSize = '0.95rem';
                alertBox.style.padding = '0.75rem 1.25rem';
                alertBox.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Great job!</strong> Your spending is on track (${data.budget_usage_percent}% used). Remaining: ₹${data.remaining_budget.toLocaleString('en-IN')}.`;
            }
        }

    } catch (err) {
        console.error('Error fetching budget details:', err);
    }
}

function setupBudgetForm() {
    const form = document.getElementById('setBudgetForm');
    const monthSelect = document.getElementById('budget-month-select');
    const yearSelect = document.getElementById('budget-year-select');

    if (monthSelect) monthSelect.addEventListener('change', loadBudgetData);
    if (yearSelect) yearSelect.addEventListener('change', loadBudgetData);

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const amountInput = document.getElementById('budgetAmountInput');
            const amount = parseFloat(amountInput.value);

            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid positive budget amount.');
                return;
            }

            const month = parseInt(monthSelect.value);
            const year = parseInt(yearSelect.value);

            try {
                const response = await fetch('/api/budget', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, month, year })
                });

                const result = await response.json();
                if (result.success) {
                    loadBudgetData();
                    alert(`Budget of ₹${amount.toLocaleString('en-IN')} set successfully for ${month}/${year}.`);
                } else {
                    alert(result.message || 'Failed to update budget.');
                }
            } catch (err) {
                console.error('Error setting budget:', err);
            }
        });
    }
}
