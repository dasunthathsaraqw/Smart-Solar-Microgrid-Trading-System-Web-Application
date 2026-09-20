// StationCreateForm.jsx — Add Station form with client-side validation mirroring the backend rules.
import { useState } from "react";
import { createStation } from "../../api/stations";

const initialForm = {
  stationName: "",
  latitude: "",
  longitude: "",
  capacityKw: "",
  availableSlots: "",
  schedule: "",
};

function validate(form) {
  if (form.stationName.trim().length < 3 || form.stationName.trim().length > 100) {
    return "Station name must be 3-100 characters";
  }
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

export default function StationCreateForm({ onCancel, onCreated, onNotify }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await createStation({
        stationName: form.stationName.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        capacityKw: Number(form.capacityKw),
        availableSlots: Number(form.availableSlots),
        schedule: form.schedule.trim(),
      });
      setSuccess("Station created successfully");
      onNotify("Station created successfully", "success");
      setForm(initialForm);
      setTimeout(onCreated, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-semibold text-brand-black">Add New Microgrid Node</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-brand-border bg-brand-white p-6">
        <Field label="Station Name" value={form.stationName} onChange={updateField("stationName")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Latitude"
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            value={form.latitude}
            onChange={updateField("latitude")}
          />
          <Field
            label="Longitude"
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            value={form.longitude}
            onChange={updateField("longitude")}
          />
        </div>
        <p className="-mt-2 text-xs text-brand-muted">e.g. Kandy: 7.2906, 80.6337</p>

        <Field
          label="Capacity (kW/h)"
          type="number"
          step="0.1"
          min="0.1"
          value={form.capacityKw}
          onChange={updateField("capacityKw")}
        />
        <Field
          label="Available Battery Slots"
          type="number"
          step="1"
          min="0"
          value={form.availableSlots}
          onChange={updateField("availableSlots")}
        />
        <Field
          label="Schedule"
          value={form.schedule}
          onChange={updateField("schedule")}
          placeholder="06:00-20:00 Mon-Sun"
        />

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
            {isSubmitting ? "Creating..." : "Create Station"}
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
