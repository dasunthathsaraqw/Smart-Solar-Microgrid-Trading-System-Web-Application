// ReservationDetail.jsx — read-only reservation detail with status-aware actions.
// The backend is the sole authority on every rule here (12-hour notice, status transitions);
// this view only reflects whatever the API allows or reports back.
import { useCallback, useEffect, useState } from "react";
import { getSlots } from "../../api/slots";
import {
  approveReservation,
  cancelReservation,
  completeReservation,
  getReservationById,
  updateReservation,
} from "../../api/reservations";
import { useConfirm } from "../../components/confirmContext";
import ReservationStatusBadge from "./ReservationStatusBadge";

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function ReservationDetail({ id, onBack, onViewQr, onNotify }) {
  const confirm = useConfirm();
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingSlot, setIsEditingSlot] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newSlotId, setNewSlotId] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getReservationById(id);
      setReservation(data);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [id, onNotify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on id change; loading flag is set before the request
    load();
  }, [load]);

  async function handleApprove() {
    const confirmed = await confirm({
      title: "Approve Reservation",
      message: "Approve this reservation? A QR code will be generated for the prosumer.",
      confirmLabel: "Approve",
    });
    if (!confirmed) return;
    try {
      await approveReservation(id);
      onNotify("Reservation approved", "success");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancel() {
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
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComplete() {
    const confirmed = await confirm({ title: "Complete Reservation", message: "Mark this reservation as completed?", confirmLabel: "Complete" });
    if (!confirmed) return;
    try {
      await completeReservation(id);
      onNotify("Reservation completed", "success");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleEditSlot() {
    if (isEditingSlot) {
      setIsEditingSlot(false);
      return;
    }

    try {
      const slots = await getSlots({ stationId: reservation.stationId, status: "available" });
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      setAvailableSlots(slots.filter((s) => new Date(s.startTime).getTime() - now <= sevenDaysMs));
      setNewSlotId("");
      setIsEditingSlot(true);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  async function handleSaveSlot() {
    setError("");
    if (!newSlotId) {
      setError("Please select a slot");
      return;
    }

    try {
      await updateReservation(id, newSlotId);
      onNotify("Reservation moved to new slot", "success");
      setIsEditingSlot(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (isLoading) return <p className="text-brand-muted">Loading...</p>;
  if (!reservation) return <p className="text-brand-muted">Reservation not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-brand-green hover:underline">
        ← Back to List
      </button>

      <div className="rounded-lg border border-brand-border bg-brand-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-black">{reservation.prosumerName}</h2>
          <ReservationStatusBadge status={reservation.status} />
        </div>

        <div className="space-y-3 text-sm text-brand-black">
          <Row label="Prosumer NIC" value={reservation.prosumerNic} />
          <Row label="Station" value={reservation.stationName} />
          <Row
            label="Slot"
            value={`${new Date(reservation.slotStartTime).toLocaleString()} – ${new Date(
              reservation.slotEndTime
            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          />
          <Row label="Capacity" value={`${reservation.capacityKw} kW`} />

          <div className="border-t border-brand-border pt-3 text-xs text-brand-muted">
            <p>Created by {reservation.createdBy} at {formatDateTime(reservation.createdAt)}</p>
            {reservation.approvedBy && (
              <p>Approved by {reservation.approvedBy} at {formatDateTime(reservation.approvedAt)}</p>
            )}
            {reservation.completedBy && (
              <p>Completed by {reservation.completedBy} at {formatDateTime(reservation.completedAt)}</p>
            )}
            {reservation.cancelledBy && (
              <p>
                Cancelled by {reservation.cancelledBy} at {formatDateTime(reservation.cancelledAt)}
                {reservation.cancellationReason ? ` — "${reservation.cancellationReason}"` : ""}
              </p>
            )}
          </div>

          {isEditingSlot && (
            <div className="rounded-md border border-brand-border bg-brand-white-soft p-4">
              <label className="mb-1 block text-sm font-medium text-brand-black">Move to slot</label>
              <select
                value={newSlotId}
                onChange={(e) => setNewSlotId(e.target.value)}
                className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              >
                <option value="" disabled>
                  Select a slot
                </option>
                {availableSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.startTime).toLocaleDateString()}{" "}
                    {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–
                    {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={handleSaveSlot}
                  className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
                >
                  Save Slot
                </button>
                <button
                  onClick={() => setIsEditingSlot(false)}
                  className="text-sm font-medium text-brand-muted hover:text-brand-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="border-l-4 border-brand-green bg-brand-white-soft px-3 py-2 text-sm text-brand-black">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {reservation.status === "Pending" && (
              <>
                <button
                  onClick={handleApprove}
                  className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
                >
                  Approve
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green-soft"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleEditSlot}
                  className="rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green-soft"
                >
                  {isEditingSlot ? "Close" : "Edit Slot"}
                </button>
              </>
            )}

            {reservation.status === "Approved" && (
              <>
                <button
                  onClick={() => onViewQr(id)}
                  className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
                >
                  View QR
                </button>
                <button
                  onClick={handleComplete}
                  className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
                >
                  Complete
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green-soft"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-brand-border pb-2">
      <span className="text-brand-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
