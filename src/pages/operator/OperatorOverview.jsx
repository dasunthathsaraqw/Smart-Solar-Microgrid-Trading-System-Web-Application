// OperatorOverview.jsx — live assigned-station workload for the Grid Operator landing tab.
// Counts and booking order come directly from /api/reports/operator-dashboard.
import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../../api/auth";
import { getOperatorDashboard } from "../../api/reports";
import { getStationById } from "../../api/stations";
import { getUser, updateSessionUser } from "../../utils/auth";
import KpiCard from "../dashboard/KpiCard";
import ReservationStatusBadge from "../reservations/ReservationStatusBadge";

const UNASSIGNED_ERROR = "Grid Operator is not assigned to a station.";

export default function OperatorOverview() {
  const [operator, setOperator] = useState(() => getUser());
  const [dashboard, setDashboard] = useState(null);
  const [station, setStation] = useState(null);
  const [stationError, setStationError] = useState("");
  const [error, setError] = useState("");
  const [isUnassigned, setIsUnassigned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setStationError("");
    setIsUnassigned(false);

    try {
      const currentUser = await getCurrentUser();
      updateSessionUser(currentUser);
      setOperator(currentUser);

      if (!currentUser.stationId) {
        setIsUnassigned(true);
        setDashboard(null);
        setStation(null);
        return;
      }

      setIsUnassigned(false);
      const [dashboardResult, stationResult] = await Promise.allSettled([
        getOperatorDashboard(),
        getStationById(currentUser.stationId),
      ]);

      if (dashboardResult.status === "rejected") {
        throw dashboardResult.reason;
      }

      setDashboard(dashboardResult.value);
      if (stationResult.status === "fulfilled") {
        setStation(stationResult.value);
      } else {
        setStation(null);
        setStationError(stationResult.reason?.message || "Station details are temporarily unavailable.");
      }
    } catch (err) {
      setDashboard(null);
      setStation(null);
      if (err.message === UNASSIGNED_ERROR) {
        setIsUnassigned(true);
      } else {
        setError(err.message || "Unable to load the operator overview. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refreshes persisted identity and live dashboard data on entry
    loadOverview();
  }, [loadOverview]);

  const upcoming = dashboard?.upcomingApproved ?? [];

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="operator-overview-heading">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-brand-muted">Welcome {operator?.name || "Operator"}</p>
          <h2 id="operator-overview-heading" className="text-2xl font-semibold text-brand-black">
            Operator Overview
          </h2>
          <p className="mt-1 text-sm text-brand-muted">Live workload for your assigned microgrid station</p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          disabled={isLoading}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <LoadingOverview />
      ) : isUnassigned ? (
        <div
          role="status"
          className="rounded-lg border-l-4 border-brand-green bg-brand-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-brand-black">No station assigned</h3>
          <p className="mt-2 text-sm text-brand-muted">
            Contact Backoffice to receive a station assignment before starting operational work.
          </p>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-brand-green bg-brand-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-brand-black">Overview unavailable</h3>
          <p className="mt-2 text-sm text-brand-muted">{error}</p>
          <button
            type="button"
            onClick={loadOverview}
            className="mt-4 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
          >
            Try again
          </button>
        </div>
      ) : dashboard ? (
        <>
          <AssignedStationCard
            stationId={operator?.stationId}
            station={station}
            stationError={stationError}
          />

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Pending Today" value={dashboard.pendingToday} />
            <KpiCard label="Approved Today" value={dashboard.approvedToday} variant="outline" />
            <KpiCard label="Completed Today" value={dashboard.completedToday} variant="solid" />
            <KpiCard label="Approved Future" value={dashboard.approvedFutureCount} />
          </div>

          <div className="rounded-lg border border-brand-border bg-brand-white shadow-sm">
            <div className="border-b border-brand-border px-4 py-4 sm:px-6">
              <h3 className="text-lg font-semibold text-brand-black">Upcoming Approved Bookings</h3>
              <p className="mt-1 text-sm text-brand-muted">
                Nearest approved transfers are shown first by the backend.
              </p>
            </div>
            <UpcomingBookings bookings={upcoming} />
          </div>
        </>
      ) : null}
    </section>
  );
}

// Displays the persisted assignment with optional station details from the existing station API.
function AssignedStationCard({ stationId, station, stationError }) {
  return (
    <div className="mb-6 rounded-lg border border-brand-green bg-brand-green-soft p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-green-dark">Assigned station</p>
          <h3 className="mt-1 text-lg font-semibold text-brand-black">
            {station?.stationName || "Station assignment active"}
          </h3>
          <p className="mt-1 break-all text-xs text-brand-muted">Station ID: {stationId}</p>
        </div>
        <span className="rounded-full border border-brand-green bg-brand-white px-3 py-1 text-xs font-medium text-brand-green-dark">
          Assigned
        </span>
      </div>

      {station ? (
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-brand-muted">Schedule</dt>
            <dd className="font-medium text-brand-black">{station.schedule}</dd>
          </div>
          <div>
            <dt className="text-brand-muted">Capacity</dt>
            <dd className="font-medium text-brand-black">{station.capacityKw} kW</dd>
          </div>
          <div>
            <dt className="text-brand-muted">Available slots</dt>
            <dd className="font-medium text-brand-black">{station.availableSlots}</dd>
          </div>
        </dl>
      ) : stationError ? (
        <p className="mt-3 text-sm text-brand-muted">{stationError}</p>
      ) : null}
    </div>
  );
}

// Renders backend-ordered upcoming reservations without recalculating operational metrics.
function UpcomingBookings({ bookings }) {
  if (bookings.length === 0) {
    return (
      <div className="px-4 py-10 text-center sm:px-6">
        <p className="font-medium text-brand-black">No upcoming approved bookings</p>
        <p className="mt-1 text-sm text-brand-muted">New approved reservations will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Upcoming approved bookings at the assigned station</caption>
        <thead className="bg-brand-white-soft text-brand-black">
          <tr>
            <th scope="col" className="px-4 py-3 sm:px-6">Prosumer</th>
            <th scope="col" className="px-4 py-3">Station</th>
            <th scope="col" className="px-4 py-3">Slot</th>
            <th scope="col" className="px-4 py-3">Capacity</th>
            <th scope="col" className="px-4 py-3 sm:pr-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t border-brand-border">
              <td className="px-4 py-3 sm:px-6">
                <span className="font-medium text-brand-black">{booking.prosumerName}</span>
                <span className="block text-xs text-brand-muted">{booking.prosumerNic}</span>
              </td>
              <td className="px-4 py-3 text-brand-black">{booking.stationName}</td>
              <td className="px-4 py-3 text-brand-black">{formatSlotTime(booking.slotStartTime)}</td>
              <td className="px-4 py-3 text-brand-black">{booking.capacityKw} kW</td>
              <td className="px-4 py-3 sm:pr-6">
                <ReservationStatusBadge status={booking.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Formats the server-provided slot timestamp for the browser's local timezone.
function formatSlotTime(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Provides an accessible loading state using the existing neutral card language.
function LoadingOverview() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading operator overview</span>
      <div className="h-32 animate-pulse rounded-lg border border-brand-border bg-brand-white" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-lg border border-brand-border bg-brand-white" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg border border-brand-border bg-brand-white" />
    </div>
  );
}
