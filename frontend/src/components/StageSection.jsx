import { useState } from "react";

function CourseRow({ course, currentLecture, editable, onChange }) {
  const total = course.totalLectures;
  const value = currentLecture ?? 0;
  const isDone = value >= total;

  function step(delta) {
    const next = Math.min(total, Math.max(0, value + delta));
    if (next !== value) onChange(course.id, next);
  }

  return (
    <div className="course-row">
      <div className="course-row__top">
        <span className="course-row__name">{course.name}</span>
        <span className={`course-row__count mono ${isDone ? "is-done" : ""}`}>
          {String(value).padStart(2, "0")} / {String(total).padStart(2, "0")}
          {isDone ? " ✓" : ""}
        </span>
      </div>

      <div className="ticks">
        {Array.from({ length: total }, (_, i) => {
          const lectureNum = i + 1;
          const filled = lectureNum <= value;
          return (
            <div
              key={i}
              className={`tick ${filled ? (isDone ? "is-done" : "is-filled") : ""}`}
              title={`Lecture ${lectureNum}`}
            />
          );
        })}
      </div>

      {editable && (
        <div className="course-row__controls">
          <button className="stepper-btn" onClick={() => step(-1)} disabled={value <= 0} aria-label="Previous lecture">
            −
          </button>
          <span className="mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Lecture {value} of {total}
          </span>
          <button className="stepper-btn" onClick={() => step(1)} disabled={value >= total} aria-label="Next lecture">
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default function StageSection({
  stage,
  progressMap,
  isCurrent,
  defaultOpen = false,
  editable = false,
  onChangeLecture,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const isComplete = stage.courses.every(
    (c) => (progressMap[c.id] ?? 0) >= c.totalLectures
  );

  return (
    <div
      className={`ascent__stage ${isComplete ? "is-complete" : ""} ${
        isCurrent ? "is-current" : ""
      }`}
    >
      <div className="ascent__node">
        <span className="ascent__node-dot" />
      </div>

      <div className="ascent__head" onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="ascent__title">
            {stage.name}
            {isCurrent && <span className="ascent__youmark">You're here</span>}
          </div>
          <div className="ascent__tagline">{stage.tagline}</div>
        </div>
        <span className="ascent__caret">{open ? "−" : "+"}</span>
      </div>

      {open && (
        <div className="ascent__courses">
          {stage.courses.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              currentLecture={progressMap[course.id] ?? 0}
              editable={editable}
              onChange={onChangeLecture}
            />
          ))}
        </div>
      )}
    </div>
  );
}
