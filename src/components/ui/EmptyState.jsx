// EmptyState.jsx — shared message for a successful request with no matching content.
// Author: M.K.E Dharmarathne it23142732

// Explains that a completed view has no content to show.
export default function EmptyState({ message = "No results found." }) {
  return (
    <div role="status" className="px-4 py-6 text-center text-sm text-brand-muted">
      {message}
    </div>
  );
}
