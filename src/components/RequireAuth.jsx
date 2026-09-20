// RequireAuth.jsx — route guard: redirects to login if unauthenticated/expired,
// or to the correct dashboard if the current role isn't allowed for this route.
import { Navigate } from "react-router-dom";
import { isLoggedIn, getRole, dashboardPathForRole } from "../utils/auth";

export default function RequireAuth({ allowedRoles, children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const role = getRole();
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return children;
}
