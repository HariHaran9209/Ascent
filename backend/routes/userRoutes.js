const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMe,
  updateVisibility,
  searchUsers,
  discoverUsers,
  getFeed,
  getUserProfile,
  followUser,
  unfollowUser,
} = require("../controllers/userController");

const router = express.Router();

router.use(protect);

// Static routes first so they don't get swallowed by /:username
router.get("/me", getMe);
router.put("/me/visibility", updateVisibility);
router.get("/search", searchUsers);
router.get("/discover", discoverUsers);
router.get("/feed", getFeed);

router.get("/:username", getUserProfile);
router.post("/:username/follow", followUser);
router.post("/:username/unfollow", unfollowUser);

module.exports = router;
