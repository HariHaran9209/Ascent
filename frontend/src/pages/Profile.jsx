import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import StageSection from "../components/StageSection";
import { buildProgressMap, getCurrentStageId } from "../utils/curriculum";

export default function Profile() {
  const { username } = useParams();
  const [stages, setStages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([api.get("/curriculum"), api.get(`/users/${username}`)])
      .then(([curriculumRes, profileRes]) => {
        setStages(curriculumRes.data.stages);
        setProfile(profileRes.data.user);
      })
      .catch((err) => setError(err.response?.data?.message || "Couldn't load that profile"))
      .finally(() => setLoading(false));
  }, [username]);

  async function toggleFollow() {
    if (!profile) return;
    setBusy(true);
    try {
      const action = profile.isFollowing ? "unfollow" : "follow";
      await api.post(`/users/${username}/${action}`);
      const { data } = await api.get(`/users/${username}`);
      setProfile(data.user);
    } catch {
      setError("Couldn't update that follow — try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="spinner-row">Loading profile…</div>;
  if (error) {
    return (
      <div className="page">
        <div className="banner banner--error">{error}</div>
      </div>
    );
  }
  if (!profile) return null;

  const progressMap = buildProgressMap(profile.progress);
  const currentStageId = stages.length ? getCurrentStageId(stages, progressMap) : null;

  return (
    <div className="page">
      <p className="eyebrow">Profile</p>
      <h1>{profile.displayName}</h1>
      <p className="subtitle">
        {profile.followerCount} followers · {profile.followingCount} following
      </p>

      {profile.isSelf ? (
        <div className="banner banner--success" style={{ marginTop: 16 }}>
          This is you — manage your own progress from <Link to="/dashboard">My climb</Link>.
        </div>
      ) : (
        <button
          className={`btn ${profile.isFollowing ? "btn--ghost" : "btn--primary"}`}
          style={{ marginTop: 16 }}
          onClick={toggleFollow}
          disabled={busy}
        >
          {profile.isFollowing ? "Following" : "Follow"}
        </button>
      )}

      {profile.locked ? (
        <div className="lock-note" style={{ marginTop: 24 }}>
          {profile.displayName}'s progress is only visible to their followers. Follow them to see their route up the mountain.
        </div>
      ) : (
        <div className="ascent">
          {stages.map((stage) => (
            <StageSection
              key={stage.id}
              stage={stage}
              progressMap={progressMap}
              isCurrent={stage.id === currentStageId}
              defaultOpen={stage.id === currentStageId}
              editable={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
