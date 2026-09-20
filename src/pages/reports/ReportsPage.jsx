// ReportsPage.jsx — dedicated reports view: a date-range filter drives four live charts plus
// a status summary table. Every "Apply Filter" click re-fetches from the API; nothing is cached.
import { useCallback, useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  getEnergyTraded,
  getReservationsByStatus,
  getReservationsPerDay,
  getTopStations,
} from "../../api/reports";
import Toast from "../../components/Toast";
import { CHART_COLORS, STATUS_COLORS, baseChartOptions } from "../dashboard/chartTheme";

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: isoDate(from), to: isoDate(to) };
}

export default function ReportsPage() {
  const [toast, setToast] = useState(null);
  const onNotify = useCallback((message, type = "success") => setToast({ message, type }), []);
  const [range, setRange] = useState(defaultRange);
  const [byStatus, setByStatus] = useState([]);
  const [perDay, setPerDay] = useState([]);
  const [topStations, setTopStations] = useState([]);
  const [energyTraded, setEnergyTraded] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    async (from, to) => {
      setIsLoading(true);
      try {
        const fromIso = new Date(`${from}T00:00:00Z`).toISOString();
        const toIso = new Date(`${to}T23:59:59Z`).toISOString();
        const days = Math.min(
          90,
          Math.max(1, Math.round((new Date(toIso) - new Date(fromIso)) / (24 * 60 * 60 * 1000)) + 1)
        );

        const [byStatusData, perDayData, topStationsData, energyTradedData] = await Promise.all([
          getReservationsByStatus({ from: fromIso, to: toIso }),
          getReservationsPerDay(days),
          getTopStations({ top: 5, from: fromIso, to: toIso }),
          getEnergyTraded(days),
        ]);

        setByStatus(byStatusData);
        setPerDay(perDayData);
        setTopStations(topStationsData);
        setEnergyTraded(energyTradedData);
      } catch (err) {
        onNotify(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [onNotify]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial live fetch; loading flag is set before the requests
    load(range.from, range.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApply(event) {
    event.preventDefault();
    load(range.from, range.to);
  }

  const totalStatusCount = byStatus.reduce((sum, s) => sum + s.count, 0);

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

  const perDayChart = {
    labels: perDay.map((d) => new Date(d.date).toLocaleDateString([], { month: "short", day: "numeric" })),
    datasets: [{ label: "Reservations", data: perDay.map((d) => d.count), backgroundColor: CHART_COLORS.green }],
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

      <h2 className="mb-6 text-2xl font-semibold text-brand-black">Reports</h2>

      <form onSubmit={handleApply} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-brand-white-soft p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black">From</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
            className="rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black">To</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
            className="rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
        >
          Apply Filter
        </button>
      </form>

      {isLoading ? (
        <p className="text-brand-muted">Loading reports...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Reservations by Status">
              <Doughnut data={byStatusChart} options={{ ...baseChartOptions, scales: undefined }} />
            </ChartCard>
            <ChartCard title="Reservations per Day">
              <Bar data={perDayChart} options={baseChartOptions} />
            </ChartCard>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Top Stations">
              <Bar data={topStationsChart} options={{ ...baseChartOptions, indexAxis: "y" }} />
            </ChartCard>
            <ChartCard title="Energy Traded">
              <Line data={energyChart} options={baseChartOptions} />
            </ChartCard>
          </div>

          <div className="rounded-lg border border-brand-green bg-brand-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-brand-black">Status Summary</h3>
            <table className="w-full text-left text-sm">
              <thead className="text-brand-muted">
                <tr>
                  <th className="py-2">Status</th>
                  <th className="py-2">Count</th>
                  <th className="py-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {byStatus.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-brand-muted">
                      No reservations in this range
                    </td>
                  </tr>
                ) : (
                  byStatus.map((s) => (
                    <tr key={s.status} className="border-t border-brand-border">
                      <td className="py-2 text-brand-black">{s.status}</td>
                      <td className="py-2 text-brand-black">{s.count}</td>
                      <td className="py-2 text-brand-black">
                        {totalStatusCount > 0 ? ((s.count / totalStatusCount) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
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
