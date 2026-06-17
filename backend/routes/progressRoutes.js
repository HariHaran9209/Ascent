const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getMyProgress, updateProgress } = require("../controllers/progressController");

const router = express.Router();

router.use(protect);
router.get("/me", getMyProgress);
router.put("/me", updateProgress);

module.exports = router;
