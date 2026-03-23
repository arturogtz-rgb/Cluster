import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #1a4d2e;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Component to handle map clicks
const LocationMarker = ({ position, onPositionChange }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? (
    <Marker position={position} icon={createMarkerIcon()} />
  ) : null;
};

/**
 * MapPicker - Componente para seleccionar ubicación en un mapa
 * 
 * @param {number} latitude - Latitud actual
 * @param {number} longitude - Longitud actual
 * @param {function} onLocationChange - Callback (lat, lng) cuando cambia la ubicación
 * @param {string} label - Etiqueta del componente
 */
const MapPicker = ({
  latitude,
  longitude,
  onLocationChange,
  label = "Ubicación en el mapa",
  height = "300px",
}) => {
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : null
  );

  // Default center: Guadalajara, Jalisco
  const defaultCenter = [20.6597, -103.3496];
  const center = position || defaultCenter;

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handlePositionChange = (lat, lng) => {
    const roundedLat = Math.round(lat * 1000000) / 1000000;
    const roundedLng = Math.round(lng * 1000000) / 1000000;
    setPosition([roundedLat, roundedLng]);
    onLocationChange(roundedLat, roundedLng);
  };

  const clearLocation = () => {
    setPosition(null);
    onLocationChange(null, null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-inter font-medium text-sm text-stone-700">
          {label}
        </label>
        {position && (
          <button
            type="button"
            onClick={clearLocation}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Limpiar ubicación
          </button>
        )}
      </div>

      {/* Coordinate Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">Latitud</label>
          <input
            type="number"
            step="any"
            value={position ? position[0] : ""}
            onChange={(e) => {
              const lat = parseFloat(e.target.value);
              if (!isNaN(lat)) {
                handlePositionChange(lat, position ? position[1] : defaultCenter[1]);
              }
            }}
            placeholder="20.6597"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:border-forest"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Longitud</label>
          <input
            type="number"
            step="any"
            value={position ? position[1] : ""}
            onChange={(e) => {
              const lng = parseFloat(e.target.value);
              if (!isNaN(lng)) {
                handlePositionChange(position ? position[0] : defaultCenter[0], lng);
              }
            }}
            placeholder="-103.3496"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Map */}
      <div
        className="rounded-xl overflow-hidden border border-stone-200 shadow-sm"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={position ? 14 : 10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            onPositionChange={handlePositionChange}
          />
        </MapContainer>
      </div>

      <p className="text-xs text-stone-500 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        Haz clic en el mapa para seleccionar la ubicación exacta
      </p>
    </div>
  );
};

export default MapPicker;
