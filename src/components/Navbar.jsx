// Navbar.jsx — black top navbar with a green accent line, shared by both dashboards.
import { useNavigate } from "react-router-dom";
import { clearSession } from "../utils/auth";

export default function Navbar({ title }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <header className="bg-brand-black border-b-4 border-brand-green">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <h1 className="text-lg font-semibold text-brand-white">
          Smart Solar Microgrid — {title}
        </h1>
        <button
          onClick={handleLogout}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
