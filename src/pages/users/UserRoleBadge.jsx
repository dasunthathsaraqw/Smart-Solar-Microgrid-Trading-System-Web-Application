// UserRoleBadge.jsx — small badge distinguishing Backoffice from Grid Operator users.
export default function UserRoleBadge({ role }) {
  if (role === "Backoffice") {
    return (
      <span className="rounded-full bg-brand-black px-2 py-1 text-xs font-medium text-brand-white">Backoffice</span>
    );
  }

  return (
    <span className="rounded-full border border-brand-green px-2 py-1 text-xs font-medium text-brand-black">
      Grid Operator
    </span>
  );
}
