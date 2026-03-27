const Admin = require("../models/Admin");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ==========================
// REGISTER ADMIN
// ==========================
exports.registerAdmin = async (req,res)=>{
try{

const {name,email,password} = req.body;

const existing = await Admin.findOne({email});

if(existing){
return res.status(400).json({message:"Admin already exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const admin = new Admin({
name,
email,
password:hashedPassword
});

await admin.save();

res.json({message:"Admin registered successfully"});

}catch(error){

console.log(error);
res.status(500).json({message:"Error registering admin"});

}
};


// ==========================
// LOGIN ADMIN
// ==========================
exports.loginAdmin = async (req,res)=>{
try{

const {email,password} = req.body;

const admin = await Admin.findOne({email});

if(!admin){
return res.status(400).json({message:"Admin not found"});
}

const match = await bcrypt.compare(password,admin.password);

if(!match){
return res.status(400).json({message:"Wrong password"});
}

const token = jwt.sign(
{id:admin._id},
"adminsecret",
{expiresIn:"1d"}
);

res.json({
message:"Login successful",
token,
admin:{
id:admin._id,
name:admin.name,
email:admin.email
}
});

}catch(error){

console.log(error);
res.status(500).json({message:"Login failed"});

}
};


// ==========================
// ADMIN USER ACTIVITY (TABLE)
// ==========================
exports.getAdminStats = async (req,res)=>{

try{

const totalUsers = await User.countDocuments();

const activeUsers = await User.countDocuments({
lastLogin:{
$gte: new Date(Date.now() - 24*60*60*1000)
}
});

const users = await User.find()
.select("email loginCount lastLogin")
.sort({lastLogin:-1});

res.json({
totalUsers,
activeUsers,
users
});

}catch(error){

console.log(error);
res.status(500).json({message:"Error fetching data"});

}

};