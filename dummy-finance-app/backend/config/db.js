const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[dummy-finance-app] MongoDB Connected");
  } catch (error) {
    console.error("[dummy-finance-app] MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
