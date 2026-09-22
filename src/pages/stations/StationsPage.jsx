// StationsPage.jsx — top-level container for Microgrid Node Management: switches between the
// list, create-form and detail views, and hosts the shared toast notification.
import { useCallback, useState } from "react";
import Toast from "../../components/Toast";
import StationCreateForm from "./StationCreateForm";
import StationDetail from "./StationDetail";
import StationsList from "./StationsList";

export default function StationsPage({ onManageSlots }) {
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  // Stable identity across renders — StationsList depends on this via useCallback,
  // and an unstable reference here would re-trigger its data-fetch effect on every notification.
  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      {view === "list" && (
        <StationsList
          onAdd={() => setView("create")}
          onView={(id) => {
            setSelectedId(id);
            setView("detail");
          }}
          onManageSlots={onManageSlots}
          onNotify={notify}
        />
      )}

      {view === "create" && (
        <StationCreateForm onCancel={() => setView("list")} onCreated={() => setView("list")} onNotify={notify} />
      )}

      {view === "detail" && <StationDetail id={selectedId} onBack={() => setView("list")} onNotify={notify} onManageSlots={onManageSlots} />}
    </div>
  );
}
