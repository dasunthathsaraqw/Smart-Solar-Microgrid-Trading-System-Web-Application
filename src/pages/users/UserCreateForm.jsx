import { useEffect, useState } from "react";
import { createUser } from "../../api/users";
import { getStations } from "../../api/stations";

const initialForm = { name: "", email: "", password: "", confirmPassword: "", role: "GridOperator", stationId: "" };

function validate(form) {
  if (form.name.trim().length < 2 || form.name.trim().length > 100) return "Name must be 2-100 characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Invalid email format";
  if (form.password.length < 6) return "Password must be at least 6 characters";
  if (form.password !== form.confirmPassword) return "Passwords do not match";
  return "";
}

export default function UserCreateForm({ onCancel, onCreated, onNotify }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stations, setStations] = useState([]);
  const [stationsError, setStationsError] = useState("");

  useEffect(() => {
    getStations("Active")
      .then((data) => setStations(Array.isArray(data) ? data : []))
      .catch((err) => setStationsError(err.message || "Unable to load active stations."));
  }, []);

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
      const payload = {
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        role: form.role,
      };

      if (form.role === "GridOperator" && form.stationId) {
        payload.stationId = form.stationId;
      }

      await createUser(payload);
      setSuccess("User created successfully");
      onNotify("User created successfully", "success");
      setForm(initialForm);
      setTimeout(onCreated, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-6 text-2xl font-semibold text-brand-black">Add New User</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-brand-border bg-brand-white p-6">
        <Field label="Full Name" value={form.name} onChange={updateField("name")} />
        <Field label="Email" type="email" value={form.email} onChange={updateField("email")} />
        <Field label="Password" type="password" value={form.password} onChange={updateField("password")} />
        <Field
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={updateField("confirmPassword")}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black">Role</label>
          <select
            value={form.role}
            onChange={updateField("role")}
            className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="GridOperator">Grid Operator</option>
            <option value="Backoffice">Backoffice</option>
          </select>
        </div>

        {form.role === "GridOperator" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Assigned Station</label>
            {stationsError ? (
              <p className="text-sm text-red-600">{stationsError}</p>
            ) : stations.length === 0 ? (
              <p className="text-sm text-brand-muted">No active stations available.</p>
            ) : (
              <select
                value={form.stationId}
                onChange={updateField("stationId")}
                className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              >
                <option value="">No station assigned</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.stationName}
                  </option>
                ))}
              </select>
            )}
          </div>
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
            {isSubmitting ? "Creating..." : "Create User"}
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
