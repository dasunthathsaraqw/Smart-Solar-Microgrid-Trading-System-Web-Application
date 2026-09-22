// prosumers.js (api) — calls to the Backoffice-only /api/prosumers endpoints.
import { apiClient } from "./client";

export async function getProsumers(status) {
  const response = await apiClient.get("/prosumers", { params: status ? { status } : {} });
  return response.data;
}

// Loads accounts awaiting Backoffice approval from the dedicated API endpoint.
export async function getPendingProsumers() {
  const response = await apiClient.get("/prosumers/pending");
  return response.data;
}

// Loads active accounts whose owners requested deactivation.
export async function getPendingDeactivations() {
  const response = await apiClient.get("/prosumers/pending-deactivations");
  return response.data;
}

export async function getProsumerByNic(nic) {
  const response = await apiClient.get(`/prosumers/${nic}`);
  return response.data;
}

export async function createProsumer(data) {
  const response = await apiClient.post("/prosumers", data);
  return response.data;
}

export async function updateProsumer(nic, data) {
  const response = await apiClient.put(`/prosumers/${nic}`, data);
  return response.data;
}

export async function deactivateProsumer(nic) {
  await apiClient.put(`/prosumers/${nic}/deactivate`);
}

export async function reactivateProsumer(nic) {
  await apiClient.put(`/prosumers/${nic}/reactivate`);
}
