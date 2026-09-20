// Login.jsx — email/password login form. Redirects by role on success.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { saveSession, dashboardPathForRole } from "../utils/auth";
import loginImage from "../assets/img/login-screen-image-v2.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      saveSession(result);
      navigate(dashboardPathForRole(result.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-white-soft">
      <div className="hidden flex-1 items-center justify-center bg-brand-white p-10 md:flex">
        <img
          src={loginImage}
          alt="Smart Solar Microgrid — solar panels feeding a home battery"
          className="max-h-[80vh] w-auto"
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-lg border border-brand-border bg-brand-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-semibold text-brand-black">Login</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            </div>

            {error && (
              <p className="border-b-2 border-brand-green pb-1 text-sm text-brand-black">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-brand-green px-4 py-2 font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-brand-muted">
            Need an account?{" "}
            <Link
              to="/create-account"
              className="font-medium text-brand-green hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
