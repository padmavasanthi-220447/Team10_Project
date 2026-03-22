const Expense = require("../models/Expense");

exports.addExpense = async (req,res)=>{

try{

const {userId,date,type,category,description,amount} = req.body;

const expense = new Expense({
userId,
date,
type,
category,
description,
amount
});

await expense.save();

res.json(expense);

}catch(err){

res.status(500).json(err);

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