// DashboardBackoffice.jsx — Backoffice dashboard shell with sidebar navigation.
// Each sidebar item just prints a placeholder message for now.
import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getUser } from "../utils/auth";
import ProsumersPage from "./prosumers/ProsumersPage";
import StationsPage from "./stations/StationsPage";
import SlotsPage from "./slots/SlotsPage";
import ReservationsPage from "./reservations/ReservationsPage";
import UsersPage from "./users/UsersPage";
import DashboardOverview from "./dashboard/DashboardOverview";
import ReportsPage from "./reports/ReportsPage";
import BookingHistoryContainer from "./booking-history/BookingHistoryContainer";

const NAV_ITEMS = [
  "Dashboard",
  "Prosumer Management",
  "Station Management",
  "Slot Management",
  "Reservation Management",
  "User Management",
  "Reports",
  "Booking History",
];

export default function DashboardBackoffice() {
  const user = getUser();
  const [activeItem, setActiveItem] = useState(NAV_ITEMS[0]);
  const [slotsStationId, setSlotsStationId] = useState(null);
  const [reservationStatus, setReservationStatus] = useState(null);
  const [prosumerTab, setProsumerTab] = useState("pending");

  function handleManageSlots(stationId) {
    setSlotsStationId(stationId);
    setActiveItem("Slot Management");
  }

  function handleNavigate(navItem, options = {}) {
    setReservationStatus(options.status || null);
    if (navItem === "Prosumer Management") setProsumerTab(options.prosumerTab || "pending");
    setActiveItem(navItem);
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-white-soft">
      <Navbar title="Backoffice" />

      <div className="flex w-full flex-1 flex-col md:flex-row">
        <Sidebar items={NAV_ITEMS} activeItem={activeItem} onSelect={setActiveItem} />

        <main className="flex-1 px-6 py-10 md:px-10">
          {activeItem === "Dashboard" ? (
            <DashboardOverview userName={user?.name} onNavigate={handleNavigate} />
          ) : activeItem === "Prosumer Management" ? (
            <ProsumersPage initialTab={prosumerTab} />
          ) : activeItem === "Station Management" ? (
            <StationsPage onManageSlots={handleManageSlots} />
          ) : activeItem === "Slot Management" ? (
            <SlotsPage initialStationId={slotsStationId} />
          ) : activeItem === "Reservation Management" ? (
            <ReservationsPage initialStatus={reservationStatus} />
          ) : activeItem === "User Management" ? (
            <UsersPage />
          ) : activeItem === "Reports" ? (
            <ReportsPage />
          ) : activeItem === "Booking History" ? (
            <BookingHistoryContainer />
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
