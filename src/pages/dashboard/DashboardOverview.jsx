// DashboardOverview.jsx — the Backoffice landing dashboard: KPI tiles, four live charts, a
// Pending Approvals queue, and a Recent Bookings table. Every section reads straight from the
// /api/reports endpoints on mount and on Refresh — nothing here is computed from a cached list.
import { useCallback, useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  getDashboardSummary,
  getEnergyTraded,
  getPendingApprovals,
  getRecentBookings,
  getReservationsByStatus,
  getReservationsPerDay,
  getTopStations,
} from "../../api/reports";
import { approveReservation } from "../../api/reservations";
import Toast from "../../components/Toast";
import { useConfirm } from "../../components/confirmContext";
import ReservationStatusBadge from "../reservations/ReservationStatusBadge";
import KpiCard from "./KpiCard";
import { CHART_COLORS, STATUS_COLORS, baseChartOptions } from "./chartTheme";

export default function DashboardOverview({ userName, onNavigate }) {
  const confirm = useConfirm();
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = "success") => setToast({ message, type }), []);
  const [summary, setSummary] = useState(null);
  const [perDay, setPerDay] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [topStations, setTopStations] = useState([]);
  const [energyTraded, setEnergyTraded] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        summaryData,
        perDayData,
        byStatusData,
        topStationsData,
        energyTradedData,
        pendingData,
        recentData,
      ] = await Promise.all([
        getDashboardSummary(),
        getReservationsPerDay(7),
        getReservationsByStatus(),
        getTopStations({ top: 5 }),
        getEnergyTraded(30),
        getPendingApprovals(10),
        getRecentBookings(10),
      ]);

      setSummary(summaryData);
      setPerDay(perDayData);
      setByStatus(byStatusData);
      setTopStations(topStationsData);
      setEnergyTraded(energyTradedData);
      setPendingApprovals(pendingData);
      setRecentBookings(recentData);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial live fetch; loading flag is set before the requests
    fetchAll();
  }, [fetchAll]);

  async function handleApprove(id) {
    const confirmed = await confirm({
      title: "Approve Reservation",
      message: "Approve this reservation? A QR code will be generated for the prosumer.",
      confirmLabel: "Approve",
    });
    if (!confirmed) return;
    try {
      await approveReservation(id);
      notify("Reservation approved", "success");
      fetchAll();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  if (isLoading || !summary) {
    return <p className="text-brand-muted">Loading dashboard...</p>;
  }

  const perDayChart = {
    labels: perDay.map((d) => new Date(d.date).toLocaleDateString([], { month: "short", day: "numeric" })),
    datasets: [{ label: "Reservations", data: perDay.map((d) => d.count), backgroundColor: CHART_COLORS.green }],
  };

  const byStatusChart = {
    labels: byStatus.map((s) => s.status),
    datasets: [
      {
        data: byStatus.map((s) => s.count),
        backgroundColor: byStatus.map((s) => STATUS_COLORS[s.status] || CHART_COLORS.greyDark),
        borderColor: CHART_COLORS.white,
        borderWidth: 2,
      },
    ],
  };

  const topStationsChart = {
    labels: topStations.map((s) => s.stationName),
    datasets: [
      { label: "Reservations", data: topStations.map((s) => s.count), backgroundColor: CHART_COLORS.green },
    ],
  };

  const energyChart = {
    labels: energyTraded.map((d) => new Date(d.date).toLocaleDateString([], { month: "short", day: "numeric" })),
    datasets: [
      {
        label: "Energy Traded (kWh)",
        data: energyTraded.map((d) => d.totalKw),
        borderColor: CHART_COLORS.green,
        backgroundColor: CHART_COLORS.green,
        pointBackgroundColor: CHART_COLORS.white,
        pointBorderColor: CHART_COLORS.green,
        tension: 0.3,
      },
    ],
  };

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-brand-black">Backoffice Dashboard</h2>
          <p className="text-sm text-brand-muted">Welcome {userName}, this is the Backoffice dashboard</p>
        </div>
        <button
          onClick={fetchAll}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
        >
          Refresh
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Reservations" value={summary.totalReservations} onClick={() => onNavigate("Reservation Management")} />
        <KpiCard
          label="Pending Reservations"
          value={summary.pendingReservations}
          variant="outline"
          onClick={() => onNavigate("Reservation Management", { status: "Pending" })}
        />
        <KpiCard
          label="Approved Future Reservations"
          value={summary.approvedFutureReservations}
          variant="solid"
          onClick={() => onNavigate("Reservation Management", { status: "Approved" })}
        />
        <KpiCard label="Active Prosumers" value={summary.activeProsumers} onClick={() => onNavigate("Prosumer Management")} />
        <KpiCard label="Active Stations" value={summary.activeStations} onClick={() => onNavigate("Station Management")} />
        <KpiCard label="Completed Reservations" value={summary.completedReservations} />
        <KpiCard label="Cancelled Reservations" value={summary.cancelledReservations} variant="outline-black" />
        <KpiCard label="Active Users" value={summary.activeUsers} onClick={() => onNavigate("User Management")} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Reservations per Day (Last 7 Days)">
          <Bar data={perDayChart} options={baseChartOptions} />
        </ChartCard>
        <ChartCard title="Reservations by Status">
          <Doughnut data={byStatusChart} options={{ ...baseChartOptions, scales: undefined }} />
        </ChartCard>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top 5 Stations">
          <Bar data={topStationsChart} options={{ ...baseChartOptions, indexAxis: "y" }} />
        </ChartCard>
        <ChartCard title="Energy Traded (Last 30 Days)">
          <Line data={energyChart} options={baseChartOptions} />
        </ChartCard>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-brand-black">Pending Approvals</h3>
        <BookingTable
          rows={pendingApprovals}
          emptyMessage="No pending approvals"
          renderActions={(r) => (
            <button
              onClick={() => handleApprove(r.id)}
              className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark"
            >
              Approve
            </button>
          )}
        />
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-brand-black">Recent Bookings</h3>
        <BookingTable rows={recentBookings} emptyMessage="No bookings yet" />
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-brand-green bg-brand-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-brand-black">{title}</h3>
      <div className="h-[280px]">{children}</div>
    </div>
  );
}

function BookingTable({ rows, emptyMessage, renderActions }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-white-soft text-brand-black">
          <tr>
            <th className="px-4 py-3">Prosumer</th>
            <th className="px-4 py-3">Station</th>
            <th className="px-4 py-3">Slot</th>
            <th className="px-4 py-3">Capacity (kW)</th>
            <th className="px-4 py-3">Status</th>
            {renderActions && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={renderActions ? 6 : 5} className="px-4 py-6 text-center text-brand-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t border-brand-border">
                <td className="px-4 py-3">
                  {r.prosumerName}
                  <div className="text-xs text-brand-muted">{r.prosumerNic}</div>
                </td>
                <td className="px-4 py-3">{r.stationName}</td>
                <td className="px-4 py-3">
                  {new Date(r.slotStartTime).toLocaleDateString()}{" "}
                  {new Date(r.slotStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">{r.capacityKw}</td>
                <td className="px-4 py-3">
                  <ReservationStatusBadge status={r.status} />
                </td>
                {renderActions && <td className="px-4 py-3">{renderActions(r)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
