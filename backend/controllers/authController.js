const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER USER
exports.register = async (req,res)=>{

try{

const {name,email,password} = req.body;

const existingUser = await User.findOne({email});

if(existingUser){
return res.status(400).json({message:"User already exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const user = new User({
name,
email,
password:hashedPassword
});

await user.save();

res.json({message:"User registered successfully"});

}catch(err){

res.status(500).json(err);

}

};



// LOGIN USER
exports.login = async (req,res)=>{

try{

const {email,password} = req.body;

const user = await User.findOne({email});

if(!user){
return res.status(400).json({message:"Invalid email"});
}

const isMatch = await bcrypt.compare(password,user.password);

if(!isMatch){
return res.status(400).json({message:"Invalid password"});
}

// ✅ IMPORTANT FIX STARTS HERE

user.lastLogin = new Date();

user.loginCount = (user.loginCount || 0) + 1;

await user.save();

// ✅ IMPORTANT FIX ENDS HERE

const token =
  process.env.JWT_SECRET &&
  jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

res.json({
message:"Login successful",
...(token ? { token } : {}),
user:{
id:user._id,
name:user.name,
email:user.email,
lastLogin:user.lastLogin,
loginCount:user.loginCount
}
});

}catch(err){

res.status(500).json(err);

}

};