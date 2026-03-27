const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const User = require("../models/User");
const emailService = require("../services/emailService");

const MONTHS = 12;
const WEEKS = 5;

function resolveUserId(req) {
  const q = req.query.userId;
  const fromQuery = Array.isArray(q) ? q[0] : q;
  const queryId =
    fromQuery != null && String(fromQuery).trim() !== ""
      ? String(fromQuery).trim()
      : "";
  if (queryId) return queryId;
  if (req.user?.id != null && String(req.user.id).trim() !== "") {
    return String(req.user.id).trim();
  }
  return null;
}

function parseQueryDate(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function objectToSortedArray(obj) {
  return Object.entries(obj)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

exports.getAnalytics = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId. Log in again from the login page.",
      });
    }

    const { startDate: startRaw, endDate: endRaw } = req.query;
    const startDate = parseQueryDate(startRaw);
    const endDate = parseQueryDate(endRaw);

    if ((startRaw && !startDate) || (endRaw && !endDate)) {
      return res.status(400).json({ message: "Invalid startDate or endDate" });
    }

    const baseBudget = parseFloat(req.query.monthlyBudgetBase);
    const monthlyBudgetBase = Number.isFinite(baseBudget) ? baseBudget : 0;

    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const expenses = await Expense.find(query).lean();

    const monthlyIncome = Array(MONTHS).fill(0);
    const monthlyExpenses = Array(MONTHS).fill(0);
    const monthlySavings = Array(MONTHS).fill(0);
    const monthlyBudget = Array(MONTHS).fill(0);
    const categoryTotals = {};
    const weeklyExpenses = Array(WEEKS).fill(0);
    const currentMonthCategoryTotals = {};

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (const tx of expenses) {
      const d = new Date(tx.date);
      if (Number.isNaN(d.getTime())) continue;

      const month = d.getMonth();
      const amt = Number(tx.amount) || 0;

      if (tx.type === "income") {
        monthlyIncome[month] += amt;
        totalIncome += amt;
      } else if (tx.type === "expense") {
        monthlyExpenses[month] += amt;
        totalExpense += amt;
        const cat = (tx.category && String(tx.category).trim()) || "Uncategorized";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          currentMonthCategoryTotals[cat] = (currentMonthCategoryTotals[cat] || 0) + amt;
          const dayOfMonth = d.getDate();
          const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), WEEKS - 1);
          weeklyExpenses[weekIndex] += amt;
        }
      } else if (tx.type === "savings") {
        monthlySavings[month] += amt;
        totalSavings += amt;
      }
    }

    for (let i = 0; i < MONTHS; i++) {
      const hasActivity =
        monthlyIncome[i] > 0 || monthlyExpenses[i] > 0 || monthlySavings[i] > 0;
      monthlyBudget[i] = hasActivity ? monthlyBudgetBase + monthlyIncome[i] : 0;
    }

    let topCategory = null;
    let topAmount = 0;
    for (const [name, sum] of Object.entries(categoryTotals)) {
      if (sum > topAmount) {
        topAmount = sum;
        topCategory = name;
      }
    }

    const categoryExpenses = objectToSortedArray(categoryTotals);
    const currentMonthExpenseDistribution = objectToSortedArray(currentMonthCategoryTotals);

    // ✅ EVENT 3: Report Generated Email (Asynchronous)
    User.findById(userId).then(userData => {
      if (userData && userData.email) {
        const reportInfo = {
          name: `Financial Report (${new Date().toLocaleDateString()})`,
          highlights: `you spent the most on ${topCategory || 'various categories'}`,
          category: topCategory || "General",
          url: `${process.env.FRONTEND_URL}/home.html`
        };
        emailService.sendReportEmail(userData, reportInfo).catch(err => console.error("Report email failed:", err));
      }
    }).catch(err => console.error("User lookup for email failed:", err));

    return res.status(200).json({
      monthlyBudget,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      categoryTotals,
      categoryExpenses,
      currentMonthExpenseDistribution,
      weeklyExpenses,
      totalIncome,
      totalExpense,
      totalSavings,
      topCategory,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};
