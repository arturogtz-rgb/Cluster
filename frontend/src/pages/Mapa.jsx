import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { MapPin, Phone, ExternalLink, Filter, X, TreePine } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { PageSEO } from "../components/SEO";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const createCustomIcon = (color = "#1a4d2e") => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px;
          height: 8px;
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
    popupAnchor: [0, -32],
  });
};

// Cluster icon creator
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = "w-10 h-10 text-sm";
  if (count > 10) size = "w-12 h-12 text-base";
  if (count > 25) size = "w-14 h-14 text-lg";

  return L.divIcon({
    html: `<div class="cluster-icon ${size}" style="
      background: #1a4d2e;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      border: 3px solid white;
      box-shadow: 0 4px 15px rgba(26,77,46,0.4);
    ">${count}</div>`,
    className: "custom-cluster-icon",
    iconSize: L.point(40, 40, true),
  });
};

// Fly to selected empresa
const FlyToMarker = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
};

const Mapa = () => {
  const [empresas, setEmpresas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedActividad, setSelectedActividad] = useState(null);
  const [flyTo, setFlyTo] = useState(null);

  const center = [20.6597, -103.3496];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empresasRes, actividadesRes] = await Promise.all([
          axios.get(`${API}/empresas?activa=true`),
          axios.get(`${API}/actividades?activa=true`),
        ]);
        const empresasData = Array.isArray(empresasRes.data) ? empresasRes.data : [];
        const conCoordenadas = empresasData.filter(
          (e) => e.latitud && e.longitud
        );
        setEmpresas(conCoordenadas);
        const actData = Array.isArray(actividadesRes.data) ? actividadesRes.data : [];
        setActividades(actData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEmpresas = empresas.filter((e) => {
    const matchesCategory =
      !selectedCategory || e.categoria === selectedCategory;
    const matchesActividad =
      !selectedActividad ||
      (e.actividades && e.actividades.includes(selectedActividad));
    return matchesCategory && matchesActividad;
  });

  const categories = [...new Set(empresas.map((e) => e.categoria))];
  const hasActiveFilters = selectedCategory || selectedActividad;

  const handleEmpresaClick = (empresa) => {
    setSelectedEmpresa(empresa);
    setFlyTo([empresa.latitud, empresa.longitud]);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedActividad(null);
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24" data-testid="mapa-page">
      <PageSEO
        title="Mapa de Empresas"
        description="Encuentra empresas de turismo de aventura cerca de ti en Jalisco. Mapa interactivo con filtros por categoría y actividad."
        url="/mapa"
      />
      {/* Header */}
      <div className="px-6 md:px-12 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-outfit font-bold text-3xl sm:text-4xl text-stone-900 mb-2">
            Mapa de Empresas
          </h1>
          <p className="font-inter text-stone-600 text-base mb-6">
            Encuentra empresas de turismo cerca de ti en Jalisco
          </p>

          {/* Dual Filters */}
          <div className="space-y-3 mb-4">
            {/* Category Filter */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-stone-500" />
                <span className="text-sm font-medium text-stone-700">
                  Categoría
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !selectedCategory
                      ? "bg-forest text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                  data-testid="filter-cat-all"
                >
                  Todas ({empresas.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === cat ? null : cat
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-forest text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                    data-testid={`filter-cat-${cat}`}
                  >
                    {cat} (
                    {empresas.filter((e) => e.categoria === cat).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Filter */}
            {actividades.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TreePine className="w-4 h-4 text-stone-500" />
                  <span className="text-sm font-medium text-stone-700">
                    Actividad
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedActividad(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      !selectedActividad
                        ? "bg-teal-600 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                    data-testid="filter-act-all"
                  >
                    Todas
                  </button>
                  {actividades.map((act) => (
                    <button
                      key={act.id}
                      onClick={() =>
                        setSelectedActividad(
                          selectedActividad === act.id ? null : act.id
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedActividad === act.id
                          ? "text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                      style={
                        selectedActividad === act.id
                          ? { backgroundColor: act.color || "#0d9488" }
                          : {}
                      }
                      data-testid={`filter-act-${act.slug}`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            selectedActividad === act.id
                              ? "white"
                              : act.color || "#0d9488",
                        }}
                      />
                      {act.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active filters badge */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                data-testid="clear-filters-btn"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map + List */}
      <div className="px-6 md:px-12 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div
                className="rounded-3xl overflow-hidden shadow-card"
                style={{ height: "600px" }}
                data-testid="map-container"
              >
                {loading ? (
                  <div className="skeleton w-full h-full" />
                ) : (
                  <MapContainer
                    center={center}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {flyTo && <FlyToMarker position={flyTo} />}
                    <MarkerClusterGroup
                      chunkedLoading
                      iconCreateFunction={createClusterCustomIcon}
                      maxClusterRadius={60}
                      spiderfyOnMaxZoom={true}
                      showCoverageOnHover={false}
                      zoomToBoundsOnClick={true}
                      animate={true}
                    >
                      {filteredEmpresas.map((empresa) => (
                        <Marker
                          key={empresa.id}
                          position={[empresa.latitud, empresa.longitud]}
                          icon={createCustomIcon(
                            selectedEmpresa?.id === empresa.id
                              ? "#0284c7"
                              : "#1a4d2e"
                          )}
                          eventHandlers={{
                            click: () => setSelectedEmpresa(empresa),
                          }}
                        >
                          <Popup>
                            <div className="p-2 min-w-[220px]">
                              {(empresa.logo_url || empresa.hero_url) && (
                                <img
                                  src={empresa.logo_url || empresa.hero_url}
                                  alt={empresa.nombre}
                                  className="w-full h-24 object-cover rounded-lg mb-2"
                                />
                              )}
                              <h3 className="font-outfit font-bold text-base mb-1">
                                {empresa.nombre}
                              </h3>
                              <span className="inline-block bg-forest/10 text-forest text-xs px-2 py-0.5 rounded-full mb-2">
                                {empresa.categoria}
                              </span>
                              <p className="text-stone-600 text-xs line-clamp-2 mb-2">
                                {empresa.descripcion}
                              </p>
                              {empresa.telefono && (
                                <p className="text-stone-500 text-xs flex items-center gap-1 mb-2">
                                  <Phone className="w-3 h-3" />
                                  {empresa.telefono}
                                </p>
                              )}
                              <Link
                                to={`/empresas/${empresa.slug}`}
                                className="text-adventure text-xs font-medium flex items-center gap-1 hover:underline"
                              >
                                Ver perfil{" "}
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MarkerClusterGroup>
                  </MapContainer>
                )}
              </div>
            </div>

            {/* Company List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-card p-4 max-h-[600px] overflow-y-auto">
                <h3 className="font-outfit font-bold text-lg text-stone-900 mb-4 sticky top-0 bg-white pb-2 z-10">
                  Empresas ({filteredEmpresas.length})
                </h3>

                {filteredEmpresas.length === 0 ? (
                  <p className="text-stone-500 text-sm text-center py-8">
                    No hay empresas con ubicación registrada para estos filtros
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredEmpresas.map((empresa) => (
                      <div
                        key={empresa.id}
                        onClick={() => handleEmpresaClick(empresa)}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                          selectedEmpresa?.id === empresa.id
                            ? "bg-forest/10 border-2 border-forest"
                            : "bg-stone-50 hover:bg-stone-100 border-2 border-transparent"
                        }`}
                        data-testid={`empresa-list-${empresa.slug}`}
                      >
                        <div className="flex gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={
                                empresa.logo_url ||
                                empresa.hero_url ||
                                "https://images.unsplash.com/photo-1551632811-561732d1e306?w=100"
                              }
                              alt={empresa.nombre}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-outfit font-semibold text-sm text-stone-900 truncate">
                              {empresa.nombre}
                            </h4>
                            <span className="text-xs text-forest bg-forest/10 px-2 py-0.5 rounded-full inline-block mb-1">
                              {empresa.categoria}
                            </span>
                            {empresa.direccion && (
                              <p className="text-stone-500 text-xs flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {empresa.direccion}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/empresas/${empresa.slug}`}
                          className="mt-2 block text-center text-adventure text-xs font-medium py-1.5 rounded-lg bg-adventure/10 hover:bg-adventure/20 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver perfil completo
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mapa;
