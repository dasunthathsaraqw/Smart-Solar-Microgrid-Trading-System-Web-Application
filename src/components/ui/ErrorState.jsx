// ErrorState.jsx — shared request error message with an optional retry action.
// Author: M.K.E Dharmarathne it23142732

// Displays the supplied error and offers a retry only when a handler is provided.
export default function ErrorState({ message, onRetry, retryLabel = "Retry" }) {
  return (
    <div role="alert" className="px-4 py-6 text-center text-sm text-brand-black">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-brand-green px-3 py-1.5 font-medium text-brand-green hover:bg-brand-green-soft focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
