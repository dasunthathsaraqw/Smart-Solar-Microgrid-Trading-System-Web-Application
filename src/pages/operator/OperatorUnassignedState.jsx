// OperatorUnassignedState.jsx — explains why operational views need a station assignment.

// Shows a shared recovery action when the dashboard supplies one.
export default function OperatorUnassignedState({ onRefresh }) {
  return (
    <div role="status" className="rounded-lg border-l-4 border-brand-green bg-brand-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-brand-black">No station assigned</h3>
      <p className="mt-2 text-sm text-brand-muted">
        Contact Backoffice to receive a station assignment before starting operational work.
      </p>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
        >
          Refresh assignment
        </button>
      )}
    </div>
  );
}
