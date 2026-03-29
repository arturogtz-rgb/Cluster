import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import axios from "axios";
import { Search, Filter, MapPin, ExternalLink, Phone, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PageSEO } from "../components/SEO";

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
    html: `<div style="width:30px;height:30px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3)"><div style="width:10px;height:10px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

const FitBounds = ({ pins }) => {
  const map = useMap();
  useEffect(() => {
    if (pins.length > 0) {
      const bounds = L.latLngBounds(pins.map(p => [p.latitud, p.longitud]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [pins, map]);
  return null;
};

const Mapa = () => {
  const [pines, setPines] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [selectedActividad, setSelectedActividad] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pinesRes, actsRes] = await Promise.all([
          axios.get(`${API}/mapa/pines`),
          axios.get(`${API}/actividades`),
        ]);
        setPines(Array.isArray(pinesRes.data) ? pinesRes.data : []);
        setActividades(Array.isArray(actsRes.data) ? actsRes.data : []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPins = useMemo(() => {
    let result = pines;
    if (selectedActividad) {
      result = result.filter(
        p => p.actividad_id === selectedActividad || p.actividad_nombre === selectedActividad
      );
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        p =>
          p.empresa_nombre.toLowerCase().includes(term) ||
          p.actividad_nombre.toLowerCase().includes(term) ||
          (p.nota || "").toLowerCase().includes(term)
      );
    }
    return result;
  }, [pines, selectedActividad, searchTerm]);

  // Group pins by location for popup (multiple empresas at same point)
  const groupedPins = useMemo(() => {
    const map = {};
    filteredPins.forEach(pin => {
      const key = `${pin.latitud},${pin.longitud}`;
      if (!map[key]) {
        map[key] = { ...pin, empresas: [] };
      }
      const existing = map[key].empresas.find(e => e.empresa_slug === pin.empresa_slug);
      if (!existing) {
        map[key].empresas.push({
          empresa_nombre: pin.empresa_nombre,
          empresa_slug: pin.empresa_slug,
          empresa_logo: pin.empresa_logo,
          empresa_telefono: pin.empresa_telefono,
        });
      }
    });
    return Object.values(map);
  }, [filteredPins]);

  const selectedActData = actividades.find(a => a.id === selectedActividad || a.nombre === selectedActividad);

  return (
    <div className="min-h-screen" data-testid="mapa-page">
      <PageSEO
        title="Mapa de Aventuras"
        description="Encuentra actividades de turismo de naturaleza y aventura en Jalisco en nuestro mapa interactivo."
        url="/mapa"
      />

      {/* Filter Panel */}
      <div className="fixed top-20 left-4 z-[1000] w-80 max-w-[calc(100vw-2rem)]" data-testid="map-filters">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-floating p-4 space-y-3">
          <h2 className="font-outfit font-bold text-lg text-stone-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-forest" />
            Filtros del Mapa
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar empresa o actividad..."
              data-testid="map-search"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:border-forest"
            />
          </div>

          {/* Activity Filter */}
          <div>
            <p className="text-xs text-stone-500 mb-2 font-medium">Filtrar por Actividad:</p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              <button
                onClick={() => setSelectedActividad(null)}
                data-testid="filter-all"
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  !selectedActividad ? "bg-forest text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Todas ({pines.length})
              </button>
              {actividades.map(act => {
                const count = pines.filter(
                  p => p.actividad_id === act.id || p.actividad_nombre === act.nombre
                ).length;
                if (count === 0) return null;
                return (
                  <button
                    key={act.id}
                    onClick={() => setSelectedActividad(act.id)}
                    data-testid={`filter-${act.slug}`}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      selectedActividad === act.id ? "text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                    style={selectedActividad === act.id ? { backgroundColor: act.color || "#1a4d2e" } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: selectedActividad === act.id ? "white" : (act.color || "#1a4d2e") }}
                    />
                    {act.nombre} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active filter indicator */}
          {(selectedActividad || searchTerm) && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-stone-500">
                {filteredPins.length} pin{filteredPins.length !== 1 ? "es" : ""} encontrado{filteredPins.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => { setSelectedActividad(null); setSearchTerm(""); }}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="h-screen w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-stone-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-forest border-t-transparent mx-auto mb-4" />
              <p className="text-stone-500">Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[20.6597, -103.3496]}
            zoom={9}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredPins.length > 0 && <FitBounds pins={filteredPins} />}

            {groupedPins.map((pin, i) => (
              <Marker
                key={`${pin.latitud}-${pin.longitud}-${i}`}
                position={[pin.latitud, pin.longitud]}
                icon={createPinIcon(pin.actividad_color || "#1a4d2e")}
              >
                <Popup className="custom-popup" maxWidth={280}>
                  <div className="p-1" data-testid="map-popup">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: pin.actividad_color || "#1a4d2e" }}
                      />
                      <span className="font-bold text-sm text-stone-800">
                        {pin.actividad_nombre}
                      </span>
                    </div>

                    {pin.nota && (
                      <p className="text-xs text-stone-500 mb-2 italic">{pin.nota}</p>
                    )}

                    <div className="space-y-2 mt-2">
                      {pin.empresas.map((emp, j) => (
                        <div key={j} className="flex items-center gap-2 bg-stone-50 rounded-lg p-2">
                          {emp.empresa_logo && (
                            <img
                              src={emp.empresa_logo}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/empresas/${emp.empresa_slug}`}
                              className="text-sm font-semibold text-forest hover:underline block truncate"
                            >
                              {emp.empresa_nombre}
                            </Link>
                            {emp.empresa_telefono && (
                              <span className="text-xs text-stone-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {emp.empresa_telefono}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/empresas/${emp.empresa_slug}`}
                            className="text-forest hover:text-adventure p-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-stone-400 mt-2 text-right">
                      {pin.latitud.toFixed(4)}, {pin.longitud.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default Mapa;
