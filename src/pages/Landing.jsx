// Landing.jsx — public introduction to microgrid trading and its three roles.
// Auto-redirects to the correct dashboard if a valid session already exists.
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, getRole, dashboardPathForRole } from "../utils/auth";

// Introduces the service and sends web users to the existing role-aware login.
export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate(dashboardPathForRole(getRole()), { replace: true });
    }
  }, [navigate]);

  return (
    <main className="min-h-screen bg-brand-white-soft text-brand-black">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border pb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-xl font-bold text-brand-white">S</span>
            <span className="text-lg font-semibold">Smart Solar Microgrid</span>
          </div>
          <Link to="/login" className="rounded-md border border-brand-green px-4 py-2 text-sm font-semibold text-brand-green-dark hover:bg-brand-green-soft">Log in</Link>
        </header>

        <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green-dark">Solar energy, shared locally</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Coordinate energy trading across your microgrid.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-muted">Manage stations, reserve energy slots, and oversee transfers through one connected system for communities that generate and share solar power.</p>
            <Link to="/login" className="mt-8 inline-flex rounded-md bg-brand-green px-6 py-3 font-semibold text-brand-white hover:bg-brand-green-dark">Log in to the web portal</Link>
          </div>
          <div className="rounded-2xl bg-brand-black p-7 text-brand-white shadow-lg sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">How it works</p>
            <ol className="mt-6 space-y-6">
              <li><strong className="block text-lg">1. Connect stations</strong><span className="mt-1 block text-sm text-brand-white/75">Backoffice maintains solar stations and available energy slots.</span></li>
              <li><strong className="block text-lg">2. Reserve energy</strong><span className="mt-1 block text-sm text-brand-white/75">Prosumers use the mobile app to find stations and manage bookings.</span></li>
              <li><strong className="block text-lg">3. Complete transfers</strong><span className="mt-1 block text-sm text-brand-white/75">Grid Operators oversee activity at their assigned station.</span></li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="roles-heading" className="border-t border-brand-border py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-green-dark">Who uses the system</p>
          <h2 id="roles-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">A clear workspace for each role</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-brand-border bg-brand-white p-6"><h3 className="text-xl font-semibold">Backoffice</h3><p className="mt-3 text-sm leading-relaxed text-brand-muted">Approve prosumers, manage stations and slots, handle reservations, and review reports through the web portal.</p></article>
            <article className="rounded-xl border border-brand-border bg-brand-white p-6"><h3 className="text-xl font-semibold">Grid Operator</h3><p className="mt-3 text-sm leading-relaxed text-brand-muted">Monitor transfers, update slots, and view the assigned station through the web portal.</p></article>
            <article className="rounded-xl border border-brand-border bg-brand-white p-6"><h3 className="text-xl font-semibold">Prosumer</h3><p className="mt-3 text-sm leading-relaxed text-brand-muted">Discover stations, book energy, and manage reservations in the mobile app.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
