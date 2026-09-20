// ReservationStatusBadge.jsx — small badge for a reservation's Pending/Approved/Completed/Cancelled status.
export default function ReservationStatusBadge({ status }) {
  if (status === "Approved") {
    return (
      <span className="rounded-full bg-brand-green px-2 py-1 text-xs font-medium text-brand-white">Approved</span>
    );
  }

  if (status === "Completed") {
    return (
      <span className="rounded-full border border-brand-black px-2 py-1 text-xs font-medium text-brand-black">
        Completed
      </span>
    );
  }

  if (status === "Cancelled") {
    return (
      <span className="rounded-full bg-brand-white-soft px-2 py-1 text-xs font-medium text-brand-black">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full border border-brand-green px-2 py-1 text-xs font-medium text-brand-green-dark">
      Pending
    </span>
  );
}
