const Expense = require("../models/Expense");


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