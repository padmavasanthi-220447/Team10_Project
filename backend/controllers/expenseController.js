const Expense = require("../models/Expense");
const User = require("../models/User");

// ✅ GET BUDGET FROM DB
exports.getBudget = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const user = await User.findById(userId).select("monthlyBudget");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ monthlyBudget: user.monthlyBudget || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ SAVE BUDGET TO DB
exports.saveBudget = async (req, res) => {
  try {
    const { userId, budget } = req.body;
    if (!userId || budget === undefined) return res.status(400).json({ message: "userId and budget required" });
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum < 0) return res.status(400).json({ message: "Invalid budget" });
    await User.findByIdAndUpdate(userId, { monthlyBudget: budgetNum });
    res.json({ message: "Budget saved", monthlyBudget: budgetNum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


exports.addExpense = async (req, res) => {
  try {
    let { userId, date, type, category, description, amount } = req.body;

    // ✅ Validation
    if (!userId || !amount || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Convert amount to number (VERY IMPORTANT)
    amount = Number(amount);

    // ✅ If no date, use current date
    if (!date) {
      date = new Date();
    }

    const expense = new Expense({
      userId,
      date,
      type,
      category,
      description,
      amount
    });

    await expense.save();

    res.status(201).json({
      message: "Expense added successfully",
      data: expense
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getExpenses = async (req,res)=>{

try{

const userId = req.query.userId;

const expenses = await Expense.find({userId});

res.json(expenses);

}catch(err){

res.status(500).json(err);

}

};