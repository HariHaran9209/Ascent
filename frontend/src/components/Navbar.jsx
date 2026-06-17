import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <span className="dot" />
          Ascent
        </div>
        {user && (
          <nav className="navbar__links">
            <NavLink to="/dashboard" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
              My climb
            </NavLink>
            <NavLink to="/feed" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
              Feed
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
              Find people
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
              Settings
            </NavLink>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
