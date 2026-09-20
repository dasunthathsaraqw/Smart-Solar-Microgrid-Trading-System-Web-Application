// BookingHistoryContainer.jsx — owns the list/detail view switch for Booking History, reusing
// the existing ReservationDetail component so Approve/Cancel/Complete/Edit-slot stay consistent
// with the Reservation Management feature rather than duplicating that UI.
import { useCallback, useState } from "react";
import Toast from "../../components/Toast";
import ReservationDetail from "../reservations/ReservationDetail";
import BookingHistoryPage from "./BookingHistoryPage";

export default function BookingHistoryContainer() {
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      {selectedId ? (
        <ReservationDetail
          id={selectedId}
          onBack={() => setSelectedId(null)}
          onViewQr={() => notify("Open this reservation from Reservation Management to view its QR", "error")}
          onNotify={notify}
        />
      ) : (
        <BookingHistoryPage onView={setSelectedId} onNotify={notify} />
      )}
    </div>
  );
}
