import { useEffect, useState } from "react";
import { getReservationById } from "../../api/reservations";
import ReservationStatusBadge from "../reservations/ReservationStatusBadge";

export default function OperatorTransferDetail({ reservationId, onClose }) {
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (!reservationId) return;

    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError("");

    getReservationById(reservationId)
      .then((data) => {
        if (isMounted) {
          setReservation(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err.response?.status === 403) {
            setError("You do not have access to view this reservation.");
          } else if (err.response?.status === 404) {
            setError("Reservation not found or no longer available.");
          } else {
            setError(err.message || "Failed to load reservation details.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reservationId, retryTrigger]);

  if (!reservationId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/50 p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-brand-white shadow-xl flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-border bg-brand-white px-6 py-4">
          <h2 id="detail-title" className="text-xl font-semibold text-brand-black">Transfer Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-brand-muted hover:bg-brand-white-soft hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-green"
            aria-label="Close detail view"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1">
          {isLoading ? (
            <div className="flex justify-center p-8 text-brand-muted">Loading reservation details...</div>
          ) : error ? (
            <div className="rounded-lg border border-red-500 bg-red-50 p-6 text-center">
              <p className="font-medium text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => setRetryTrigger((c) => c + 1)}
                className="mt-4 rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          ) : reservation ? (
            <div className="space-y-6">
              
              {/* Status Operational Context Guidance */}
              {reservation.status === "Pending" && (
                <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">This reservation is pending approval in your Monitor list.</p>
                </div>
              )}
              {reservation.status === "Approved" && (
                <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">Awaiting QR verification / physical transfer.</p>
                  <p className="mt-1 text-xs text-blue-600">Complete this transfer using the operator mobile QR scanner.</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                
                {/* Identity */}
                <div className="rounded-lg border border-brand-border p-4 bg-brand-white-soft">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-muted">Prosumer Identity</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-brand-muted">Name</dt>
                      <dd className="text-sm font-medium text-brand-black">{reservation.prosumerName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brand-muted">NIC</dt>
                      <dd className="text-sm font-medium text-brand-black">{reservation.prosumerNic}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brand-muted">Reservation ID</dt>
                      <dd className="text-xs font-medium text-brand-black break-all">{reservation.id}</dd>
                    </div>
                  </dl>
                </div>

                {/* Station & Slot */}
                <div className="rounded-lg border border-brand-border p-4 bg-brand-white-soft">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-muted">Slot & Station</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-brand-muted">Station</dt>
                      <dd className="text-sm font-medium text-brand-black">
                        {reservation.stationName} <span className="text-xs font-normal text-brand-muted">({reservation.stationId})</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brand-muted">Time</dt>
                      <dd className="text-sm font-medium text-brand-black">
                        {reservation.slotStartTime ? new Date(reservation.slotStartTime).toLocaleString() : "N/A"}
                        {" - "}
                        {reservation.slotEndTime ? new Date(reservation.slotEndTime).toLocaleTimeString() : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brand-muted">Capacity</dt>
                      <dd className="text-sm font-medium text-brand-black">{reservation.capacityKw} kW</dd>
                    </div>
                  </dl>
                </div>

              </div>

              {/* Lifecycle Info */}
              <div className="rounded-lg border border-brand-border p-4 bg-brand-white-soft">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">Lifecycle</h3>
                  <ReservationStatusBadge status={reservation.status} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-brand-muted">Created At</dt>
                    <dd className="text-sm font-medium text-brand-black">
                      {reservation.createdAt ? new Date(reservation.createdAt).toLocaleString() : "N/A"}
                    </dd>
                    {reservation.createdBy && <dd className="text-xs text-brand-muted">by {reservation.createdBy}</dd>}
                  </div>

                  {(reservation.approvedAt || reservation.status === "Approved" || reservation.status === "Completed") && (
                    <div>
                      <dt className="text-xs text-brand-muted">Approved At</dt>
                      <dd className="text-sm font-medium text-brand-black">
                        {reservation.approvedAt ? new Date(reservation.approvedAt).toLocaleString() : "N/A"}
                      </dd>
                      {reservation.approvedBy && <dd className="text-xs text-brand-muted">by {reservation.approvedBy}</dd>}
                    </div>
                  )}

                  {reservation.status === "Completed" && (
                    <div>
                      <dt className="text-xs text-brand-muted">Completed At</dt>
                      <dd className="text-sm font-medium text-brand-black">
                        {reservation.completedAt ? new Date(reservation.completedAt).toLocaleString() : "N/A"}
                      </dd>
                      {reservation.completedBy && <dd className="text-xs text-brand-muted">by {reservation.completedBy}</dd>}
                    </div>
                  )}

                  {reservation.status === "Cancelled" && (
                    <div className="col-span-1 sm:col-span-2 rounded-md bg-white p-3 border border-brand-border">
                      <dt className="text-xs text-brand-muted">Cancelled At</dt>
                      <dd className="text-sm font-medium text-brand-black">
                        {reservation.cancelledAt ? new Date(reservation.cancelledAt).toLocaleString() : "N/A"}
                      </dd>
                      {reservation.cancelledBy && <dd className="text-xs text-brand-muted mb-2">by {reservation.cancelledBy}</dd>}
                      
                      <dt className="text-xs text-brand-muted">Reason</dt>
                      <dd className="text-sm font-medium text-brand-black">{reservation.cancellationReason || "No reason provided."}</dd>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
