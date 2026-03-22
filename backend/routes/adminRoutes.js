const express = require("express");
const router = express.Router();

const {
registerAdmin,
loginAdmin,
getAdminStats
} = require("../controllers/adminController");

router.post("/register",registerAdmin);
router.post("/login",loginAdmin);
router.get("/stats",getAdminStats);

module.exports = router;