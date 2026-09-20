// StationsList.jsx — station table with Active/Deactivated tabs, a client-side search box,
// a total count, and row actions. Defaults to the Active tab.
import { useCallback, useEffect, useState } from "react";
import { deactivateStation, getStations, reactivateStation } from "../../api/stations";
import { useConfirm } from "../../components/confirmContext";
import StationStatusBadge from "./StationStatusBadge";

const TABS = [
  { key: "active", label: "Active" },
  { key: "deactivated", label: "Deactivated" },
];

export default function StationsList({ onAdd, onView, onManageSlots, onNotify }) {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("active");
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadStations = useCallback(
    async (status) => {
      setIsLoading(true);
      try {
        const data = await getStations(status);
        setStations(data);
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
    loadStations(activeTab);
  }, [activeTab, loadStations]);

  const term = search.trim().toLowerCase();
  const filtered = term ? stations.filter((s) => s.stationName.toLowerCase().includes(term)) : stations;

  async function handleDeactivate(id) {
    const confirmed = await confirm({
      title: "Deactivate Station",
      message: "Are you sure you want to deactivate this station?",
      confirmLabel: "Deactivate",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deactivateStation(id);
      onNotify("Station deactivated", "success");
      loadStations(activeTab);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  async function handleReactivate(id) {
    const confirmed = await confirm({ title: "Reactivate Station", message: "Reactivate this station?", confirmLabel: "Reactivate" });
    if (!confirmed) return;
    try {
      await reactivateStation(id);
      onNotify("Station reactivated", "success");
      loadStations(activeTab);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-brand-black">Microgrid Node Management</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + Add Station
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
          placeholder="Search by station name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
      </div>

      <p className="mb-2 text-sm text-brand-muted">{filtered.length} stations</p>

      <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-white-soft text-brand-black">
            <tr>
              <th className="px-4 py-3">Station Name</th>
              <th className="px-4 py-3">Latitude</th>
              <th className="px-4 py-3">Longitude</th>
              <th className="px-4 py-3">Capacity (kW)</th>
              <th className="px-4 py-3">Available Slots</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-brand-muted">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-brand-muted">
                  No stations found
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">{s.stationName}</td>
                  <td className="px-4 py-3">{s.latitude}</td>
                  <td className="px-4 py-3">{s.longitude}</td>
                  <td className="px-4 py-3">{s.capacityKw}</td>
                  <td className="px-4 py-3">{s.availableSlots}</td>
                  <td className="px-4 py-3">{s.schedule}</td>
                  <td className="px-4 py-3">
                    <StationStatusBadge isActive={s.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onView(s.id)}
                        className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onManageSlots(s.id)}
                        className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                      >
                        Manage Slots
                      </button>
                      {s.isActive ? (
                        <button
                          onClick={() => handleDeactivate(s.id)}
                          className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(s.id)}
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
