const User = require("../models/User");
const bcrypt = require("bcryptjs");


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

res.json({
message:"Login successful",
user:{
id:user._id,
name:user.name,
email:user.email
}
});

}catch(err){

res.status(500).json(err);

}

};