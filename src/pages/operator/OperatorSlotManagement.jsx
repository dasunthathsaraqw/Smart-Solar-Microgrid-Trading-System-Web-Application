// OperatorSlotManagement.jsx — assigned-station-only slot administration for Grid Operators.
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteSlot, getSlots } from "../../api/slots";
import { useConfirm } from "../../components/confirmContext";
import SlotCreateForm from "../slots/SlotCreateForm";
import SlotDetail from "../slots/SlotDetail";
import SlotStatusBadge from "../slots/SlotStatusBadge";
import { useOperatorContext } from "./OperatorContext";
import OperatorUnassignedState from "./OperatorUnassignedState";

const STATUS_TABS = [
  { key: "available", label: "Available" },
  { key: "booked", label: "Booked" },
  { key: "past", label: "Past" },
];

const ACCESS_DENIED_MESSAGE = "Access denied. Your station assignment may have changed.";

function isStationAccessDenied(error) {
  const message = error?.message?.toLowerCase() || "";
  return error?.response?.status === 403 || message.includes("not assigned") || message.includes("forbidden");
}

function formatDuration(startTime, endTime) {
  const minutes = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining} min`;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

export default function OperatorSlotManagement() {
  const confirm = useConfirm();
  const {
    stationId,
    assignedStation,
    isUnassigned,
    isLoading: contextLoading,
    error: contextError,
    stationError,
    refreshOperatorContext,
    notify,
  } = useOperatorContext();

  const [view, setView] = useState("list");
  const [viewStationId, setViewStationId] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [activeTab, setActiveTab] = useState("available");
  const [slots, setSlots] = useState([]);
  const [loadedStationId, setLoadedStationId] = useState(null);
  const [listError, setListError] = useState("");
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestSequence = useRef(0);

  const loadSlots = useCallback(
    async (targetStationId, status) => {
      if (!targetStationId) {
        requestSequence.current += 1;
        setSlots([]);
        setLoadedStationId(null);
        setIsSlotsLoading(false);
        return;
      }

      const requestId = ++requestSequence.current;
      setIsSlotsLoading(true);
      setListError("");
      setSlots([]);
      setLoadedStationId(null);

      try {
        const data = await getSlots({ stationId: targetStationId, status });
        if (requestId !== requestSequence.current) return;
        setSlots(Array.isArray(data) ? data : []);
        setLoadedStationId(targetStationId);
      } catch (error) {
        if (requestId !== requestSequence.current) return;
        setSlots([]);
        setLoadedStationId(null);
        if (isStationAccessDenied(error)) {
          setListError(ACCESS_DENIED_MESSAGE);
          await refreshOperatorContext();
        } else {
          setListError(error.message || "Unable to load slots for your assigned station.");
        }
      } finally {
        if (requestId === requestSequence.current) {
          setIsSlotsLoading(false);
        }
      }
    },
    [refreshOperatorContext]
  );

  useEffect(() => {
    if (!isUnassigned && stationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch assigned-station slots when scope or filter changes
      loadSlots(stationId, activeTab);
    } else {
      requestSequence.current += 1;
      setSlots([]);
      setLoadedStationId(null);
      setIsSlotsLoading(false);
    }
  }, [activeTab, isUnassigned, loadSlots, refreshVersion, stationId]);

  const handleRefresh = useCallback(async () => {
    requestSequence.current += 1;
    setSlots([]);
    setLoadedStationId(null);
    setListError("");
    setSelectedSlotId(null);
    setView("list");
    setViewStationId(null);
    await refreshOperatorContext();
    setRefreshVersion((version) => version + 1);
    notify("Station assignment and slots refreshed.", "success");
  }, [notify, refreshOperatorContext]);

  const handleAccessDenied = useCallback(async () => {
    requestSequence.current += 1;
    setSlots([]);
    setLoadedStationId(null);
    setListError(ACCESS_DENIED_MESSAGE);
    setSelectedSlotId(null);
    setView("list");
    setViewStationId(null);
    await refreshOperatorContext();
    setRefreshVersion((version) => version + 1);
  }, [refreshOperatorContext]);

  async function handleDelete(slotId) {
    if (deletingId) return;
    const confirmed = await confirm({
      title: "Delete Slot",
      message: "This will permanently delete the slot. This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;

    setDeletingId(slotId);
    try {
      await deleteSlot(slotId);
      notify("Slot deleted", "success");
      await loadSlots(stationId, activeTab);
    } catch (error) {
      if (isStationAccessDenied(error)) {
        notify(ACCESS_DENIED_MESSAGE, "error");
        await handleAccessDenied();
      } else {
        setListError(error.message || "Unable to delete the slot.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const safeView = viewStationId === stationId ? view : "list";
  const visibleSlots = loadedStationId === stationId ? slots : [];
  const stationName = assignedStation?.stationName || assignedStation?.name || "Assigned station";
  const fixedStation = stationId ? { id: stationId, stationName } : null;

  if (contextLoading) {
    return <LoadingSlotManagement />;
  }

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="operator-slots-heading">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="operator-slots-heading" className="text-2xl font-semibold text-brand-black">
            Update Slots
          </h2>
          <p className="mt-1 text-sm text-brand-muted">Manage availability for your assigned station only</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isSlotsLoading}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSlotsLoading ? "Refreshing..." : "Refresh assignment"}
        </button>
      </div>

      {contextError ? (
        <ErrorPanel title="Unable to load operator context" message={contextError} onRetry={handleRefresh} />
      ) : isUnassigned || !stationId ? (
        <OperatorUnassignedState />
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-brand-green bg-brand-green-soft p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-green-dark">Assigned station</p>
            <h3 className="mt-1 text-lg font-semibold text-brand-black">{stationName}</h3>
            <p className="mt-1 break-all text-xs text-brand-muted">Station ID: {stationId}</p>
            {stationError && <p className="mt-2 text-sm text-brand-muted">{stationError}</p>}
          </div>

          {safeView === "create" ? (
            <SlotCreateForm
              stations={[]}
              fixedStation={fixedStation}
              initialStationId={stationId}
              onCancel={() => setView("list")}
              onCreated={() => {
                setView("list");
                setRefreshVersion((version) => version + 1);
              }}
              onNotify={notify}
              onAccessDenied={handleAccessDenied}
            />
          ) : safeView === "detail" ? (
            <SlotDetail
              id={selectedSlotId}
              expectedStationId={stationId}
              onBack={() => {
                setView("list");
                setRefreshVersion((version) => version + 1);
              }}
              onNotify={notify}
              onAccessDenied={handleAccessDenied}
            />
          ) : listError ? (
            <ErrorPanel
              title={listError === ACCESS_DENIED_MESSAGE ? "Access Denied" : "Unable to load slots"}
              message={listError}
              onRetry={listError === ACCESS_DENIED_MESSAGE ? handleRefresh : () => setRefreshVersion((version) => version + 1)}
              retryLabel={listError === ACCESS_DENIED_MESSAGE ? "Refresh assignment" : "Retry"}
            />
          ) : (
            <OperatorSlotsList
              slots={visibleSlots}
              activeTab={activeTab}
              isLoading={isSlotsLoading}
              deletingId={deletingId}
              onTabChange={setActiveTab}
              onAdd={() => {
                setViewStationId(stationId);
                setView("create");
              }}
              onView={(slotId) => {
                setSelectedSlotId(slotId);
                setViewStationId(stationId);
                setView("detail");
              }}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </section>
  );
}

function OperatorSlotsList({ slots, activeTab, isLoading, deletingId, onTabChange, onAdd, onView, onDelete }) {
  const [now] = useState(() => Date.now());

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-brand-black">Assigned-station slots</h3>
          <p className="mt-1 text-sm text-brand-muted">No other station can be selected from this view.</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white transition-colors hover:bg-brand-green-dark"
        >
          + Add Slot
        </button>
      </div>

      <nav className="mb-4 flex overflow-x-auto border-b border-brand-border" aria-label="Slot status filters">
        {STATUS_TABS.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-brand-green text-brand-green-dark"
                : "border-transparent text-brand-muted hover:text-brand-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <p className="mb-2 text-sm text-brand-muted">{slots.length} slots</p>
      <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white shadow-sm">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-brand-white-soft text-brand-black">
            <tr>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Start</th>
              <th scope="col" className="px-4 py-3">End</th>
              <th scope="col" className="px-4 py-3">Duration</th>
              <th scope="col" className="px-4 py-3">Capacity (kW)</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-brand-muted">Loading assigned-station slots...</td>
              </tr>
            ) : slots.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-brand-muted">
                  No slots found for your assigned station.
                </td>
              </tr>
            ) : (
              slots.map((slot) => {
                const canModify = !slot.isBooked && new Date(slot.endTime).getTime() > now;
                return (
                  <tr key={slot.id} className="border-t border-brand-border">
                    <td className="px-4 py-3">{new Date(slot.slotDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{formatTime(slot.startTime)}</td>
                    <td className="px-4 py-3">{formatTime(slot.endTime)}</td>
                    <td className="px-4 py-3">{formatDuration(slot.startTime, slot.endTime)}</td>
                    <td className="px-4 py-3">{slot.capacityKw}</td>
                    <td className="px-4 py-3">
                      <SlotStatusBadge isBooked={slot.isBooked} endTime={slot.endTime} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onView(slot.id)}
                          className="rounded-md border border-brand-green px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
                        >
                          View
                        </button>
                        {canModify && (
                          <button
                            type="button"
                            onClick={() => onDelete(slot.id)}
                            disabled={Boolean(deletingId)}
                            className="rounded-md bg-brand-green px-3 py-1 text-xs font-medium text-brand-white hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === slot.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ErrorPanel({ title, message, onRetry, retryLabel = "Retry" }) {
  return (
    <div role="alert" className="rounded-lg border border-brand-border bg-brand-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-brand-black">{title}</h3>
      <p className="mt-2 text-sm text-brand-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-brand-white hover:bg-brand-green-dark"
      >
        {retryLabel}
      </button>
    </div>
  );
}

function LoadingSlotManagement() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl space-y-6">
      <span className="sr-only">Loading slot management</span>
      <div className="h-20 animate-pulse rounded-lg bg-brand-white" />
      <div className="h-28 animate-pulse rounded-lg border border-brand-border bg-brand-white" />
      <div className="h-96 animate-pulse rounded-lg border border-brand-border bg-brand-white" />
    </div>
  );
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
