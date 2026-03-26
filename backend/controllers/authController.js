const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// ✅ CONFIGURE GOOGLE PASSPORT STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Create new user from Google profile
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            profilePicture: profile.photos[0]?.value,
            password: null, // No password for Google OAuth users
          });
          await user.save();
        } else if (!user.googleId) {
          // Link Google account to existing email
          user.googleId = profile.id;
          if (!user.profilePicture && profile.photos[0]?.value) {
            user.profilePicture = profile.photos[0].value;
          }
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ✅ SERIALIZE & DESERIALIZE USER FOR SESSIONS
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

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

// ✅ GOOGLE OAUTH CALLBACK
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5000";
    res.redirect(
      `${frontendUrl}/home.html?token=${token}&userId=${user._id}&name=${encodeURIComponent(user.name)}&email=${user.email}`
    );
  } catch (err) {
    res.status(500).json({ message: "Authentication failed" });
  }
};

// ✅ GET GOOGLE AUTH URL (for frontend)
exports.getGoogleAuthUrl = (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}&response_type=code&scope=openid%20email%20profile`;
  res.json({ authUrl: googleAuthUrl });
};