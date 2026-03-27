const User = require("../models/User");

/**
 * POST /api/auth/login
 * Body: { email: string, phone: string }
 *
 * If a user exists (by email or phone) -> login.
 * Otherwise -> create a new user.
 */
async function login(req, res) {
  try {
    const { email, phone } = req.body || {};

    if (!email || !phone) {
      return res.status(400).json({ message: "email and phone are required" });
    }

    // Basic sanitation; models also trim inputs.
    const emailNorm = String(email).trim().toLowerCase();
    const phoneNorm = String(phone).trim();

    const existingUser = await User.findOne({
      $or: [{ email: emailNorm }, { phone: phoneNorm }],
    });

    let user;
    if (existingUser) {
      // Keep stored values aligned with the latest login attempt.
      existingUser.email = emailNorm || existingUser.email;
      existingUser.phone = phoneNorm || existingUser.phone;
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({ email: emailNorm, phone: phoneNorm });
    }

    // Keep response simple for frontend localStorage.
    return res.json({
      userId: user._id.toString(),
      email: user.email,
      phone: user.phone,
      message: "Login successful",
    });
  } catch (error) {
    console.error("[dummy-finance-app] authController.login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { login };
