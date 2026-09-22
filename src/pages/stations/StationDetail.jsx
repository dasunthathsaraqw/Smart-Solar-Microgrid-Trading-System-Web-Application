// StationDetail.jsx — read-only station detail view with inline edit and lifecycle actions.
// The backend decides whether a deactivation is blocked (active reservations); this view
// only displays whatever error message the API returns, never a hardcoded one.
import { useEffect, useState } from "react";
import {
  deactivateStation,
  getStationById,
  reactivateStation,
  updateStation,
} from "../../api/stations";
import { useConfirm } from "../../components/confirmContext";
import LocationPicker from "../../components/LocationPicker";
import ScheduleEditor from "../../components/ScheduleEditor";
import StationStatusBadge from "./StationStatusBadge";
import StationSlotSummary from "./StationSlotSummary";
import DeactivationBlockedDialog from "./DeactivationBlockedDialog";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";

// Displays station details while the service remains authoritative for updates and lifecycle rules.
export default function StationDetail({ id, onBack, onNotify, onManageSlots }) {
  const confirm = useConfirm();
  const [station, setStation] = useState(null);
  const [form, setForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [blockedError, setBlockedError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Reloads the selected station after lifecycle actions.
  async function load() {
    setIsLoading(true);
    try {
      const data = await getStationById(id);
      setStation(data);
      setForm(data);
      setError("");
    } catch (err) {
      setError(err.message);
      onNotify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  // Updates one editable station field.
  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  // Saves editable station fields through the service.
  async function handleSave() {
    setError("");
    try {
      const updated = await updateStation(id, {
        stationName: form.stationName,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        capacityKw: Number(form.capacityKw),
        availableSlots: Number(form.availableSlots),
        schedule: form.schedule,
      });
      setStation(updated);
      setForm(updated);
      setIsEditing(false);
      onNotify("Station updated", "success");
    } catch (err) {
      setError(err.message);
    }
  }

  // Displays the blocking dialog only when the service rejects deactivation for reservations.
  async function handleDeactivate() {
    const confirmed = await confirm({
      title: "Deactivate Station",
      message: "Are you sure you want to deactivate this station?",
      confirmLabel: "Deactivate",
      destructive: true,
    });
    if (!confirmed) return;
    setError("");
    try {
      await deactivateStation(id);
      onNotify("Station deactivated", "success");
      load();
    } catch (err) {
      // Surfaces the backend's own message, e.g. "Cannot deactivate: active reservations exist".
      if (err.message === "Cannot deactivate: active reservations exist") setBlockedError(err.message);
      else setError(err.message);
    }
  }

  // Reactivates the station and surfaces any service error.
  async function handleReactivate() {
    const confirmed = await confirm({ title: "Reactivate Station", message: "Reactivate this station?", confirmLabel: "Reactivate" });
    if (!confirmed) return;
    try {
      await reactivateStation(id);
      onNotify("Station reactivated", "success");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (isLoading) return <LoadingState message="Loading station..." />;
  if (!station) return error ? <ErrorState message={error} onRetry={load} /> : <EmptyState message="Station not found." />;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-brand-green hover:underline">
        ← Back to List
      </button>

      <div className="rounded-lg border border-brand-border bg-brand-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-black">{station.stationName}</h2>
          <StationStatusBadge isActive={station.isActive} />
        </div>

        <div className="space-y-4">
          <DetailField label="Station Name" value={form.stationName} editable={isEditing} onChange={updateField("stationName")} />
          {isEditing ? <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(latitude, longitude) => setForm((prev) => ({ ...prev, latitude, longitude }))} /> : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Latitude" value={form.latitude} />
              <DetailField label="Longitude" value={form.longitude} />
            </div>
          )}
          <DetailField
            label="Capacity (kW/h)"
            value={form.capacityKw}
            editable={isEditing}
            onChange={updateField("capacityKw")}
            type="number"
          />
          <DetailField
            label="Available Battery Slots"
            value={form.availableSlots}
            editable={isEditing}
            onChange={updateField("availableSlots")}
            type="number"
          />
          {isEditing ? <ScheduleEditor value={form.schedule} onChange={(schedule) => setForm((prev) => ({ ...prev, schedule }))} /> : <DetailField label="Schedule" value={form.schedule} />}

          <div className="border-t border-brand-border pt-3 text-xs text-brand-muted">
            <p>Created by {station.createdBy}</p>
            <p>Created at {new Date(station.createdAt).toLocaleString()}</p>
          </div>

          {error && (
            <p className="border-l-4 border-brand-green bg-brand-white-soft px-3 py-2 text-sm text-brand-black">
              {error}
            </p>
          )}

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
                    setForm(station);
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

            {station.isActive ? (
              <button
                onClick={handleDeactivate}
                className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={handleReactivate}
                className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
              >
                Reactivate
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5"><StationSlotSummary key={`${id}-${station.isActive}`} stationId={id} isActive={station.isActive} onManageSlots={onManageSlots} /></div>
      {blockedError && <DeactivationBlockedDialog stationId={id} message={blockedError} onClose={() => setBlockedError("")} />}
    </div>
  );
}

// Shows a station field or its editable input.
function DetailField({ label, value, editable, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-black">{label}</label>
      {editable ? (
        <input
          type={type}
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
