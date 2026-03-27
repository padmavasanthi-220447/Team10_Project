const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

router.get("/", async (req, res) => {
  try {
    const { userId, monthlyBudgetBase } = req.query;

    const expenses = await Expense.find({ userId });

    // =========================
    // 1️⃣ Monthly Arrays (12 months)
    // =========================
    const monthlyExpenses = Array(12).fill(0);
    const monthlyIncome = Array(12).fill(0);

    expenses.forEach(e => {
      const month = new Date(e.date).getMonth();

      if (e.type === "income") {
        monthlyIncome[month] += e.amount;
      } else {
        monthlyExpenses[month] += e.amount;
      }
    });

    // =========================
    // 2️⃣ Monthly Budget & Savings
    // =========================
    const base = Number(monthlyBudgetBase) || 0;

    const monthlyBudget = Array(12).fill(base);

    const monthlySavings = monthlyIncome.map((inc, i) => {
      return inc - monthlyExpenses[i];
    });

    // =========================
    // 3️⃣ Current Month Pie
    // =========================
    const currentMonth = new Date().getMonth();

    const categoryMap = {};

    expenses.forEach(e => {
      const m = new Date(e.date).getMonth();

      if (m === currentMonth && e.type === "expense") {
        categoryMap[e.category] =
          (categoryMap[e.category] || 0) + e.amount;
      }
    });

    const currentMonthExpenseDistribution = Object.keys(categoryMap).map(c => ({
      category: c,
      amount: categoryMap[c]
    }));

    // =========================
    // 4️⃣ Weekly Expenses
    // =========================
    const weeklyExpenses = Array(5).fill(0);

    expenses.forEach(e => {
      if (e.type === "expense") {
        const day = new Date(e.date).getDate();
        const weekIndex = Math.min(Math.floor((day - 1) / 7), 4);
        weeklyExpenses[weekIndex] += e.amount;
      }
    });

    // =========================
    // 5️⃣ Category Wise (All Time)
    // =========================
    const categoryAll = {};

    expenses.forEach(e => {
      if (e.type === "expense") {
        categoryAll[e.category] =
          (categoryAll[e.category] || 0) + e.amount;
      }
    });

    const categoryExpenses = Object.keys(categoryAll).map(c => ({
      category: c,
      amount: categoryAll[c]
    }));

    // =========================
    // FINAL RESPONSE (MATCH FRONTEND)
    // =========================
    res.json({
      monthlyBudget,
      monthlyExpenses,
      monthlySavings,
      currentMonthExpenseDistribution,
      weeklyExpenses,
      categoryExpenses
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;