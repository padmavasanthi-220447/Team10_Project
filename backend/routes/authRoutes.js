const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

router.post("/register",authController.register);

router.post("/login",authController.login);

// ✅ GOOGLE OAUTH ROUTES
router.get("/google/auth-url", authController.getGoogleAuthUrl);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  authController.googleCallback
);

module.exports = router;