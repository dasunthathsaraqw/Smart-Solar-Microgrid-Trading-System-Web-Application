// DashboardOperator.jsx — Grid Operator dashboard shell with overview and existing operations.
import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { OperatorProvider, useOperatorContext } from "./operator/OperatorContext";
import OperatorUnassignedState from "./operator/OperatorUnassignedState";
import ErrorState from "../components/ui/ErrorState";
import OperatorOverview from "./operator/OperatorOverview";
import OperatorSlotManagement from "./operator/OperatorSlotManagement";
import OperatorStationView from "./operator/OperatorStationView";
import OperatorTransactionHistory from "./operator/OperatorTransactionHistory";
import OperatorTransferMonitor from "./operator/OperatorTransferMonitor";

const NAV_ITEMS = ["Overview", "Transfer Monitor", "Update Slots", "Transaction History", "Station View"];

export default function DashboardOperator() {
  const [activeItem, setActiveItem] = useState(NAV_ITEMS[0]);

  return (
    <OperatorProvider>
      <div className="flex min-h-screen flex-col bg-brand-white-soft">
        <Navbar title="Grid Operator" />

        <div className="flex w-full flex-1 flex-col md:flex-row">
          <Sidebar items={NAV_ITEMS} activeItem={activeItem} onSelect={setActiveItem} />

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-10">
            <OperatorPageGate>
              {activeItem === "Overview" ? (
                <OperatorOverview />
              ) : activeItem === "Transfer Monitor" ? (
                <OperatorTransferMonitor />
              ) : activeItem === "Update Slots" ? (
                <OperatorSlotManagement />
              ) : activeItem === "Transaction History" ? (
                <OperatorTransactionHistory />
              ) : activeItem === "Station View" ? (
                <OperatorStationView />
              ) : <OperatorOverview />}
            </OperatorPageGate>
          </main>
        </div>

        <footer className="bg-brand-black py-4 text-center text-xs text-brand-white">
          Smart Solar Microgrid Trading System
        </footer>
      </div>
    </OperatorProvider>
  );
}

// Uses the latest /auth/me station context to guard every operator section consistently.
function OperatorPageGate({ children }) {
  const { isLoading, isUnassigned, error, stationError, stationErrorStatus, refreshOperatorContext } = useOperatorContext();

  if (isLoading) return <p role="status" className="text-brand-muted">Loading operator context...</p>;
  if (error || stationErrorStatus === 403 || stationErrorStatus === 404) {
    return (
      <div className="rounded-lg border border-brand-border bg-brand-white p-6">
        <ErrorState message={error || stationError} onRetry={refreshOperatorContext} retryLabel="Refresh assignment" />
      </div>
    );
  }
  if (isUnassigned) return <OperatorUnassignedState onRefresh={refreshOperatorContext} />;
  return children;
}
