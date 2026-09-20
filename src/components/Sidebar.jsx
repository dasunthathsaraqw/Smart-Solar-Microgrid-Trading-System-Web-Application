// Sidebar.jsx — dashboard side navigation. Highlights the active item and reports
// selection via onSelect; collapses to a horizontal scrollable tab strip on mobile.
export default function Sidebar({ items, activeItem, onSelect }) {
  return (
    <nav className="w-full shrink-0 border-b border-brand-border bg-brand-white md:w-64 md:border-b-0 md:border-r">
      <ul className="flex overflow-x-auto md:block">
        {items.map((item) => {
          const isActive = item === activeItem;
          return (
            <li key={item} className="shrink-0 md:shrink">
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={`w-full whitespace-nowrap border-b-4 px-4 py-3 text-left text-sm font-medium transition-colors md:border-b-0 md:border-l-4 ${
                  isActive
                    ? "border-brand-green bg-brand-green-soft text-brand-green-dark"
                    : "border-transparent text-brand-black hover:bg-brand-white-soft"
                }`}
              >
                {item}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
