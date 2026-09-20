// users.js (api) — calls to the Backoffice-only /api/users endpoints.
import { apiClient } from "./client";

export async function createUser({ name, email, password, role, nic }) {
  const response = await apiClient.post("/users", { name, email, password, role, nic });
  return response.data;
}
