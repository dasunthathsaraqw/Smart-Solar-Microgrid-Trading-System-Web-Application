// UsersList.jsx — user table with a role filter, Active/Deactivated status tabs, a client-side
// search box, a total count, and status-aware row actions. The backend is the sole authority on
// whether a deactivation is allowed (self / last-Backoffice); this view just shows its response.
import { useCallback, useEffect, useState } from "react";
import { deactivateUser, getUsers, reactivateUser } from "../../api/users";
import { getStations } from "../../api/stations";
import { useConfirm } from "../../components/confirmContext";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
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
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getStations()
      .then((data) => setStations(Array.isArray(data) ? data : []))
      .catch((err) => onNotify(err.message, "error"))
      .finally(() => setIsLoadingStations(false));
  }, [onNotify]);

  const loadUsers = useCallback(
    async (roleFilter, statusFilter) => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await getUsers({ role: roleFilter || undefined, status: statusFilter });
        setUsers(data);
      } catch (err) {
        setLoadError(err.message);
        setUsers([]);
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

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (user) => <UserRoleBadge role={user.role} /> },
    { key: "stationId", header: "Assigned Station", render: (user) => user.role !== "GridOperator"
      ? "—"
      : !user.stationId
        ? "Not assigned"
        : isLoadingStations
          ? "Loading station..."
          : stations.find((station) => station.id === user.stationId)?.stationName || `Station ${user.stationId}` },
    { key: "isActive", header: "Status", render: (user) => <UserStatusBadge isActive={user.isActive} /> },
    { key: "createdAt", header: "Created At", render: (user) => new Date(user.createdAt).toLocaleDateString() },
  ];

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
      <PageHeader title="User Management" actions={
        <button
          onClick={onAdd}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + Add User
        </button>
      } />

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

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(user) => user.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => loadUsers(role, status)}
        emptyMessage="No users found"
        actions={(user) => (
          <>
            <button
              type="button"
              onClick={() => onView(user.id)}
              className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
            >
              View
            </button>
            {user.isActive ? (
              <>
                <button
                  type="button"
                  onClick={() => onView(user.id, true)}
                  className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeactivate(user.id)}
                  className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                >
                  Deactivate
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleReactivate(user.id)}
                className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
              >
                Reactivate
              </button>
            )}
          </>
        )}
      />    </div>
  );
}
