// KpiCard.jsx — one dashboard KPI tile. "solid" fills the accent in green, "outline" keeps a
// white card with a green/black border — the only two treatments in the strict palette.
export default function KpiCard({ label, value, variant = "accent", onClick }) {
  const isClickable = typeof onClick === "function";

  const variantClasses =
    variant === "solid"
      ? "border-brand-green bg-brand-green text-brand-white"
      : variant === "outline-black"
        ? "border-brand-black bg-brand-white text-brand-black"
        : "border-brand-green bg-brand-white text-brand-black";

  const Wrapper = isClickable ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`w-full rounded-lg border-l-4 p-4 text-left shadow-sm transition-shadow ${variantClasses} ${
        isClickable ? "cursor-pointer hover:shadow-md" : ""
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          variant === "solid" ? "text-brand-white" : "text-brand-muted"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </Wrapper>
  );
}
