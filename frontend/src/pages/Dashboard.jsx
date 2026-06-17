import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StageSection from "../components/StageSection";
import { buildProgressMap, getCurrentStageId } from "../utils/curriculum";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [stages, setStages] = useState([]);
  const [progress, setProgress] = useState(user?.progress || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/curriculum")
      .then(({ data }) => setStages(data.stages))
      .catch(() => setError("Couldn't load the curriculum"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setProgress(user?.progress || []);
  }, [user]);

  const progressMap = buildProgressMap(progress);
  const currentStageId = stages.length ? getCurrentStageId(stages, progressMap) : null;

  async function handleChangeLecture(courseId, currentLecture) {
    setProgress((prev) => {
      const next = prev.filter((p) => p.courseId !== courseId);
      next.push({ courseId, currentLecture, updatedAt: new Date().toISOString() });
      return next;
    });

    try {
      const { data } = await api.put("/progress/me", { courseId, currentLecture });
      setProgress(data.progress);
      setUser((u) => (u ? { ...u, progress: data.progress } : u));
    } catch {
      setError("Couldn't save that update — try again");
    }
  }

  if (loading) {
    return <div className="spinner-row">Loading your climb…</div>;
  }

  return (
    <div className="page">
      <p className="eyebrow">Your climb</p>
      <h1>Hey {user?.displayName || user?.username}</h1>
      <p className="subtitle">Tap a stage to open it, then set where you are in each course.</p>

      {error && (
        <div className="banner banner--error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      <div className="ascent">
        {stages.map((stage) => (
          <StageSection
            key={stage.id}
            stage={stage}
            progressMap={progressMap}
            isCurrent={stage.id === currentStageId}
            defaultOpen={stage.id === currentStageId}
            editable
            onChangeLecture={handleChangeLecture}
          />
        ))}
      </div>
    </div>
  );
}
