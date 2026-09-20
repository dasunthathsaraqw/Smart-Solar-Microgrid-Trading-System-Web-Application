// SlotStatusBadge.jsx — small badge for a slot's available/booked/past status.
import { useState } from "react";

export default function SlotStatusBadge({ isBooked, endTime }) {
  // Captured once at mount rather than calling Date.now() directly during render.
  const [now] = useState(() => Date.now());
  const isPast = new Date(endTime).getTime() <= now;

  if (isPast) {
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

  return (
    <span className="rounded-full bg-brand-green px-2 py-1 text-xs font-medium text-brand-white">Available</span>
  );
}
