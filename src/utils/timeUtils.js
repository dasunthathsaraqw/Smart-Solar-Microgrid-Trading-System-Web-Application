// timeUtils.js - Consistent client-side date/time formatting policy

/**
 * Converts a local date string and local time string from HTML inputs into a UTC ISO string.
 * @param {string} localDateStr - Format "YYYY-MM-DD"
 * @param {string} localTimeStr - Format "HH:mm"
 * @returns {string} - e.g. "2026-09-28T04:30:00.000Z" (if in +05:30)
 */
export function toUtcIsoString(localDateStr, localTimeStr) {
  // Creating a Date from "YYYY-MM-DDTHH:mm" parses as local time in standard JS
  const date = new Date(`${localDateStr}T${localTimeStr}`);
  return date.toISOString();
}

/**
 * Extracts the local "HH:mm" string from a UTC ISO string for use in HTML time inputs.
 * @param {string} isoString - e.g. "2026-09-28T04:30:00.000Z"
 * @returns {string} - e.g. "10:00" (if in +05:30)
 */
export function toLocalTimeInput(isoString) {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Formats a UTC ISO string to a localized date string (e.g., "9/28/2026" or "Sep 28, 2026").
 */
export function formatLocalDate(isoString, options = {}) {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString([], options);
}

/**
 * Formats a UTC ISO string to a localized time string (e.g., "10:00 AM").
 */
export function formatLocalTime(isoString) {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
