// Landing.jsx — landing page with Login / Create Account entry points.
// Auto-redirects to the correct dashboard if a valid session already exists.
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, getRole, dashboardPathForRole } from "../utils/auth";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate(dashboardPathForRole(getRole()), { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-white-soft px-4">
      <h1 className="mb-2 text-3xl font-bold text-brand-black">Smart Solar Microgrid</h1>
      <p className="mb-8 text-brand-muted">Trading System — Backoffice &amp; Grid Operator Portal</p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="rounded-md bg-brand-green px-6 py-3 font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          Login
        </Link>
        <Link
          to="/create-account"
          className="rounded-md border border-brand-green px-6 py-3 font-medium text-brand-green transition-colors hover:bg-brand-green-soft"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
