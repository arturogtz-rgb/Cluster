import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon with forest green color
const createCustomIcon = (isHighlighted = false) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${isHighlighted ? "#0284c7" : "#1a4d2e"};
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

const Mapa = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Center of Jalisco (Guadalajara)
  const center = [20.6597, -103.3496];

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const response = await axios.get(`${API}/empresas?activa=true`);
        // Filter only companies with coordinates
        const empresasConCoordenadas = response.data.filter(
          (e) => e.latitud && e.longitud
        );
        setEmpresas(empresasConCoordenadas);
      } catch (error) {
        console.error("Error fetching empresas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, []);

  const filteredEmpresas = selectedCategory
    ? empresas.filter((e) => e.categoria === selectedCategory)
    : empresas;

  const categories = [...new Set(empresas.map((e) => e.categoria))];

  return (
    <div className="min-h-screen pt-20 md:pt-24" data-testid="mapa-page">
      {/* Header */}
      <div className="px-6 md:px-12 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-outfit font-bold text-3xl sm:text-4xl text-stone-900 mb-2">
            Mapa de Empresas
          </h1>
          <p className="font-inter text-stone-600 text-base mb-6">
            Encuentra empresas de turismo cerca de ti en Jalisco
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedCategory
                  ? "bg-forest text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              data-testid="filter-all"
            >
              Todas ({empresas.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-forest text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
                data-testid={`filter-${cat}`}
              >
                {cat} ({empresas.filter((e) => e.categoria === cat).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
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
                    {filteredEmpresas.map((empresa) => (
                      <Marker
                        key={empresa.id}
                        position={[empresa.latitud, empresa.longitud]}
                        icon={createCustomIcon(selectedEmpresa?.id === empresa.id)}
                        eventHandlers={{
                          click: () => setSelectedEmpresa(empresa),
                        }}
                      >
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <h3 className="font-outfit font-bold text-base mb-1">
                              {empresa.nombre}
                            </h3>
                            <span className="inline-block bg-forest/10 text-forest text-xs px-2 py-0.5 rounded-full mb-2">
                              {empresa.categoria}
                            </span>
                            <p className="text-stone-600 text-xs line-clamp-2 mb-2">
                              {empresa.descripcion}
                            </p>
                            <Link
                              to={`/empresas/${empresa.slug}`}
                              className="text-adventure text-xs font-medium flex items-center gap-1 hover:underline"
                            >
                              Ver perfil <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>

            {/* Company List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-card p-4 max-h-[600px] overflow-y-auto">
                <h3 className="font-outfit font-bold text-lg text-stone-900 mb-4 sticky top-0 bg-white pb-2">
                  Empresas ({filteredEmpresas.length})
                </h3>
                
                {filteredEmpresas.length === 0 ? (
                  <p className="text-stone-500 text-sm text-center py-8">
                    No hay empresas con ubicación registrada en esta categoría
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredEmpresas.map((empresa) => (
                      <div
                        key={empresa.id}
                        onClick={() => setSelectedEmpresa(empresa)}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                          selectedEmpresa?.id === empresa.id
                            ? "bg-forest/10 border-2 border-forest"
                            : "bg-stone-50 hover:bg-stone-100 border-2 border-transparent"
                        }`}
                        data-testid={`empresa-list-${empresa.slug}`}
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={empresa.logo_url || empresa.hero_url || "https://images.unsplash.com/photo-1551632811-561732d1e306?w=100"}
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
                            {empresa.telefono && (
                              <p className="text-stone-500 text-xs flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {empresa.telefono}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/empresas/${empresa.slug}`}
                          className="mt-2 block text-center text-adventure text-xs font-medium py-1.5 rounded-lg bg-adventure/10 hover:bg-adventure/20 transition-colors"
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
