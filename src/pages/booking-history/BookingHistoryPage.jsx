// BookingHistoryPage.jsx — searchable, filterable, paginated booking history. Every search
// (including page/size/sort changes) goes to POST /api/reservations/search — there is no
// client-side filtering of a pre-fetched list, per the "live from API" requirement.
import { useEffect, useState } from "react";
import { getStations } from "../../api/stations";
import { searchReservations } from "../../api/reservations";
import ReservationStatusBadge from "../reservations/ReservationStatusBadge";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";

const STATUS_OPTIONS = ["", "Pending", "Approved", "Completed", "Cancelled"];
const PAGE_SIZES = [10, 25, 50];

const HISTORY_COLUMNS = [
  { key: "prosumerNic", header: "Prosumer NIC" },
  { key: "prosumerName", header: "Prosumer Name" },
  { key: "stationName", header: "Station" },
  { key: "slotDate", header: "Slot Date", render: (r) => new Date(r.slotStartTime).toLocaleDateString() },
  { key: "slotTime", header: "Slot Time", render: (r) => new Date(r.slotStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  { key: "capacityKw", header: "Capacity (kW)" },
  { key: "status", header: "Status", render: (r) => <ReservationStatusBadge status={r.status} /> },
  { key: "createdAt", header: "Created At", render: (r) => new Date(r.createdAt).toLocaleDateString() },
];

const initialFilters = {
  prosumerNic: "",
  prosumerName: "",
  stationId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  minCapacityKw: "",
  maxCapacityKw: "",
  sortBy: "date",
  sortDir: "desc",
};

export default function BookingHistoryPage({ onView, onNotify }) {
  const [stations, setStations] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [result, setResult] = useState({ items: [], totalCount: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getStations()
      .then(setStations)
      .catch((err) => onNotify(err.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(searchFilters, searchPage, searchPageSize) {
    setIsLoading(true);
    setLoadError("");
    try {
      const request = {
        prosumerNic: searchFilters.prosumerNic || undefined,
        prosumerName: searchFilters.prosumerName || undefined,
        stationId: searchFilters.stationId || undefined,
        status: searchFilters.status || undefined,
        dateFrom: searchFilters.dateFrom ? `${searchFilters.dateFrom}T00:00:00Z` : undefined,
        dateTo: searchFilters.dateTo ? `${searchFilters.dateTo}T23:59:59Z` : undefined,
        minCapacityKw: searchFilters.minCapacityKw ? Number(searchFilters.minCapacityKw) : undefined,
        maxCapacityKw: searchFilters.maxCapacityKw ? Number(searchFilters.maxCapacityKw) : undefined,
        sortBy: searchFilters.sortBy,
        sortDir: searchFilters.sortDir,
        page: searchPage,
        pageSize: searchPageSize,
      };

      const data = await searchReservations(request);
      setResult(data);
    } catch (err) {
      setLoadError(err.message);
      onNotify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial live fetch; loading flag is set before the request
    runSearch(initialFilters, 1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(field) {
    return (event) => setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    runSearch(filters, 1, pageSize);
  }

  function handleReset() {
    setFilters(initialFilters);
    setPage(1);
    runSearch(initialFilters, 1, pageSize);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
    runSearch(filters, newPage, pageSize);
  }

  function handlePageSizeChange(event) {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    setPage(1);
    runSearch(filters, 1, newSize);
  }

  const { items, totalCount, totalPages } = result;
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div>
      <PageHeader title="Booking History" />

      <form onSubmit={handleSearch} className="mb-6 space-y-3 rounded-lg bg-brand-white-soft p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label="Prosumer NIC" value={filters.prosumerNic} onChange={updateFilter("prosumerNic")} />
          <TextField label="Prosumer Name" value={filters.prosumerName} onChange={updateFilter("prosumerName")} />
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Station</label>
            <select
              value={filters.stationId}
              onChange={updateFilter("stationId")}
              className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            >
              <option value="">All Stations</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.stationName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Status</label>
            <select
              value={filters.status}
              onChange={updateFilter("status")}
              className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s || "All"}
                </option>
              ))}
            </select>
          </div>
          <TextField label="Date From" type="date" value={filters.dateFrom} onChange={updateFilter("dateFrom")} />
          <TextField label="Date To" type="date" value={filters.dateTo} onChange={updateFilter("dateTo")} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <TextField
            label="Min Capacity (kW)"
            type="number"
            step="0.1"
            value={filters.minCapacityKw}
            onChange={updateFilter("minCapacityKw")}
          />
          <TextField
            label="Max Capacity (kW)"
            type="number"
            step="0.1"
            value={filters.maxCapacityKw}
            onChange={updateFilter("maxCapacityKw")}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={updateFilter("sortBy")}
              className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            >
              <option value="date">Date</option>
              <option value="capacity">Capacity</option>
              <option value="prosumer">Prosumer</option>
              <option value="station">Station</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black">Sort Direction</label>
            <select
              value={filters.sortDir}
              onChange={updateFilter("sortDir")}
              className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green-soft"
          >
            Reset
          </button>
        </div>
      </form>

      {!isLoading && !loadError && <p className="mb-2 text-sm text-brand-muted">
        Showing {rangeStart}–{rangeEnd} of {totalCount} results
      </p>}

      <DataTable
        columns={HISTORY_COLUMNS}
        rows={items}
        getRowKey={(reservation) => reservation.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => runSearch(filters, page, pageSize)}
        emptyMessage="No bookings match your filters"
        actions={(reservation) => (
          <button
            type="button"
            onClick={() => onView(reservation.id)}
            className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
          >
            View
          </button>
        )}
      />
      {!loadError && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-brand-black">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isLoading}
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
            disabled={isLoading || page <= 1}
            className="rounded-md border border-brand-green px-3 py-1 text-sm font-medium text-brand-green hover:bg-brand-green-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-brand-black">
            Page {totalPages === 0 ? 0 : page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={isLoading || page >= totalPages}
            className="rounded-md border border-brand-green px-3 py-1 text-sm font-medium text-brand-green hover:bg-brand-green-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>}
    </div>
  );
}

function TextField({ label, ...inputProps }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-black">{label}</label>
      <input
        {...inputProps}
        className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
      />
    </div>
  );
}
