const form = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const monthFilter = document.getElementById('monthFilter');
const yearFilter = document.getElementById('yearFilter');
const transactionsList = document.getElementById('transactionsList');
const incomeTotal = document.getElementById('incomeTotal');
const expenseTotal = document.getElementById('expenseTotal');
const balanceTotal = document.getElementById('balanceTotal');
const donutCanvas = document.getElementById('donutChart');
const chartLabel = document.getElementById('chartLabel');
const barCanvas = document.getElementById('barChart');
const barLabel = document.getElementById('barLabel');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEditButton');

const STORAGE_KEY = 'expenseTrackerTransactions';

let transactions = [];
let editIndex = null;

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadTransactions() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            transactions = parsed;
        }
    } catch (error) {
        console.warn('Não foi possível carregar as transações do localStorage.', error);
    }
}

function sortTransactionsByDate() {
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getCurrentMonthValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getSelectedMonth() {
    const value = monthFilter.value || getCurrentMonthValue();
    const [year, month] = value.split('-').map(Number);
    return { year, month: month - 1 };
}

function getCurrentYearValue() {
    const now = new Date();
    return now.getFullYear();
}

function getSelectedYear() {
    const value = Number(yearFilter.value) || getCurrentYearValue();
    return value;
}

function isInSelectedMonth(dateValue) {
    const { year, month } = getSelectedMonth();
    const date = new Date(dateValue);
    return date.getFullYear() === year && date.getMonth() === month;
}

function isInSelectedYear(dateValue) {
    const year = getSelectedYear();
    const date = new Date(dateValue);
    return date.getFullYear() === year;
}

function getFilteredTransactions() {
    return transactions.filter((item) => isInSelectedMonth(item.date));
}

function getYearExpenses() {
    const year = getSelectedYear();
    const months = Array.from({ length: 12 }, () => 0);
    transactions.forEach((item) => {
        if (item.type !== 'expense') return;
        const date = new Date(item.date);
        if (date.getFullYear() !== year) return;
        months[date.getMonth()] += item.amount;
    });
    return months;
}

function updateSummary() {
    const visibleTransactions = getFilteredTransactions();
    const income = visibleTransactions
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + item.amount, 0);

    const expense = visibleTransactions
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + item.amount, 0);

    const balance = income - expense;

    incomeTotal.textContent = formatCurrency(income);
    expenseTotal.textContent = formatCurrency(expense);
    balanceTotal.textContent = formatCurrency(balance);
    drawDonut(income, expense);
}

function drawBarChart(expenses) {
    const ctx = barCanvas.getContext('2d');
    const width = barCanvas.width;
    const height = barCanvas.height;
    const padding = 40;
    const maxExpense = Math.max(...expenses, 100);
    const barWidth = (width - padding * 2) / 12 - 12;
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#718096';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    expenses.forEach((value, index) => {
        const barHeight = (value / maxExpense) * (height - padding * 2);
        const x = padding + index * (barWidth + 12);
        const y = height - padding - barHeight;

        ctx.fillStyle = value > 0 ? '#f87171' : 'rgba(203, 213, 225, 0.15)';
        ctx.fillRect(x, y, barWidth, barHeight);

        if (value > 0) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(formatCurrency(value), x + barWidth / 2, y - 8);
        }

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px sans-serif';
        ctx.fillText(labels[index], x + barWidth / 2, height - padding + 18);
    });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    for (let i = 0; i <= 4; i += 1) {
        const y = height - padding - ((height - padding * 2) / 4) * i;
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding + 10, y);
    }
    ctx.stroke();

    const year = getSelectedYear();
    barLabel.textContent = `Despesas por mês em ${year}`;
}

function updateMonthView() {
    if (!monthFilter.value) {
        monthFilter.value = getCurrentMonthValue();
    }
    updateSummary();
    renderTransactions();
}

function updateYearView() {
    if (!yearFilter.value) {
        yearFilter.value = String(getCurrentYearValue());
    }
    drawBarChart(getYearExpenses());
}

