document.addEventListener("DOMContentLoaded", function () {
  // ===== CHECK TOKEN =====
  const token = localStorage.getItem("token");
  if (!token) {
    // silent redirect
    window.location.href = "login.html";
    return;
  }

  // ===== USERNAME =====
  const username = "User"; // temporarily static
  document.getElementById("username").textContent = username;

  // ===== LOAD DASHBOARD =====
  updateDashboard();
  loadWeeklyGraph();
});

// ===== LOGOUT =====
function confirmLogout() {
  const confirmAction = confirm("Are you sure you want to logout?");
  if (confirmAction) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}

// ===== DASHBOARD DATA =====
function updateDashboard() {
  const transactions = JSON.parse(localStorage.getItem("expenses")) || [];
  const monthlyBudget = parseFloat(localStorage.getItem("monthlyBudget")) || 0;

  let totalIncome = 0,
    totalExpense = 0,
    totalSavings = 0;

  transactions.forEach((item) => {
    if (item.type === "income") totalIncome += item.amount;
    else if (item.type === "savings") totalSavings += item.amount;
    else totalExpense += item.amount;
  });

  document.getElementById("budgetCard").textContent = "₹" + monthlyBudget;
  document.getElementById("expenseCard").textContent = "₹" + totalExpense;
  document.getElementById("savingsCard").textContent = "₹" + totalSavings;
}

// ===== WEEKLY GRAPH =====
function loadWeeklyGraph() {
  const transactions = JSON.parse(localStorage.getItem("expenses")) || [];
  const weeklyExpenses = [0, 0, 0, 0, 0, 0, 0];
  const weeklySavings = [0, 0, 0, 0, 0, 0, 0];

  transactions.forEach((item) => {
    const date = new Date(item.date);
    const day = date.getDay();
    const index = (day + 6) % 7; // Monday start
    if (item.type === "expense") weeklyExpenses[index] += item.amount;
    if (item.type === "savings") weeklySavings[index] += item.amount;
  });

  const ctx = document.getElementById("weeklyChart");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Expenses",
          data: weeklyExpenses,
          borderColor: "#e53935",
          backgroundColor: "rgba(229,57,53,0.2)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Savings",
          data: weeklySavings,
          borderColor: "#2e7d32",
          backgroundColor: "rgba(46,125,50,0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });
}
