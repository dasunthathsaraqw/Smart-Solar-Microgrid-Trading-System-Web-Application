// SlotCreateForm.jsx — Add Slot(s) form with a Single/Bulk mode toggle.
// Date + time inputs are treated as UTC directly (matching the backend's UTC-based rules),
// the same way the rest of this app exchanges ISO timestamps with the API.
import { useMemo, useState } from "react";
import { bulkCreateSlots, createSlot } from "../../api/slots";
import { toUtcIsoString } from "../../utils/timeUtils";

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function maxDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function SlotCreateForm({
  stations,
  initialStationId,
  fixedStation,
  onCancel,
  onCreated,
  onNotify,
  onAccessDenied,
}) {
  const [mode, setMode] = useState("single");
  const [selectedStationId, setSelectedStationId] = useState(initialStationId || stations[0]?.id || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [single, setSingle] = useState({ date: "", startTime: "", endTime: "", capacityKw: "" });
  const [bulk, setBulk] = useState({
    date: "",
    dayStart: "06:00",
    dayEnd: "20:00",
    durationMinutes: 60,
    capacityPerSlotKw: "",
  });
  const stationId = fixedStation?.id || selectedStationId;

  const previewCount = useMemo(() => {
    if (!bulk.dayStart || !bulk.dayEnd) return 0;
    const [sh, sm] = bulk.dayStart.split(":").map(Number);
    const [eh, em] = bulk.dayEnd.split(":").map(Number);
    const totalMinutes = eh * 60 + em - (sh * 60 + sm);
    if (totalMinutes <= 0) return 0;
    return Math.floor(totalMinutes / Number(bulk.durationMinutes));
  }, [bulk.dayStart, bulk.dayEnd, bulk.durationMinutes]);

  function updateSingle(field) {
    return (event) => setSingle((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function updateBulk(field) {
    return (event) => setBulk((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!stationId) {
      setError("Please select a station");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "single") {
        if (!single.date || !single.startTime || !single.endTime || !single.capacityKw) {
          setError("All fields are required");
          setIsSubmitting(false);
          return;
        }

        await createSlot({
          stationId,
          slotDate: `${single.date}T00:00:00Z`,
          startTime: toUtcIsoString(single.date, single.startTime),
          endTime: toUtcIsoString(single.date, single.endTime),
          capacityKw: Number(single.capacityKw),
        });
        setSuccess("1 slot created successfully");
        onNotify("1 slot created successfully", "success");
      } else {
        if (!bulk.date || !bulk.dayStart || !bulk.dayEnd || !bulk.capacityPerSlotKw) {
          setError("All fields are required");
          setIsSubmitting(false);
          return;
        }

        const result = await bulkCreateSlots({
          stationId,
          slotDate: `${bulk.date}T00:00:00Z`,
          startTime: toUtcIsoString(bulk.date, bulk.dayStart),
          endTime: toUtcIsoString(bulk.date, bulk.dayEnd),
          slotDurationMinutes: Number(bulk.durationMinutes),
          capacityPerSlotKw: Number(bulk.capacityPerSlotKw),
        });
        setSuccess(`${result.length} slot(s) created successfully`);
        onNotify(`${result.length} slot(s) created successfully`, "success");
      }

      setTimeout(onCreated, 1500);
    } catch (err) {
      if (isStationAccessDenied(err)) {
        const message = "Access denied. Your station assignment may have changed.";
        setError(message);
        onNotify(message, "error");
        await onAccessDenied?.();
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-semibold text-brand-black">Add Slots</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-brand-border bg-brand-white p-6">
        {fixedStation ? (
          <div className="rounded-md border border-brand-green bg-brand-green-soft px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-green-dark">Assigned station</p>
            <p className="mt-1 font-medium text-brand-black">{fixedStation.stationName || "Assigned station"}</p>
            <p className="mt-1 break-all text-xs text-brand-muted">Station ID: {fixedStation.id}</p>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Station</label>
            <select
              required
              value={stationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
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
        )}

        <div className="flex gap-4 text-sm font-medium text-brand-black">
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "single"} onChange={() => setMode("single")} />
            Single Slot
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "bulk"} onChange={() => setMode("bulk")} />
            Bulk Slots
          </label>
        </div>

        {mode === "single" ? (
          <>
            <Field
              label="Date"
              type="date"
              min={todayIso()}
              max={maxDateIso()}
              value={single.date}
              onChange={updateSingle("date")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Start Time" type="time" value={single.startTime} onChange={updateSingle("startTime")} />
              <Field label="End Time" type="time" value={single.endTime} onChange={updateSingle("endTime")} />
            </div>
            <Field
              label="Capacity (kW)"
              type="number"
              step="0.1"
              min="0.1"
              value={single.capacityKw}
              onChange={updateSingle("capacityKw")}
            />
          </>
        ) : (
          <>
            <Field
              label="Date"
              type="date"
              min={todayIso()}
              max={maxDateIso()}
              value={bulk.date}
              onChange={updateBulk("date")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Day Start Time" type="time" value={bulk.dayStart} onChange={updateBulk("dayStart")} />
              <Field label="Day End Time" type="time" value={bulk.dayEnd} onChange={updateBulk("dayEnd")} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black">Slot Duration</label>
              <select
                value={bulk.durationMinutes}
                onChange={updateBulk("durationMinutes")}
                className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              >
                {DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Capacity per Slot (kW)"
              type="number"
              step="0.1"
              min="0.1"
              value={bulk.capacityPerSlotKw}
              onChange={updateBulk("capacityPerSlotKw")}
            />

            <p className="rounded-md bg-brand-green-soft px-3 py-2 text-sm text-brand-green-dark">
              This will create up to {previewCount} slot{previewCount === 1 ? "" : "s"} of {bulk.durationMinutes}{" "}
              minutes each.
            </p>
          </>
        )}

        {error && (
          <p className="border-l-4 border-brand-green bg-brand-white-soft px-3 py-2 text-sm text-brand-black">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md bg-brand-green-soft px-3 py-2 text-sm font-medium text-brand-green-dark">
            {success}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-brand-green px-4 py-2 font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : mode === "single" ? "Create Slot" : "Create All Slots"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-sm font-medium text-brand-muted hover:text-brand-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function isStationAccessDenied(error) {
  const message = error?.message?.toLowerCase() || "";
  return error?.response?.status === 403 || message.includes("not assigned") || message.includes("forbidden");
}

function Field({ label, ...inputProps }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-black">{label}</label>
      <input
        required
        {...inputProps}
        className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
      />
    </div>
  );
}
