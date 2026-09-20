// slots.js (api) — calls to the Backoffice/GridOperator /api/slots endpoints.
import { apiClient } from "./client";

export async function getSlots({ stationId, status } = {}) {
  const params = {};
  if (stationId) params.stationId = stationId;
  if (status) params.status = status;
  const response = await apiClient.get("/slots", { params });
  return response.data;
}

export async function getSlotById(id) {
  const response = await apiClient.get(`/slots/${id}`);
  return response.data;
}

export async function createSlot(data) {
  const response = await apiClient.post("/slots", data);
  return response.data;
}

export async function bulkCreateSlots(data) {
  const response = await apiClient.post("/slots/bulk", data);
  return response.data;
}

export async function updateSlot(id, data) {
  const response = await apiClient.put(`/slots/${id}`, data);
  return response.data;
}

export async function deleteSlot(id) {
  await apiClient.delete(`/slots/${id}`);
}
