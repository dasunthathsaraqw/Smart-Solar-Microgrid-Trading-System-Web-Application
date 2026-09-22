// UserDetail.jsx — read-only user detail with inline edit and deactivate/reactivate.
// Password is optional on edit: leave blank to keep the current one unchanged (Backoffice-only reset).
import { useCallback, useEffect, useState } from "react";
import { deactivateUser, getUserById, reactivateUser, updateUser } from "../../api/users";
import { getStations } from "../../api/stations";
import { useConfirm } from "../../components/confirmContext";
import UserRoleBadge from "./UserRoleBadge";
import UserStatusBadge from "./UserStatusBadge";

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function UserDetail({ id, startInEdit, onBack, onNotify }) {
  const confirm = useConfirm();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "GridOperator", password: "", stationId: "" });
  const [isEditing, setIsEditing] = useState(Boolean(startInEdit));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [stationsError, setStationsError] = useState("");
  const [isLoadingStations, setIsLoadingStations] = useState(true);

  useEffect(() => {
    getStations()
      .then((data) => setStations(Array.isArray(data) ? data : []))
      .catch((err) => setStationsError(err.message || "Unable to load active stations."))
      .finally(() => setIsLoadingStations(false));
  }, []);

  // Keeps only API-active stations in the edit selector while retaining all names for display.
  const activeStations = stations.filter((station) => station.isActive);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserById(id);
      setUser(data);
      setForm({ name: data.name, email: data.email, role: data.role, password: "", stationId: data.stationId || "" });
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

  // Clears the selected station when an edited user changes to Backoffice.
  function updateField(field) {
    return (event) => {
      const value = event.target.value;
      setForm((prev) => ({
        ...prev,
        [field]: value,
        ...(field === "role" && value !== "GridOperator" ? { stationId: "" } : {}),
      }));
    };
  }

  async function handleSave() {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Invalid email format");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;

      if (form.role === "GridOperator") {
        payload.stationId = form.stationId || null;
      } else {
        payload.stationId = null;
      }

      const updated = await updateUser(id, payload);
      setUser(updated);
      setForm({ name: updated.name, email: updated.email, role: updated.role, password: "", stationId: updated.stationId || "" });
      setIsEditing(false);
      onNotify("User updated", "success");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeactivate() {
    const confirmed = await confirm({
      title: "Deactivate User",
      message: "Are you sure you want to deactivate this user? They will no longer be able to log in.",
      confirmLabel: "Deactivate",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deactivateUser(id);
      onNotify("User deactivated", "success");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReactivate() {
    const confirmed = await confirm({ title: "Reactivate User", message: "Reactivate this user?", confirmLabel: "Reactivate" });
    if (!confirmed) return;
    try {
      await reactivateUser(id);
      onNotify("User reactivated", "success");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (isLoading) return <p className="text-brand-muted">Loading...</p>;
  if (!user) return <p className="text-brand-muted">User not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-brand-green hover:underline">
        ← Back to List
      </button>

      <div className="rounded-lg border border-brand-border bg-brand-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-black">{user.name}</h2>
          <div className="flex gap-2">
            <UserRoleBadge role={user.role} />
            <UserStatusBadge isActive={user.isActive} />
          </div>
        </div>

        <div className="space-y-4">
          <DetailField label="Full Name" value={form.name} editable={isEditing} onChange={updateField("name")} />
          <DetailField label="Email" value={form.email} editable={isEditing} onChange={updateField("email")} />

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Role</label>
            {isEditing ? (
              <select
                value={form.role}
                onChange={updateField("role")}
                className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              >
                <option value="GridOperator">Grid Operator</option>
                <option value="Backoffice">Backoffice</option>
              </select>
            ) : (
              <p className="rounded-md border border-brand-border bg-brand-white-soft px-3 py-2 text-brand-black">
                {user.role}
              </p>
            )}
          </div>

          {(isEditing && form.role === "GridOperator") || (!isEditing && user.role === "GridOperator") ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black">Assigned Station</label>
              {isEditing ? (
                isLoadingStations ? (
                  <p className="text-sm text-brand-muted">Loading active stations...</p>
                ) : stationsError ? (
                  <p className="text-sm text-red-600">{stationsError}</p>
                ) : activeStations.length === 0 ? (
                  <p className="text-sm text-brand-muted">No active stations available.</p>
                ) : (
                  <select
                    value={form.stationId}
                    onChange={updateField("stationId")}
                    className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                  >
                    <option value="">No station assigned</option>
                    {form.stationId && !activeStations.some((s) => s.id === form.stationId) && (
                      <option value={form.stationId} disabled>
                        Current assignment unavailable — Station {form.stationId}
                      </option>
                    )}
                    {activeStations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.stationName}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <p className="rounded-md border border-brand-border bg-brand-white-soft px-3 py-2 text-brand-black">
                  {!user.stationId
                    ? "Not assigned"
                    : isLoadingStations
                      ? "Loading station..."
                      : stations.find((s) => s.id === user.stationId)?.stationName || `Station ${user.stationId}`}
                </p>
              )}
            </div>
          ) : null}

          {isEditing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black">New Password</label>
              <input
                type="password"
                placeholder="Leave blank to keep unchanged"
                value={form.password}
                onChange={updateField("password")}
                className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            </div>
          )}

          <div className="border-t border-brand-border pt-3 text-xs text-brand-muted">
            <p>Created by {user.createdBy || "system"} at {formatDateTime(user.createdAt)}</p>
            {user.updatedAt && <p>Last updated at {formatDateTime(user.updatedAt)}</p>}
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
                    setForm({ name: user.name, email: user.email, role: user.role, password: "", stationId: user.stationId || "" });
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

            {user.isActive ? (
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

function DetailField({ label, value, editable, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-black">{label}</label>
      {editable ? (
        <input
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
