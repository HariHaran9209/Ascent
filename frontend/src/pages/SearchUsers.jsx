import { useEffect, useState } from "react";
import api from "../api/axios";
import UserCard from "../components/UserCard";
import { buildCourseIndex, getLatestPosition } from "../utils/curriculum";

export default function SearchUsers() {
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [discoverResults, setDiscoverResults] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/curriculum").then(({ data }) => setStages(data.stages));
  }, []);

  useEffect(() => {
    if (tab !== "discover") return;
    setLoading(true);
    api
      .get("/users/discover")
      .then(({ data }) => setDiscoverResults(data.users))
      .catch(() => setError("Couldn't load discover"))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "search") return;
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .get("/users/search", { params: { q } })
        .then(({ data }) => setSearchResults(data.users))
        .catch(() => setError("Search failed"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, tab]);

  async function toggleFollow(user) {
    setBusyId(user.id);
    try {
      const action = user.isFollowing ? "unfollow" : "follow";
      await api.post(`/users/${user.username}/${action}`);
      const flip = (list) =>
        list.map((u) => (u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u));
      setSearchResults(flip);
      setDiscoverResults(flip);
    } catch {
      setError("Couldn't update that follow");
    } finally {
      setBusyId(null);
    }
  }

  const courseIndex = buildCourseIndex(stages);
  const discoverWithPosition = discoverResults.map((u) => ({
    ...u,
    position: getLatestPosition(u.progress, courseIndex),
  }));

  return (
    <div className="page">
      <p className="eyebrow">Find people</p>
      <h1>Other climbers</h1>

      <div className="tabs" style={{ marginTop: 20 }}>
        <button className={`tab ${tab === "discover" ? "is-active" : ""}`} onClick={() => setTab("discover")}>
          Discover
        </button>
        <button className={`tab ${tab === "search" ? "is-active" : ""}`} onClick={() => setTab("search")}>
          Search by username
        </button>
      </div>

      {error && <div className="banner banner--error">{error}</div>}

      {tab === "search" && (
        <div className="search-bar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username…"
            autoFocus
          />
        </div>
      )}

      {loading ? (
        <div className="spinner-row">Loading…</div>
      ) : tab === "discover" ? (
        discoverWithPosition.length === 0 ? (
          <div className="empty-state">
            <h3>No public climbers yet</h3>
            <p>People who set their progress to "visible to everyone" will show up here.</p>
          </div>
        ) : (
          <div className="list">
            {discoverWithPosition.map((u) => (
              <UserCard key={u.id} user={u} onToggleFollow={toggleFollow} busy={busyId === u.id} />
            ))}
          </div>
        )
      ) : query.trim().length < 2 ? (
        <div className="empty-state">
          <h3>Type at least 2 characters</h3>
          <p>Search for a classmate by their exact username.</p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="empty-state">
          <h3>No matches</h3>
          <p>Double-check the username and try again.</p>
        </div>
      ) : (
        <div className="list">
          {searchResults.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              onToggleFollow={toggleFollow}
              busy={busyId === u.id}
              showPosition={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
