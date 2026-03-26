const Goal = require("../models/Goal");

// ADD GOAL
exports.addGoal = async (req, res) => {
  try {
    const goal = new Goal(req.body);
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET GOALS
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.params.userId });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE GOAL
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE GOAL
exports.deleteGoal = async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.distributeSavings = async (userId, totalSavings) => {
  try {
    const goals = await Goal.find({ userId });

    if (!goals.length) return;

    const usableSavings = totalSavings * 0.75;

    const totalPriority = goals.reduce((sum, g) => sum + Number(g.priority), 0);

    if (totalPriority === 0) return;

    for (let goal of goals) {
      const share = (goal.priority / totalPriority) * usableSavings;

      goal.amountSaved = (goal.amountSaved || 0) + share;

      // cap at goal amount
      if (goal.amountSaved > goal.amount) {
        goal.amountSaved = goal.amount;
      }

      await goal.save();
    }

  } catch (err) {
    console.error("Goal Distribution Error:", err);
  }
};
exports.distributeSavingsAPI = async (req, res) => {
  try {
    const { userId, savings } = req.body;

    if (!userId || savings <= 0) {
      return res.status(400).json({ message: "Invalid data" });
    }

    await exports.distributeSavings(userId, savings);

    res.json({ message: "Goals updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating goals" });
  }
};