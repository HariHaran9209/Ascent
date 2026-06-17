/**
 * Preset curriculum structure for the IITM BS Data Science & Applications program.
 *
 * This is the "already designed and presetted" tree students pick from —
 * they never type a course name, they just select where they are in it.
 *
 * IMPORTANT: The institute revises course lists and lecture counts most
 * cohorts. The structure below reflects the commonly known program shape
 * (Qualifier -> Foundation -> Diploma -> Degree) but you should cross-check
 * course names and `totalLectures` against the current official handbook
 * for your batch before going live, and update this file accordingly.
 * Everything downstream (API, UI) reads from this single file, so this is
 * the only place you need to edit to correct or extend the curriculum.
 */

const CURRICULUM = [
  {
    id: "qualifier",
    name: "Qualifier",
    tagline: "Basecamp — the entry climb everyone starts on",
    courses: [
      { id: "qual-eng1", name: "English I", totalLectures: 10 },
      { id: "qual-math1", name: "Mathematics I", totalLectures: 10 },
      { id: "qual-stats1", name: "Statistics I", totalLectures: 10 },
      { id: "qual-ct", name: "Computational Thinking", totalLectures: 10 },
    ],
  },
  {
    id: "foundation",
    name: "Foundation",
    tagline: "Camp I — the broad base before specialising",
    courses: [
      { id: "fnd-math1", name: "Mathematics for Data Science I", totalLectures: 12 },
      { id: "fnd-stats1", name: "Statistics for Data Science I", totalLectures: 12 },
      { id: "fnd-ct", name: "Computational Thinking", totalLectures: 12 },
      { id: "fnd-eng1", name: "English I", totalLectures: 10 },
      { id: "fnd-math2", name: "Mathematics for Data Science II", totalLectures: 12 },
      { id: "fnd-stats2", name: "Statistics for Data Science II", totalLectures: 12 },
      { id: "fnd-py", name: "Programming in Python", totalLectures: 12 },
      { id: "fnd-eng2", name: "English II", totalLectures: 10 },
    ],
  },
  {
    id: "diploma",
    name: "Diploma",
    tagline: "Camp II — programming and data science tracks",
    courses: [
      { id: "dip-dbms", name: "Database Management Systems", totalLectures: 12 },
      { id: "dip-pdsa", name: "Programming, Data Structures and Algorithms", totalLectures: 12 },
      { id: "dip-mad1", name: "Modern Application Development I", totalLectures: 12 },
      { id: "dip-mad2", name: "Modern Application Development II", totalLectures: 12 },
      { id: "dip-java", name: "Java Programming", totalLectures: 10 },
      { id: "dip-sysc", name: "System Commands", totalLectures: 8 },
      { id: "dip-bdm", name: "Business Data Management", totalLectures: 12 },
      { id: "dip-mlf", name: "Machine Learning Foundations", totalLectures: 12 },
      { id: "dip-mlt", name: "Machine Learning Techniques", totalLectures: 12 },
      { id: "dip-mlp", name: "Machine Learning Practice", totalLectures: 12 },
      { id: "dip-ba", name: "Business Analytics", totalLectures: 12 },
      { id: "dip-tds", name: "Tools in Data Science", totalLectures: 10 },
    ],
  },
  {
    id: "degree",
    name: "Degree (BS)",
    tagline: "Summit — electives, projects and specialisation",
    courses: [
      { id: "deg-se", name: "Software Engineering", totalLectures: 12 },
      { id: "deg-sep", name: "Software Engineering Practice", totalLectures: 10 },
      { id: "deg-ai", name: "AI: Search Methods for Problem Solving", totalLectures: 12 },
      { id: "deg-dl", name: "Deep Learning", totalLectures: 12 },
      { id: "deg-spg", name: "Strategies for Professional Growth", totalLectures: 8 },
      { id: "deg-proj", name: "BSc Final Project", totalLectures: 12 },
    ],
  },
];

/** Flat lookup map: courseId -> { ...course, stageId, stageName } */
function buildCourseIndex() {
  const index = {};
  for (const stage of CURRICULUM) {
    for (const course of stage.courses) {
      index[course.id] = { ...course, stageId: stage.id, stageName: stage.name };
    }
  }
  return index;
}

const COURSE_INDEX = buildCourseIndex();

function getCourseById(courseId) {
  return COURSE_INDEX[courseId] || null;
}

function getStageById(stageId) {
  return CURRICULUM.find((s) => s.id === stageId) || null;
}

module.exports = { CURRICULUM, COURSE_INDEX, getCourseById, getStageById };
