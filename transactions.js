document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    setupFilters();
    setupModals();
});

let currentDeleteId = null;

async function loadTransactions() {
    const search = document.getElementById('filter-search')?.value || '';
    const category = document.getElementById('filter-category')?.value || '';
    const type = document.getElementById('filter-type')?.value || '';
    const startDate = document.getElementById('filter-start-date')?.value || '';
    const endDate = document.getElementById('filter-end-date')?.value || '';

    const params = new URLSearchParams({
        search, category, type, start_date: startDate, end_date: endDate
    });

    try {
        const response = await fetch(`/api/transactions?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
            console.error('Failed to fetch transactions:', result.message);
            return;
        }

        renderTransactionsTable(result.data);
    } catch (err) {
        console.error('Error loading transactions:', err);
    }
}

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-table-body');
    const countLabel = document.getElementById('transaction-count');
    if (!tbody) return;

    if (countLabel) countLabel.innerText = `Showing ${transactions.length} record(s)`;

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                    <i class="fas fa-receipt" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    No transaction records match your search or filter criteria.
                </td>
            </tr>
        `;
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
                <td><span style="font-weight: 600;">${t.category}</span></td>
                <td>${t.description || '-'}</td>
                <td class="amount-display ${amountClass}">${sign}₹${t.amount.toLocaleString('en-IN')}</td>
                <td>
                    <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-secondary btn-icon" onclick="openEditModal(${t.id}, '${t.transaction_type}', ${t.amount}, '${t.category}', '${t.date}', '${t.description || ''}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-icon" onclick="openDeleteModal(${t.id})" title="Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupFilters() {
    const searchInput = document.getElementById('filter-search');
    const categorySelect = document.getElementById('filter-category');
    const typeSelect = document.getElementById('filter-type');
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    const resetBtn = document.getElementById('reset-filters-btn');

    const inputs = [searchInput, categorySelect, typeSelect, startDateInput, endDateInput];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', debounce(loadTransactions, 300));
            input.addEventListener('change', loadTransactions);
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (categorySelect) categorySelect.value = '';
            if (typeSelect) typeSelect.value = '';
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            loadTransactions();
        });
    }
}

function setupModals() {
    const addModal = document.getElementById('addTransactionModal');
    const openAddBtn = document.getElementById('openAddTransactionBtn');
    const closeAddBtn = document.getElementById('closeAddTransactionBtn');
    const addForm = document.getElementById('addTransactionForm');
    const addTypeSelect = document.getElementById('addType');
    const addCategorySelect = document.getElementById('addCategory');

    const incomeCategories = ['Salary', 'Scholarship', 'Freelance', 'Business', 'Investment', 'Other'];
    const expenseCategories = ['Food', 'Transport', 'Education', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Other'];

    function updateAddCategoryOptions() {
        if (!addTypeSelect || !addCategorySelect) return;
        const cats = addTypeSelect.value === 'income' ? incomeCategories : expenseCategories;
        addCategorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    if (addTypeSelect) {
        addTypeSelect.addEventListener('change', updateAddCategoryOptions);
        updateAddCategoryOptions();
    }

    if (openAddBtn) openAddBtn.addEventListener('click', () => addModal.classList.add('active'));
    if (closeAddBtn) closeAddBtn.addEventListener('click', () => addModal.classList.remove('active'));

    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                transaction_type: addTypeSelect.value,
                amount: parseFloat(document.getElementById('addAmount').value),
                category: addCategorySelect.value,
                date: document.getElementById('addDate').value || new Date().toISOString().split('T')[0],
                description: document.getElementById('addDescription').value
            };

            try {
                const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (result.success) {
                    addModal.classList.remove('active');
                    addForm.reset();
                    loadTransactions();
                } else {
                    alert(result.message || 'Error creating transaction.');
                }
            } catch (err) {
                console.error('Error adding transaction:', err);
            }
        });
    }

    // Delete Modal Setup
    const deleteModal = document.getElementById('deleteConfirmModal');
    const closeDeleteBtn = document.getElementById('closeDeleteModalBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', () => deleteModal.classList.remove('active'));

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!currentDeleteId) return;

            try {
                const res = await fetch(`/api/transactions/${currentDeleteId}`, { method: 'DELETE' });
                const result = await res.json();

                if (result.success) {
                    deleteModal.classList.remove('active');
                    currentDeleteId = null;
                    loadTransactions();
                } else {
                    alert(result.message || 'Failed to delete transaction.');
                }
            } catch (err) {
                console.error('Error deleting transaction:', err);
            }
        });
    }

    // Edit Modal Setup
    const editModal = document.getElementById('editTransactionModal');
    const closeEditBtn = document.getElementById('closeEditModalBtn');
    const editForm = document.getElementById('editTransactionForm');
    const editTypeSelect = document.getElementById('editType');
    const editCategorySelect = document.getElementById('editCategory');

    function updateEditCategoryOptions(selectedCat) {
        if (!editTypeSelect || !editCategorySelect) return;
        const cats = editTypeSelect.value === 'income' ? incomeCategories : expenseCategories;
        editCategorySelect.innerHTML = cats.map(c => `<option value="${c}" ${c === selectedCat ? 'selected' : ''}>${c}</option>`).join('');
    }

    if (editTypeSelect) {
        editTypeSelect.addEventListener('change', () => updateEditCategoryOptions());
    }

    if (closeEditBtn) closeEditBtn.addEventListener('click', () => editModal.classList.remove('active'));

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editId').value;

            const payload = {
                transaction_type: editTypeSelect.value,
                amount: parseFloat(document.getElementById('editAmount').value),
                category: editCategorySelect.value,
                date: document.getElementById('editDate').value,
                description: document.getElementById('editDescription').value
            };

            try {
                const res = await fetch(`/api/transactions/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (result.success) {
                    editModal.classList.remove('active');
                    loadTransactions();
                } else {
                    alert(result.message || 'Failed to update transaction.');
                }
            } catch (err) {
                console.error('Error updating transaction:', err);
            }
        });
    }
}

function openEditModal(id, type, amount, category, date, description) {
    document.getElementById('editId').value = id;
    document.getElementById('editType').value = type;
    document.getElementById('editAmount').value = amount;
    document.getElementById('editDate').value = date;
    document.getElementById('editDescription').value = description;

    const incomeCategories = ['Salary', 'Scholarship', 'Freelance', 'Business', 'Investment', 'Other'];
    const expenseCategories = ['Food', 'Transport', 'Education', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Other'];
    const cats = type === 'income' ? incomeCategories : expenseCategories;

    const editCategorySelect = document.getElementById('editCategory');
    editCategorySelect.innerHTML = cats.map(c => `<option value="${c}" ${c === category ? 'selected' : ''}>${c}</option>`).join('');

    document.getElementById('editTransactionModal').classList.add('active');
}

function openDeleteModal(id) {
    currentDeleteId = id;
    document.getElementById('deleteConfirmModal').classList.add('active');
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
