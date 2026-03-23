const express = require("express");
const router = express.Router();

const { chatWithAI } = require("../controllers/chatController");

// POST route for chatbot
router.post("/chat", chatWithAI);

module.exports = router;