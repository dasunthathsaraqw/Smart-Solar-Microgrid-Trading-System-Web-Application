// StationMap.jsx — OpenStreetMap view of station locations and status.
// Author: M.K.E Dharmarathne it23142732
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { inactiveIcon } from "./mapIcons";
import "leaflet/dist/leaflet.css";

// Keeps the map focused on the visible station markers when the station set changes.
function MapViewport({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) map.setView(positions[0], 13);
    else if (positions.length > 1) map.fitBounds(positions, { padding: [24, 24], maxZoom: 13 });
  }, [map, positions]);
  return null;
}

// Renders server-provided station details; readOnly explicitly removes navigation actions.
export default function StationMap({ stations = [], onViewStation, readOnly = false }) {
  const located = stations.filter((station) => Number.isFinite(station.latitude) && Number.isFinite(station.longitude) && Math.abs(station.latitude) <= 90 && Math.abs(station.longitude) <= 180);
  const positions = located.map((station) => [station.latitude, station.longitude]);

  return (
    <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-white">
      <MapContainer center={[7.8731, 80.7718]} zoom={8} scrollWheelZoom={false} className="h-80 w-full sm:h-96">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewport positions={positions} />
        {located.map((station) => (
          <Marker key={station.id} position={[station.latitude, station.longitude]} icon={station.isActive ? undefined : inactiveIcon}>
            <Popup>
              <div className="space-y-1 text-sm">
                <strong>{station.stationName}</strong>
                <p>{station.isActive ? "Active" : "Deactivated"} · {station.capacityKw} kW</p>
                <p>Available slots: {station.availableSlots}</p>
                <p>Schedule: {station.schedule || "Not provided"}</p>
                {!readOnly && onViewStation && (
                  <button type="button" onClick={() => onViewStation(station.id)} className="font-medium text-brand-green hover:underline">View details</button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {located.length === 0 && <p className="p-3 text-sm text-brand-muted">No stations with valid coordinates to show on the map.</p>}
    </div>
  );
}
