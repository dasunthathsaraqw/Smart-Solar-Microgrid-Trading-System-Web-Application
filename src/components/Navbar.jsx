// Navbar.jsx — shared dashboard navbar with a live API health indicator.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHealth } from "../api/health";
import { clearSession } from "../utils/auth";

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    // Health is informational: failed checks update the dot without blocking navigation.
    async function refreshHealth() {
      try {
        const health = await getHealth();
        if (active) setApiStatus(health.status === "ok" ? "online" : "offline");
      } catch {
        if (active) setApiStatus("offline");
      }
    }

    refreshHealth();
    const interval = window.setInterval(refreshHealth, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  // Clears the current session and returns to the login page.
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
        <div className="flex items-center gap-4">
          <span
            role="status"
            aria-label={`API ${apiStatus}`}
            title={`API ${apiStatus}`}
            className="inline-flex items-center gap-2 text-xs text-brand-white"
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                apiStatus === "online"
                  ? "bg-brand-green"
                  : apiStatus === "offline"
                    ? "bg-red-500"
                    : "bg-yellow-400"
              }`}
            />
            <span className="hidden sm:inline">API {apiStatus}</span>
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
