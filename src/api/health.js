// health.js — reads the API and database health status for the shared navbar.
// Author: M.K.E Dharmarathne it23142732
import { apiClient } from "./client";

// Reads the anonymous database-backed health endpoint.
export async function getHealth() {
  const response = await apiClient.get("/health");
  return response.data;
}
