require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const User = require("./models/User");
const Transaction = require("./models/Transaction");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// Connect DB and seed optional sample data.
async function seedSampleData() {
  // Only seed if there are no users yet (keeps existing data intact).
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  const sampleUser = await User.create({
    email: "sample@dummyfinance.com",
    phone: "9999999999",
  });

  const categories = ["Food", "Travel", "Bills", "Shopping"];
  const today = new Date();

  // Create a few transactions over the last 3 days.
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);

    await Transaction.create({
      userId: sampleUser._id,
      date: d,
      type: "expense",
      category: categories[i % categories.length],
      description: ["Coffee", "Taxi", "Electricity", "Groceries"][i % 4],
      amount: 100 + i * 50,
    });
  }

  console.log("[dummy-finance-app] Seeded sample user + transactions");
}

async function start() {
  await connectDB();
  await seedSampleData();

  // API routes (dummy external provider).
  app.use("/api/auth", authRoutes);
  app.use("/api/transactions", transactionRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, port: Number(process.env.PORT) || 5001 });
  });

  app.get("/api/config", (req, res) => res.json({
    mainTrackerImportUrl: `${process.env.MAIN_TRACKER_URL || "http://localhost:5000"}/import-transactions`
  }));

  // Serve the standalone frontend pages.
  const frontendDir = path.resolve(__dirname, "..", "frontend");
  app.use(express.static(frontendDir));

  app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDir, "login.html"));
  });

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`[dummy-finance-app] Server running on port ${PORT}`);
    console.log(`[dummy-finance-app] Open: http://localhost:${PORT}/`);
    console.log(`[dummy-finance-app] Login page: http://localhost:${PORT}/login.html`);
  });
}

start().catch((err) => {
  console.error("[dummy-finance-app] Failed to start:", err);
  process.exit(1);
});

