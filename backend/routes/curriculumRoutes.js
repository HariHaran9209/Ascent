const express = require("express");
const { getCurriculum } = require("../controllers/curriculumController");

const router = express.Router();

router.get("/", getCurriculum);

module.exports = router;
