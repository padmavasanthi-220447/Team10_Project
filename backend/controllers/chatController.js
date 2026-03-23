const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.chatWithAI = async (req, res) => {
  try {
    const { message, transactions, monthlyBudget } = req.body;
    const lowerMsg = message.toLowerCase();

    // =========================
    // 🔥 HUMAN RESPONSES
    // =========================
    if (["hi", "hello", "hey"].some(w => lowerMsg.includes(w))) {
      return res.json({
        reply: "Hi 👋 I'm your Smart Financial Advisor. Ask me anything about your expenses 💡"
      });
    }

    if (lowerMsg.includes("thank")) {
      return res.json({
        reply: "You're welcome 😊 Happy to help!"
      });
    }

    if (["bye", "goodbye"].some(w => lowerMsg.includes(w))) {
      return res.json({
        reply: "Goodbye 👋 Stay financially smart!"
      });
    }

    // =========================
    // 📊 CALCULATE TOTALS (FIXED)
    // =========================
    let totalExpense = 0;
    let totalSavings = 0;
    let transactionDetails = "";

    if (transactions && Array.isArray(transactions)) {
      transactions.forEach(item => {

        if (item.type === "expense") {
          totalExpense += item.amount || 0;
        }

        if (item.type === "savings") {
          totalSavings += item.amount || 0;
        }

        // ✅ ADD CATEGORY DATA
        transactionDetails += `- ${item.category || "General"} | ${item.type} | ₹${item.amount}\n`;
      });
    }

    // =========================
    // 🧠 CONTEXT FOR AI
    // =========================
    const financialData = `
    User Financial Data:

    Monthly Income (Budget): ₹${monthlyBudget}
    Total Expenses: ₹${totalExpense}
    Total Savings: ₹${totalSavings}

    Detailed Transactions:
    ${transactionDetails}
    `;

    // =========================
    // 🤖 GROQ CALL
    // =========================
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are a smart financial advisor.

STRICT RULES:
- No paragraphs
- Only bullet points
- Short and clear
- Treat "Monthly Budget" as user's income
You CAN analyze category-wise spending.

FORMAT:

📊 Summary:
- Point

💰 Savings Plan:
- Point

⏳ Goal Timeline:
- Point

💡 Smart Tips:
- Point
`
        },
        {
          role: "user",
          content: `
${financialData}

User Query:
${message}
`
        }
      ]
    });

    res.json({
      reply: response.choices?.[0]?.message?.content || "⚠️ No response"
    });

  } catch (error) {
    console.error("Groq Error:", error);

    res.json({
      reply: "⚠️ AI error. Please try again."
    });
  }
};