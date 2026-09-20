// ConfirmProvider.jsx — app-wide replacement for window.confirm/window.prompt. Renders a single
// styled modal (black/white/green palette) and exposes an imperative, promise-based `confirm()`
// via context so call sites read almost exactly like the browser dialogs they replace.
import { useCallback, useRef, useState } from "react";
import { ConfirmContext } from "./confirmContext";

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const resolverRef = useRef(null);

  // Opens the dialog and returns a promise that resolves when the user responds.
  // Without an input field this resolves to true/false, matching window.confirm.
  // With one, it resolves to { confirmed, value }, matching window.prompt's intent.
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setInputValue(options.defaultValue || "");
      setDialog({
        title: options.title || "Are you sure?",
        message: options.message || "",
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        showInput: Boolean(options.showInput),
        inputLabel: options.inputLabel || "",
        inputPlaceholder: options.inputPlaceholder || "",
        destructive: Boolean(options.destructive),
      });
    });
  }, []);

  function settle(result) {
    setDialog(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(result);
  }

  function handleConfirm() {
    settle(dialog.showInput ? { confirmed: true, value: inputValue } : true);
  }

  function handleCancel() {
    settle(dialog.showInput ? { confirmed: false, value: "" } : false);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg border border-brand-border bg-brand-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-brand-black">{dialog.title}</h3>

            {dialog.message && <p className="mb-4 text-sm text-brand-muted">{dialog.message}</p>}

            {dialog.showInput && (
              <div className="mb-4">
                {dialog.inputLabel && (
                  <label className="mb-1 block text-sm font-medium text-brand-black">{dialog.inputLabel}</label>
                )}
                <textarea
                  autoFocus
                  rows={3}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={dialog.inputPlaceholder}
                  className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="rounded-md border border-brand-border px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-brand-white-soft"
              >
                {dialog.cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                autoFocus={!dialog.showInput}
                className={`rounded-md px-4 py-2 text-sm font-medium text-brand-white transition-colors ${
                  dialog.destructive
                    ? "bg-brand-black hover:bg-brand-black-soft"
                    : "bg-brand-green hover:bg-brand-green-dark"
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
