const User = require("../models/User");
const Expense = require("../models/Expense");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDateOnly(dateLike) {
  // Dummy export uses YYYY-MM-DD; this normalizes to midnight UTC.
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * POST /import-transactions
 * Body:
 * {
 *   email: string,
 *   transactions: [
 *     { date, type, category, description, amount }
 *   ]
 * }
 */
async function importTransactions(req, res) {
  try {
    const { email, transactions } = req.body || {};

    const emailNorm = normalizeEmail(email);
    if (!emailNorm) {
      return res.status(400).json({ message: "email is required" });
    }

    if (!Array.isArray(transactions)) {
      return res.status(400).json({ message: "transactions must be an array" });
    }

    // Main app stores emails as typed, so match case-insensitively.
    const mainUser = await User.findOne({
      email: new RegExp(`^${escapeRegExp(emailNorm)}$`, "i"),
    });
    if (!mainUser) {
      return res.status(404).json({
        message:
          "No matching main user found for this email. Please register/login on the main site first.",
      });
    }

    const userId = mainUser._id;

    let created = 0;
    let skipped = 0;

    // Import sequentially to keep logic simple + avoid large write bursts.
    for (const t of transactions) {
      const dateNorm = normalizeDateOnly(t?.date);
      const amountNum = Number(t?.amount);

      const txType = String(t?.type || "").trim();
      const category = t?.category == null ? "" : String(t.category).trim();
      const description = t?.description == null ? "" : String(t.description).trim();

      // Validate minimally according to main Expense schema.
      if (!dateNorm || !["income", "expense", "savings"].includes(txType)) {
        skipped++;
        continue;
      }
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        skipped++;
        continue;
      }

      const exists = await Expense.findOne({
        userId,
        date: dateNorm,
        type: txType,
        category,
        description,
        amount: amountNum,
      });

      if (exists) {
        skipped++;
        continue;
      }

      await Expense.create({
        userId,
        date: dateNorm,
        type: txType,
        category,
        description,
        amount: amountNum,
      });

      created++;
    }

    return res.json({
      message: "Import completed",
      created,
      skipped,
    });
  } catch (err) {
    console.error("[importController.importTransactions] error:", err);
    // Avoid leaking internals; keep message simple.
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { importTransactions };

