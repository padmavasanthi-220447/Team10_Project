const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const Expense = require("../models/Expense");

const router = express.Router();

// Multer config
const upload = multer({ dest: "uploads/" });

// Upload + Process CSV
router.post("/upload-statement", upload.single("file"), async (req, res) => {
    try {
        const results = [];

        // 🔥 Get userId from frontend
        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on("data", (data) => {
                results.push(data);
            })
            .on("end", async () => {

                console.log("📊 Parsed Transactions:", results.length);
                console.log("👤 User ID:", userId);

                for (let txn of results) {
                    try {
                        const expense = new Expense({
                            userId: userId, // 🔥 FIXED HERE
                            date: txn.date,
                            type: txn.type?.toLowerCase(),
                            category: txn.category?.toLowerCase(),
                            description: txn.description || "",
                            amount: parseFloat(txn.amount)
                        });

                        await expense.save();
                    } catch (err) {
                        console.error("❌ Error saving transaction:", txn, err);
                    }
                }

                // Delete uploaded file
                fs.unlinkSync(req.file.path);

                res.json({
                    message: "CSV uploaded and saved to MongoDB",
                    total: results.length
                });
            });

    } catch (error) {
        console.error("❌ Upload Error:", error);
        res.status(500).json({ error: "Upload failed" });
    }
});

module.exports = router;