const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

date:{
type:Date,
required:true
},

type:{
type:String,
enum:["income","expense","savings"],
required:true
},

category:{
type:String
},

description:{
type:String
},

amount:{
type:Number,
required:true
}

},{timestamps:true});

module.exports = mongoose.model("Expense",expenseSchema);