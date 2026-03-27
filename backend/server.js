require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./config/db");
const { chatWithAI } = require("./controllers/chatController");
const analyticsRoutes = require("./routes/analytics");
const goalRoutes = require("./routes/goalRoutes");
const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const analyticsController = require("./controllers/analyticsController");
const uploadRoutes = require("./routes/upload");
const importRoutes = require("./routes/importRoutes");
const { initCronJobs } = require("./jobs/cronJobs");
const app = express();

// ✅ TRUST RENDER SECURE PROXY
app.set('trust proxy', 1);

// ✅ MIDDLEWARE FIRST
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      const allowed = [
        "http://localhost:5000",
        "http://localhost:3000",
        process.env.FRONTEND_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      ].filter(Boolean);
      if (allowed.includes(origin)) return callback(null, true);
      // In production, also allow same-origin (Render serves frontend from the same URL)
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// ✅ SESSION & PASSPORT MIDDLEWARE
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ✅ CONNECT DB & START JOBS
connectDB().then(() => {
  initCronJobs();
});

// ✅ ANALYTICS — explicit app.get (works on all Express 5.x builds)
const optionalAuth = authMiddleware.optionalAuth;
const getAnalytics = analyticsController.getAnalytics;
if (typeof optionalAuth !== "function" || typeof getAnalytics !== "function") {
  throw new Error("Analytics handlers missing: check authMiddleware.optionalAuth and analyticsController.getAnalytics");
}
app.get("/api/analytics", optionalAuth, getAnalytics);
app.get("/analytics-data", optionalAuth, getAnalytics);

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", uploadRoutes);
app.use("/api/goals", goalRoutes);
app.use(importRoutes);
app.get("/api/client-config", (req, res) => {
  const host = req.get("host") || "localhost";
  res.json({
    ok: true,
    apiBase: `${req.protocol}://${host}`,
  });
});
app.use("/api/admin", adminRoutes);
// Do not use app.use("/api", router) — in Express 5 it interferes with other /api routes.
app.post("/api/chat", chatWithAI);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, port: Number(process.env.PORT) || 5000 });
});

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

const publicDir = path.resolve(__dirname, "..");

function serveHtml(filename) {
  return (req, res) => {
    const fp = path.join(publicDir, filename);
    res.sendFile(fp, (err) => {
      if (err) {
        console.error("sendFile failed:", filename, err.message);
        res.status(404).send("Cannot find " + filename + " (expected at " + fp + ")");
      }
    });
  };
}

["analytics.html", "add-expense.html", "login.html", "home.html", "landing.html"].forEach(
  (name) => {
    app.get("/" + name, serveHtml(name));
  }
);
app.get("/analytics", serveHtml("analytics.html"));
app.get("/add-expense", serveHtml("add-expense.html"));
app.get("/login", serveHtml("login.html"));
app.get("/home", serveHtml("home.html"));

app.use(express.static(publicDir));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open UI: http://localhost:${PORT}/login.html`);
  console.log(`Analytics: http://localhost:${PORT}/analytics.html`);
});