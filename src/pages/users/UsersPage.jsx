// UsersPage.jsx — top-level container for User Management: switches between the list,
// create-form and detail views, and hosts the shared toast notification.
import { useCallback, useState } from "react";
import Toast from "../../components/Toast";
import UserCreateForm from "./UserCreateForm";
import UserDetail from "./UserDetail";
import UsersList from "./UsersList";

export default function UsersPage() {
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [startInEdit, setStartInEdit] = useState(false);
  const [toast, setToast] = useState(null);

  // Stable identity across renders — UsersList depends on this via useCallback,
  // and an unstable reference here would re-trigger its data-fetch effect on every notification.
  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      {view === "list" && (
        <UsersList
          onAdd={() => setView("create")}
          onView={(id, editMode = false) => {
            setSelectedId(id);
            setStartInEdit(editMode);
            setView("detail");
          }}
          onNotify={notify}
        />
      )}

      {view === "create" && (
        <UserCreateForm onCancel={() => setView("list")} onCreated={() => setView("list")} onNotify={notify} />
      )}

      {view === "detail" && (
        <UserDetail id={selectedId} startInEdit={startInEdit} onBack={() => setView("list")} onNotify={notify} />
      )}
    </div>
  );
}
