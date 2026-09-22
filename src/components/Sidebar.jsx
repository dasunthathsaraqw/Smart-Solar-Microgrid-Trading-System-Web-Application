// Sidebar.jsx — dashboard side navigation. Highlights the active item and reports
// selection via onSelect; collapses behind an accessible menu button on mobile.
import { useId, useState } from "react";

// Keeps all dashboard sections reachable on small screens without horizontal overflow.
export default function Sidebar({ items, activeItem, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  return (
    <nav className="w-full shrink-0 border-b border-brand-border bg-brand-white md:w-64 md:border-b-0 md:border-r">
      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-brand-black md:hidden"
      >
        <span>Menu · {activeItem}</span>
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      <ul id={menuId} className={`${isOpen ? "block" : "hidden"} max-h-[60vh] overflow-y-auto md:block md:max-h-none`}>
        {items.map((item) => {
          const isActive = item === activeItem;
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => { onSelect(item); setIsOpen(false); }}
                className={`w-full border-l-4 px-4 py-3 text-left text-sm font-medium transition-colors ${
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
