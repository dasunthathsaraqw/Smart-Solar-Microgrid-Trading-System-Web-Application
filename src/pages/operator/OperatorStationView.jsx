import { useCallback, useEffect, useState } from "react";
import { getSlots } from "../../api/slots";
import SlotStatusBadge from "../slots/SlotStatusBadge";
import { formatLocalDate, formatLocalTime } from "../../utils/timeUtils";
import { useOperatorContext } from "./OperatorContext";
import OperatorUnassignedState from "./OperatorUnassignedState";
import PageHeader from "../../components/ui/PageHeader";
import ErrorState from "../../components/ui/ErrorState";
import StationMap from "../../components/StationMap";
import SectionCard from "../../components/ui/SectionCard";

export default function OperatorStationView() {
  const {
    currentUser: operator,
    assignedStation: station,
    isUnassigned,
    isLoading: contextLoading,
    error: contextError,
    stationError,
    refreshOperatorContext,
    notify
  } = useOperatorContext();

  const [slots, setSlots] = useState([]);
  const [availableSlotsCount, setAvailableSlotsCount] = useState(0);
  const [slotsError, setSlotsError] = useState("");
  const [isSlotsLoading, setIsSlotsLoading] = useState(true);

  const loadSlots = useCallback(async () => {
    if (isUnassigned || !operator?.stationId) {
      setSlots([]);
      setAvailableSlotsCount(0);
      setIsSlotsLoading(false);
      return;
    }

    setIsSlotsLoading(true);
    setSlotsError("");

    try {
      // The API computes availability using server time and slot state.
      const [slotsData, availableSlots] = await Promise.all([
        getSlots({ stationId: operator.stationId }),
        getSlots({ stationId: operator.stationId, status: "available" }),
      ]);
      setSlots(slotsData);
      setAvailableSlotsCount(availableSlots.length);
    } catch (err) {
      if (err.response?.status === 403) {
        setSlotsError("Access denied. Your station assignment may have changed.");
      } else {
        setSlotsError(err.message || "Failed to load slots.");
      }
      setSlots([]);
      setAvailableSlotsCount(0);
    } finally {
      setIsSlotsLoading(false);
    }
  }, [operator, isUnassigned]);

  useEffect(() => {
    if (!contextLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSlots();
    }
  }, [contextLoading, loadSlots]);

  const handleRefresh = async () => {
    await refreshOperatorContext();
    await loadSlots();
    notify("Station view refreshed.");
  };

  const isLoading = contextLoading || isSlotsLoading;
  const error = contextError || stationError;

  // Booked count is a display total of the API's persisted booking flags.
  const bookedSlotsCount = slots.filter(s => s.isBooked).length;

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="operator-station-heading">
      <PageHeader id="operator-station-heading" title="Station View" subtitle="Operational details for your assigned station" actions={
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      } />

      {isLoading ? (
        <LoadingStationView />
      ) : isUnassigned ? (
        <OperatorUnassignedState />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRefresh} retryLabel={error.includes("Access denied") ? "Refresh assignment" : "Retry"} />
      ) : station ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-brand-border bg-brand-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-black">Station Status</h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-brand-muted">Name</dt>
                  <dd className="mt-1 text-sm text-brand-black">{station.stationName || station.name || "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-brand-muted">ID</dt>
                  <dd className="mt-1 text-sm break-all text-brand-black">{station.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-brand-muted">Status</dt>
                  <dd className="mt-1 text-sm text-brand-black">{station.isActive ? "Active" : "Inactive"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-brand-muted">Capacity</dt>
                  <dd className="mt-1 text-sm text-brand-black">{station.capacityKw} kW</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-brand-muted">Schedule</dt>
                  <dd className="mt-1 text-sm text-brand-black">{station.schedule || "N/A"}</dd>
                </div>
              </dl>
            </div>
            
            <div className="rounded-lg border border-brand-border bg-brand-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-black">Location & Summary</h3>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-brand-muted">Coordinates</dt>
                  <dd className="mt-1 text-sm text-brand-black">
                    {station.latitude != null && station.longitude != null 
                      ? `${station.latitude}, ${station.longitude}` 
                      : "Not available"}
                  </dd>
                </div>
                {!slotsError && (
                  <div className="flex gap-6">
                    <div>
                      <dt className="text-sm font-medium text-brand-muted">Future Available Slots</dt>
                      <dd className="mt-1 text-lg font-semibold text-brand-green-dark">{availableSlotsCount}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-brand-muted">Booked Slots</dt>
                      <dd className="mt-1 text-lg font-semibold text-brand-black">{bookedSlotsCount}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <SectionCard title="Station location" subtitle="Map of your assigned station" className="mb-8">
            <StationMap stations={[station]} readOnly />
          </SectionCard>

          <div className="rounded-lg border border-brand-border bg-brand-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-brand-border px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-brand-black">Operational Slots</h3>
                <p className="mt-1 text-sm text-brand-muted">All slots for this station.</p>
              </div>
              <div className="mt-2 text-sm text-brand-muted sm:mt-0">
                {slots.length} total
              </div>
            </div>
            
            {slotsError ? (
              <div className="p-4 sm:p-6">
                <p className="text-sm text-red-600">{slotsError}</p>
              </div>
            ) : (
              <SlotsTable slots={slots} />
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function SlotsTable({ slots }) {
  if (!slots || slots.length === 0) {
    return (
      <div className="px-4 py-10 text-center sm:px-6">
        <p className="font-medium text-brand-black">No slots available</p>
        <p className="mt-1 text-sm text-brand-muted">This station does not have any slots configured.</p>
      </div>
    );
  }

  // Sort slots by start time
  const sortedSlots = [...slots].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-brand-white-soft text-brand-black">
          <tr>
            <th scope="col" className="px-4 py-3 sm:px-6">Date</th>
            <th scope="col" className="px-4 py-3">Start Time</th>
            <th scope="col" className="px-4 py-3">End Time</th>
            <th scope="col" className="px-4 py-3">Capacity</th>
            <th scope="col" className="px-4 py-3 sm:pr-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedSlots.map((slot) => (
            <tr key={slot.id} className="border-t border-brand-border">
              <td className="px-4 py-3 sm:px-6 text-brand-black">{formatLocalDate(slot.startTime)}</td>
              <td className="px-4 py-3 text-brand-black">{formatLocalTime(slot.startTime)}</td>
              <td className="px-4 py-3 text-brand-black">{formatLocalTime(slot.endTime)}</td>
              <td className="px-4 py-3 text-brand-black">{slot.capacityKw} kW</td>
              <td className="px-4 py-3 sm:pr-6">
                      <SlotStatusBadge isBooked={slot.isBooked} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingStationView() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading station view</span>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg border border-brand-border bg-brand-white" />
        <div className="h-64 animate-pulse rounded-lg border border-brand-border bg-brand-white" />
      </div>
      <div className="h-96 animate-pulse rounded-lg border border-brand-border bg-brand-white" />
    </div>
  );
}
