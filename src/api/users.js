// users.js (api) — calls to the Backoffice-only /api/users endpoints.
import { apiClient } from "./client";

// Sends the optional operator station assignment with the user creation request.
export async function createUser({ name, email, password, role, nic, stationId }) {
  const response = await apiClient.post("/users", { name, email, password, role, nic, stationId });
  return response.data;
}

export async function getUsers({ role, status } = {}) {
  const params = {};
  if (role) params.role = role;
  if (status) params.status = status;
  const response = await apiClient.get("/users", { params });
  return response.data;
}

export async function getUserById(id) {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
}

export async function updateUser(id, data) {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
}

export async function deactivateUser(id) {
  await apiClient.put(`/users/${id}/deactivate`);
}

export async function reactivateUser(id) {
  await apiClient.put(`/users/${id}/reactivate`);
}
