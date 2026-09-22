// ReservationsList.jsx — reservation table with status/station filters, a client-side search
// box, a total count, and status-aware row actions. Defaults to the Pending status filter.
import { useCallback, useEffect, useState } from "react";
import { getStations } from "../../api/stations";
import { approveReservation, cancelReservation, completeReservation, getReservations } from "../../api/reservations";
import { useConfirm } from "../../components/confirmContext";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import ReservationStatusBadge from "./ReservationStatusBadge";

const STATUS_OPTIONS = ["Pending", "Approved", "Completed", "Cancelled", "All"];

const RESERVATION_COLUMNS = [
  { key: "prosumer", header: "Prosumer", render: (reservation) => <>{reservation.prosumerName}<div className="text-xs text-brand-muted">{reservation.prosumerNic}</div></> },
  { key: "stationName", header: "Station" },
  { key: "slotDate", header: "Slot Date", render: (reservation) => new Date(reservation.slotStartTime).toLocaleDateString() },
  { key: "slotTime", header: "Slot Time", render: (reservation) => <>{new Date(reservation.slotStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(reservation.slotEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</> },
  { key: "capacityKw", header: "Capacity (kW)" },
  { key: "status", header: "Status", render: (reservation) => <ReservationStatusBadge status={reservation.status} /> },
];

export default function ReservationsList({ initialStatus, onAdd, onView, onViewQr, onNotify }) {
  const confirm = useConfirm();
  const [stations, setStations] = useState([]);
  const [status, setStatus] = useState(initialStatus || "Pending");
  const [stationId, setStationId] = useState("");
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getStations("active")
      .then(setStations)
      .catch((err) => onNotify(err.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReservations = useCallback(
    async (statusFilter, stationFilter) => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await getReservations({
          status: statusFilter === "All" ? undefined : statusFilter,
          stationId: stationFilter || undefined,
        });
        setReservations(data);
      } catch (err) {
        setLoadError(err.message);
        setReservations([]);
        onNotify(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [onNotify]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change; loading flag is set before the request
    loadReservations(status, stationId);
  }, [status, stationId, loadReservations]);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? reservations.filter(
        (r) => r.prosumerNic.toLowerCase().includes(term) || r.prosumerName.toLowerCase().includes(term)
      )
    : reservations;

  async function handleApprove(id) {
    const confirmed = await confirm({
      title: "Approve Reservation",
      message: "Approve this reservation? A QR code will be generated for the prosumer.",
      confirmLabel: "Approve",
    });
    if (!confirmed) return;
    try {
      await approveReservation(id);
      onNotify("Reservation approved", "success");
      loadReservations(status, stationId);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  async function handleCancel(id) {
    const result = await confirm({
      title: "Cancel Reservation",
      message: "Are you sure you want to cancel this reservation?",
      confirmLabel: "Cancel Reservation",
      showInput: true,
      inputLabel: "Reason (optional)",
      inputPlaceholder: "e.g. Prosumer requested a change of plans",
      destructive: true,
    });
    if (!result.confirmed) return;
    try {
      await cancelReservation(id, result.value || undefined);
      onNotify("Reservation cancelled", "success");
      loadReservations(status, stationId);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  async function handleComplete(id) {
    const confirmed = await confirm({ title: "Complete Reservation", message: "Mark this reservation as completed?", confirmLabel: "Complete" });
    if (!confirmed) return;
    try {
      await completeReservation(id);
      onNotify("Reservation completed", "success");
      loadReservations(status, stationId);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  return (
    <div>
      <PageHeader title="Reservation Management" actions={
        <button
          onClick={onAdd}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + New Reservation
        </button>
      } />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
          className="rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        >
          <option value="">All Stations</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.stationName}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by prosumer NIC or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs flex-1 rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
      </div>

      <p className="mb-2 text-sm text-brand-muted">{filtered.length} reservations</p>

      <DataTable
        columns={RESERVATION_COLUMNS}
        rows={filtered}
        getRowKey={(reservation) => reservation.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => loadReservations(status, stationId)}
        emptyMessage="No reservations found"
        actions={(reservation) => (
          <>
            <button
              type="button"
              onClick={() => onView(reservation.id)}
              className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
            >
              View
            </button>
            {reservation.status === "Pending" && (
              <>
                <button
                  type="button"
                  onClick={() => handleApprove(reservation.id)}
                  className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(reservation.id)}
                  className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                >
                  Cancel
                </button>
              </>
            )}
            {reservation.status === "Approved" && (
              <>
                <button
                  type="button"
                  onClick={() => onViewQr(reservation.id)}
                  className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                >
                  View QR
                </button>
                <button
                  type="button"
                  onClick={() => handleComplete(reservation.id)}
                  className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                >
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(reservation.id)}
                  className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                >
                  Cancel
                </button>
              </>
            )}
          </>
        )}
      />    </div>
  );
}
