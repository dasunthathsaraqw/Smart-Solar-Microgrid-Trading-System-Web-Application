import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../../api/auth";
import { getStationById } from "../../api/stations";
import { getSlots } from "../../api/slots";
import { updateSessionUser } from "../../utils/auth";
import SlotStatusBadge from "../slots/SlotStatusBadge";

export default function OperatorStationView() {
  const [station, setStation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnassigned, setIsUnassigned] = useState(false);
  const [error, setError] = useState("");
  const [slotsError, setSlotsError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setSlotsError("");
    setIsUnassigned(false);

    try {
      const currentUser = await getCurrentUser();
      updateSessionUser(currentUser);

      if (!currentUser.stationId) {
        setIsUnassigned(true);
        setStation(null);
        setSlots([]);
        return;
      }

      setIsUnassigned(false);
      
      try {
        const stationData = await getStationById(currentUser.stationId);
        setStation(stationData);
      } catch (err) {
        setError(err.message || "Failed to load station details.");
        setStation(null);
      }

      try {
        const slotsData = await getSlots({ stationId: currentUser.stationId });
        setSlots(slotsData);
      } catch (err) {
        setSlotsError(err.message || "Failed to load slots.");
        setSlots([]);
      }
      
    } catch (err) {
      setStation(null);
      setSlots([]);
      setError(err.message || "Failed to authenticate or load station details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refreshes persisted identity and live data on entry
    loadData();
  }, [loadData]);

  // Derived slot counts
  const [now] = useState(() => Date.now());
  const availableSlotsCount = slots.filter(s => !s.isBooked && new Date(s.endTime).getTime() > now).length;
  const bookedSlotsCount = slots.filter(s => s.isBooked).length;

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="operator-station-heading">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="operator-station-heading" className="text-2xl font-semibold text-brand-black">
            Station View
          </h2>
          <p className="mt-1 text-sm text-brand-muted">Operational details for your assigned station</p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <LoadingStationView />
      ) : isUnassigned ? (
        <div role="status" className="rounded-lg border-l-4 border-brand-green bg-brand-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-brand-black">No station assigned</h3>
          <p className="mt-2 text-sm text-brand-muted">
            Contact Backoffice to receive a station assignment.
          </p>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-red-500 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Error loading station</h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
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
                {slots.length > 0 && !slotsError && (
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
              <td className="px-4 py-3 sm:px-6 text-brand-black">{formatDate(slot.startTime)}</td>
              <td className="px-4 py-3 text-brand-black">{formatTime(slot.startTime)}</td>
              <td className="px-4 py-3 text-brand-black">{formatTime(slot.endTime)}</td>
              <td className="px-4 py-3 text-brand-black">{slot.capacityKw} kW</td>
              <td className="px-4 py-3 sm:pr-6">
                <SlotStatusBadge isBooked={slot.isBooked} endTime={slot.endTime} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
