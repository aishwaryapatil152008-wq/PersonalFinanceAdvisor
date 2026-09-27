document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    setupAnalyticsFilters();
});

let incomeExpenseChart = null;
let categoryPieChart = null;
let spendingTrendChart = null;
let savingsTrendChart = null;

async function loadAnalytics() {
    const yearSelect = document.getElementById('analytics-year-filter');
    const monthSelect = document.getElementById('analytics-month-filter');

    const year = yearSelect ? yearSelect.value : new Date().getFullYear();
    const month = monthSelect ? monthSelect.value : '';

    try {
        const response = await fetch(`/api/analytics?year=${year}&month=${month}`);
        const result = await response.json();

        if (!result.success) {
            console.error('Failed to load analytics:', result.message);
            return;
        }

        const data = result.data;

        renderIncomeVsExpenseChart(data.monthly_trends);
        renderCategoryPieChart(data.expense_by_category);
        renderSpendingTrendChart(data.monthly_trends);
        renderSavingsTrendChart(data.monthly_trends);

    } catch (err) {
        console.error('Error fetching analytics:', err);
    }
}

function setupAnalyticsFilters() {
    const yearSelect = document.getElementById('analytics-year-filter');
    const monthSelect = document.getElementById('analytics-month-filter');

    if (yearSelect) yearSelect.addEventListener('change', loadAnalytics);
    if (monthSelect) monthSelect.addEventListener('change', loadAnalytics);
}

function getTextColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '#cbd5e1' : '#475569';
}

function getGridColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
}

// Chart 1: Income vs Expense (Bar Chart)
function renderIncomeVsExpenseChart(monthlyTrends) {
    const canvas = document.getElementById('incomeExpenseChart');
    if (!canvas) return;

    const labels = monthlyTrends.map(t => t.month_name);
    const incomeData = monthlyTrends.map(t => t.income);
    const expenseData = monthlyTrends.map(t => t.expense);

    if (incomeExpenseChart) incomeExpenseChart.destroy();

    const textColor = getTextColor();
    const gridColor = getGridColor();

    incomeExpenseChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income (₹)',
                    data: incomeData,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                },
                {
                    label: 'Expense (₹)',
                    data: expenseData,
                    backgroundColor: '#ef4444',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: textColor, font: { family: 'Inter', weight: '600' } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, callback: (val) => '₹' + val.toLocaleString('en-IN') },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// Chart 2: Expenses by Category (Doughnut Chart)
function renderCategoryPieChart(categoryData) {
    const canvas = document.getElementById('categoryPieChart');
    if (!canvas) return;

    const categories = Object.keys(categoryData || {});
    const values = Object.values(categoryData || {});

    if (categoryPieChart) categoryPieChart.destroy();

    if (categories.length === 0) {
        canvas.parentElement.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 3rem;">No category data available for the selected period.</p>`;
        return;
    }

    const textColor = getTextColor();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    categoryPieChart = new Chart(canvas.getContext('2d'), {
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
                legend: { position: 'right', labels: { color: textColor, font: { family: 'Inter', weight: '600' } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
                    }
                }
            }
        }
    });
}

// Chart 3: Monthly Spending Trends (Line Chart)
function renderSpendingTrendChart(monthlyTrends) {
    const canvas = document.getElementById('spendingTrendChart');
    if (!canvas) return;

    const labels = monthlyTrends.map(t => t.month_name);
    const expenseData = monthlyTrends.map(t => t.expense);

    if (spendingTrendChart) spendingTrendChart.destroy();

    const textColor = getTextColor();
    const gridColor = getGridColor();

    spendingTrendChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Expenses (₹)',
                data: expenseData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.35,
                pointRadius: 5,
                pointBackgroundColor: '#ef4444'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: textColor, font: { family: 'Inter', weight: '600' } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Expenses: ₹${ctx.raw.toLocaleString('en-IN')}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, callback: (val) => '₹' + val.toLocaleString('en-IN') },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// Chart 4: Savings Trends (Bar Chart)
function renderSavingsTrendChart(monthlyTrends) {
    const canvas = document.getElementById('savingsTrendChart');
    if (!canvas) return;

    const labels = monthlyTrends.map(t => t.month_name);
    const savingsData = monthlyTrends.map(t => t.savings);

    if (savingsTrendChart) savingsTrendChart.destroy();

    const textColor = getTextColor();
    const gridColor = getGridColor();

    savingsTrendChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Savings (₹)',
                data: savingsData,
                backgroundColor: savingsData.map(v => v >= 0 ? '#8b5cf6' : '#ef4444'),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: textColor, font: { family: 'Inter', weight: '600' } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Net Savings: ₹${ctx.raw.toLocaleString('en-IN')}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: {
                    ticks: { color: textColor, callback: (val) => '₹' + val.toLocaleString('en-IN') },
                    grid: { color: gridColor }
                }
            }
        }
    });
}
