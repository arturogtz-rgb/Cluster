import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, Plus, Trash2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createPinIcon = (color = "#1a4d2e") =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3)"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

const ClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const ActivityLocationManager = ({ selectedActividades, ubicaciones, onChange }) => {
  const [actividades, setActividades] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [addingPin, setAddingPin] = useState(false);

  useEffect(() => {
    axios.get(`${API}/actividades?activa=true`)
      .then(res => { setActividades(Array.isArray(res.data) ? res.data : []); })
      .catch(() => {});
  }, []);

  const selectedActs = actividades.filter(
    a => selectedActividades.includes(a.id) || selectedActividades.includes(a.nombre)
  );

  useEffect(() => {
    if (selectedActs.length > 0 && !activeTab) {
      setActiveTab(selectedActs[0].id);
    }
  }, [selectedActs.length]);

  const getPinsForActivity = (actId) =>
    (ubicaciones || []).filter(u => u.actividad_id === actId);

  const handleMapClick = (lat, lng) => {
    if (!addingPin || !activeTab) return;
    const act = actividades.find(a => a.id === activeTab);
    const newPin = {
      actividad_id: activeTab,
      actividad_nombre: act?.nombre || "",
      latitud: Math.round(lat * 1000000) / 1000000,
      longitud: Math.round(lng * 1000000) / 1000000,
      nota: "",
    };
    onChange([...(ubicaciones || []), newPin]);
    setAddingPin(false);
  };

  const removePin = (index) => {
    const actPins = getPinsForActivity(activeTab);
    const pinToRemove = actPins[index];
    const globalIndex = (ubicaciones || []).findIndex(
      u => u.actividad_id === pinToRemove.actividad_id &&
           u.latitud === pinToRemove.latitud &&
           u.longitud === pinToRemove.longitud
    );
    if (globalIndex >= 0) {
      const updated = [...ubicaciones];
      updated.splice(globalIndex, 1);
      onChange(updated);
    }
  };

  const updatePinNota = (index, nota) => {
    const actPins = getPinsForActivity(activeTab);
    const pinToUpdate = actPins[index];
    const updated = (ubicaciones || []).map(u => {
      if (u.actividad_id === pinToUpdate.actividad_id &&
          u.latitud === pinToUpdate.latitud &&
          u.longitud === pinToUpdate.longitud) {
        return { ...u, nota };
      }
      return u;
    });
    onChange(updated);
  };

  if (selectedActs.length === 0) {
    return (
      <div className="bg-stone-50 rounded-xl p-4 text-center text-stone-500 text-sm">
        Selecciona actividades para agregar ubicaciones en el mapa
      </div>
    );
  }

  const currentPins = getPinsForActivity(activeTab);
  const allPins = ubicaciones || [];
  const defaultCenter = [20.6597, -103.3496];

  return (
    <div className="space-y-4" data-testid="activity-location-manager">
      <div className="flex items-center justify-between">
        <label className="font-inter font-medium text-sm text-stone-700">
          Ubicaciones por Actividad
        </label>
        <span className="text-xs text-stone-400">{allPins.length} pin{allPins.length !== 1 ? "es" : ""} total</span>
      </div>

      {/* Activity Tabs */}
      <div className="flex flex-wrap gap-2">
        {selectedActs.map(act => {
          const pinCount = getPinsForActivity(act.id).length;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => { setActiveTab(act.id); setAddingPin(false); }}
              data-testid={`act-tab-${act.slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === act.id ? "text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              style={activeTab === act.id ? { backgroundColor: act.color || "#1a4d2e" } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTab === act.id ? "white" : act.color || "#1a4d2e" }} />
              {act.nombre}
              {pinCount > 0 && <span className="ml-1 opacity-75">({pinCount})</span>}
            </button>
          );
        })}
      </div>

      {activeTab && (
        <>
          {/* Add Pin Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAddingPin(!addingPin)}
              data-testid="add-pin-btn"
              className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                addingPin
                  ? "bg-adventure text-white"
                  : "bg-forest/10 text-forest hover:bg-forest/20"
              }`}
            >
              <Plus className="w-4 h-4" />
              {addingPin ? "Haz clic en el mapa..." : "Agregar pin"}
            </button>
            {addingPin && (
              <span className="text-xs text-adventure animate-pulse">
                Haz clic en el mapa para colocar el pin
              </span>
            )}
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm" style={{ height: "350px" }}>
            <MapContainer
              center={currentPins.length > 0 ? [currentPins[0].latitud, currentPins[0].longitud] : defaultCenter}
              zoom={currentPins.length > 0 ? 12 : 9}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickHandler onMapClick={handleMapClick} />
              {/* Show ALL pins for context, but highlight current activity */}
              {allPins.map((pin, i) => {
                const isCurrentAct = pin.actividad_id === activeTab;
                const act = actividades.find(a => a.id === pin.actividad_id);
                return (
                  <Marker
                    key={`${pin.actividad_id}-${pin.latitud}-${pin.longitud}-${i}`}
                    position={[pin.latitud, pin.longitud]}
                    icon={createPinIcon(isCurrentAct ? (act?.color || "#1a4d2e") : "#94a3b8")}
                    opacity={isCurrentAct ? 1 : 0.5}
                  />
                );
              })}
            </MapContainer>
          </div>

          {/* Pin List */}
          {currentPins.length > 0 && (
            <div className="space-y-2">
              {currentPins.map((pin, i) => (
                <div key={i} className="flex items-center gap-2 bg-stone-50 p-3 rounded-xl" data-testid={`pin-item-${i}`}>
                  <MapPin className="w-4 h-4 text-forest flex-shrink-0" />
                  <span className="text-xs text-stone-500 w-36 flex-shrink-0">
                    {pin.latitud}, {pin.longitud}
                  </span>
                  <input
                    type="text"
                    value={pin.nota || ""}
                    onChange={(e) => updatePinNota(i, e.target.value)}
                    placeholder="Nota (opcional)"
                    className="flex-1 px-2 py-1 rounded-lg border border-stone-200 bg-white text-xs focus:outline-none focus:border-forest"
                  />
                  <button
                    type="button"
                    onClick={() => removePin(i)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityLocationManager;
