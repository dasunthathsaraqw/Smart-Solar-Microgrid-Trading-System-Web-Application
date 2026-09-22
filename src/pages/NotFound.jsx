// NotFound.jsx — useful fallback for unknown application routes.
// Author: M.K.E Dharmarathne it23142732
import { Link } from "react-router-dom";

// Directs visitors from an unknown URL back to the public landing page.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-white-soft px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-green-dark">404</p>
      <h1 className="mt-2 text-3xl font-bold text-brand-black">Page not found</h1>
      <p className="mt-3 max-w-md text-brand-muted">The page you requested does not exist or its address has changed.</p>
      <Link to="/" className="mt-6 rounded-md bg-brand-green px-5 py-2.5 font-medium text-brand-white hover:bg-brand-green-dark">Go to home</Link>
    </main>
  );
}
