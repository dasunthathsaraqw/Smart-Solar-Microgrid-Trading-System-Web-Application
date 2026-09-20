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
import StationStatusBadge from "./StationStatusBadge";

function validate(form) {
  const lat = Number(form.latitude);
  if (Number.isNaN(lat) || lat < -90 || lat > 90) return "Latitude must be between -90 and 90";
  const lng = Number(form.longitude);
  if (Number.isNaN(lng) || lng < -180 || lng > 180) return "Longitude must be between -180 and 180";
  if (!(Number(form.capacityKw) > 0)) return "Capacity must be greater than 0";
  if (!Number.isInteger(Number(form.availableSlots)) || Number(form.availableSlots) < 0) {
    return "Available slots must be a whole number of 0 or more";
  }
  if (!form.schedule.trim()) return "Schedule is required";
  return "";
}

export default function StationDetail({ id, onBack, onNotify }) {
  const [station, setStation] = useState(null);
  const [form, setForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setIsLoading(true);
    try {
      const data = await getStationById(id);
      setStation(data);
      setForm(data);
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSave() {
    setError("");
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

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

  async function handleDeactivate() {
    if (!window.confirm("Deactivate this station?")) return;
    setError("");
    try {
      await deactivateStation(id);
      onNotify("Station deactivated", "success");
      load();
    } catch (err) {
      // Surfaces the backend's own message, e.g. "Cannot deactivate: active reservations exist".
      setError(err.message);
    }
  }

  async function handleReactivate() {
    if (!window.confirm("Reactivate this station?")) return;
    await reactivateStation(id);
    onNotify("Station reactivated", "success");
    load();
  }

  if (isLoading) return <p className="text-brand-muted">Loading...</p>;
  if (!station) return <p className="text-brand-muted">Station not found.</p>;

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField
              label="Latitude"
              value={form.latitude}
              editable={isEditing}
              onChange={updateField("latitude")}
              type="number"
            />
            <DetailField
              label="Longitude"
              value={form.longitude}
              editable={isEditing}
              onChange={updateField("longitude")}
              type="number"
            />
          </div>
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
          <DetailField label="Schedule" value={form.schedule} editable={isEditing} onChange={updateField("schedule")} />

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
    </div>
  );
}

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
