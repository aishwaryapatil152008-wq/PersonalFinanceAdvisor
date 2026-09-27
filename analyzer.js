/**
 * FinanceAI - Interactive AI Financial Analyzer Engine
 * Handles financial calculations, goal selection, AI progressive loading, 
 * Gemini API interaction, and dynamic dashboard rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
    initFinancialAnalyzer();
});

let breakdownChartInstance = null;
let selectedGoal = 'Emergency Fund';

function initFinancialAnalyzer() {
    const analyzerForm = document.getElementById('analyzerForm');
    const goalCards = document.querySelectorAll('.goal-card');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');

    // 1. Financial Goal Selection Listener
    goalCards.forEach(card => {
        card.addEventListener('click', () => {
            goalCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedGoal = card.getAttribute('data-goal') || 'Emergency Fund';
        });
    });

    // 2. Form Submission Listener
    if (analyzerForm) {
        analyzerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await executeFinancialAnalysis();
        });
    }

    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            document.getElementById('errorCardState').classList.remove('active');
            document.getElementById('analyzerForm').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

async function executeFinancialAnalysis() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const processingCard = document.getElementById('aiProcessingCard');
    const emptyState = document.getElementById('emptyStateCard');
    const resultsContainer = document.getElementById('resultsContainer');
    const errorCard = document.getElementById('errorCardState');

    // Hide previous states
    if (emptyState) emptyState.style.display = 'none';
    if (resultsContainer) resultsContainer.classList.remove('active');
    if (errorCard) errorCard.classList.remove('active');

    // UI Loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Analyzing your finances...`;
    processingCard.classList.add('active');
    processingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Step indicators element
    const step1 = document.getElementById('step-income');
    const step2 = document.getElementById('step-expenses');
    const step3 = document.getElementById('step-budget');
    const step4 = document.getElementById('step-ai');

    // Reset step styles
    [step1, step2, step3, step4].forEach(step => {
        if (step) step.className = 'processing-step-chip';
    });

    // Simulate fast progressive checks
    if (step1) { step1.classList.add('active'); }
    await sleep(400);
    if (step1) { step1.className = 'processing-step-chip done'; step1.innerHTML = `<i class="fas fa-check-circle"></i> Income ✓`; }

    if (step2) { step2.classList.add('active'); }
    await sleep(400);
    if (step2) { step2.className = 'processing-step-chip done'; step2.innerHTML = `<i class="fas fa-check-circle"></i> Expenses ✓`; }

    if (step3) { step3.classList.add('active'); }
    await sleep(400);
    if (step3) { step3.className = 'processing-step-chip done'; step3.innerHTML = `<i class="fas fa-check-circle"></i> Budget analysis ✓`; }

    if (step4) { step4.classList.add('active'); }

    // Read Input Values
    const income = parseFloat(document.getElementById('inputIncome').value) || 0;
    const rent = parseFloat(document.getElementById('inputRent').value) || 0;
    const food = parseFloat(document.getElementById('inputFood').value) || 0;
    const transport = parseFloat(document.getElementById('inputTransport').value) || 0;
    const dining = parseFloat(document.getElementById('inputDining').value) || 0;
    const entertainment = parseFloat(document.getElementById('inputEntertainment').value) || 0;
    const utilities = parseFloat(document.getElementById('inputUtilities').value) || 0;
    const savingsInput = parseFloat(document.getElementById('inputSavings').value) || 0;
    const other = parseFloat(document.getElementById('inputOther').value) || 0;

    const categories = {
        'Rent': rent,
        'Food': food,
        'Transport': transport,
        'Dining Out': dining,
        'Entertainment': entertainment,
        'Utilities': utilities,
        'Savings/Investments': savingsInput,
        'Other': other
    };

    const totalExpenses = rent + food + transport + dining + entertainment + utilities + savingsInput + other;
    const netSavings = income - totalExpenses;
    const savingsRatio = income > 0 ? (netSavings / income) * 100 : 0;

    // Calculate Financial Health Score & Status Rationale
    let healthScore = 0;
    let healthStatus = 'Fair';
    let healthClass = 'fair';
    let healthGaugeColor = '#f59e0b';
    let healthRationale = '';

    if (income <= 0) {
        healthScore = 0;
        healthStatus = 'Needs Attention';
        healthClass = 'poor';
        healthGaugeColor = '#ef4444';
        healthRationale = 'Please enter a valid positive monthly income to evaluate your financial health score.';
    } else if (totalExpenses > income) {
        healthScore = Math.max(15, Math.round(50 - ((totalExpenses - income) / income) * 50));
        healthStatus = 'Needs Attention';
        healthClass = 'poor';
        healthGaugeColor = '#ef4444';
        healthRationale = `Your monthly expenses (₹${totalExpenses.toLocaleString('en-IN')}) exceed your monthly income (₹${income.toLocaleString('en-IN')}). Immediate expense optimization is recommended.`;
    } else if (savingsRatio >= 25) {
        healthScore = Math.min(98, Math.round(75 + (savingsRatio - 25) * 0.9));
        healthStatus = 'Excellent';
        healthClass = 'good';
        healthGaugeColor = '#10b981';
        healthRationale = `Outstanding money management! You save ${savingsRatio.toFixed(1)}% of your monthly income. You are in a strong position to achieve your ${selectedGoal} goal faster.`;
    } else if (savingsRatio >= 15) {
        healthScore = Math.round(65 + (savingsRatio - 15) * 1.0);
        healthStatus = 'Good';
        healthClass = 'good';
        healthGaugeColor = '#10b981';
        healthRationale = `Healthy financial balance! You save ${savingsRatio.toFixed(1)}% of your income. Minor adjustments in discretionary categories can accelerate your savings.`;
    } else {
        healthScore = Math.max(40, Math.round(40 + savingsRatio * 1.5));
        healthStatus = 'Fair';
        healthClass = 'fair';
        healthGaugeColor = '#f59e0b';
        healthRationale = `You are saving ${savingsRatio.toFixed(1)}% of your income. Increasing your savings allocation closer to 20% will build a robust buffer for ${selectedGoal}.`;
    }

    // Call Gemini API (/api/chat) for personalized AI Insights & Suggestions
    const promptText = `
Perform a high-level personal financial analysis for the following profile:
- Monthly Income: ₹${income}
- Monthly Expenses Breakdown:
  * Rent/Housing: ₹${rent}
  * Groceries/Food: ₹${food}
  * Transport: ₹${transport}
  * Dining Out: ₹${dining}
  * Entertainment: ₹${entertainment}
  * Utilities/Bills: ₹${utilities}
  * Monthly Savings/Investments: ₹${savingsInput}
  * Other: ₹${other}
- Total Expenses: ₹${totalExpenses}
- Net Monthly Surplus/Savings: ₹${netSavings} (${savingsRatio.toFixed(1)}% of income)
- Financial Health Score: ${healthScore}/100 (${healthStatus})
- Primary Target Financial Goal: ${selectedGoal}

Instructions:
1. Provide a concise, encouraging 2-3 sentence executive AI Financial Summary.
2. Provide 3 specific, practical action items for savings with approximate ₹ savings amounts aimed at reaching their target goal (${selectedGoal}).
Keep language clear, professional, and actionable.
    `.trim();

    let aiInsightText = '';
    try {
        const apiRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: promptText })
        });
        const result = await apiRes.json();
        if (result.success && result.response) {
            aiInsightText = result.response;
        }
    } catch (err) {
        console.warn('Gemini API call failed, generating dynamic smart response:', err);
    }

    if (step4) { step4.className = 'processing-step-chip done'; step4.innerHTML = `<i class="fas fa-check-circle"></i> AI recommendations ✓`; }
    await sleep(300);

    // Hide loading card
    processingCard.classList.remove('active');
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `<i class="fas fa-chart-line"></i> Analyze My Finances <i class="fas fa-arrow-right"></i>`;

    // Render Results Dashboard
    renderResults({
        income,
        totalExpenses,
        netSavings,
        savingsRatio,
        healthScore,
        healthStatus,
        healthClass,
        healthGaugeColor,
        healthRationale,
        categories,
        selectedGoal,
        aiInsightText
    });
}

function renderResults(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;

    // 1. Snapshot Cards Update with Count-Up
    animateValue('res-income', 0, data.income, 1000, '₹');
    animateValue('res-expenses', 0, data.totalExpenses, 1000, '₹');
    animateValue('res-savings', 0, Math.max(0, data.netSavings), 1000, '₹');
    
    document.getElementById('res-savings-sub').innerText = `${data.savingsRatio.toFixed(1)}% of income saved`;
    document.getElementById('res-health-status').innerText = data.healthStatus;

    // 2. Health Gauge Update
    const gaugeScoreEl = document.getElementById('gaugeScore');
    const gaugeBadgeEl = document.getElementById('gaugeBadge');
    const gaugeRationaleEl = document.getElementById('gaugeRationale');
    const gaugeFill = document.getElementById('gaugeFill');

    if (gaugeScoreEl) gaugeScoreEl.innerText = data.healthScore;
    if (gaugeBadgeEl) {
        gaugeBadgeEl.className = `health-badge ${data.healthClass}`;
        gaugeBadgeEl.innerHTML = `<i class="fas fa-shield-alt"></i> Financial Health: ${data.healthStatus}`;
    }
    if (gaugeRationaleEl) gaugeRationaleEl.innerText = data.healthRationale;

    if (gaugeFill) {
        // Circumference is 2 * PI * r = 2 * PI * 54 = 339.29
        const circumference = 339.29;
        const offset = circumference - (data.healthScore / 100) * circumference;
        gaugeFill.style.strokeDashoffset = offset;
        gaugeFill.style.stroke = data.healthGaugeColor;
    }

    // 3. Personalized Budget Grid
    renderPersonalizedBudgetGrid(data.categories, data.income);

    // 4. Spending Analysis Status Chips
    renderSpendingAnalysisChips(data.categories, data.income);

    // 5. AI Saving Suggestions
    renderSavingSuggestions(data);

    // 6. AI Financial Insight
    const insightBox = document.getElementById('aiInsightContent');
    if (insightBox) {
        if (data.aiInsightText) {
            insightBox.innerHTML = formatMarkdown(data.aiInsightText);
        } else {
            insightBox.innerHTML = `
                <p>Based on your logged income of <strong>₹${data.income.toLocaleString('en-IN')}</strong> and total expenses of <strong>₹${data.totalExpenses.toLocaleString('en-IN')}</strong>, your net monthly surplus is <strong>₹${Math.max(0, data.netSavings).toLocaleString('en-IN')}</strong> (${data.savingsRatio.toFixed(1)}%).</p>
                <br>
                <p><strong>Strategic Advice for ${data.selectedGoal}:</strong> Automate your savings allocation immediately on payday. Keeping discretionary categories (Dining & Entertainment) within 15% of your total budget will protect your long-term wealth goals.</p>
            `;
        }
    }

    // 7. Render Breakdown Chart
    renderBreakdownChart(data.categories);

    // Reveal Dashboard with Smooth Animation
    resultsContainer.classList.add('active');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPersonalizedBudgetGrid(categories, totalIncome) {
    const grid = document.getElementById('budgetCardsGrid');
    if (!grid) return;

    const iconMap = {
        'Rent': 'fa-house cat-rent',
        'Food': 'fa-utensils cat-food',
        'Transport': 'fa-car cat-transport',
        'Dining Out': 'fa-bowl-food cat-dining',
        'Entertainment': 'fa-film cat-entertainment',
        'Utilities': 'fa-bolt cat-utilities',
        'Savings/Investments': 'fa-piggy-bank cat-savings',
        'Other': 'fa-layer-group cat-other'
    };

    grid.innerHTML = Object.entries(categories).map(([name, amount]) => {
        const pct = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : 0;
        const iconClass = iconMap[name] || 'fa-tag cat-other';
        const barColorClass = pct > 30 ? 'danger' : (pct > 15 ? 'warning' : 'safe');

        return `
            <div class="budget-item-card">
                <div class="budget-item-header">
                    <div class="budget-item-title">
                        <div class="category-icon-box ${iconClass.split(' ')[1]}">
                            <i class="fas ${iconClass.split(' ')[0]}"></i>
                        </div>
                        <span>${name}</span>
                    </div>
                    <span class="budget-item-percent">${pct}%</span>
                </div>
                <div class="budget-item-amount">₹${amount.toLocaleString('en-IN')}</div>
                <div class="progress-container-sm">
                    <div class="progress-bar-animated progress-bar ${barColorClass}" style="width: ${Math.min(pct, 100)}%;"></div>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">
                    Recommended allocation: ${getRecommendedPct(name)}
                </div>
            </div>
        `;
    }).join('');
}

function getRecommendedPct(category) {
    switch (category) {
        case 'Rent': return '25% – 30%';
        case 'Food': return '10% – 15%';
        case 'Transport': return '5% – 10%';
        case 'Dining Out': return '5% – 8%';
        case 'Entertainment': return '5%';
        case 'Utilities': return '5% – 8%';
        case 'Savings/Investments': return '20%+';
        default: return '5% – 10%';
    }
}

function renderSpendingAnalysisChips(categories, totalIncome) {
    const chipsGrid = document.getElementById('spendingAnalysisChips');
    if (!chipsGrid) return;

    chipsGrid.innerHTML = Object.entries(categories).map(([cat, amt]) => {
        if (amt <= 0) return '';
        const pct = totalIncome > 0 ? (amt / totalIncome) * 100 : 0;
        let isOver = false;

        if (cat === 'Rent' && pct > 35) isOver = true;
        if (cat === 'Dining Out' && pct > 12) isOver = true;
        if (cat === 'Entertainment' && pct > 10) isOver = true;
        if (cat === 'Food' && pct > 25) isOver = true;

        const icon = isOver ? '<i class="fas fa-exclamation-triangle"></i>' : '<i class="fas fa-check"></i>';
        const statusClass = isOver ? 'status-overspending' : 'status-on-track';
        const labelText = isOver ? 'Above Recommended' : 'On Track';

        return `
            <div class="analysis-status-card">
                <div class="status-indicator-icon ${statusClass}">
                    ${icon}
                </div>
                <div>
                    <div><strong>${cat}</strong> (${pct.toFixed(1)}%)</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${labelText}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSavingSuggestions(data) {
    const container = document.getElementById('savingSuggestionsList');
    if (!container) return;

    const diningAmt = data.categories['Dining Out'] || 0;
    const entAmt = data.categories['Entertainment'] || 0;
    const foodAmt = data.categories['Food'] || 0;

    const potentialDiningSave = Math.round(diningAmt * 0.3);
    const potentialEntSave = Math.round(entAmt * 0.35);

    const suggestions = [
        {
            num: '01',
            title: `Optimize Dining & Takeout Expenses`,
            desc: `Reducing dining out by 30% frees up extra monthly cash. Redirect this toward your ${data.selectedGoal}.`,
            saving: potentialDiningSave > 0 ? `Potential Saving: ₹${potentialDiningSave.toLocaleString('en-IN')}/mo` : 'Potential Saving: ₹1,500/mo',
            goal: `Goal: ${data.selectedGoal}`
        },
        {
            num: '02',
            title: `Automate Savings Allocation`,
            desc: `Set an automated bank transfer of 20% of your income immediately when your salary is credited to avoid impulse spending.`,
            saving: `Target Savings Rate: 20%+`,
            goal: `Goal: ${data.selectedGoal}`
        },
        {
            num: '03',
            title: `Audit Recurring Subscriptions & Entertainment`,
            desc: `Review active streaming, gaming, or app memberships and cap non-essential digital expenses.`,
            saving: potentialEntSave > 0 ? `Potential Saving: ₹${potentialEntSave.toLocaleString('en-IN')}/mo` : 'Potential Saving: ₹800/mo',
            goal: `Goal: ${data.selectedGoal}`
        }
    ];

    container.innerHTML = suggestions.map(s => `
        <div class="suggestion-card">
            <div class="suggestion-number">${s.num}</div>
            <div class="suggestion-content">
                <div class="suggestion-title">${s.title}</div>
                <div class="suggestion-desc">${s.desc}</div>
                <div class="suggestion-meta">
                    <span class="saving-tag"><i class="fas fa-coins"></i> ${s.saving}</span>
                    <span class="goal-tag"><i class="fas fa-bullseye"></i> ${s.goal}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderBreakdownChart(categories) {
    const canvas = document.getElementById('breakdownChartCanvas');
    if (!canvas) return;

    const filtered = Object.entries(categories).filter(([_, val]) => val > 0);
    const labels = filtered.map(([k, _]) => k);
    const values = filtered.map(([_, v]) => v);

    if (breakdownChartInstance) {
        breakdownChartInstance.destroy();
    }

    if (values.length === 0) return;

    const ctx = canvas.getContext('2d');
    breakdownChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#2563eb', '#10b981', '#f59e0b', '#ec4899',
                    '#8b5cf6', '#0284c7', '#34d399', '#64748b'
                ],
                borderWidth: 3,
                borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#111c38' : '#ffffff'
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
                        color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#cbd5e1' : '#475569'
                    }
                }
            }
        }
    });
}

// Helpers
function animateValue(id, start, end, duration, prefix = '') {
    const obj = document.getElementById(id);
    if (!obj) return;

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        obj.innerText = `${prefix}${current.toLocaleString('en-IN')}`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/^### (.*$)/gim, '<h4 style="margin: 0.75rem 0 0.4rem 0; font-weight:800; color:var(--text-primary);">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}
