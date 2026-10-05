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
      <header className="border-b-4 border-brand-green bg-brand-black">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green text-xl font-bold text-brand-black">S</span>
            <span className="text-base font-bold tracking-tight text-brand-white sm:text-lg">Smart Solar Microgrid</span>
          </div>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-soft focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black"
          >
            Log in
          </Link>
        </div>
      </header>

      <section aria-labelledby="landing-heading" className="relative overflow-hidden border-b border-brand-border bg-brand-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-40 h-96 w-96 rounded-full bg-brand-green-soft sm:-right-12" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black sm:text-sm">Solar energy, shared locally</p>
            <h1 id="landing-heading" className="mt-4 max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Coordinate energy trading across your microgrid.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
              Manage stations, reserve energy slots, and oversee transfers through one connected system for communities that generate and share solar power.
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-md bg-brand-green px-6 py-3 text-center font-semibold text-brand-black shadow-sm transition-colors hover:bg-brand-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-dark focus-visible:ring-offset-2"
            >
              Log in to the web portal
            </Link>
          </div>

          <div aria-hidden="true" className="relative mx-auto w-full max-w-lg rounded-lg border border-brand-border border-t-4 border-t-brand-green bg-brand-white p-4 shadow-sm sm:p-6">
            <div className="-mx-4 -mt-4 flex items-center justify-between gap-4 rounded-t-lg border-b border-brand-border bg-brand-green-soft px-4 py-4 sm:-mx-6 sm:-mt-6 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-black">Microgrid overview</p>
                <p className="mt-1 text-lg font-semibold">From solar to transfer</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-green bg-brand-white">
                <div className="h-4 w-4 rounded-full bg-brand-green" />
              </div>
            </div>
            <div className="relative mt-4 space-y-2.5 before:absolute before:bottom-6 before:left-[26px] before:top-6 before:w-px before:bg-brand-green sm:mt-5 sm:space-y-3 sm:before:left-8">
              <div className="relative flex items-center gap-3 rounded-lg border border-brand-border bg-brand-white p-2.5 shadow-sm sm:gap-4 sm:p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green-soft text-xs font-bold text-brand-black ring-4 ring-brand-white sm:h-10 sm:w-10">01</span>
                <span className="text-sm font-semibold sm:text-base">Solar / Station</span>
                <span className="ml-auto text-brand-green-dark">→</span>
              </div>
              <div className="relative flex items-center gap-3 rounded-lg border border-brand-border bg-brand-white p-2.5 shadow-sm sm:gap-4 sm:p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green-soft text-xs font-bold text-brand-black ring-4 ring-brand-white sm:h-10 sm:w-10">02</span>
                <span className="text-sm font-semibold sm:text-base">Energy Slot</span>
                <span className="ml-auto text-brand-green-dark">→</span>
              </div>
              <div className="relative flex items-center gap-3 rounded-lg border border-brand-border bg-brand-white p-2.5 shadow-sm sm:gap-4 sm:p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green-soft text-xs font-bold text-brand-black ring-4 ring-brand-white sm:h-10 sm:w-10">03</span>
                <span className="text-sm font-semibold sm:text-base">Reservation</span>
                <span className="ml-auto text-brand-green-dark">→</span>
              </div>
              <div className="relative flex items-center gap-3 rounded-lg border border-brand-border bg-brand-white p-2.5 shadow-sm sm:gap-4 sm:p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green-soft text-xs font-bold text-brand-black ring-4 ring-brand-white sm:h-10 sm:w-10">04</span>
                <span className="text-sm font-semibold sm:text-base">Transfer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="bg-brand-white-soft py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black sm:text-sm">The process</p>
          <h2 id="how-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
          <div className="relative mt-7">
            <div aria-hidden="true" className="pointer-events-none absolute left-8 right-8 top-8 hidden h-px bg-brand-green-soft md:block" />
            <ol className="grid gap-5 md:grid-cols-3 md:gap-6">
              <li className="relative flex h-full flex-col rounded-lg border border-brand-border border-l-4 border-l-brand-green bg-brand-white p-5 shadow-sm sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-green bg-brand-green-soft text-sm font-bold text-brand-black">01</span>
                <h3 className="mt-5 text-lg font-semibold">Connect stations</h3>
                <p className="mt-2 text-base leading-relaxed text-brand-muted">Backoffice maintains solar stations and available energy slots.</p>
              </li>
              <li className="relative flex h-full flex-col rounded-lg border border-brand-border border-l-4 border-l-brand-green bg-brand-white p-5 shadow-sm sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-green bg-brand-green-soft text-sm font-bold text-brand-black">02</span>
                <h3 className="mt-5 text-lg font-semibold">Reserve energy</h3>
                <p className="mt-2 text-base leading-relaxed text-brand-muted">Prosumers use the mobile app to find stations and manage bookings.</p>
              </li>
              <li className="relative flex h-full flex-col rounded-lg border border-brand-border border-l-4 border-l-brand-green bg-brand-white p-5 shadow-sm sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-green bg-brand-green-soft text-sm font-bold text-brand-black">03</span>
                <h3 className="mt-5 text-lg font-semibold">Complete transfers</h3>
                <p className="mt-2 text-base leading-relaxed text-brand-muted">Grid Operators oversee activity at their assigned station.</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section aria-labelledby="roles-heading" className="border-t border-brand-border bg-brand-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-black sm:text-sm">Who uses the system</p>
          <h2 id="roles-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">A clear workspace for each role</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3 md:gap-6">
            <article className="h-full rounded-lg border border-brand-border border-l-4 border-l-brand-green bg-brand-white p-6 shadow-sm sm:p-7">
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green-soft text-lg font-bold text-brand-black">B</span>
              <h3 className="mt-5 text-xl font-bold sm:text-[1.375rem]">Backoffice</h3>
              <p className="mt-3 text-base leading-relaxed text-brand-muted">Approve prosumers, manage stations and slots, handle reservations, and review reports through the web portal.</p>
            </article>
            <article className="h-full rounded-lg border border-brand-border border-l-4 border-l-brand-green bg-brand-white p-6 shadow-sm sm:p-7">
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green-soft text-lg font-bold text-brand-black">G</span>
              <h3 className="mt-5 text-xl font-bold sm:text-[1.375rem]">Grid Operator</h3>
              <p className="mt-3 text-base leading-relaxed text-brand-muted">Monitor transfers, update slots, and view the assigned station through the web portal.</p>
            </article>
            <article className="h-full rounded-lg border border-brand-border border-l-4 border-l-brand-green bg-brand-white p-6 shadow-sm sm:p-7">
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green-soft text-lg font-bold text-brand-black">P</span>
              <h3 className="mt-5 text-xl font-bold sm:text-[1.375rem]">Prosumer</h3>
              <p className="mt-3 text-base leading-relaxed text-brand-muted">Discover stations, book energy, and manage reservations in the mobile app.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="bg-brand-black text-brand-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-7 sm:px-6 sm:py-8 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="font-semibold">Smart Solar Microgrid</p>
          <p className="text-sm text-brand-white/75">Local energy coordination, simplified.</p>
        </div>
      </footer>
    </main>
  );
}
