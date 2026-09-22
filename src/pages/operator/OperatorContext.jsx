import { createContext, useContext, useState, useCallback, useEffect } from "react";
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
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const refreshOperatorContext = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setStationError("");
    setIsUnassigned(false);

    try {
      // /auth/me returns the latest persisted assignment; the JWT has no station claim.
      const user = await getCurrentUser();
      updateSessionUser(user);
      setCurrentUser(user);

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
        setAssignedStation(station);
      } catch (err) {
        setAssignedStation(null);
        setStationError(err.message || "Station details are temporarily unavailable.");
      }

    } catch (err) {
      setCurrentUser(null);
      setStationId(null);
      setAssignedStation(null);
      if (err.response?.status === 403 || err.message === "Grid Operator is not assigned to a station.") {
        setIsUnassigned(true);
      } else {
        setError(err.message || "Failed to authenticate or load operator context.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load of context
    refreshOperatorContext();
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
