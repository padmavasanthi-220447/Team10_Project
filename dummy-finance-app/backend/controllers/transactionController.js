const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

function normalizeDateToMidnight(d) {
  const dt = new Date(d);
  // Use UTC to keep "YYYY-MM-DD" exports stable across timezones.
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
}

function formatDateYYYYMMDD(date) {
  // Return YYYY-MM-DD for predictable export payloads.
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

/**
 * POST /api/transactions/add
 * Body: { userId, amount, category, description }
 *
 * Creates a dummy "expense" transaction with date = today.
 */
async function addTransaction(req, res) {
  try {
    const { userId, amount, category, description } = req.body || {};

    if (!userId || !category || !description) {
      return res.status(400).json({
        message: "userId, category, and description are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    // Dummy provider always sends expenses as per requirements.
    const txDate = normalizeDateToMidnight(new Date());

    // Optional duplicate prevention (same day + same fields).
    const existing = await Transaction.findOne({
      userId,
      date: txDate,
      type: "expense",
      category: String(category).trim(),
      description: String(description).trim(),
      amount: amountNum,
    });

    if (existing) {
      return res.status(409).json({ message: "Duplicate transaction" });
    }

    const tx = await Transaction.create({
      userId,
      date: txDate,
      type: "expense",
      category: String(category).trim(),
      description: String(description).trim(),
      amount: amountNum,
    });

    return res.status(201).json(tx);
  } catch (error) {
    console.error("[dummy-finance-app] addTransaction error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/transactions/:userId
 */
async function listTransactions(req, res) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const txs = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .exec();

    return res.json(txs);
  } catch (error) {
    console.error("[dummy-finance-app] listTransactions error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/transactions/export/:userId
 *
 * Export format must match:
 * [
 *   { date, type, category, description, amount }
 * ]
 */
async function exportTransactions(req, res) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const txs = await Transaction.find({ userId }).sort({ date: -1, createdAt: -1 }).exec();

    const payload = txs.map((tx) => ({
      date: formatDateYYYYMMDD(tx.date),
      type: tx.type,
      category: tx.category,
      description: tx.description,
      amount: tx.amount,
    }));

    return res.json(payload);
  } catch (error) {
    console.error("[dummy-finance-app] exportTransactions error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  addTransaction,
  listTransactions,
  exportTransactions,
};
