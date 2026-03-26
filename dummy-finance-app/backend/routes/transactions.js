const express = require("express");
const transactionController = require("../controllers/transactionController");

const router = express.Router();

// POST /api/transactions/add
router.post("/add", transactionController.addTransaction);

// GET /api/transactions/export/:userId
router.get("/export/:userId", transactionController.exportTransactions);

// GET /api/transactions/:userId
router.get("/:userId", transactionController.listTransactions);

module.exports = router;
