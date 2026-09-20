// SlotsList.jsx — slot table with a station filter dropdown, Available/Booked/Past tabs,
// a client-side search box, a total count, and row actions.
import { useCallback, useEffect, useState } from "react";
import { getStations } from "../../api/stations";
import { deleteSlot, getSlots } from "../../api/slots";
import SlotStatusBadge from "./SlotStatusBadge";

const TABS = [
  { key: "available", label: "Available" },
  { key: "booked", label: "Booked" },
  { key: "past", label: "Past" },
];

function formatDuration(startTime, endTime) {
  const minutes = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining} min`;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

export default function SlotsList({ initialStationId, onAdd, onView, onNotify }) {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(initialStationId || "");
  const [activeTab, setActiveTab] = useState("available");
  const [slots, setSlots] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  // Captured once at mount rather than calling Date.now() directly during render.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    getStations("active")
      .then(setStations)
      .catch((err) => onNotify(err.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSlots = useCallback(
    async (stationId, status) => {
      setIsLoading(true);
      try {
        const data = await getSlots({ stationId: stationId || undefined, status });
        setSlots(data);
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
    loadSlots(selectedStationId, activeTab);
  }, [selectedStationId, activeTab, loadSlots]);

  const term = search.trim().toLowerCase();
  const filtered = term ? slots.filter((s) => s.stationName.toLowerCase().includes(term)) : slots;

  async function handleDelete(id) {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await deleteSlot(id);
      onNotify("Slot deleted", "success");
      loadSlots(selectedStationId, activeTab);
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-brand-black">Energy Slot Management</h2>
        <button
          onClick={() => onAdd(selectedStationId)}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + Add Slot
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedStationId}
          onChange={(e) => setSelectedStationId(e.target.value)}
          className="rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        >
          <option value="">All Stations</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.stationName}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by station name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs flex-1 rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
      </div>

      <div className="mb-4 flex overflow-x-auto">
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

      <p className="mb-2 text-sm text-brand-muted">{filtered.length} slots</p>

      <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-white-soft text-brand-black">
            <tr>
              <th className="px-4 py-3">Station</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Capacity (kW)</th>
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
                  No slots found
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const isPast = new Date(s.endTime).getTime() <= now;
                const canModify = !s.isBooked && !isPast;
                return (
                  <tr key={s.id} className="border-t border-brand-border">
                    <td className="px-4 py-3">{s.stationName}</td>
                    <td className="px-4 py-3">{new Date(s.slotDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3">{new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3">{formatDuration(s.startTime, s.endTime)}</td>
                    <td className="px-4 py-3">{s.capacityKw}</td>
                    <td className="px-4 py-3">
                      <SlotStatusBadge isBooked={s.isBooked} endTime={s.endTime} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onView(s.id)}
                          className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                        >
                          View
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
