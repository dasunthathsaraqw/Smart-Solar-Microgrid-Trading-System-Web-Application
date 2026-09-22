import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../../api/auth";
import { getOperatorTransactionHistory } from "../../api/reservations";
import { updateSessionUser } from "../../utils/auth";
import ReservationStatusBadge from "../reservations/ReservationStatusBadge";

const PAGE_SIZES = [10, 25, 50];

const initialFilters = {
  dateFrom: "",
  dateTo: "",
};

export default function OperatorTransactionHistory() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [result, setResult] = useState({ items: [], totalCount: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isUnassigned, setIsUnassigned] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (currentFilters, currentPage, currentPageSize) => {
    setIsLoading(true);
    setError("");
    setIsUnassigned(false);

    try {
      const currentUser = await getCurrentUser();
      updateSessionUser(currentUser);

      if (!currentUser.stationId) {
        setIsUnassigned(true);
        setResult({ items: [], totalCount: 0, totalPages: 0 });
        return;
      }

      setIsUnassigned(false);

      const params = {
        dateFrom: currentFilters.dateFrom ? `${currentFilters.dateFrom}T00:00:00Z` : undefined,
        dateTo: currentFilters.dateTo ? `${currentFilters.dateTo}T23:59:59Z` : undefined,
        page: currentPage,
        pageSize: currentPageSize,
      };

      const data = await getOperatorTransactionHistory(params);
      setResult(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || "You do not have access to this station's history.");
      } else {
        setError(err.message || "Failed to load transaction history.");
      }
      setResult({ items: [], totalCount: 0, totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load of transaction history
    loadHistory(initialFilters, 1, 10);
  }, [loadHistory]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadHistory(filters, 1, pageSize);
  }

  function handleReset() {
    setFilters(initialFilters);
    setPage(1);
    loadHistory(initialFilters, 1, pageSize);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
    loadHistory(filters, newPage, pageSize);
  }

  function handlePageSizeChange(e) {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setPage(1);
    loadHistory(filters, 1, newSize);
  }

  const { items, totalCount, totalPages } = result;
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

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
        <div role="status" className="rounded-lg border-l-4 border-brand-green bg-brand-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-brand-black">No station assigned</h3>
          <p className="mt-2 text-sm text-brand-muted">Contact Backoffice to receive a station assignment.</p>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-red-500 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Error loading history</h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <button
            onClick={() => loadHistory(filters, page, pageSize)}
            className="mt-4 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSearch} className="mb-6 space-y-3 rounded-lg bg-brand-white-soft p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-black">Date From</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-black">Date To</label>
                <input
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

          <p className="mb-2 text-sm text-brand-muted">
            Showing {rangeStart}–{rangeEnd} of {totalCount} results
          </p>

          <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
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
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-brand-muted">
                      Loading history...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-brand-muted">
                      {(filters.dateFrom || filters.dateTo) 
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && totalPages > 0 && (
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
                  disabled={page <= 1}
                  className="rounded-md border border-brand-green px-3 py-1 text-sm font-medium text-brand-green hover:bg-brand-green-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-brand-black">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-md border border-brand-green px-3 py-1 text-sm font-medium text-brand-green hover:bg-brand-green-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
