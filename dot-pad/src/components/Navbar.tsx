import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-logo" onClick={() => navigate("/")}>
        <span className="logo-dot">⠿</span> DotPad
      </div>

      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        ☰
      </button>

      <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <NavLink
          to="/test"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={() => setMenuOpen(false)}
        >
          Test
        </NavLink>

        <NavLink
          to="/dictionary"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={() => setMenuOpen(false)}
        >
          Dictionary
        </NavLink>
      </nav>
    </header>
  );
}
