import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      navigate("/verify", { state: { purpose: "register", identifier: data.email, username: form.username } });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create your account, try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <p className="eyebrow">Ascent</p>
        <h1>Start your climb</h1>
        <p className="lede">Track your IITM BS progress, lecture by lecture, and let others follow along.</p>

        {error && <div className="banner banner--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={form.username}
              onChange={update("username")}
              placeholder="e.g. hariharan_99"
              pattern="^[a-zA-Z0-9_]{3,24}$"
              title="3-24 characters: letters, numbers, underscores"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
          <button className="btn btn--primary btn--block" disabled={loading}>
            {loading ? "Sending OTP…" : "Create account"}
          </button>
        </form>

        <p className="auth-foot">
          Already climbing? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
