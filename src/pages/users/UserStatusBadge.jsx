// UserStatusBadge.jsx — small badge for a user's active/deactivated status.
export default function UserStatusBadge({ isActive }) {
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
