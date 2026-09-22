export default function OperatorUnassignedState() {
  return (
    <div role="status" className="rounded-lg border-l-4 border-brand-green bg-brand-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-brand-black">No station assigned</h3>
      <p className="mt-2 text-sm text-brand-muted">
        Contact Backoffice to receive a station assignment before starting operational work.
      </p>
    </div>
  );
}
