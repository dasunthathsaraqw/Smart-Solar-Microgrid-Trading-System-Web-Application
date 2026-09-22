// StationCreateForm.jsx — Add Station form with client-side validation mirroring the backend rules.
import { useState } from "react";
import { createStation } from "../../api/stations";
import LocationPicker from "../../components/LocationPicker";
import ScheduleEditor from "../../components/ScheduleEditor";

const initialForm = {
  stationName: "",
  latitude: "",
  longitude: "",
  capacityKw: "",
  availableSlots: "",
  schedule: "",
};

// Creates a station with map-selected coordinates and a schedule string accepted by the API.
export default function StationCreateForm({ onCancel, onCreated, onNotify }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Updates a typed station property before submission.
  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  // Sends the station fields to the service and displays its validation response.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

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

        <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(latitude, longitude) => setForm((prev) => ({ ...prev, latitude, longitude }))} />

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
        <ScheduleEditor value={form.schedule} onChange={(schedule) => setForm((prev) => ({ ...prev, schedule }))} />

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

// Renders a labelled station property input.
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
