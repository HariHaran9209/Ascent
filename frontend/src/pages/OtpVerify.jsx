import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const RESEND_COOLDOWN = 30;

export default function OtpVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { startSession } = useAuth();
  const inputRef = useRef(null);

  const { purpose, identifier, username } = location.state || {};

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!purpose || !identifier) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = purpose === "register" ? "/auth/verify-registration" : "/auth/verify-login-otp";
      const payload =
        purpose === "register" ? { email: identifier, otp } : { username: identifier, otp };

      const { data } = await api.post(endpoint, payload);
      startSession(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't verify that code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    try {
      await api.post("/auth/resend-otp", { identifier, purpose });
      setInfo("A new code is on its way.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't resend the code");
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <p className="eyebrow">Ascent</p>
        <h1>Enter your code</h1>
        <p className="lede">
          We sent a 6-digit code to {purpose === "register" ? identifier : "your registered email"}
          {username ? ` for ${username}` : ""}.
        </p>

        {error && <div className="banner banner--error">{error}</div>}
        {info && <div className="banner banner--success">{info}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="otp">6-digit code</label>
            <input
              id="otp"
              ref={inputRef}
              className="otp-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              required
            />
          </div>
          <button className="btn btn--primary btn--block" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <p className="auth-foot">
          Didn't get it?{" "}
          <button onClick={handleResend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </p>
      </div>
    </div>
  );
}
