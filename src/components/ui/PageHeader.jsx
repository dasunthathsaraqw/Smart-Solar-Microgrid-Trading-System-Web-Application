// PageHeader.jsx — shared page title, subtitle, and optional actions layout.
// Author: M.K.E Dharmarathne it23142732

// Places page context and caller-provided actions in a responsive header.
export default function PageHeader({ title, subtitle, actions, id }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id={id} className="text-2xl font-semibold text-brand-black">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
