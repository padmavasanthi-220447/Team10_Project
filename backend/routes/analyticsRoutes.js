/**
 * Analytics HTTP route is registered in server.js:
 *   app.get("/api/analytics", optionalAuth, getAnalytics)
 * (Express 5 is more reliable with app-level GET than router mount here.)
 */
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const analyticsController = require("../controllers/analyticsController");

router.get("/", authMiddleware.optionalAuth, analyticsController.getAnalytics);

module.exports = router;
