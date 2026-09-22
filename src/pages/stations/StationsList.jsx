// StationsList.jsx — Backoffice station map and management list.
// Author: M.K.E Dharmarathne it23142732
import { useCallback, useEffect, useState } from "react";
import { deactivateStation, getStations, reactivateStation } from "../../api/stations";
import { useConfirm } from "../../components/confirmContext";
import StationMap from "../../components/StationMap";
import PageHeader from "../../components/ui/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import DataTable from "../../components/ui/DataTable";
import ErrorState from "../../components/ui/ErrorState";
import StationStatusBadge from "./StationStatusBadge";
import DeactivationBlockedDialog from "./DeactivationBlockedDialog";

const STATION_COLUMNS = [
  { key: "stationName", header: "Station Name" },
  { key: "latitude", header: "Latitude" },
  { key: "longitude", header: "Longitude" },
  { key: "capacityKw", header: "Capacity (kW)" },
  { key: "availableSlots", header: "Available Slots" },
  { key: "schedule", header: "Schedule" },
  { key: "isActive", header: "Status", render: (station) => <StationStatusBadge isActive={station.isActive} /> },
];

// Lists every server station on the map and filters the management table for display.
export default function StationsList({ onAdd, onView, onManageSlots, onNotify }) {
  const confirm = useConfirm();
  const [stations, setStations] = useState([]);
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("stationName");
  const [sortDir, setSortDir] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [blocked, setBlocked] = useState(null);

  // Refreshes the map and table from the Backoffice station endpoint.
  const loadStations = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      setStations(await getStations());
    } catch (err) {
      setStations([]);
      setLoadError(err.message);
      onNotify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial station request
    loadStations();
  }, [loadStations]);

  const term = search.trim().toLowerCase();
  const visible = stations
    .filter((station) => (status === "all" || station.isActive === (status === "active")) && station.stationName.toLowerCase().includes(term))
    .sort((a, b) => {
      const compared = sortBy === "stationName"
        ? a.stationName.localeCompare(b.stationName)
        : sortBy === "capacityKw"
          ? a.capacityKw - b.capacityKw
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? compared : -compared;
    });

  // Requests deactivation and displays the service's blocking reason when applicable.
  async function handleDeactivate(station) {
    const confirmed = await confirm({ title: "Deactivate Station", message: "Are you sure you want to deactivate this station?", confirmLabel: "Deactivate", destructive: true });
    if (!confirmed) return;
    try {
      await deactivateStation(station.id);
      onNotify("Station deactivated", "success");
      loadStations();
    } catch (err) {
      if (err.message === "Cannot deactivate: active reservations exist") setBlocked({ stationId: station.id, message: err.message });
      else onNotify(err.message, "error");
    }
  }

  // Asks the service to reactivate a station and refreshes the list.
  async function handleReactivate(station) {
    const confirmed = await confirm({ title: "Reactivate Station", message: "Reactivate this station?", confirmLabel: "Reactivate" });
    if (!confirmed) return;
    try {
      await reactivateStation(station.id);
      onNotify("Station reactivated", "success");
      loadStations();
    } catch (err) {
      onNotify(err.message, "error");
    }
  }

  return (
    <div>
      <PageHeader title="Microgrid Node Management" actions={
        <button type="button" onClick={onAdd} className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark">+ Add Station</button>
      } />
      <SectionCard title="Station map" subtitle="Active markers are colored; deactivated markers are gray." className="mb-6">
        {isLoading ? <p role="status" className="text-sm text-brand-muted">Loading station map...</p> : loadError ? <ErrorState message={loadError} onRetry={loadStations} /> : <StationMap stations={stations} onViewStation={onView} />}
      </SectionCard>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-brand-black">Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="ml-2 rounded-md border border-brand-border px-3 py-2">
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="all">All</option>
          </select>
        </label>
        <label className="text-sm text-brand-black">Sort by
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="ml-2 rounded-md border border-brand-border px-3 py-2">
            <option value="stationName">Name</option>
            <option value="capacityKw">Capacity</option>
            <option value="createdAt">Created date</option>
          </select>
        </label>
        <label className="text-sm text-brand-black">Order
          <select value={sortDir} onChange={(event) => setSortDir(event.target.value)} className="ml-2 rounded-md border border-brand-border px-3 py-2">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        <input type="search" aria-label="Search stations by name" placeholder="Search by station name" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full max-w-xs rounded-md border border-brand-border px-3 py-2 text-sm" />
      </div>
      <p className="mb-2 text-sm text-brand-muted">{visible.length} stations</p>
      <DataTable
        columns={STATION_COLUMNS}
        rows={visible}
        getRowKey={(station) => station.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={loadStations}
        emptyMessage="No stations found"
        actions={(station) => (
          <>
            <button type="button" onClick={() => onView(station.id)} className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft">View</button>
            <button type="button" onClick={() => onManageSlots(station.id)} className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft">Manage Slots</button>
            {station.isActive ? (
              <button type="button" onClick={() => handleDeactivate(station)} className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark">Deactivate</button>
            ) : (
              <button type="button" onClick={() => handleReactivate(station)} className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark">Reactivate</button>
            )}
          </>
        )}
      />
      {blocked && <DeactivationBlockedDialog stationId={blocked.stationId} message={blocked.message} onClose={() => setBlocked(null)} />}
    </div>
  );
}