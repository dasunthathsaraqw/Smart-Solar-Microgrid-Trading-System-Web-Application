// ProsumersList.jsx — prosumer table with status tabs, a client-side search box and row actions.
// Defaults to the Pending Activation tab, the most relevant view for the Backoffice workflow.
import { useCallback, useEffect, useState } from "react";
import { deactivateProsumer, getProsumers, reactivateProsumer } from "../../api/prosumers";
import { useConfirm } from "../../components/confirmContext";
import StatusBadge from "./StatusBadge";

const TABS = [
  { key: "pending", label: "Pending Activation" },
  { key: "active", label: "Active" },
  { key: "deactivated", label: "Deactivated" },
];

export default function ProsumersList({ onAdd, onView, onNotify }) {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("pending");
  const [prosumers, setProsumers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadProsumers = useCallback(
    async (status) => {
      setIsLoading(true);
      try {
        const data = await getProsumers(status);
        setProsumers(data);
      } catch (err) {
        onNotify(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [onNotify]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on tab change; loading flag is set before the request
    loadProsumers(activeTab);
  }, [activeTab, loadProsumers]);

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
      loadProsumers(activeTab);
    } catch (err) {
      onNotify(err.message, "error");
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
      loadProsumers(activeTab);
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
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
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
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onView(p.nic)}
                        className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                      >
                        View
                      </button>
                      {p.status === "active" && (
                        <button
                          onClick={() => handleDeactivate(p.nic)}
                          className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                        >
                          Deactivate
                        </button>
                      )}
                      {p.status === "pending" && (
                        <button
                          onClick={() => handleReactivate(p.nic, true)}
                          className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                        >
                          Approve
                        </button>
                      )}
                      {p.status === "deactivated" && (
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
