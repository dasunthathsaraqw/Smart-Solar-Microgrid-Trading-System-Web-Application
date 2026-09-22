import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../../api/auth";
import { approveReservation, getReservations } from "../../api/reservations";
import { updateSessionUser } from "../../utils/auth";
import ReservationStatusBadge from "../reservations/ReservationStatusBadge";
import OperatorTransferDetail from "./OperatorTransferDetail";

const STATUS_TABS = [
  { id: "Approved", label: "Awaiting Transfer" },
  { id: "Pending", label: "Pending" },
  { id: "Completed", label: "Completed" },
  { id: "Cancelled", label: "Cancelled" },
];

export default function OperatorTransferMonitor() {
  const [activeTab, setActiveTab] = useState("Approved");
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnassigned, setIsUnassigned] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isProcessing, setIsProcessing] = useState(null);
  const [selectedReservationId, setSelectedReservationId] = useState(null);

  const loadTransfers = useCallback(async (status) => {
    setIsLoading(true);
    setError("");
    setActionError("");
    setIsUnassigned(false);

    try {
      const currentUser = await getCurrentUser();
      updateSessionUser(currentUser);

      if (!currentUser.stationId) {
        setIsUnassigned(true);
        setReservations([]);
        return;
      }

      setIsUnassigned(false);
      
      const data = await getReservations({ status });
      // The API returns either an array directly, or an object with items depending on pagination.
      // Based on getReservations it usually returns the raw array if unpaginated, or items if paginated.
      // Let's assume it returns an array based on standard Member 2 usage unless it has items.
      setReservations(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || "You do not have access to this station.");
      } else {
        setError(err.message || "Failed to load transfers.");
      }
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
    loadTransfers(activeTab);
  }, [activeTab, loadTransfers]);

  async function handleApprove(id) {
    setIsProcessing(id);
    setActionError("");
    try {
      await approveReservation(id);
      await loadTransfers(activeTab); // Refresh current list
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Failed to approve reservation.");
    } finally {
      setIsProcessing(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="transfer-monitor-heading">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="transfer-monitor-heading" className="text-2xl font-semibold text-brand-black">
            Transfer Monitor
          </h2>
          <p className="mt-1 text-sm text-brand-muted">Operational view of bookings for your assigned station</p>
        </div>
        <button
          type="button"
          onClick={() => loadTransfers(activeTab)}
          disabled={isLoading}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isUnassigned ? (
        <div role="status" className="rounded-lg border-l-4 border-brand-green bg-brand-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-brand-black">No station assigned</h3>
          <p className="mt-2 text-sm text-brand-muted">Contact Backoffice to receive a station assignment before monitoring transfers.</p>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-red-500 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Error loading transfers</h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <button
            onClick={() => loadTransfers(activeTab)}
            className="mt-4 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 border-b border-brand-border">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-brand-green text-brand-green-dark"
                      : "border-transparent text-brand-muted hover:border-brand-border hover:text-brand-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {actionError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{actionError}</p>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-white-soft text-brand-black">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-6">Prosumer</th>
                  <th scope="col" className="px-4 py-3">Slot Date & Time</th>
                  <th scope="col" className="px-4 py-3">Capacity</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 sm:pr-6">Action / Info</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-brand-muted">
                      Loading transfers...
                    </td>
                  </tr>
                ) : reservations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-brand-muted">
                      No {activeTab.toLowerCase()} reservations found.
                    </td>
                  </tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id} className="border-t border-brand-border">
                      <td className="px-4 py-3 sm:px-6">
                        <span className="block font-medium text-brand-black">{res.prosumerName}</span>
                        <span className="text-xs text-brand-muted">{res.prosumerNic}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-black">
                        {res.slotStartTime ? (
                          <>
                            <span className="block">{new Date(res.slotStartTime).toLocaleDateString()}</span>
                            <span className="text-xs text-brand-muted">
                              {new Date(res.slotStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        ) : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-brand-black">{res.capacityKw} kW</td>
                      <td className="px-4 py-3">
                        <ReservationStatusBadge status={res.status} />
                      </td>
                      <td className="px-4 py-3 sm:pr-6 text-brand-black text-sm">
                        <button
                          onClick={() => setSelectedReservationId(res.id)}
                          className="mr-3 rounded-md border border-brand-green px-3 py-1.5 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                        >
                          View Details
                        </button>
                        {activeTab === "Pending" && (
                          <button
                            onClick={() => handleApprove(res.id)}
                            disabled={isProcessing === res.id}
                            className="rounded-md bg-brand-green px-3 py-1.5 text-xs font-medium text-brand-white hover:bg-brand-green-dark disabled:opacity-50"
                          >
                            {isProcessing === res.id ? "Approving..." : "Approve"}
                          </button>
                        )}
                        {activeTab === "Approved" && (
                          <span className="text-xs text-brand-muted font-medium">Awaiting QR scanner transfer</span>
                        )}
                        {activeTab === "Completed" && (
                          <span className="text-xs text-brand-muted">Completed {res.completedAt ? new Date(res.completedAt).toLocaleDateString() : ""}</span>
                        )}
                        {activeTab === "Cancelled" && (
                          <span className="text-xs text-brand-muted">{res.cancellationReason || "Cancelled"}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {selectedReservationId && (
        <OperatorTransferDetail
          reservationId={selectedReservationId}
          onClose={() => setSelectedReservationId(null)}
        />
      )}
    </section>
  );
}
