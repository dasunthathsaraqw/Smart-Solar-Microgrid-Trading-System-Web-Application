// DashboardOperator.jsx — Grid Operator dashboard shell with sidebar navigation.
// "Monitor Bookings" and "Update Slots" render the real reservation/slot features
// (the backend already authorizes GridOperator on both); "Station View" is still a
// placeholder pending Stage 6's operator-specific station actions.
import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getUser } from "../utils/auth";
import ReservationsPage from "./reservations/ReservationsPage";
import SlotsPage from "./slots/SlotsPage";

const NAV_ITEMS = ["Monitor Bookings", "Update Slots", "Station View"];

export default function DashboardOperator() {
  const user = getUser();
  const [activeItem, setActiveItem] = useState(NAV_ITEMS[0]);

  return (
    <div className="flex min-h-screen flex-col bg-brand-white-soft">
      <Navbar title="Grid Operator" />

      <div className="flex w-full flex-1 flex-col md:flex-row">
        <Sidebar items={NAV_ITEMS} activeItem={activeItem} onSelect={setActiveItem} />

        <main className="flex-1 px-6 py-10 md:px-10">
          {activeItem === "Monitor Bookings" ? (
            <ReservationsPage />
          ) : activeItem === "Update Slots" ? (
            <SlotsPage />
          ) : (
            <>
              <p className="mb-1 text-sm text-brand-muted">Welcome {user?.name}</p>
              <h2 className="text-2xl font-semibold text-brand-black">this is the {activeItem}</h2>
            </>
          )}
        </main>
      </div>

      <footer className="bg-brand-black py-4 text-center text-xs text-brand-white">
        Smart Solar Microgrid Trading System
      </footer>
    </div>
  );
}
