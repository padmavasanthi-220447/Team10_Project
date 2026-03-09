// Chart instances
let categoryChart = null;
let weeklyChart = null;
let dailyChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadExpenses();
    loadBudget();
    updateCards();
    setTodayDate();

    // Form submission
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('budgetForm').addEventListener('submit', setBudget);
});

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Add expense function
function addExpense(e) {
    e.preventDefault();

    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (!date || !category || !description || !amount) {
        alert('Please fill in all fields');
        return;
    }

    // Check if budget is set
    const budget = parseFloat(localStorage.getItem('budget')) || 0;
    if (budget === 0) {
        alert('Please set a monthly budget first!');
        return;
    }

    // Get existing expenses and calculate total
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const currentTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const newTotal = currentTotal + amount;

    // Show warning if budget is exceeded
    if (newTotal > budget) {
        const exceededAmount = newTotal - budget;
        const confirmed = confirm(
            `⚠️ Warning!\n\n` +
            `Adding this expense will exceed your budget by ₹${exceededAmount.toFixed(2)}\n\n` +
            `Current Budget: ₹${budget.toFixed(2)}\n` +
            `Current Spent: ₹${currentTotal.toFixed(2)}\n` +
            `New Expense: ₹${amount.toFixed(2)}\n` +
            `Total After: ₹${newTotal.toFixed(2)}\n\n` +
            `Do you want to add this expense anyway?`
        );
        
        if (!confirmed) {
            return;
        }
    }

    // Create expense object
    const expense = {
        id: Date.now(),
        date: date,
        category: category,
        description: description,
        amount: amount
    };

    // Add to expenses
    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // Clear form
    document.getElementById('expenseForm').reset();
    setTodayDate();

    // Reload and update
    loadExpenses();
    updateCards();
    updateCharts();
    
    // Show success message
    showAlert(`✓ Expense of ₹${amount.toFixed(2)} added successfully!`, 'success');
}

// Load expenses from localStorage
function loadExpenses() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const tbody = document.getElementById('expensesList');
    const emptyMessage = document.getElementById('emptyMessage');

    tbody.innerHTML = '';

    if (expenses.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }

    emptyMessage.style.display = 'none';

    // Sort expenses by date (newest first)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    expenses.forEach(expense => {
        const row = document.createElement('tr');
        const date = new Date(expense.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        row.innerHTML = `
            <td>${date}</td>
            <td>${expense.category}</td>
            <td>${expense.description}</td>
            <td>₹${expense.amount.toFixed(2)}</td>
            <td>
                <button class="btn-delete" onclick="deleteExpense(${expense.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenses = expenses.filter(exp => exp.id !== id);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        loadExpenses();
        updateCards();
        updateCharts();
    }
}

// Set budget
function setBudget(e) {
    e.preventDefault();

    const budgetAmount = parseFloat(document.getElementById('budgetAmount').value);

    if (budgetAmount <= 0) {
        alert('Please enter a valid budget amount');
        return;
    }

    localStorage.setItem('budget', budgetAmount);
    document.getElementById('budgetForm').reset();
    alert('Budget set successfully!');
    updateCards();
    updateCharts();
}

// Load budget from localStorage
function loadBudget() {
    const budget = localStorage.getItem('budget');
    if (budget) {
        document.getElementById('budgetAmount').value = budget;
    }
}

// Update cards with totals
function updateCards() {
    const budget = parseFloat(localStorage.getItem('budget')) || 0;
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget - totalSpent;

    document.getElementById('totalBudget').textContent = '₹' + budget.toFixed(2);
    document.getElementById('totalSpent').textContent = '₹' + totalSpent.toFixed(2);
    document.getElementById('remaining').textContent = '₹' + remaining.toFixed(2);

    // Change remaining color based on status
    const remainingElement = document.getElementById('remaining');
    if (remaining < 0) {
        remainingElement.style.color = '#FF6B6B'; // Red for overspend
    } else if (remaining < budget * 0.2) {
        remainingElement.style.color = '#FFA500'; // Orange for warning
    } else {
        remainingElement.style.color = '#B8521A'; // Brown for normal
    }
    
    updateCharts();
}

// Show temporary alert notification
function showAlert(message, type) {
    // Create alert container if it doesn't exist
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            font-family: Segoe UI;
        `;
        document.body.appendChild(alertContainer);
    }

    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : '#FF8C00'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        margin-bottom: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    alertEl.textContent = message;
    alertContainer.appendChild(alertEl);

    // Auto remove after 3 seconds
    setTimeout(() => {
        alertEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alertEl.remove(), 300);
    }, 3000);
}

