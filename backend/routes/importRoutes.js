const express = require("express");
const importController = require("../controllers/importController");

const router = express.Router();

// Dummy financial provider sync endpoint (external integration).
// POST /import-transactions
router.post("/import-transactions", importController.importTransactions);

module.exports = router;
