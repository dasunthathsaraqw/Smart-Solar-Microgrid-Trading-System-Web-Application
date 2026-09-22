// ProsumersPage.jsx — top-level container for Prosumer Management: switches between the
// list, create-form and detail views, and hosts the shared toast notification.
import { useCallback, useState } from "react";
import Toast from "../../components/Toast";
import ProsumerCreateForm from "./ProsumerCreateForm";
import ProsumerDetail from "./ProsumerDetail";
import ProsumersList from "./ProsumersList";

export default function ProsumersPage({ initialTab = "pending" }) {
  const [view, setView] = useState("list");
  const [selectedNic, setSelectedNic] = useState(null);
  const [toast, setToast] = useState(null);

  // Stable identity across renders — ProsumersList depends on this via useCallback,
  // and an unstable reference here would re-trigger its data-fetch effect on every notification.
  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      {view === "list" && (
        <ProsumersList
          initialTab={initialTab}
          onAdd={() => setView("create")}
          onView={(nic) => {
            setSelectedNic(nic);
            setView("detail");
          }}
          onNotify={notify}
        />
      )}

      {view === "create" && (
        <ProsumerCreateForm onCancel={() => setView("list")} onCreated={() => setView("list")} onNotify={notify} />
      )}

      {view === "detail" && <ProsumerDetail nic={selectedNic} onBack={() => setView("list")} onNotify={notify} />}
    </div>
  );
}
