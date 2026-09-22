// stations.js (api) — calls to the Backoffice-only /api/stations endpoints.
import { apiClient } from "./client";

export async function getStations(status) {
  const response = await apiClient.get("/stations", { params: status ? { status } : {} });
  return response.data;
}

// Requests distance-ordered active stations and slot counts from the API.
export async function getNearbyStations({ latitude, longitude, radiusKm, limit }) {
  const response = await apiClient.get("/stations/nearby", {
    params: { latitude, longitude, radiusKm, limit },
  });
  return response.data;
}

export async function getStationById(id) {
  const response = await apiClient.get(`/stations/${id}`);
  return response.data;
}

export async function createStation(data) {
  const response = await apiClient.post("/stations", data);
  return response.data;
}

export async function updateStation(id, data) {
  const response = await apiClient.put(`/stations/${id}`, data);
  return response.data;
}

export async function deactivateStation(id) {
  await apiClient.put(`/stations/${id}/deactivate`);
}

export async function reactivateStation(id) {
  await apiClient.put(`/stations/${id}/reactivate`);
}
