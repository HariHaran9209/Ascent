export function buildCourseIndex(stages) {
  const index = {};
  for (const stage of stages) {
    for (const course of stage.courses) {
      index[course.id] = { ...course, stageId: stage.id, stageName: stage.name };
    }
  }
  return index;
}

export function buildProgressMap(progress) {
  const map = {};
  for (const p of progress || []) {
    map[p.courseId] = p.currentLecture;
  }
  return map;
}

export function isStageComplete(stage, progressMap) {
  return stage.courses.every((c) => (progressMap[c.id] ?? 0) >= c.totalLectures);
}

/** The first not-yet-finished stage, in curriculum order — "where you are right now". */
export function getCurrentStageId(stages, progressMap) {
  for (const stage of stages) {
    if (!isStageComplete(stage, progressMap)) return stage.id;
  }
  return stages[stages.length - 1]?.id ?? null;
}

/** Most recently touched course, used for compact summaries on cards. */
export function getLatestPosition(progress, courseIndex) {
  if (!progress || progress.length === 0) return null;
  const sorted = [...progress].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
  const latest = sorted[0];
  const course = courseIndex[latest.courseId];
  if (!course) return null;
  return {
    stageName: course.stageName,
    courseName: course.name,
    currentLecture: latest.currentLecture,
    totalLectures: course.totalLectures,
  };
}
