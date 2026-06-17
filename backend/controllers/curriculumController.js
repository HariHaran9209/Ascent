const { CURRICULUM } = require("../data/curriculum");

// GET /api/curriculum
function getCurriculum(req, res) {
  res.status(200).json({ stages: CURRICULUM });
}

module.exports = { getCurriculum };
