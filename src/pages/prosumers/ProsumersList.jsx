// ProsumersList.jsx — prosumer table with lifecycle tabs, counts, search and row actions.
import { useCallback, useEffect, useState } from "react";
import {
  deactivateProsumer,
  getPendingDeactivations,
  getPendingProsumers,
  getProsumers,
  reactivateProsumer,
} from "../../api/prosumers";
import { useConfirm } from "../../components/confirmContext";
import StatusBadge from "./StatusBadge";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending approval" },
  { key: "requests", label: "Deactivation requests" },
  { key: "active", label: "Active" },
  { key: "deactivated", label: "Deactivated" },
];

const emptyGroups = { all: [], pending: [], requests: [], active: [], deactivated: [] };

export default function ProsumersList({ initialTab = "pending", onAdd, onView, onNotify }) {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [groups, setGroups] = useState(emptyGroups);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [approvingNic, setApprovingNic] = useState(null);

  // Refreshes each tab from API data; the two request queues use their dedicated endpoints.
  const loadProsumers = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [all, pending, requests] = await Promise.all([
        getProsumers(),
        getPendingProsumers(),
        getPendingDeactivations(),
      ]);
      // These filters only group API records for display; the API owns lifecycle transitions.
      setGroups({
        all,
        pending,
        requests,
        active: all.filter((p) => p.isActive && !p.deactivationRequested),
        deactivated: all.filter((p) => !p.isActive && p.deactivationRequested),
      });
    } catch (err) {
      setGroups(emptyGroups);
      setLoadError(err.message);
      onNotify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch all tab counts on mount
    loadProsumers();
  }, [loadProsumers]);

  const prosumers = groups[activeTab];
  const term = search.trim().toLowerCase();
  const filtered = term
    ? prosumers.filter((p) => p.nic.toLowerCase().includes(term) || p.name.toLowerCase().includes(term))
    : prosumers;

  async function handleDeactivate(nic) {
    const confirmed = await confirm({
      title: "Deactivate Prosumer",
      message: `Are you sure you want to deactivate prosumer ${nic}?`,
      confirmLabel: "Deactivate",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deactivateProsumer(nic);
      onNotify("Prosumer deactivated", "success");
      loadProsumers();
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  // Confirms an owner's deactivation request, then lets the API perform the transition.
  async function handleApproveDeactivation(nic) {
    const confirmed = await confirm({
      title: "Approve deactivation request",
      message: `Approve the deactivation request for ${nic}? They will no longer be able to log in.`,
      confirmLabel: "Approve deactivation",
      destructive: true,
    });
    if (!confirmed) return;

    setApprovingNic(nic);
    try {
      await deactivateProsumer(nic);
      onNotify("Deactivation request approved", "success");
      await loadProsumers();
    } catch (err) {
      onNotify(err.message, "error");
    } finally {
      setApprovingNic(null);
    }
  }

  async function handleReactivate(nic, isApprove) {
    const confirmed = await confirm({
      title: isApprove ? "Approve Prosumer" : "Reactivate Prosumer",
      message: isApprove ? `Approve prosumer ${nic}?` : `Reactivate prosumer ${nic}?`,
      confirmLabel: isApprove ? "Approve" : "Reactivate",
    });
    if (!confirmed) return;
    try {
      await reactivateProsumer(nic);
      onNotify(isApprove ? "Prosumer approved" : "Prosumer reactivated", "success");
      loadProsumers();
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-brand-black">Prosumer Management</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + Add Prosumer
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-x-auto" role="tablist" aria-label="Prosumer status">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-brand-green text-brand-green-dark"
                  : "border-transparent text-brand-muted hover:text-brand-black"
              }`}
            >
              <span>{tab.label}</span>
              <span className="rounded-full bg-brand-white-soft px-2 py-0.5 text-xs text-brand-black">
                {isLoading ? "…" : groups[tab.key].length}
              </span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by NIC or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-white-soft text-brand-black">
            <tr>
              <th className="px-4 py-3">NIC</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Panel kW</th>
              <th className="px-4 py-3">Status</th>
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
            ) : loadError ? (
              <tr>
                <td colSpan={7} role="alert" className="px-4 py-6 text-center text-red-700">
                  {loadError}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-brand-muted">
                  No prosumers found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.nic} className="border-t border-brand-border">
                  <td className="px-4 py-3">{p.nic}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.email}</td>
                  <td className="px-4 py-3">{p.contactNumber}</td>
                  <td className="px-4 py-3">{p.panelCapacityKw}</td>
                  <td className="px-4 py-3">
                    <StatusBadge isActive={p.isActive} deactivationRequested={p.deactivationRequested} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onView(p.nic)}
                        className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                      >
                        View
                      </button>
                      {p.isActive && !p.deactivationRequested && (
                        <button
                          onClick={() => handleDeactivate(p.nic)}
                          className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                        >
                          Deactivate
                        </button>
                      )}
                      {activeTab === "requests" && p.isActive && p.deactivationRequested && (
                        <button
                          type="button"
                          onClick={() => handleApproveDeactivation(p.nic)}
                          disabled={approvingNic !== null}
                          className="rounded-md bg-brand-black px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-black-soft disabled:opacity-60"
                        >
                          {approvingNic === p.nic ? "Approving..." : "Approve deactivation"}
                        </button>
                      )}
                      {!p.isActive && !p.deactivationRequested && (
                        <button
                          onClick={() => handleReactivate(p.nic, true)}
                          className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                        >
                          Approve
                        </button>
                      )}
                      {!p.isActive && p.deactivationRequested && (
                        <button
                          onClick={() => handleReactivate(p.nic, false)}
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
