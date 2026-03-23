import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Tag,
  X,
  Save,
} from "lucide-react";
import ImageUploader from "../../components/ImageUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminCategorias = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const token = localStorage.getItem("auth_token");

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    imagen_url: "",
    orden: 0,
    activa: true,
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchCategorias();
  }, [token, navigate]);

  const fetchCategorias = async () => {
    try {
      const response = await axios.get(`${API}/categorias`);
      setCategorias(response.data?.categorias || []);
    } catch (error) {
      console.error("Error fetching categorias:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (cat = null) => {
    if (cat) {
      setForm(cat);
      setEditingCat(cat);
    } else {
      setForm({ nombre: "", descripcion: "", imagen_url: "", orden: 0, activa: true });
      setEditingCat(null);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await axios.put(`${API}/categorias/${editingCat.slug}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Categoría actualizada");
      } else {
        await axios.post(`${API}/categorias`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Categoría creada");
      }
      setModalOpen(false);
      fetchCategorias();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar");
    }
  };

  const handleDelete = async (slug, nombre) => {
    if (!window.confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
    try {
      await axios.delete(`${API}/categorias/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Categoría eliminada");
      fetchCategorias();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">
            Categorías
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {categorias.length} categorías
          </p>
        </div>
        <button
          onClick={() => openModal()}
          data-testid="new-categoria-btn"
          className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg w-fit"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categorias.map((cat, index) => (
            <div
              key={cat.slug || index}
              data-testid={`admin-categoria-${cat.slug}`}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="relative h-32 bg-forest/10">
                {cat.imagen_url ? (
                  <img
                    src={cat.imagen_url}
                    alt={cat.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag className="w-12 h-12 text-forest/30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-outfit font-bold text-stone-900 mb-1">
                  {cat.nombre}
                </h3>
                <p className="text-stone-500 text-sm line-clamp-2 mb-3">
                  {cat.descripcion || "Sin descripción"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(cat)}
                    className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-stone-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  {cat.slug && (
                    <button
                      onClick={() => handleDelete(cat.slug, cat.nombre)}
                      className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-floating w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-outfit font-bold text-xl text-stone-900">
                {editingCat ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-stone-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                />
              </div>
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                />
              </div>
              <ImageUploader
                value={form.imagen_url}
                onChange={(url) => setForm({ ...form, imagen_url: url })}
                category="categorias"
                entitySlug={editingCat?.slug || "nuevo"}
                imageType="card"
                label="Imagen"
                token={token}
              />
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  value={form.orden}
                  onChange={(e) =>
                    setForm({ ...form, orden: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) =>
                    setForm({ ...form, activa: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                />
                <span className="text-sm text-stone-700">Activa</span>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 rounded-full border border-stone-200 text-stone-700 font-medium text-sm hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark"
                >
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategorias;
