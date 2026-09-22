// reports.js (api) — calls to the /api/reports aggregate endpoints and the reservation search
// endpoint. Every call hits the API fresh; nothing here is cached client-side.
import { apiClient } from "./client";

export async function getDashboardSummary() {
  const response = await apiClient.get("/reports/dashboard-summary");
  return response.data;
}

export async function getReservationsByStatus({ from, to } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const response = await apiClient.get("/reports/reservations-by-status", { params });
  return response.data;
}

export async function getReservationsPerDay(days = 7) {
  const response = await apiClient.get("/reports/reservations-per-day", { params: { days } });
  return response.data;
}

export async function getTopStations({ top = 5, from, to } = {}) {
  const params = { top };
  if (from) params.from = from;
  if (to) params.to = to;
  const response = await apiClient.get("/reports/top-stations", { params });
  return response.data;
}

export async function getEnergyTraded(days = 30) {
  const response = await apiClient.get("/reports/energy-traded", { params: { days } });
  return response.data;
}

export async function getRecentBookings(count = 10) {
  const response = await apiClient.get("/reports/recent-bookings", { params: { count } });
  return response.data;
}

export async function getPendingApprovals(count = 20) {
  const response = await apiClient.get("/reports/pending-approvals", { params: { count } });
  return response.data;
}

// Loads live operator metrics using the backend's persisted station assignment.
export async function getOperatorDashboard() {
  const response = await apiClient.get("/reports/operator-dashboard");
  return response.data;
}
