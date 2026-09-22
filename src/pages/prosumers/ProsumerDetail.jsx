// ProsumerDetail.jsx — read-only prosumer detail view with inline edit and lifecycle actions.
// The NIC is always read-only since it is the prosumer's primary identifier.
import { useEffect, useState } from "react";
import {
  deactivateProsumer,
  getProsumerByNic,
  reactivateProsumer,
  updateProsumer,
} from "../../api/prosumers";
import { useConfirm } from "../../components/confirmContext";
import StatusBadge from "./StatusBadge";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_REGEX = /^0[0-9]{9}$/;

function validate(form) {
  if (!EMAIL_REGEX.test(form.email)) return "Invalid email format";
  if (!CONTACT_REGEX.test(form.contactNumber)) return "Contact number must be 10 digits starting with 0";
  if (!(Number(form.panelCapacityKw) > 0)) return "Panel capacity must be greater than 0";
  return "";
}

export default function ProsumerDetail({ nic, onBack, onNotify }) {
  const confirm = useConfirm();
  const [prosumer, setProsumer] = useState(null);
  const [form, setForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nic]);

  async function load() {
    setIsLoading(true);
    try {
      const data = await getProsumerByNic(nic);
      setProsumer(data);
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
      const updated = await updateProsumer(nic, {
        name: form.name,
        email: form.email,
        contactNumber: form.contactNumber,
        address: form.address,
        panelCapacityKw: Number(form.panelCapacityKw),
      });
      setProsumer(updated);
      setForm(updated);
      setIsEditing(false);
      onNotify("Prosumer updated", "success");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeactivate() {
    const confirmed = await confirm({
      title: "Deactivate Prosumer",
      message: `Are you sure you want to deactivate prosumer ${nic}?`,
      confirmLabel: "Deactivate",
      destructive: true,
    });
    if (!confirmed) return;
    await deactivateProsumer(nic);
    onNotify("Prosumer deactivated", "success");
    load();
  }

  async function handleReactivate() {
    const confirmed = await confirm({
      title: "Reactivate Prosumer",
      message: `Reactivate prosumer ${nic}?`,
      confirmLabel: "Reactivate",
    });
    if (!confirmed) return;
    await reactivateProsumer(nic);
    onNotify("Prosumer reactivated", "success");
    load();
  }

  if (isLoading) return <p className="text-brand-muted">Loading...</p>;
  if (!prosumer) return <p className="text-brand-muted">Prosumer not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-brand-green hover:underline">
        ← Back to List
      </button>

      <div className="rounded-lg border border-brand-border bg-brand-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-black">{prosumer.name}</h2>
          <StatusBadge isActive={prosumer.isActive} deactivationRequested={prosumer.deactivationRequested} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">NIC</label>
            <input
              disabled
              value={prosumer.nic}
              className="w-full rounded-md border border-brand-border bg-brand-white-soft px-3 py-2 text-brand-muted"
            />
            <p className="mt-1 text-xs text-brand-muted">NIC is the primary key and cannot be changed.</p>
          </div>

          <DetailField label="Full Name" value={form.name} editable={isEditing} onChange={updateField("name")} />
          <DetailField label="Email" value={form.email} editable={isEditing} onChange={updateField("email")} />
          <DetailField
            label="Contact Number"
            value={form.contactNumber}
            editable={isEditing}
            onChange={updateField("contactNumber")}
          />
          <DetailField
            label="Address"
            value={form.address}
            editable={isEditing}
            onChange={updateField("address")}
            textarea
          />
          <DetailField
            label="Panel Capacity (kW)"
            value={form.panelCapacityKw}
            editable={isEditing}
            onChange={updateField("panelCapacityKw")}
            type="number"
          />

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
                    setForm(prosumer);
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

            {prosumer.isActive ? (
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

function DetailField({ label, value, editable, onChange, textarea, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-black">{label}</label>
      {editable ? (
        textarea ? (
          <textarea
            value={value}
            onChange={onChange}
            rows={3}
            className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
        )
      ) : (
        <p className="rounded-md border border-brand-border bg-brand-white-soft px-3 py-2 text-brand-black">
          {value}
        </p>
      )}
    </div>
  );
}
