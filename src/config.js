// config.js — central place for environment-dependent settings.
// Adjust VITE_API_BASE in a .env file if the backend runs on a different port.
export const API_BASE = import.meta.env.VITE_API_BASE || "https://localhost:7031/api";
