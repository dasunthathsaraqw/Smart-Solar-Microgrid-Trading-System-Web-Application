// DashboardBackoffice.jsx — Backoffice dashboard shell with sidebar navigation.
// Each sidebar item just prints a placeholder message for now.
import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getUser } from "../utils/auth";

const NAV_ITEMS = [
  "Prosumer Management",
  "Station Management",
  "Reservation Management",
  "User Management",
];

export default function DashboardBackoffice() {
  const user = getUser();
  const [activeItem, setActiveItem] = useState(NAV_ITEMS[0]);

  return (
    <div className="flex min-h-screen flex-col bg-brand-white-soft">
      <Navbar title="Backoffice" />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col md:flex-row">
        <Sidebar items={NAV_ITEMS} activeItem={activeItem} onSelect={setActiveItem} />

        <main className="flex-1 px-6 py-10">
          <p className="mb-1 text-sm text-brand-muted">Welcome {user?.name}</p>
          <h2 className="text-2xl font-semibold text-brand-black">this is the {activeItem}</h2>
        </main>
      </div>

      <footer className="bg-brand-black py-4 text-center text-xs text-brand-white">
        Smart Solar Microgrid Trading System
      </footer>
    </div>
  );
}
