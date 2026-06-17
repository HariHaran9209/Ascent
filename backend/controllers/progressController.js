const { getCourseById } = require("../data/curriculum");

// GET /api/progress/me
async function getMyProgress(req, res) {
  res.status(200).json({ progress: req.user.progress });
}

// PUT /api/progress/me
// body: { courseId, currentLecture }
async function updateProgress(req, res) {
  try {
    const { courseId, currentLecture } = req.body;

    if (!courseId || typeof currentLecture !== "number") {
      return res.status(400).json({ message: "courseId and a numeric currentLecture are required" });
    }

    const course = getCourseById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Unknown courseId" });
    }
    if (currentLecture < 0 || currentLecture > course.totalLectures) {
      return res
        .status(400)
        .json({ message: `currentLecture must be between 0 and ${course.totalLectures}` });
    }

    const user = req.user;
    const existing = user.progress.find((p) => p.courseId === courseId);

    if (existing) {
      existing.currentLecture = currentLecture;
      existing.updatedAt = new Date();
    } else {
      user.progress.push({ courseId, currentLecture, updatedAt: new Date() });
    }

    await user.save();
    return res.status(200).json({ progress: user.progress });
  } catch (err) {
    console.error("updateProgress error:", err);
    return res.status(500).json({ message: "Something went wrong, please try again" });
  }
}

module.exports = { getMyProgress, updateProgress };
