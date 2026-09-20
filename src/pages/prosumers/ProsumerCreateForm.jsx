// ProsumerCreateForm.jsx — Add Prosumer form with client-side validation mirroring the backend rules.
import { useState } from "react";
import { createProsumer } from "../../api/prosumers";

const NIC_REGEX = /^([0-9]{9}[VvXx]|[0-9]{12})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_REGEX = /^0[0-9]{9}$/;

const initialForm = {
  nic: "",
  name: "",
  email: "",
  contactNumber: "",
  address: "",
  panelCapacityKw: "",
  password: "",
  confirmPassword: "",
};

function validate(form) {
  if (!NIC_REGEX.test(form.nic)) return "Invalid NIC format";
  if (!EMAIL_REGEX.test(form.email)) return "Invalid email format";
  if (!CONTACT_REGEX.test(form.contactNumber)) return "Contact number must be 10 digits starting with 0";
  if (!(Number(form.panelCapacityKw) > 0)) return "Panel capacity must be greater than 0";
  if (form.password.length < 6) return "Password must be at least 6 characters";
  if (form.password !== form.confirmPassword) return "Passwords do not match";
  return "";
}

export default function ProsumerCreateForm({ onCancel, onCreated, onNotify }) {
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
      await createProsumer({
        nic: form.nic,
        name: form.name,
        email: form.email,
        contactNumber: form.contactNumber,
        address: form.address,
        panelCapacityKw: Number(form.panelCapacityKw),
        password: form.password,
      });
      setSuccess("Prosumer created successfully. Status: Pending Activation.");
      onNotify("Prosumer created successfully", "success");
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
      <h2 className="mb-6 text-2xl font-semibold text-brand-black">Add New Prosumer</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-brand-border bg-brand-white p-6">
        <Field label="NIC" value={form.nic} onChange={updateField("nic")} placeholder="199012345678 or 901234567V" />
        <Field label="Full Name" value={form.name} onChange={updateField("name")} />
        <Field label="Email" type="email" value={form.email} onChange={updateField("email")} />
        <Field
          label="Contact Number"
          value={form.contactNumber}
          onChange={updateField("contactNumber")}
          placeholder="0771234567"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black">Address</label>
          <textarea
            required
            rows={3}
            value={form.address}
            onChange={updateField("address")}
            className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
        </div>

        <Field
          label="Panel Capacity (kW)"
          type="number"
          step="0.1"
          value={form.panelCapacityKw}
          onChange={updateField("panelCapacityKw")}
        />

        <Field label="Password" type="password" value={form.password} onChange={updateField("password")} />
        <Field
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={updateField("confirmPassword")}
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
            {isSubmitting ? "Creating..." : "Create Prosumer"}
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
