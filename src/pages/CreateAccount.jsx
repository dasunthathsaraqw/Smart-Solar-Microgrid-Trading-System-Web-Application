// CreateAccount.jsx — Backoffice-only form for creating new Backoffice/GridOperator accounts.
// Route access itself is restricted to the "Backoffice" role by RequireAuth in App.jsx.
import { useState } from "react";
import { createUser } from "../api/users";

const initialForm = { name: "", email: "", password: "", confirmPassword: "", role: "GridOperator" };

export default function CreateAccount() {
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

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser(form);
      setSuccess("Account created successfully");
      setForm(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-white-soft px-4">
      <div className="w-full max-w-md rounded-lg border border-brand-border bg-brand-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-brand-black">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={updateField("name")}
              className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={updateField("email")}
              className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={updateField("password")}
              className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Confirm Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Role</label>
            <select
              value={form.role}
              onChange={updateField("role")}
              className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            >
              <option value="Backoffice">Backoffice</option>
              <option value="GridOperator">Grid Operator</option>
            </select>
          </div>

          {error && (
            <p className="border-b-2 border-brand-green pb-1 text-sm text-brand-black">{error}</p>
          )}
          {success && <p className="text-sm font-medium text-brand-green">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand-green px-4 py-2 font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
