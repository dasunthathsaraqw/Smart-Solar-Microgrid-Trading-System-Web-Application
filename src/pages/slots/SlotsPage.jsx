// SlotsPage.jsx — top-level container for Energy Slot Management: switches between the
// list, create-form and detail views, and hosts the shared toast notification.
import { useCallback, useEffect, useState } from "react";
import Toast from "../../components/Toast";
import { getStations } from "../../api/stations";
import SlotCreateForm from "./SlotCreateForm";
import SlotDetail from "./SlotDetail";
import SlotsList from "./SlotsList";

export default function SlotsPage({ initialStationId }) {
  const [view, setView] = useState("list");
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [createStationId, setCreateStationId] = useState(initialStationId || "");
  const [stations, setStations] = useState([]);
  const [toast, setToast] = useState(null);

  // Stable identity across renders — SlotsList depends on this via useCallback,
  // and an unstable reference here would re-trigger its data-fetch effect on every notification.
  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    getStations("active")
      .then(setStations)
      .catch((err) => notify(err.message, "error"));
  }, [notify]);

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      {view === "list" && (
        <SlotsList
          initialStationId={initialStationId}
          onAdd={(stationId) => {
            setCreateStationId(stationId);
            setView("create");
          }}
          onView={(id) => {
            setSelectedSlotId(id);
            setView("detail");
          }}
          onNotify={notify}
        />
      )}

      {view === "create" && (
        <SlotCreateForm
          stations={stations}
          initialStationId={createStationId}
          onCancel={() => setView("list")}
          onCreated={() => setView("list")}
          onNotify={notify}
        />
      )}

      {view === "detail" && <SlotDetail id={selectedSlotId} onBack={() => setView("list")} onNotify={notify} />}
    </div>
  );
}
