// confirmContext.js — the context and hook for ConfirmProvider, kept in their own module
// (not exported alongside the component) so Vite's Fast Refresh can track the component file.
import { createContext, useContext } from "react";

export const ConfirmContext = createContext(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
