// StationStatusBadge.jsx — small colored badge for a station's active/deactivated status.
export default function StationStatusBadge({ isActive }) {
  if (isActive) {
    return (
      <span className="rounded-full bg-brand-green px-2 py-1 text-xs font-medium text-brand-white">Active</span>
    );
  }

  return (
    <span className="rounded-full border border-brand-black px-2 py-1 text-xs font-medium text-brand-black">
      Deactivated
    </span>
  );
}
