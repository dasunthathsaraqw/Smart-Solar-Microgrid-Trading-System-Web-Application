// ReservationCreateForm.jsx — Backoffice/Operator books a slot on behalf of a prosumer.
// The slot dropdown is defensively filtered to the next 7 days client-side, but the backend
// is the actual source of truth for every rule here (7-day window, station/prosumer active, etc).
import { useEffect, useMemo, useState } from "react";
import { getProsumers } from "../../api/prosumers";
import { getStations } from "../../api/stations";
import { getSlots } from "../../api/slots";
import { createReservation } from "../../api/reservations";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function ReservationCreateForm({ onCancel, onCreated, onNotify }) {
  const [prosumers, setProsumers] = useState([]);
  const [stations, setStations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [prosumerNic, setProsumerNic] = useState("");
  const [stationId, setStationId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getProsumers("active")
      .then(setProsumers)
      .catch((err) => onNotify(err.message, "error"));
    getStations("active")
      .then(setStations)
      .catch((err) => onNotify(err.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting dependent slot state when station selection is cleared
      setSlots([]);
      setSlotId("");
      return;
    }

    getSlots({ stationId, status: "available" })
      .then((data) => {
        const now = Date.now();
        setSlots(data.filter((s) => new Date(s.startTime).getTime() - now <= SEVEN_DAYS_MS));
      })
      .catch((err) => onNotify(err.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  const selectedProsumer = prosumers.find((p) => p.nic === prosumerNic);
  const selectedStation = stations.find((s) => s.id === stationId);
  const selectedSlot = useMemo(() => slots.find((s) => s.id === slotId), [slots, slotId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!prosumerNic || !stationId || !slotId) {
      setError("Please select a prosumer, station and slot");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReservation({ prosumerNic, stationId, slotId });
      onNotify("Reservation created with status Pending. Awaiting approval.", "success");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-semibold text-brand-black">New Reservation</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-brand-border bg-brand-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black">Prosumer</label>
          <select
            required
            value={prosumerNic}
            onChange={(e) => setProsumerNic(e.target.value)}
            className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="" disabled>
              Select a prosumer
            </option>
            {prosumers.map((p) => (
              <option key={p.nic} value={p.nic}>
                {p.name} ({p.nic})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black">Station</label>
          <select
            required
            value={stationId}
            onChange={(e) => {
              setStationId(e.target.value);
              setSlotId("");
            }}
            className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="" disabled>
              Select a station
            </option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stationName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black">Slot</label>
          <select
            required
            disabled={!stationId}
            value={slotId}
            onChange={(e) => setSlotId(e.target.value)}
            className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green disabled:bg-brand-white-soft"
          >
            <option value="" disabled>
              {stationId ? "Select a slot" : "Select a station first"}
            </option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.startTime).toLocaleDateString()}{" "}
                {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–
                {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({s.capacityKw} kW)
              </option>
            ))}
          </select>
          {stationId && slots.length === 0 && (
            <p className="mt-1 text-xs text-brand-muted">No available slots within the next 7 days for this station.</p>
          )}
        </div>

        {selectedProsumer && selectedStation && selectedSlot && (
          <div className="rounded-md border border-brand-green bg-brand-green-soft p-4 text-sm text-brand-green-dark">
            <p className="font-medium">{selectedProsumer.name}</p>
            <p>{selectedStation.stationName}</p>
            <p>
              {new Date(selectedSlot.startTime).toLocaleDateString()}{" "}
              {new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–
              {new Date(selectedSlot.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p>{selectedSlot.capacityKw} kW</p>
          </div>
        )}

        {error && (
          <p className="border-l-4 border-brand-green bg-brand-white-soft px-3 py-2 text-sm text-brand-black">
            {error}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-brand-green px-4 py-2 font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Reservation"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-brand-muted hover:text-brand-black"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