// Update all charts
function updateCharts() {
    updateCategoryChart();
    updateWeeklyChart();
    updateDailyChart();
    updateCategoryStats();
}

// Generate Pie Chart - Category Distribution
function updateCategoryChart() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    
    if (expenses.length === 0) {
        if (categoryChart) categoryChart.destroy();
        return;
    }

    // Group by category
    const categoryData = {};
    expenses.forEach(expense => {
        if (!categoryData[expense.category]) {
            categoryData[expense.category] = 0;
        }
        categoryData[expense.category] += expense.amount;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#82E0AA',
        '#FAD7A0', '#A9DFBF', '#F5B041', '#85C1E2', '#F48FB1'
    ];

    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) categoryChart.destroy();
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Generate Bar Chart - Weekly Expenses
function updateWeeklyChart() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    
    if (expenses.length === 0) {
        if (weeklyChart) weeklyChart.destroy();
        return;
    }

    // Get last 7 weeks data
    const weekData = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekLabel = `Week ${Math.ceil((date.getDate()) / 7)}`;
        const weekKey = weekStart.toISOString().split('T')[0];
        weekData[weekLabel] = 0;
    }

    // Aggregate expenses by week
    expenses.forEach(expense => {
        const expDate = new Date(expense.date);
        const weekStart = new Date(expDate);
        weekStart.setDate(weekStart.getDate() - expDate.getDay());
        const weekLabel = `W${weekStart.getWeek()}`;
        
        if (!weekData[weekLabel]) weekData[weekLabel] = 0;
        weekData[weekLabel] += expense.amount;
    });

    const labels = Object.keys(weekData);
    const data = Object.values(weekData);
    const weeklyColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE'
    ];

    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    if (weeklyChart) weeklyChart.destroy();
    
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weekly Expenses (₹)',
                data: data,
                backgroundColor: weeklyColors,
                borderColor: weeklyColors.map(color => color),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Generate Line Chart - Daily Trend
function updateDailyChart() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    
    if (expenses.length === 0) {
        if (dailyChart) dailyChart.destroy();
        return;
    }

    // Group by date and calculate cumulative
    const dailyData = {};
    expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let cumulative = 0;
    expenses.forEach(expense => {
        if (!dailyData[expense.date]) {
            dailyData[expense.date] = 0;
        }
        dailyData[expense.date] += expense.amount;
        cumulative += expense.amount;
    });

    const labels = Object.keys(dailyData).map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    
    let cumulativeSum = 0;
    const cumulativeData = Object.values(dailyData).map(val => {
        cumulativeSum += val;
        return cumulativeSum;
    });

    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    if (dailyChart) dailyChart.destroy();
    
    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Spending (₹)',
                data: cumulativeData,
                borderColor: '#FF6B6B',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#45B7D1',
                pointBorderColor: '#FF6B6B',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update Category Stats
function updateCategoryStats() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const statsContainer = document.getElementById('categoryStats');
    
    if (expenses.length === 0) {
        statsContainer.innerHTML = '<p style="text-align:center; color:#999;">No expenses to display</p>';
        return;
    }

    // Group by category
    const categoryData = {};
    let total = 0;
    
    expenses.forEach(expense => {
        if (!categoryData[expense.category]) {
            categoryData[expense.category] = 0;
        }
        categoryData[expense.category] += expense.amount;
        total += expense.amount;
    });

    // Sort by amount (descending)
    const sorted = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);

    statsContainer.innerHTML = '';
    const statColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#82E0AA',
        '#FAD7A0', '#A9DFBF', '#F5B041', '#F48FB1'
    ];
    
    sorted.forEach(([category, amount], index) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        const color = statColors[index % statColors.length];
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <div>
                <div class="stat-label" style="color: ${color}; font-weight: bold;">${category}</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};"></div>
                </div>
            </div>
            <div class="stat-value" style="color: ${color};">${percentage}%</div>
        `;
        statsContainer.appendChild(statItem);
    });
}

// Helper function to get week number
Date.prototype.getWeek = function() {
    const firstDay = new Date(this.getFullYear(), 0, 1);
    const dayOffset = (firstDay.getDay() || 7) - 1;
    const dayMilliseconds = 86400000;
    const weekNumber = Math.ceil((this.getTime() - firstDay.getTime() + dayOffset * dayMilliseconds) / (7 * dayMilliseconds));
    return weekNumber;
}
