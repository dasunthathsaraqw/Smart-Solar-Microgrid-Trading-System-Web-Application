// StatusBadge.jsx — small colored badge for a prosumer's active/pending/deactivated status.
export default function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <span className="rounded-full bg-brand-green px-2 py-1 text-xs font-medium text-brand-white">Active</span>
    );
  }

  if (status === "deactivated") {
    return (
      <span className="rounded-full bg-brand-black px-2 py-1 text-xs font-medium text-brand-white">
        Deactivated
      </span>
    );
  }

  return (
    <span className="rounded-full border border-brand-green px-2 py-1 text-xs font-medium text-brand-green-dark">
      Pending
    </span>
  );
}
