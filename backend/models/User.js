const mongoose = require("mongoose");   // ✅ ADD THIS LINE

const userSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

email:{
type:String,
required:true,
unique:true
},

password:{
type:String,
required:true
},

lastLogin:{
type:Date
},

loginCount:{
type:Number,
default:0
}

});

module.exports = mongoose.model("User", userSchema);