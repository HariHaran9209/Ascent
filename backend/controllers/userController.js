const User = require("../models/User");

function canView(targetUser, viewerId) {
  if (!viewerId) return targetUser.visibility === "public";
  if (targetUser._id.equals(viewerId)) return true;
  if (targetUser.visibility === "public") return true;
  return targetUser.followers.some((f) => f.equals(viewerId));
}

// GET /api/users/me
async function getMe(req, res) {
  res.status(200).json({ user: req.user.toPublicJSON() });
}

// PUT /api/users/me/visibility   body: { visibility: 'public' | 'followers' }
async function updateVisibility(req, res) {
  const { visibility } = req.body;
  if (!["public", "followers"].includes(visibility)) {
    return res.status(400).json({ message: "visibility must be 'public' or 'followers'" });
  }
  req.user.visibility = visibility;
  await req.user.save();
  res.status(200).json({ user: req.user.toPublicJSON() });
}

// GET /api/users/search?q=someName
async function searchUsers(req, res) {
  const q = (req.query.q || "").trim();
  if (q.length < 2) {
    return res.status(200).json({ users: [] });
  }

  const users = await User.find({
    isVerified: true,
    username: { $regex: q, $options: "i" },
    _id: { $ne: req.user._id },
  })
    .select("username displayName followers")
    .limit(15);

  const results = users.map((u) => ({
    id: u._id,
    username: u.username,
    displayName: u.displayName || u.username,
    isFollowing: u.followers.some((f) => f.equals(req.user._id)),
  }));

  res.status(200).json({ users: results });
}

// GET /api/users/discover  -> public profiles, most recently active first
async function discoverUsers(req, res) {
  const users = await User.find({
    isVerified: true,
    visibility: "public",
    _id: { $ne: req.user._id },
  })
    .select("username displayName progress followers")
    .limit(30);

  const withActivity = users.map((u) => {
    const lastUpdate = u.progress.reduce(
      (latest, p) => (p.updatedAt > latest ? p.updatedAt : latest),
      new Date(0)
    );
    return {
      id: u._id,
      username: u.username,
      displayName: u.displayName || u.username,
      progress: u.progress,
      isFollowing: u.followers.some((f) => f.equals(req.user._id)),
      lastUpdate,
    };
  });

  withActivity.sort((a, b) => b.lastUpdate - a.lastUpdate);
  res.status(200).json({ users: withActivity });
}

// GET /api/users/feed -> people the current user follows, with their progress
async function getFeed(req, res) {
  const users = await User.find({ _id: { $in: req.user.following } }).select(
    "username displayName progress"
  );

  const feed = users.map((u) => ({
    id: u._id,
    username: u.username,
    displayName: u.displayName || u.username,
    progress: u.progress,
  }));

  res.status(200).json({ feed });
}

// GET /api/users/:username
async function getUserProfile(req, res) {
  const target = await User.findOne({ username: req.params.username });
  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }

  const isSelf = target._id.equals(req.user._id);
  const isFollowing = target.followers.some((f) => f.equals(req.user._id));
  const visible = canView(target, req.user._id);

  const base = {
    id: target._id,
    username: target.username,
    displayName: target.displayName || target.username,
    visibility: target.visibility,
    followerCount: target.followers.length,
    followingCount: target.following.length,
    isSelf,
    isFollowing,
  };

  if (!visible) {
    return res.status(200).json({ user: { ...base, locked: true, progress: [] } });
  }

  res.status(200).json({ user: { ...base, locked: false, progress: target.progress } });
}

// POST /api/users/:username/follow
async function followUser(req, res) {
  if (req.params.username === req.user.username) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  const target = await User.findOne({ username: req.params.username });
  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!target.followers.some((f) => f.equals(req.user._id))) {
    target.followers.push(req.user._id);
    await target.save();
  }
  if (!req.user.following.some((f) => f.equals(target._id))) {
    req.user.following.push(target._id);
    await req.user.save();
  }

  res.status(200).json({ message: `Now following ${target.username}` });
}

// POST /api/users/:username/unfollow
async function unfollowUser(req, res) {
  const target = await User.findOne({ username: req.params.username });
  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }

  target.followers = target.followers.filter((f) => !f.equals(req.user._id));
  req.user.following = req.user.following.filter((f) => !f.equals(target._id));
  await target.save();
  await req.user.save();

  res.status(200).json({ message: `Unfollowed ${target.username}` });
}

module.exports = {
  getMe,
  updateVisibility,
  searchUsers,
  discoverUsers,
  getFeed,
  getUserProfile,
  followUser,
  unfollowUser,
};
