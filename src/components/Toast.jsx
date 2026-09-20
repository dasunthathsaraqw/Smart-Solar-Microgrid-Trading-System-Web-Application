// Toast.jsx — small auto-dismissing notification, styled in the black/white/green palette only.
// Success uses the green-tinted box; errors use a black-on-white box with a green accent
// border instead of red, per the project's strict color rules.
import { useEffect } from "react";

export default function Toast({ message, type = "success", onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const styles =
    type === "error"
      ? "border-l-4 border-brand-green bg-brand-white text-brand-black"
      : "border border-brand-green bg-brand-green-soft text-brand-green-dark";

  return (
    <div className={`fixed right-4 top-4 z-50 rounded-md px-4 py-3 text-sm font-medium shadow-md ${styles}`}>
      {message}
    </div>
  );
}
