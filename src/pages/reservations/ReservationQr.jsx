// ReservationQr.jsx — renders the reservation's QR token as a scannable code with a download
// button. The backend only returns a token while the reservation is Approved; any other
// status is shown as an explicit "not available" message rather than an empty/broken QR.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getReservationById, getReservationQr } from "../../api/reservations";

export default function ReservationQr({ id, onBack }) {
  const [reservation, setReservation] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getReservationById(id);
        if (cancelled) return;
        setReservation(data);

        const { qrToken } = await getReservationQr(id);
        const dataUrl = await QRCode.toDataURL(qrToken, { width: 320, margin: 2 });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleDownload() {
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `reservation-${id}-qr.png`;
    link.click();
  }

  return (
    <div className="mx-auto max-w-md">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-brand-green hover:underline">
        ← Back
      </button>

      <div className="rounded-lg border border-brand-green bg-brand-white p-8 text-center">
        <h2 className="mb-6 text-xl font-semibold text-brand-black">Transaction QR Code</h2>

        {isLoading ? (
          <p className="text-brand-muted">Loading...</p>
        ) : error ? (
          <p className="border-l-4 border-brand-green bg-brand-white-soft px-3 py-2 text-left text-sm text-brand-black">
            QR not available. {error}
          </p>
        ) : (
          <>
            <img src={qrDataUrl} alt="Reservation QR code" className="mx-auto mb-6" />

            {reservation && (
              <div className="mb-6 space-y-1 text-left text-sm text-brand-black">
                <p className="font-medium">{reservation.prosumerName}</p>
                <p>{reservation.stationName}</p>
                <p>
                  {new Date(reservation.slotStartTime).toLocaleString()} –{" "}
                  {new Date(reservation.slotEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p>{reservation.capacityKw} kW</p>
              </div>
            )}

            <p className="mb-4 text-xs text-brand-muted">
              Show this QR to the Grid Operator at the station to complete the transaction.
            </p>

            <button
              onClick={handleDownload}
              className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
            >
              Download QR
            </button>
          </>
        )}
      </div>
    </div>
  );
}
