const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");

router.post("/add", expenseController.addExpense);
router.get("/", expenseController.getExpenses);

module.exports = router;
router.delete("/:id", async (req,res)=>{
const Expense = require("../models/Expense");

try{

await Expense.findByIdAndDelete(req.params.id);

res.json({message:"Deleted"});

}catch(err){

res.status(500).json(err);

}
});