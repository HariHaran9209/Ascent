import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const OPTIONS = [
  {
    value: "public",
    title: "Visible to everyone",
    description: "Anyone who opens your profile can see exactly where you are.",
  },
  {
    value: "followers",
    title: "Visible to your followers only",
    description: "Only accounts that follow you can see your progress. Everyone else sees a locked profile.",
  },
];

export default function Settings() {
  const { user, setUser } = useAuth();
  const [visibility, setVisibility] = useState(user?.visibility || "followers");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  async function handleSelect(value) {
    if (value === visibility) return;
    setVisibility(value);
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const { data } = await api.put("/users/me/visibility", { visibility: value });
      setUser((u) => (u ? { ...u, visibility: data.user.visibility } : u));
      setInfo("Saved.");
    } catch {
      setError("Couldn't save that — try again");
      setVisibility(user?.visibility || "followers");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <p className="eyebrow">Settings</p>
      <h1>Who can see your climb</h1>
      <p className="subtitle">Change this any time — it applies immediately.</p>

      {error && (
        <div className="banner banner--error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
      {info && !error && (
        <div className="banner banner--success" style={{ marginTop: 16 }}>
          {info}
        </div>
      )}

      <div className="visibility-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`visibility-card ${visibility === opt.value ? "is-selected" : ""}`}
            onClick={() => handleSelect(opt.value)}
            disabled={saving}
          >
            <h3>{opt.title}</h3>
            <p>{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
