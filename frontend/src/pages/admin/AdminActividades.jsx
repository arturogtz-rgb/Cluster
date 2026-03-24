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
  TreePine,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminActividades = () => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchActividades();
  }, [token, navigate]);

  const fetchActividades = async () => {
    try {
      const response = await axios.get(`${API}/actividades`);
      const data = response.data;
      setActividades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching actividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug, nombre) => {
    if (!window.confirm(`¿Eliminar la actividad "${nombre}"?`)) return;

    try {
      await axios.delete(`${API}/actividades/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Actividad eliminada");
      fetchActividades();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const filteredActividades = actividades.filter((act) =>
    act.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">
            Actividades
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {filteredActividades.length} de {actividades.length} actividades
          </p>
        </div>
        <Link
          to="/admin/actividades/nueva"
          data-testid="new-actividad-btn"
          className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg w-fit"
        >
          <Plus className="w-4 h-4" />
          Nueva Actividad
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar actividades..."
            data-testid="search-actividades"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-20" />
          ))}
        </div>
      ) : filteredActividades.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="font-outfit font-bold text-lg text-stone-800 mb-2">
            No hay actividades
          </h3>
          <p className="text-stone-500 mb-6">
            Crea tu primera actividad de naturaleza
          </p>
          <Link
            to="/admin/actividades/nueva"
            className="inline-flex items-center gap-2 bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-forest-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear actividad
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-stone-100">
            {filteredActividades.map((actividad) => (
              <div
                key={actividad.id}
                data-testid={`actividad-row-${actividad.slug}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
              >
                {/* Color Dot */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                  style={{ backgroundColor: actividad.color || "#1a4d2e" }}
                />

                {/* Icon */}
                {actividad.icono_url ? (
                  <img
                    src={actividad.icono_url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center flex-shrink-0">
                    <TreePine className="w-5 h-5 text-forest" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-outfit font-bold text-stone-900">
                    {actividad.nombre}
                  </h3>
                  {actividad.descripcion && (
                    <p className="text-sm text-stone-500 line-clamp-1">
                      {actividad.descripcion}
                    </p>
                  )}
                </div>

                {/* Status */}
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                    actividad.activa
                      ? "bg-green-100 text-green-700"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {actividad.activa ? "Activa" : "Inactiva"}
                </span>

                {/* Order */}
                <span className="text-xs text-stone-400 flex-shrink-0 w-8 text-center">
                  #{actividad.orden}
                </span>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    to={`/admin/actividades/editar/${actividad.slug}`}
                    data-testid={`edit-actividad-${actividad.slug}`}
                    className="bg-stone-100 text-stone-700 p-2 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() =>
                      handleDelete(actividad.slug, actividad.nombre)
                    }
                    data-testid={`delete-actividad-${actividad.slug}`}
                    className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActividades;
