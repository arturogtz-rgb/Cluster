import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  MapPin,
  Phone,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminEmpresas = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchEmpresas();
  }, [token, navigate]);

  const fetchEmpresas = async () => {
    try {
      const response = await axios.get(`${API}/empresas`);
      setEmpresas(response.data);
    } catch (error) {
      console.error("Error fetching empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug, nombre) => {
    if (!window.confirm(`¿Eliminar la empresa "${nombre}"?`)) return;

    try {
      await axios.delete(`${API}/empresas/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Empresa eliminada");
      fetchEmpresas();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const categories = [...new Set(empresas.map((e) => e.categoria))];

  const filteredEmpresas = empresas.filter((empresa) => {
    const matchesSearch =
      empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.direccion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !filterCategory || empresa.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">
            Empresas
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {filteredEmpresas.length} de {empresas.length} empresas
          </p>
        </div>
        <Link
          to="/admin/empresas/nueva"
          data-testid="new-empresa-btn"
          className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg w-fit"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o dirección..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-forest"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-forest min-w-[200px]"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton rounded-2xl h-64" />
            ))}
          </div>
        ) : filteredEmpresas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="font-outfit font-bold text-lg text-stone-800 mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-stone-500 mb-6">
              Prueba con otros términos de búsqueda
            </p>
            <Link
              to="/admin/empresas/nueva"
              className="inline-flex items-center gap-2 bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-forest-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear primera empresa
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmpresas.map((empresa) => (
              <div
                key={empresa.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative h-40">
                  <img
                    src={
                      empresa.hero_url ||
                      empresa.logo_url ||
                      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400"
                    }
                    alt={empresa.nombre}
                    className="w-full h-full object-cover"
                  />
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {empresa.destacada && (
                      <span className="bg-agave text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Destacada
                      </span>
                    )}
                    {!empresa.activa && (
                      <span className="bg-stone-800 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Inactiva
                      </span>
                    )}
                  </div>
                  {/* Logo overlay */}
                  {empresa.logo_url && empresa.hero_url && (
                    <div className="absolute bottom-3 left-3 bg-white rounded-lg p-1.5 shadow-md">
                      <img
                        src={empresa.logo_url}
                        alt=""
                        className="h-8 w-auto object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-outfit font-bold text-stone-900 line-clamp-1">
                      {empresa.nombre}
                    </h3>
                  </div>

                  <span className="inline-block bg-forest/10 text-forest text-xs font-medium px-2 py-1 rounded-full mb-3">
                    {empresa.categoria}
                  </span>

                  {empresa.direccion && (
                    <p className="text-stone-500 text-sm flex items-center gap-1 mb-2 line-clamp-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {empresa.direccion}
                    </p>
                  )}

                  {empresa.telefono && (
                    <p className="text-stone-500 text-sm flex items-center gap-1 mb-3">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      {empresa.telefono}
                    </p>
                  )}

                  {/* Coordenadas indicator */}
                  {empresa.latitud && empresa.longitud && (
                    <p className="text-xs text-adventure mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Ubicación en mapa configurada
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <Link
                      to={`/admin/empresas/editar/${empresa.slug}`}
                      className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-stone-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Link>
                    <Link
                      to={`/empresas/${empresa.slug}`}
                      target="_blank"
                      className="bg-adventure/10 text-adventure py-2 px-3 rounded-lg hover:bg-adventure/20 transition-colors"
                      title="Ver en sitio"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(empresa.slug, empresa.nombre)}
                      className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmpresas;
