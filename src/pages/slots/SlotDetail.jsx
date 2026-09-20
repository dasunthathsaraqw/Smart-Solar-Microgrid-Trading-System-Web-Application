// SlotDetail.jsx — read-only slot detail view with inline edit and delete.
// Booked slots show an info banner instead of edit/delete controls; the backend still
// enforces this rule server-side regardless of what this view allows.
import { useCallback, useEffect, useState } from "react";
import { deleteSlot, getSlotById, updateSlot } from "../../api/slots";
import { useConfirm } from "../../components/confirmContext";
import SlotStatusBadge from "./SlotStatusBadge";

function toTimeInputValue(isoString) {
  return new Date(isoString).toISOString().slice(11, 16);
}

export default function SlotDetail({ id, onBack, onNotify }) {
  const confirm = useConfirm();
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ startTime: "", endTime: "", capacityKw: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  // Captured once at mount rather than calling Date.now() directly during render.
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSlotById(id);
      setSlot(data);
      setForm({
        startTime: toTimeInputValue(data.startTime),
        endTime: toTimeInputValue(data.endTime),
        capacityKw: data.capacityKw,
      });
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

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSave() {
    setError("");
    if (!(Number(form.capacityKw) > 0)) {
      setError("Capacity must be greater than 0");
      return;
    }

    const datePart = slot.slotDate.slice(0, 10);
    try {
      const updated = await updateSlot(id, {
        startTime: `${datePart}T${form.startTime}:00Z`,
        endTime: `${datePart}T${form.endTime}:00Z`,
        capacityKw: Number(form.capacityKw),
      });
      setSlot(updated);
      setForm({
        startTime: toTimeInputValue(updated.startTime),
        endTime: toTimeInputValue(updated.endTime),
        capacityKw: updated.capacityKw,
      });
      setIsEditing(false);
      onNotify("Slot updated", "success");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Delete Slot",
      message: "This will permanently delete the slot. This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deleteSlot(id);
      onNotify("Slot deleted", "success");
      onBack();
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  if (isLoading) return <p className="text-brand-muted">Loading...</p>;
  if (!slot) return <p className="text-brand-muted">Slot not found.</p>;

  const isPast = new Date(slot.endTime).getTime() <= now;
  const canModify = !slot.isBooked && !isPast;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-brand-green hover:underline">
        ← Back to List
      </button>

      <div className="rounded-lg border border-brand-border bg-brand-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-black">{slot.stationName}</h2>
          <SlotStatusBadge isBooked={slot.isBooked} endTime={slot.endTime} />
        </div>

        {slot.isBooked && (
          <p className="mb-4 border-l-4 border-brand-green bg-brand-white-soft px-3 py-2 text-sm text-brand-black">
            This slot has been booked and cannot be modified.
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Date</label>
            <p className="rounded-md border border-brand-border bg-brand-white-soft px-3 py-2 text-brand-black">
              {new Date(slot.slotDate).toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimeField label="Start Time" value={form.startTime} editable={isEditing && canModify} onChange={updateField("startTime")} />
            <TimeField label="End Time" value={form.endTime} editable={isEditing && canModify} onChange={updateField("endTime")} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Capacity (kW)</label>
            {isEditing && canModify ? (
              <input
                type="number"
                step="0.1"
                value={form.capacityKw}
                onChange={updateField("capacityKw")}
                className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            ) : (
              <p className="rounded-md border border-brand-border bg-brand-white-soft px-3 py-2 text-brand-black">
                {slot.capacityKw}
              </p>
            )}
          </div>

          <div className="border-t border-brand-border pt-3 text-xs text-brand-muted">
            <p>Created by {slot.createdBy}</p>
            <p>Created at {new Date(slot.createdAt).toLocaleString()}</p>
          </div>

          {error && (
            <p className="border-l-4 border-brand-green bg-brand-white-soft px-3 py-2 text-sm text-brand-black">
              {error}
            </p>
          )}

          {canModify && (
            <div className="flex flex-wrap gap-3 pt-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setError("");
                    }}
                    className="text-sm font-medium text-brand-muted hover:text-brand-black"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green-soft"
                >
                  Edit
                </button>
              )}

              <button
                onClick={handleDelete}
                className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeField({ label, value, editable, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-black">{label}</label>
      {editable ? (
        <input
          type="time"
          value={value}
          onChange={onChange}
          className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
      ) : (
        <p className="rounded-md border border-brand-border bg-brand-white-soft px-3 py-2 text-brand-black">
          {value}
        </p>
      )}
    </div>
  );
}
