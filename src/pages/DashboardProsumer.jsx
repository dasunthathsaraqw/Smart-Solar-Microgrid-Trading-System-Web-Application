import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getUser } from "../utils/auth";
import BookingHistoryContainer from "./booking-history/BookingHistoryContainer";

const NAV_ITEMS = ["Booking History"];

export default function DashboardProsumer() {
  const user = getUser();
  const [activeItem, setActiveItem] = useState(NAV_ITEMS[0]);

  return (
    <div className="flex min-h-screen flex-col bg-brand-white-soft">
      <Navbar user={user} />
      <div className="flex flex-1">
        <Sidebar
          items={NAV_ITEMS}
          activeItem={activeItem}
          onSelect={setActiveItem}
          role={user?.role}
        />
        <main className="flex-1 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-black">Prosumer Portal</h1>
              <p className="mt-1 text-sm text-brand-muted">
                Welcome, {user?.name}.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-brand-white shadow-sm ring-1 ring-brand-border">
            {activeItem === "Booking History" ? (
              <div className="p-6">
                <BookingHistoryContainer />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center p-6">
                <p className="text-brand-muted">This module is not yet implemented.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
