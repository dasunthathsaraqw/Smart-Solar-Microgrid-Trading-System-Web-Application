// SectionCard.jsx — shared bordered section with optional heading and actions.
// Author: M.K.E Dharmarathne it23142732
import { useId } from "react";

// Groups related page content in a labelled card when a title is supplied.
export default function SectionCard({ title, subtitle, actions, children, className = "" }) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={`rounded-lg border border-brand-border bg-brand-white shadow-sm ${className}`.trim()}
    >
      {(title || subtitle || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-border px-4 py-4 sm:px-6">
          <div>
            {title && <h3 id={headingId} className="text-lg font-semibold text-brand-black">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}
