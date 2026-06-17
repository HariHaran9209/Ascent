import { useEffect, useState } from "react";
import api from "../api/axios";
import UserCard from "../components/UserCard";
import { buildCourseIndex, getLatestPosition } from "../utils/curriculum";

export default function Feed() {
  const [stages, setStages] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/curriculum"), api.get("/users/feed")])
      .then(([curriculumRes, feedRes]) => {
        setStages(curriculumRes.data.stages);
        setFeed(feedRes.data.feed);
      })
      .catch(() => setError("Couldn't load your feed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-row">Loading feed…</div>;

  const courseIndex = buildCourseIndex(stages);
  const withPosition = feed.map((u) => ({ ...u, position: getLatestPosition(u.progress, courseIndex) }));

  return (
    <div className="page">
      <p className="eyebrow">Feed</p>
      <h1>People you follow</h1>
      <p className="subtitle">Their latest checkpoint on the climb.</p>

      {error && (
        <div className="banner banner--error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {withPosition.length === 0 ? (
        <div className="empty-state">
          <h3>No one here yet</h3>
          <p>Follow some classmates from Find people to see their progress show up here.</p>
        </div>
      ) : (
        <div className="list" style={{ marginTop: 20 }}>
          {withPosition.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
