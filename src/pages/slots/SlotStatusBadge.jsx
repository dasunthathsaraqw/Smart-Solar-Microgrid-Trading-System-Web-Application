// SlotStatusBadge.jsx — displays the API's slot booking flag or requested status filter.

// Uses server-filter context for Past/Available and the response's isBooked flag otherwise.
export default function SlotStatusBadge({ isBooked, status }) {
  if (status === "past") {
    return (
      <span className="rounded-full border border-brand-muted px-2 py-1 text-xs font-medium text-brand-muted">
        Past
      </span>
    );
  }

  if (isBooked) {
    return (
      <span className="rounded-full border border-brand-black px-2 py-1 text-xs font-medium text-brand-black">
        Booked
      </span>
    );
  }

  return status === "available" ? (
    <span className="rounded-full bg-brand-green px-2 py-1 text-xs font-medium text-brand-white">Available</span>
  ) : (
    <span className="rounded-full bg-brand-green px-2 py-1 text-xs font-medium text-brand-white">Unbooked</span>
  );
}
