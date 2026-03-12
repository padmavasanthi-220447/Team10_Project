const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/cash_compass");

    console.log("MongoDB Connected");
  } catch (error) {
    console.log("Database connection error");
  }
};

module.exports = connectDB;
