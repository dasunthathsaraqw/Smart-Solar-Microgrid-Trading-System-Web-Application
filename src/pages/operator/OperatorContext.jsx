import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { getCurrentUser } from "../../api/auth";
import { getStationById } from "../../api/stations";
import { updateSessionUser } from "../../utils/auth";
import Toast from "../../components/Toast";

const OperatorContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useOperatorContext() {
  const context = useContext(OperatorContext);
  if (!context) {
    throw new Error("useOperatorContext must be used within an OperatorProvider");
  }
  return context;
}

export function OperatorProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [stationId, setStationId] = useState(null);
  const [assignedStation, setAssignedStation] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUnassigned, setIsUnassigned] = useState(false);
  const [error, setError] = useState("");
  const [stationError, setStationError] = useState("");
  const [stationErrorStatus, setStationErrorStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const requestSequence = useRef(0);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const refreshOperatorContext = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setIsLoading(true);
    setError("");
    setStationError("");
    setStationErrorStatus(null);
    setIsUnassigned(false);
    setAssignedStation(null);

    try {
      // /auth/me returns the latest persisted assignment; the JWT has no station claim.
      const user = await getCurrentUser();
      if (requestId !== requestSequence.current) return;
      updateSessionUser(user);
      setCurrentUser(user);

      if (user.role !== "GridOperator") {
        setStationId(null);
        setError("Access denied. This account is not a Grid Operator.");
        return;
      }

      if (!user.stationId) {
        setStationId(null);
        setAssignedStation(null);
        setIsUnassigned(true);
        return;
      }

      setStationId(user.stationId);
      setIsUnassigned(false);

      try {
        const station = await getStationById(user.stationId);
        if (requestId !== requestSequence.current) return;
        setAssignedStation(station);
      } catch (err) {
        if (requestId !== requestSequence.current) return;
        setAssignedStation(null);
        const status = err.response?.status;
        setStationErrorStatus(status ?? null);
        setStationError(status === 404
          ? "Your assigned station was not found. Refresh your assignment or contact Backoffice."
          : status === 403
            ? "Access denied to your assigned station. Refresh your assignment or contact Backoffice."
            : err.message || "Station details are temporarily unavailable.");
      }

    } catch (err) {
      if (requestId !== requestSequence.current) return;
      setCurrentUser(null);
      setStationId(null);
      setAssignedStation(null);
      if (err.message === "Grid Operator is not assigned to a station.") {
        setIsUnassigned(true);
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Your account cannot open the Grid Operator portal.");
      } else {
        setError(err.message || "Failed to authenticate or load operator context.");
      }
    } finally {
      if (requestId === requestSequence.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load of context
    refreshOperatorContext();
    return () => { requestSequence.current += 1; };
  }, [refreshOperatorContext]);

  const value = {
    currentUser,
    stationId,
    assignedStation,
    isAssigned: !isUnassigned && !!stationId,
    isUnassigned,
    isLoading,
    error,
    stationError,
    stationErrorStatus,
    refreshOperatorContext,
    notify
  };

  return (
    <OperatorContext.Provider value={value}>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
      {children}
    </OperatorContext.Provider>
  );
}
