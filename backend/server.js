const authRoutes = require("./routes/authRoutes");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const expenseRoutes = require("./routes/expenseRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

app.get("/api/health", (req, res) => {
    res.send("Expense Tracker API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});