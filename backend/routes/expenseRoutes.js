const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const Expense = require("../models/Expense");

// Add Expense
router.post("/add", expenseController.addExpense);

// Get All Expenses
router.get("/", expenseController.getExpenses);

// Delete Expense
router.delete("/:id", async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;