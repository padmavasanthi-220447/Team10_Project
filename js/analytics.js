const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEK_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
const PIE_COLORS = ["#ef5350", "#26a69a", "#42a5f5", "#ffa726", "#ab47bc", "#7e57c2", "#29b6f6", "#8d6e63"];

/**
 * Prefer /analytics-data (no /api prefix) so nothing can rewrite the URL to "/api/".
 * Fallback: /api/analytics
 */
function getAnalyticsRequestUrl(queryString) {
  var qs = queryString || "";
  var suffix = (qs ? "?" + qs : "");
  var pr = window.location.protocol;
  var primaryPath = "/analytics-data" + suffix;
  var fallbackPath = "/api/analytics" + suffix;

  if (pr !== "http:" && pr !== "https:") {
    return "http://localhost:5000" + primaryPath;
  }
  var port = String(window.location.port || "");
  if (port === "5500" || port === "5501") {
    var h = window.location.hostname || "localhost";
    return pr + "//" + h + ":5000" + primaryPath;
  }
  return window.location.origin + primaryPath;
}

let chartInstances = [];

function getAnalyticsFetchHeaders() {
  const headers = {};
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function destroyCharts() {
  chartInstances.forEach((c) => c.destroy());
  chartInstances = [];
}

function showError(message) {
  const grid = document.querySelector(".analytics-grid");
  if (!grid) return;
  grid.querySelectorAll(".analytics-error").forEach((n) => n.remove());
  const el = document.createElement("p");
  el.className = "analytics-error";
  el.textContent = message;
  el.style.cssText =
    "grid-column:1/-1;text-align:center;padding:24px;color:#c62828;background:#ffebee;border-radius:8px;";
  grid.prepend(el);
}

async function loadAnalytics() {
  const rawId = localStorage.getItem("userId");
  const userId = rawId != null ? String(rawId).trim() : "";

  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  const budgetKey = `monthlyBudget_${userId}`;
  const monthlyBudgetBase = parseFloat(localStorage.getItem(budgetKey)) || 0;
  const params = new URLSearchParams();
  params.set("userId", userId);
  if (monthlyBudgetBase > 0) params.set("monthlyBudgetBase", String(monthlyBudgetBase));

  const qs = params.toString();
  const headers = getAnalyticsFetchHeaders();

  let res;
  let text;
  try {
    res = await fetch(getAnalyticsRequestUrl(qs), { headers });
    text = await res.text();
    const body0 = text.replace(/^\uFEFF/, "").trim();
    const looksLikeJson = body0.length > 0 && body0.charAt(0) === "{";
    if (!res.ok || !looksLikeJson) {
      var fb =
        window.location.protocol === "http:" || window.location.protocol === "https:"
          ? window.location.origin + "/api/analytics?" + qs
          : "http://localhost:5000/api/analytics?" + qs;
      if (window.location.port === "5500" || window.location.port === "5501") {
        fb =
          window.location.protocol +
          "//" +
          (window.location.hostname || "localhost") +
          ":5000/api/analytics?" +
          qs;
      }
      res = await fetch(fb, { headers });
      text = await res.text();
    }
  } catch (e) {
    console.error(e);
    showError(
      "Could not reach the server. In folder frontend/backend run: npm run dev — then open http://localhost:5000/login.html (same port as the terminal)."
    );
    return;
  }

  const trimmed = text.replace(/^\uFEFF/, "").trim();
  let data = {};
  if (trimmed) {
    try {
      data = JSON.parse(trimmed);
    } catch {
      const hint = trimmed.slice(0, 160).replace(/\s+/g, " ");
      showError(
        "Server returned non-JSON. Use ONLY the address from Node (e.g. http://localhost:5000/analytics.html). " +
          (hint ? "Received: " + hint : "")
      );
      return;
    }
  }

  if (!res.ok) {
    showError(data.message || `Failed to load analytics (${res.status}).`);
    return;
  }

  destroyCharts();

  createMonthlyChart(data);
  createPieChart(data);
  createWeeklyChart(data);
  createCategoryChart(data);
}

function createMonthlyChart(data) {
  const monthlyBudget = data.monthlyBudget || Array(12).fill(0);
  const monthlyIncome = data.monthlyIncome || Array(12).fill(0);

  const budgetPart = [];
  const incomePart = [];

  for (let i = 0; i < 12; i++) {
    const total = monthlyBudget[i] || 0;
    const income = monthlyIncome[i] || 0;

    // Ensure income does not exceed budget
    const incomeUsed = Math.min(income, total);
    const remainingBudget = total - incomeUsed;

    budgetPart.push(remainingBudget); // blue
    incomePart.push(incomeUsed);      // yellow
  }  
  const monthlyExpenses = data.monthlyExpenses || Array(12).fill(0);
  const monthlySavings = data.monthlySavings || Array(12).fill(0);

  const chart = new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: {
      labels: MONTH_LABELS,
      datasets: [
        {
          label: "Budget (Remaining)",
          data: budgetPart,
          backgroundColor: "#42a5f5",
          stack: "budgetStack", // ✅
        },
        {
          label: "Income",
          data: incomePart,
          backgroundColor: "#fdd835",
          stack: "budgetStack", // ✅ SAME STACK
        },
        {
          label: "Expenses",
          data: monthlyExpenses,
          backgroundColor: "#ef5350",
          stack: "expenseStack", // ❗ DIFFERENT STACK
        },
        {
          label: "Savings",
          data: monthlySavings,
          backgroundColor: "#66bb6a",
          stack: "savingsStack", // ❗ DIFFERENT STACK
        },
        
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true , beginAtZero: true },
      },
    },
  });
  chartInstances.push(chart);
}

function createPieChart(data) {
  const items = data.currentMonthExpenseDistribution || [];
  const canvas = document.getElementById("pieChart");

  if (items.length === 0) {
    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["No expenses this month"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#e0e0e0"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
    chartInstances.push(chart);
    return;
  }

  const labels = items.map((x) => x.category);
  const values = items.map((x) => x.amount);
  const colors = labels.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]);

  const chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });
  chartInstances.push(chart);
}

function createWeeklyChart(data) {
  const weeklyExpenses = data.weeklyExpenses || Array(5).fill(0);

  const chart = new Chart(document.getElementById("weeklyChart"), {
    type: "bar",
    data: {
      labels: WEEK_LABELS,
      datasets: [
        {
          label: "Weekly Expenses",
          data: weeklyExpenses,
          backgroundColor: "#ef5350",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
  chartInstances.push(chart);
}

function createCategoryChart(data) {
  const items = data.categoryExpenses || [];
  const canvas = document.getElementById("categoryChart");

  if (items.length === 0) {
    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: ["—"],
        datasets: [
          {
            label: "Category Expense",
            data: [0],
            backgroundColor: "#26a69a",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
    chartInstances.push(chart);
    return;
  }

  const labels = items.map((x) => x.category);
  const values = items.map((x) => x.amount);

  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Category Expense",
          data: values,
          backgroundColor: "#26a69a",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 } },
        y: { beginAtZero: true },
      },
    },
  });
  chartInstances.push(chart);
}

document.addEventListener("DOMContentLoaded", loadAnalytics);
