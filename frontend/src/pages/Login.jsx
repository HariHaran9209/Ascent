import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/login", form);
      navigate("/verify", { state: { purpose: "login", identifier: form.username, username: form.username } });
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        navigate("/verify", { state: { purpose: "register", identifier: data.email, username: form.username } });
        return;
      }
      setError(data?.message || "Couldn't log you in, try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <p className="eyebrow">Ascent</p>
        <h1>Welcome back</h1>
        <p className="lede">Log in to update your progress or check on people you follow.</p>

        {error && <div className="banner banner--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" value={form.username} onChange={update("username")} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update("password")}
              required
            />
          </div>
          <button className="btn btn--primary btn--block" disabled={loading}>
            {loading ? "Checking…" : "Continue"}
          </button>
        </form>

        <p className="auth-foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
