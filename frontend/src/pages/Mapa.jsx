import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import axios from "axios";
import { Search, Filter, MapPin, ExternalLink, Phone, X, Building2 } from "lucide-react";
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
  const [empresas, setEmpresas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [selectedActividad, setSelectedActividad] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pinesRes, actsRes, empRes] = await Promise.all([
          axios.get(`${API}/mapa/pines`),
          axios.get(`${API}/actividades`),
          axios.get(`${API}/empresas?activa=true`),
        ]);
        setPines(Array.isArray(pinesRes.data) ? pinesRes.data : []);
        setActividades(Array.isArray(actsRes.data) ? actsRes.data : []);
        setEmpresas(Array.isArray(empRes.data) ? empRes.data : []);
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

  // Group pins by location for popup
  const groupedPins = useMemo(() => {
    const map = {};
    filteredPins.forEach(pin => {
      const key = `${pin.latitud},${pin.longitud}`;
      if (!map[key]) map[key] = { ...pin, empresas: [] };
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

  // Filtered empresa list for sidebar
  const filteredEmpresas = useMemo(() => {
    const pinSlugs = new Set(filteredPins.map(p => p.empresa_slug));
    let result = empresas;
    if (selectedActividad || searchTerm.trim()) {
      result = result.filter(e => pinSlugs.has(e.slug));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        e =>
          e.nombre.toLowerCase().includes(term) ||
          (e.categoria || "").toLowerCase().includes(term) ||
          (e.actividades || []).some(a => a.toLowerCase().includes(term))
      );
    }
    return result;
  }, [empresas, filteredPins, selectedActividad, searchTerm]);

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-8 px-4 md:px-8 bg-limestone" data-testid="mapa-page">
      <PageSEO
        title="Mapa de Aventuras"
        description="Encuentra actividades de turismo de naturaleza y aventura en Jalisco en nuestro mapa interactivo."
        url="/mapa"
      />

      {/* Page Title */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="font-outfit font-bold text-2xl md:text-3xl text-stone-900" data-testid="mapa-title">
          Mapa de Aventuras
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Explora las ubicaciones de turismo de naturaleza en Jalisco
        </p>
      </div>

      {/* Filters Bar */}
      <div className="max-w-7xl mx-auto mb-4" data-testid="map-filters">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar empresa o actividad..."
                data-testid="map-search"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:border-forest"
              />
            </div>

            {/* Clear Filter */}
            {(selectedActividad || searchTerm) && (
              <button
                onClick={() => { setSelectedActividad(null); setSearchTerm(""); }}
                className="flex items-center gap-1 px-4 py-2.5 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" /> Limpiar
              </button>
            )}
          </div>

          {/* Activity Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedActividad(null)}
              data-testid="filter-all"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !selectedActividad ? "bg-forest text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Filter className="w-3 h-3 inline mr-1" />
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
                  onClick={() => setSelectedActividad(selectedActividad === act.id ? null : act.id)}
                  data-testid={`filter-${act.slug}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
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
      </div>

      {/* Map + Sidebar Container */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Map Container */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden" style={{ minHeight: "500px" }}>
            {loading ? (
              <div className="h-full flex items-center justify-center" style={{ minHeight: "500px" }}>
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-forest border-t-transparent mx-auto mb-3" />
                  <p className="text-stone-500 text-sm">Cargando mapa...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[20.6597, -103.3496]}
                zoom={9}
                style={{ height: "500px", width: "100%" }}
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
                          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: pin.actividad_color || "#1a4d2e" }} />
                          <span className="font-bold text-sm text-stone-800">{pin.actividad_nombre}</span>
                        </div>
                        {pin.nota && <p className="text-xs text-stone-500 mb-2 italic">{pin.nota}</p>}
                        <div className="space-y-2 mt-2">
                          {pin.empresas.map((emp, j) => (
                            <div key={j} className="flex items-center gap-2 bg-stone-50 rounded-lg p-2">
                              {emp.empresa_logo && (
                                <img src={emp.empresa_logo} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <Link to={`/empresas/${emp.empresa_slug}`} className="text-sm font-semibold text-forest hover:underline block truncate">
                                  {emp.empresa_nombre}
                                </Link>
                                {emp.empresa_telefono && (
                                  <span className="text-xs text-stone-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {emp.empresa_telefono}
                                  </span>
                                )}
                              </div>
                              <Link to={`/empresas/${emp.empresa_slug}`} className="text-forest hover:text-adventure p-1">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Sidebar - Company List */}
          <div className="lg:w-80 flex-shrink-0" data-testid="map-sidebar">
            <div className="bg-white rounded-2xl shadow-sm p-4 lg:max-h-[540px] lg:overflow-y-auto">
              <h3 className="font-outfit font-bold text-sm text-stone-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-forest" />
                Empresas ({filteredEmpresas.length})
              </h3>

              {filteredEmpresas.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">
                  No se encontraron empresas
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredEmpresas.map((emp) => (
                    <Link
                      key={emp.id}
                      to={`/empresas/${emp.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group"
                      data-testid={`sidebar-empresa-${emp.slug}`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        {(emp.logo_url || emp.hero_url) ? (
                          <img
                            src={emp.logo_url || emp.hero_url}
                            alt={emp.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-stone-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate group-hover:text-forest transition-colors">
                          {emp.nombre}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          {emp.categoria}
                        </p>
                        {emp.actividades && emp.actividades.length > 0 && (
                          <p className="text-xs text-stone-400 truncate mt-0.5">
                            {emp.actividades.slice(0, 3).join(", ")}
                            {emp.actividades.length > 3 && ` +${emp.actividades.length - 3}`}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-forest flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mapa;
