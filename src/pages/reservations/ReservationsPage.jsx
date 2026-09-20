// ReservationsPage.jsx — top-level container for Reservation Management: switches between the
// list, create-form, detail and QR views, and hosts the shared toast notification.
import { useCallback, useState } from "react";
import Toast from "../../components/Toast";
import ReservationCreateForm from "./ReservationCreateForm";
import ReservationDetail from "./ReservationDetail";
import ReservationQr from "./ReservationQr";
import ReservationsList from "./ReservationsList";

export default function ReservationsPage({ initialStatus }) {
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  // Stable identity across renders — ReservationsList depends on this via useCallback,
  // and an unstable reference here would re-trigger its data-fetch effect on every notification.
  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      {view === "list" && (
        <ReservationsList
          initialStatus={initialStatus}
          onAdd={() => setView("create")}
          onView={(id) => {
            setSelectedId(id);
            setView("detail");
          }}
          onViewQr={(id) => {
            setSelectedId(id);
            setView("qr");
          }}
          onNotify={notify}
        />
      )}

      {view === "create" && (
        <ReservationCreateForm onCancel={() => setView("list")} onCreated={() => setView("list")} onNotify={notify} />
      )}

      {view === "detail" && (
        <ReservationDetail
          id={selectedId}
          onBack={() => setView("list")}
          onViewQr={(id) => {
            setSelectedId(id);
            setView("qr");
          }}
          onNotify={notify}
        />
      )}

      {view === "qr" && <ReservationQr id={selectedId} onBack={() => setView("detail")} />}
    </div>
  );
}
