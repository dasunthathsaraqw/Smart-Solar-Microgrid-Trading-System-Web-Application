// LoadingState.jsx — shared progress message for content that is being fetched.
// Author: M.K.E Dharmarathne it23142732

// Announces loading without assuming how or where the content is fetched.
export default function LoadingState({ message = "Loading..." }) {
  return (
    <div role="status" aria-live="polite" className="px-4 py-6 text-center text-sm text-brand-muted">
      {message}
    </div>
  );
}
