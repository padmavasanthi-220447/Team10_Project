const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

router.post("/register",authController.register);

router.post("/login",authController.login);

// ✅ GOOGLE OAUTH ROUTES
router.get("/google/auth-url", authController.getGoogleAuthUrl);

// 🛠 Helper to dynamically generate absolute URL for Google OAuth
const getDynamicCallback = (req) => {
  let protocol = req.headers['x-forwarded-proto'] || req.protocol;
  let host = req.headers['x-forwarded-host'] || req.get('host');
  if (host && (host.includes("render.com") || host.includes("vercel.app"))) {
      protocol = "https"; 
  }
  return `${protocol}://${host}/api/auth/google/callback`;
};

router.get(
  "/google",
  (req, res, next) => {
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      callbackURL: getDynamicCallback(req)
    })(req, res, next);
  }
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { 
      failureRedirect: "/login.html",
      callbackURL: getDynamicCallback(req)
    })(req, res, next);
  },
  authController.googleCallback
);

module.exports = router;