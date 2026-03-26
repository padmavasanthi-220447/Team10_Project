const express = require("express");
const router = express.Router();
const {
  addGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  distributeSavingsAPI,
} = require("../controllers/goalController");

router.post("/add", addGoal);
router.get("/:userId", getGoals);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);
router.post("/distribute", distributeSavingsAPI);
module.exports = router;
