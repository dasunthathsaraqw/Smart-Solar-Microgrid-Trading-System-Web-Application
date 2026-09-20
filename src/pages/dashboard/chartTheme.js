// chartTheme.js — registers the Chart.js building blocks used across the dashboard/reports
// charts, and centralizes the strict black/white/green color palette so no chart ever falls
// back to Chart.js's default colors (which include red/blue/yellow).
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Legend, Tooltip);

export const CHART_COLORS = {
  green: "#00b894",
  greenDark: "#019875",
  greenLight: "#4dd4b0",
  black: "#111111",
  grey: "#e5e5e5",
  greyDark: "#666666",
  white: "#ffffff",
};

export const STATUS_COLORS = {
  Pending: CHART_COLORS.greenLight,
  Approved: CHART_COLORS.green,
  Completed: CHART_COLORS.greenDark,
  Cancelled: CHART_COLORS.black,
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: CHART_COLORS.black },
    },
    tooltip: {
      backgroundColor: CHART_COLORS.black,
      titleColor: CHART_COLORS.white,
      bodyColor: CHART_COLORS.white,
    },
  },
  scales: {
    x: {
      ticks: { color: CHART_COLORS.greyDark },
      grid: { color: CHART_COLORS.grey },
    },
    y: {
      ticks: { color: CHART_COLORS.greyDark },
      grid: { color: CHART_COLORS.grey },
    },
  },
};
