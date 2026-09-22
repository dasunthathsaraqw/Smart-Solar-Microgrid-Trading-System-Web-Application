// StationSlotSummary.jsx — station slot counts from the slots API.
// Author: M.K.E Dharmarathne it23142732
import { useEffect, useState } from "react";
import { getAvailableSlotsByStation, getSlots } from "../../api/slots";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";

// Shows API slot totals and the API's seven-day available slot list count.
export default function StationSlotSummary({ stationId, isActive, onManageSlots }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  // Reloads the summary for the selected station without modifying slot rules.
  useEffect(() => {
    let active = true;
    Promise.all([getSlots({ stationId }), isActive ? getAvailableSlotsByStation(stationId) : Promise.resolve([])])
      .then(([slots, free]) => {
        if (active) {
          const now = Date.now();
          setSummary({ upcoming: slots.filter((slot) => new Date(slot.startTime).getTime() > now).length, booked: slots.filter((slot) => slot.isBooked).length, free: free.length });
          setError("");
        }
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [stationId, isActive, retry]);

  return (
    <div className="rounded-lg border border-brand-border bg-brand-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-brand-black">Slot summary</h3>
        {onManageSlots && <button type="button" onClick={() => onManageSlots(stationId)} className="text-sm font-medium text-brand-green hover:underline">Manage slots</button>}
      </div>
      {loading ? <LoadingState message="Loading slot summary..." /> : error ? <ErrorState message={error} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} /> : (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><dt className="text-sm text-brand-muted">Upcoming</dt><dd className="text-xl font-semibold text-brand-black">{summary.upcoming}</dd></div>
          <div><dt className="text-sm text-brand-muted">Booked</dt><dd className="text-xl font-semibold text-brand-black">{summary.booked}</dd></div>
          <div><dt className="text-sm text-brand-muted">Free within 7 days</dt><dd className="text-xl font-semibold text-brand-black">{isActive ? summary.free : "Unavailable"}</dd></div>
        </dl>
      )}
    </div>
  );
}
