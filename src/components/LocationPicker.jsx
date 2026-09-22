// LocationPicker.jsx — synchronized map and coordinate inputs for station forms.
// Author: M.K.E Dharmarathne it23142732
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "./mapIcons";
import "leaflet/dist/leaflet.css";

// Moves the map as typed coordinates become a valid map location.
function PickerViewport({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 13));
  }, [map, position]);
  return null;
}

// Reports map clicks to the same form fields used by typed coordinates.
function PickerClick({ onChange }) {
  useMapEvents({ click: (event) => onChange(event.latlng.lat.toFixed(6), event.latlng.lng.toFixed(6)) });
  return null;
}

// Lets users type coordinates or place a marker; the API remains the validation authority.
export default function LocationPicker({ latitude, longitude, onChange }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  // This range check only prevents an invalid map position; the service validates saved data.
  const position = latitude !== "" && longitude !== "" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="station-latitude" className="mb-1 block text-sm font-medium text-brand-black">Latitude</label>
          <input id="station-latitude" type="number" step="0.000001" min="-90" max="90" required value={latitude} onChange={(event) => onChange(event.target.value, longitude)} className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green" />
        </div>
        <div>
          <label htmlFor="station-longitude" className="mb-1 block text-sm font-medium text-brand-black">Longitude</label>
          <input id="station-longitude" type="number" step="0.000001" min="-180" max="180" required value={longitude} onChange={(event) => onChange(latitude, event.target.value)} className="w-full rounded-md border border-brand-border px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-brand-border">
        <MapContainer center={position || [7.8731, 80.7718]} zoom={position ? 13 : 8} scrollWheelZoom={false} className="h-64 w-full sm:h-72">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <PickerViewport position={position} />
          <PickerClick onChange={onChange} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
      <p className="text-xs text-brand-muted">Click the map or enter coordinates. The service validates saved locations.</p>
    </div>
  );
}