function drawDonut(income, expense) {
    const ctx = donutCanvas.getContext('2d');
    const total = income + expense;
    const size = donutCanvas.width;
    const center = size / 2;
    const radius = center - 24;

    ctx.clearRect(0, 0, size, size);

    if (total === 0) {
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.fill();
        chartLabel.textContent = 'Sem transações';
        return;
    }

    let startAngle = -Math.PI / 2;

    const drawSegment = (value, color) => {
        const angle = (value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        startAngle += angle;
    };

    drawSegment(expense, '#f87171');
    drawSegment(income, '#22c55e');

    ctx.beginPath();
    ctx.arc(center, center, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117';
    ctx.fill();

    const incomePercent = Math.round((income / total) * 100);
    const expensePercent = Math.round((expense / total) * 100);
    chartLabel.textContent = `Receita ${incomePercent}% • Despesa ${expensePercent}%`;
}

function renderTransactions() {
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma transação registrada.</td></tr>';
        return;
    }

    sortTransactionsByDate();
    const visibleTransactions = transactions
        .map((item, index) => ({ item, originalIndex: index }))
        .filter(({ item }) => isInSelectedMonth(item.date));

    if (visibleTransactions.length === 0) {
        transactionsList.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma transação registrada para o mês selecionado.</td></tr>';
        return;
    }

    transactionsList.innerHTML = visibleTransactions
        .map(({ item, originalIndex }) => {
            return `
                <tr>
                    <td>${item.description}</td>
                    <td>${formatTransactionDate(item.date)}</td>
                    <td class="status-${item.type}">${item.type === 'income' ? 'Recebimento' : 'Despesa'}</td>
                    <td>${formatCurrency(item.type === 'expense' ? -item.amount : item.amount)}</td>
                    <td>
                        <button type="button" onclick="editTransaction(${originalIndex})">Editar</button>
                        <button type="button" onclick="removeTransaction(${originalIndex})">Remover</button>
                    </td>
                </tr>
            `;
        })
        .join('');
}

function addTransaction(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const rawDate = dateInput.value.trim();
    const type = document.querySelector('input[name="type"]:checked').value;

    const parsedDate = parseTransactionDate(rawDate);
    if (!description || !amount || isNaN(amount) || !parsedDate) {
        alert('Preencha a descrição, valor e uma data válida no formato dd/mm/aa.');
        return;
    }

    const date = parsedDate.toISOString();

    if (editIndex !== null) {
        transactions[editIndex] = { description, amount, type, date };
        editIndex = null;
        submitButton.textContent = 'Adicionar';
        cancelEditButton.classList.add('hidden');
    } else {
        transactions.push({ description, amount, type, date });
    }

    sortTransactionsByDate();
    saveTransactions();
    form.reset();
    descriptionInput.focus();

    updateSummary();
    renderTransactions();
    updateYearView();
}

function editTransaction(index) {
    const item = transactions[index];
    editIndex = index;
    descriptionInput.value = item.description;
    amountInput.value = item.amount;
    dateInput.value = item.date.slice(0, 10);
    document.querySelector(`input[name="type"][value="${item.type}"]`).checked = true;
    submitButton.textContent = 'Salvar alteração';
    cancelEditButton.classList.remove('hidden');
    descriptionInput.focus();
}

function parseTransactionDate(value) {
    if (!value) return null;

    if (value.includes('-')) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const parts = value.split('/').map((part) => part.trim());
    if (parts.length !== 3) return null;

    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    let year = Number(parts[2]);
    if (String(parts[2]).length === 2) {
        year += year >= 50 ? 1900 : 2000;
    }

    const date = new Date(year, month, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function formatTransactionDate(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

function cancelEdit() {
    editIndex = null;
    form.reset();
    submitButton.textContent = 'Adicionar';
    cancelEditButton.classList.add('hidden');
}

function removeTransaction(index) {
    transactions.splice(index, 1);
    saveTransactions();
    updateSummary();
    renderTransactions();
    updateYearView();
}

loadTransactions();
sortTransactionsByDate();
monthFilter.value = getCurrentMonthValue();
yearFilter.value = String(getCurrentYearValue());
monthFilter.addEventListener('change', updateMonthView);
yearFilter.addEventListener('change', updateYearView);
form.addEventListener('submit', addTransaction);
cancelEditButton.addEventListener('click', cancelEdit);
updateMonthView();
updateYearView();
updateYearView();
