// SlotsList.jsx — slot table with a station filter dropdown, Available/Booked/Past tabs,
// a client-side search box, a total count, and row actions.
import { useCallback, useEffect, useState } from "react";
import { getStations } from "../../api/stations";
import { deleteSlot, getSlots } from "../../api/slots";
import { useConfirm } from "../../components/confirmContext";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import { formatLocalDate, formatLocalTime } from "../../utils/timeUtils";
import SlotStatusBadge from "./SlotStatusBadge";

const TABS = [
  { key: "available", label: "Available" },
  { key: "booked", label: "Booked" },
  { key: "past", label: "Past" },
];

// Formats an API slot's duration for display.
function formatDuration(startTime, endTime) {
  const minutes = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining} min`;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

const SLOT_COLUMNS = [
  { key: "stationName", header: "Station" },
  { key: "date", header: "Date", render: (slot) => formatLocalDate(slot.startTime) },
  { key: "start", header: "Start", render: (slot) => formatLocalTime(slot.startTime) },
  { key: "end", header: "End", render: (slot) => formatLocalTime(slot.endTime) },
  { key: "duration", header: "Duration", render: (slot) => formatDuration(slot.startTime, slot.endTime) },
  { key: "capacityKw", header: "Capacity (kW)" },
];

export default function SlotsList({ initialStationId, onAdd, onView, onNotify }) {
  const confirm = useConfirm();
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(initialStationId || "");
  const [activeTab, setActiveTab] = useState("available");
  const [slots, setSlots] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getStations("active")
      .then(setStations)
      .catch((err) => onNotify(err.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSlots = useCallback(
    async (stationId, status) => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await getSlots({ stationId: stationId || undefined, status });
        setSlots(data);
      } catch (err) {
        setLoadError(err.message);
        setSlots([]);
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
  const columns = [...SLOT_COLUMNS, { key: "status", header: "Status", render: (slot) => <SlotStatusBadge isBooked={slot.isBooked} status={activeTab} /> }];

  async function handleDelete(id) {
    const confirmed = await confirm({
      title: "Delete Slot",
      message: "This will permanently delete the slot. This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;
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
      <PageHeader title="Energy Slot Management" actions={
        <button
          onClick={() => onAdd(selectedStationId)}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + Add Slot
        </button>
      } />

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

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(slot) => slot.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => loadSlots(selectedStationId, activeTab)}
        emptyMessage="No slots found"
        actions={(slot) => (
          <>
            <button
              type="button"
              onClick={() => onView(slot.id)}
              className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
            >
              View
            </button>
            {!slot.isBooked && (
              <button
                type="button"
                onClick={() => handleDelete(slot.id)}
                className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
              >
                Delete
              </button>
            )}
          </>
        )}
      />    </div>
  );
}
