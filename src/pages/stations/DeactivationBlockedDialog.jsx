// DeactivationBlockedDialog.jsx — explains a service-blocked station deactivation.
// Author: M.K.E Dharmarathne it23142732
import { useEffect, useState } from "react";
import { getReservations } from "../../api/reservations";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";

// Lists the station's Approved reservations for information only.
export default function DeactivationBlockedDialog({ stationId, message, onClose }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  // Fetches the server's Approved list without changing any reservation.
  useEffect(() => {
    let active = true;
    getReservations({ stationId, status: "Approved" })
      .then((data) => { if (active) { setReservations(data); setError(""); } })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [stationId, retry]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="blocked-title" className="fixed inset-0 z-[1000] flex items-center justify-center bg-brand-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-brand-white p-6 shadow-xl">
        <h2 id="blocked-title" className="text-xl font-semibold text-brand-black">Station deactivation blocked</h2>
        <p role="alert" className="mt-2 text-sm text-brand-black">{message}</p>
        <h3 className="mt-5 text-sm font-semibold text-brand-black">Approved reservations</h3>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }} /> : reservations.length === 0 ? <EmptyState message="No Approved reservations were returned." /> : (
          <ul className="mt-2 space-y-2">
            {reservations.map((reservation) => <li key={reservation.id} className="rounded border border-brand-border p-3 text-sm text-brand-black">{reservation.prosumerName} · {new Date(reservation.slotStartTime).toLocaleString()} · {reservation.capacityKw} kW</li>)}
          </ul>
        )}
        <button type="button" onClick={onClose} className="mt-5 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark">Close</button>
      </div>
    </div>
  );
}
