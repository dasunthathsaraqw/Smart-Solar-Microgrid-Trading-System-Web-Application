// UsersList.jsx — user table with a role filter, Active/Deactivated status tabs, a client-side
// search box, a total count, and status-aware row actions. The backend is the sole authority on
// whether a deactivation is allowed (self / last-Backoffice); this view just shows its response.
import { useCallback, useEffect, useState } from "react";
import { deactivateUser, getUsers, reactivateUser } from "../../api/users";
import { getStations } from "../../api/stations";
import { useConfirm } from "../../components/confirmContext";
import UserRoleBadge from "./UserRoleBadge";
import UserStatusBadge from "./UserStatusBadge";

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "deactivated", label: "Deactivated" },
];

export default function UsersList({ onAdd, onView, onNotify }) {
  const confirm = useConfirm();
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("active");
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStations()
      .then((data) => setStations(Array.isArray(data) ? data : []))
      .catch((err) => onNotify(err.message, "error"))
      .finally(() => setIsLoadingStations(false));
  }, [onNotify]);

  const loadUsers = useCallback(
    async (roleFilter, statusFilter) => {
      setIsLoading(true);
      try {
        const data = await getUsers({ role: roleFilter || undefined, status: statusFilter });
        setUsers(data);
      } catch (err) {
        onNotify(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [onNotify]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change; loading flag is set before the request
    loadUsers(role, status);
  }, [role, status, loadUsers]);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? users.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    : users;

  async function handleDeactivate(id) {
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
      loadUsers(role, status);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  async function handleReactivate(id) {
    const confirmed = await confirm({ title: "Reactivate User", message: "Reactivate this user?", confirmLabel: "Reactivate" });
    if (!confirmed) return;
    try {
      await reactivateUser(id);
      onNotify("User reactivated", "success");
      loadUsers(role, status);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-brand-black">User Management</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + Add User
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        >
          <option value="">All Roles</option>
          <option value="Backoffice">Backoffice</option>
          <option value="GridOperator">Grid Operator</option>
        </select>

        <div className="flex overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                status === tab.key
                  ? "border-brand-green text-brand-green-dark"
                  : "border-transparent text-brand-muted hover:text-brand-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs flex-1 rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
      </div>

      <p className="mb-2 text-sm text-brand-muted">{filtered.length} users</p>

      <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-white-soft text-brand-black">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assigned Station</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-brand-muted">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-brand-muted">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <UserRoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "GridOperator"
                      ? "—"
                      : !u.stationId
                        ? "Not assigned"
                        : isLoadingStations
                          ? "Loading station..."
                          : stations.find((station) => station.id === u.stationId)?.stationName || `Station ${u.stationId}`}
                  </td>
                  <td className="px-4 py-3">
                    <UserStatusBadge isActive={u.isActive} />
                  </td>
                  <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onView(u.id)}
                        className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                      >
                        View
                      </button>
                      {u.isActive ? (
                        <>
                          <button
                            onClick={() => onView(u.id, true)}
                            className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                          >
                            Deactivate
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleReactivate(u.id)}
                          className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
