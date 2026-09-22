import { useEffect, useState } from "react";
import { getOperatorTransactionHistory } from "../../api/reservations";
import ReservationStatusBadge from "../reservations/ReservationStatusBadge";
import OperatorTransferDetail from "./OperatorTransferDetail";
import { useOperatorContext } from "./OperatorContext";
import OperatorUnassignedState from "./OperatorUnassignedState";

const PAGE_SIZES = [10, 25, 50];

const initialFilters = {
  dateFrom: "",
  dateTo: "",
};

// Shows completed reservations for the assigned station using the API's paged history response.
export default function OperatorTransactionHistory() {
  const {
    isUnassigned,
    isLoading: contextLoading,
    error: contextError,
    refreshOperatorContext,
  } = useOperatorContext();

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [result, setResult] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Fetches the applied UTC date range and ignores responses from superseded requests.
  useEffect(() => {
    if (contextLoading || contextError || isUnassigned) return;

    let active = true;
    const params = {
      dateFrom: appliedFilters.dateFrom ? `${appliedFilters.dateFrom}T00:00:00.000Z` : undefined,
      dateTo: appliedFilters.dateTo ? `${appliedFilters.dateTo}T23:59:59.999Z` : undefined,
      page,
      pageSize,
    };

    // Loads one page while preserving the API's error message for failed requests.
    async function loadHistory() {
      setIsHistoryLoading(true);
      setHistoryError("");
      try {
        const data = await getOperatorTransactionHistory(params);
        if (active) setResult(data);
      } catch (err) {
        if (active) setHistoryError(err.message || "Failed to load transaction history.");
      } finally {
        if (active) setIsHistoryLoading(false);
      }
    }

    loadHistory();
    return () => { active = false; };
  }, [appliedFilters, page, pageSize, contextLoading, contextError, isUnassigned, retryTrigger]);

  // Updates the draft date range without changing the displayed results.
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  // Applies the draft filters and returns to the first page.
  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  // Clears the draft and applied filters and returns to the first page.
  function handleReset() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  }

  // Requests the selected page with the currently applied filters.
  function handlePageChange(newPage) {
    setPage(newPage);
  }

  // Changes the page size and restarts pagination.
  function handlePageSizeChange(e) {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setPage(1);
  }

  const { items, totalCount, totalPages, hasNextPage, hasPreviousPage } = result;
  const rangeStart = totalCount === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const rangeEnd = Math.min(result.page * result.pageSize, totalCount);

  // Refreshes assignment context and retries the current history page.
  const handleRefresh = async () => {
    await refreshOperatorContext();
    setRetryTrigger((current) => current + 1);
  };

  const isLoading = contextLoading || isHistoryLoading;
  const error = contextError || historyError;

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="operator-history-heading">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="operator-history-heading" className="text-2xl font-semibold text-brand-black">
            Transaction History
          </h2>
          <p className="mt-1 text-sm text-brand-muted">Completed energy transfers for your assigned station</p>
        </div>
      </div>

      {isUnassigned ? (
        <OperatorUnassignedState />
      ) : (
        <>
          <form onSubmit={handleSearch} className="mb-6 space-y-3 rounded-lg bg-brand-white-soft p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="history-date-from" className="mb-1 block text-sm font-medium text-brand-black">Date From (UTC)</label>
                <input
                  id="history-date-from"
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                />
              </div>
              <div>
                <label htmlFor="history-date-to" className="mb-1 block text-sm font-medium text-brand-black">Date To (UTC)</label>
                <input
                  id="history-date-to"
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
                disabled={isLoading}
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green-soft"
                disabled={isLoading}
              >
                Clear Filters
              </button>
            </div>
          </form>

          {error && (
            <div role="alert" className="mb-6 rounded-lg border border-red-500 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Error loading history</h3>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-4 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
              >
                Retry
              </button>
            </div>
          )}

          {!error && !isLoading && <p className="mb-2 text-sm text-brand-muted">
            Showing {rangeStart}–{rangeEnd} of {totalCount} results
          </p>}

          {!error && <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-white-soft text-brand-black">
                <tr>
                  <th scope="col" className="px-4 py-3">Completed Date</th>
                  <th scope="col" className="px-4 py-3">Prosumer</th>
                  <th scope="col" className="px-4 py-3">Station</th>
                  <th scope="col" className="px-4 py-3">Slot Time</th>
                  <th scope="col" className="px-4 py-3">Capacity</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Completed By</th>
                  <th scope="col" className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-brand-muted">
                      Loading history...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-brand-muted">
                      {(appliedFilters.dateFrom || appliedFilters.dateTo)
                        ? "No completed energy transfers matched the selected period."
                        : "No completed energy transfers found."}
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="border-t border-brand-border">
                      <td className="px-4 py-3 text-brand-black">
                        {r.completedAt ? new Date(r.completedAt).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-brand-black block">{r.prosumerName}</span>
                        <span className="text-xs text-brand-muted">{r.prosumerNic}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-black">{r.stationName}</td>
                      <td className="px-4 py-3 text-brand-black">
                        {r.slotStartTime ? new Date(r.slotStartTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-brand-black">{r.capacityKw} kW</td>
                      <td className="px-4 py-3">
                        <ReservationStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-brand-black text-xs">{r.completedBy || "System"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedReservationId(r.id)}
                          className="rounded-md border border-brand-green px-3 py-1.5 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>}

          {!error && !isLoading && totalPages > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-brand-black">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="rounded-md border border-brand-border px-2 py-1 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!hasPreviousPage}
                  className="rounded-md border border-brand-green px-3 py-1 text-sm font-medium text-brand-green hover:bg-brand-green-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-brand-black">
                  Page {result.page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!hasNextPage}
                  className="rounded-md border border-brand-green px-3 py-1 text-sm font-medium text-brand-green hover:bg-brand-green-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
