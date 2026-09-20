// ReservationsList.jsx — reservation table with status/station filters, a client-side search
// box, a total count, and status-aware row actions. Defaults to the Pending status filter.
import { useCallback, useEffect, useState } from "react";
import { getStations } from "../../api/stations";
import { approveReservation, cancelReservation, completeReservation, getReservations } from "../../api/reservations";
import { useConfirm } from "../../components/confirmContext";
import ReservationStatusBadge from "./ReservationStatusBadge";

const STATUS_OPTIONS = ["Pending", "Approved", "Completed", "Cancelled", "All"];

export default function ReservationsList({ initialStatus, onAdd, onView, onViewQr, onNotify }) {
  const confirm = useConfirm();
  const [stations, setStations] = useState([]);
  const [status, setStatus] = useState(initialStatus || "Pending");
  const [stationId, setStationId] = useState("");
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStations("active")
      .then(setStations)
      .catch((err) => onNotify(err.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReservations = useCallback(
    async (statusFilter, stationFilter) => {
      setIsLoading(true);
      try {
        const data = await getReservations({
          status: statusFilter === "All" ? undefined : statusFilter,
          stationId: stationFilter || undefined,
        });
        setReservations(data);
      } catch (err) {
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-brand-black">Reservation Management</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + New Reservation
        </button>
      </div>

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

      <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-white-soft text-brand-black">
            <tr>
              <th className="px-4 py-3">Prosumer</th>
              <th className="px-4 py-3">Station</th>
              <th className="px-4 py-3">Slot Date</th>
              <th className="px-4 py-3">Slot Time</th>
              <th className="px-4 py-3">Capacity (kW)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-brand-muted">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-brand-muted">
                  No reservations found
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">
                    {r.prosumerName}
                    <div className="text-xs text-brand-muted">{r.prosumerNic}</div>
                  </td>
                  <td className="px-4 py-3">{r.stationName}</td>
                  <td className="px-4 py-3">{new Date(r.slotStartTime).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {new Date(r.slotStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                    {new Date(r.slotEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">{r.capacityKw}</td>
                  <td className="px-4 py-3">
                    <ReservationStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onView(r.id)}
                        className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                      >
                        View
                      </button>
                      {r.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCancel(r.id)}
                            className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {r.status === "Approved" && (
                        <>
                          <button
                            onClick={() => onViewQr(r.id)}
                            className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                          >
                            View QR
                          </button>
                          <button
                            onClick={() => handleComplete(r.id)}
                            className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancel(r.id)}
                            className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
