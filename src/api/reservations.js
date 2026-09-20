// reservations.js (api) — calls to the /api/reservations endpoints (Backoffice/GridOperator).
import { apiClient } from "./client";

export async function getReservations({ status, stationId, prosumerNic } = {}) {
  const params = {};
  if (status) params.status = status;
  if (stationId) params.stationId = stationId;
  if (prosumerNic) params.prosumerNic = prosumerNic;
  const response = await apiClient.get("/reservations", { params });
  return response.data;
}

export async function getReservationById(id) {
  const response = await apiClient.get(`/reservations/${id}`);
  return response.data;
}

export async function createReservation(data) {
  const response = await apiClient.post("/reservations", data);
  return response.data;
}

export async function updateReservation(id, newSlotId) {
  const response = await apiClient.put(`/reservations/${id}`, { newSlotId });
  return response.data;
}

export async function cancelReservation(id, reason) {
  const response = await apiClient.put(`/reservations/${id}/cancel`, { reason });
  return response.data;
}

export async function approveReservation(id) {
  const response = await apiClient.put(`/reservations/${id}/approve`);
  return response.data;
}

export async function completeReservation(id) {
  const response = await apiClient.put(`/reservations/${id}/complete`);
  return response.data;
}

export async function getReservationQr(id) {
  const response = await apiClient.get(`/reservations/${id}/qr`);
  return response.data;
}

export async function searchReservations(searchRequest) {
  const response = await apiClient.post("/reservations/search", searchRequest);
  return response.data;
}
