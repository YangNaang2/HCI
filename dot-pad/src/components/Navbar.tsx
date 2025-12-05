import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="navbar-logo" onClick={() => navigate("/")}>
        <span className="logo-dot">⠿</span> DotPad
      </div>
    </header>
  );
}
