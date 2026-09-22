// StatusBadge.jsx — labels the four prosumer lifecycle states from API flags.

// Maps the API's two lifecycle flags to one display state without deciding any action.
function displayState(isActive, deactivationRequested) {
  if (isActive && deactivationRequested) return "deactivation-requested";
  if (isActive) return "active";
  if (deactivationRequested) return "deactivated";
  return "pending-approval";
}

// Displays the lifecycle flags returned by the API.
export default function StatusBadge({ isActive, deactivationRequested }) {
  const state = displayState(isActive, deactivationRequested);

  if (state === "active") {
    return (
      <span className="rounded-full bg-brand-green px-2 py-1 text-xs font-medium text-brand-white">Active</span>
    );
  }

  if (state === "deactivation-requested") {
    return (
      <span className="rounded-full border border-amber-600 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
        Deactivation requested
      </span>
    );
  }

  if (state === "deactivated") {
    return (
      <span className="rounded-full bg-brand-black px-2 py-1 text-xs font-medium text-brand-white">
        Deactivated
      </span>
    );
  }

  return (
    <span className="rounded-full border border-brand-green px-2 py-1 text-xs font-medium text-brand-green-dark">
      Pending approval
    </span>
  );
}
