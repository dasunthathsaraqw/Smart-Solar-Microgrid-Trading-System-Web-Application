// auth.js — reads/writes the logged-in user's session (JWT + profile) in localStorage.

const STORAGE_KEY = "smartsolar_session";

// Persists the login response (token, name, email, role, expiresAt) after a successful login.
export function saveSession(loginResponse) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: loginResponse.token,
      name: loginResponse.name,
      email: loginResponse.email,
      role: loginResponse.role,
      expiresAt: loginResponse.expiresAt,
    })
  );
}

// Removes the current session, effectively logging the user out.
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function readSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return readSession()?.token ?? null;
}

export function getUser() {
  const session = readSession();
  if (!session) return null;
  return { name: session.name, email: session.email, role: session.role };
}

export function getRole() {
  return readSession()?.role ?? null;
}

// Returns true only when a token exists and has not passed its expiresAt timestamp.
export function isLoggedIn() {
  const session = readSession();
  return Boolean(session?.token) && !isTokenExpired();
}

export function isTokenExpired() {
  const session = readSession();
  if (!session?.expiresAt) return true;
  return new Date(session.expiresAt).getTime() <= Date.now();
}

// Maps a role to its dashboard route.
export function dashboardPathForRole(role) {
  if (role === "Backoffice") return "/dashboard/backoffice";
  if (role === "GridOperator") return "/dashboard/operator";
  return "/login";
}
