import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminArticulos = () => {
  const navigate = useNavigate();
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchArticulos();
  }, [token, navigate]);

  const fetchArticulos = async () => {
    try {
      const response = await axios.get(`${API}/articulos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticulos(response.data);
    } catch (error) {
      console.error("Error fetching articulos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug, titulo) => {
    if (!window.confirm(`¿Eliminar el artículo "${titulo}"?`)) return;

    try {
      await axios.delete(`${API}/articulos/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Artículo eliminado");
      fetchArticulos();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredArticulos = articulos.filter((articulo) =>
    articulo.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </Link>
              <div>
                <h1 className="font-outfit font-bold text-xl text-stone-900">
                  Artículos
                </h1>
                <p className="text-sm text-stone-500">
                  {filteredArticulos.length} artículos
                </p>
              </div>
            </div>
            <Link
              to="/admin/articulos/nuevo"
              className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Nuevo Artículo
            </Link>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar artículos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton rounded-2xl h-64" />
            ))}
          </div>
        ) : filteredArticulos.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="font-outfit font-bold text-lg text-stone-800 mb-2">
              No hay artículos
            </h3>
            <Link
              to="/admin/articulos/nuevo"
              className="inline-flex items-center gap-2 bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-forest-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear primer artículo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticulos.map((articulo) => (
              <div
                key={articulo.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="relative h-40">
                  <img
                    src={
                      articulo.hero_url ||
                      "https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=400"
                    }
                    alt={articulo.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    {articulo.publicado ? (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Publicado
                      </span>
                    ) : (
                      <span className="bg-stone-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Borrador
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-outfit font-bold text-stone-900 line-clamp-2 mb-2">
                    {articulo.titulo}
                  </h3>
                  <p className="text-stone-500 text-sm flex items-center gap-1 mb-3">
                    <Calendar className="w-4 h-4" />
                    {formatDate(articulo.created_at)}
                  </p>
                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <Link
                      to={`/admin/articulos/editar/${articulo.slug}`}
                      className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-stone-200"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(articulo.slug, articulo.titulo)}
                      className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100"
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

export default AdminArticulos;
