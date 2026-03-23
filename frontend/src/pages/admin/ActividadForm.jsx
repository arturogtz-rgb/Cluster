import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Save, TreePine, Palette } from "lucide-react";
import ImageUploader from "../../components/ImageUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLOR_PRESETS = [
  { label: "Verde Bosque", value: "#1a4d2e" },
  { label: "Azul Aventura", value: "#2563eb" },
  { label: "Agave", value: "#c8a951" },
  { label: "Naranja", value: "#ea580c" },
  { label: "Rojo", value: "#dc2626" },
  { label: "Púrpura", value: "#7c3aed" },
  { label: "Teal", value: "#0d9488" },
  { label: "Rosa", value: "#db2777" },
];

const ActividadForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEditing = !!slug;
  const token = localStorage.getItem("auth_token");

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    icono_url: "",
    color: "#1a4d2e",
    orden: 0,
    activa: true,
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    if (isEditing) {
      fetchActividad();
    }
  }, [token, slug, navigate, isEditing]);

  const fetchActividad = async () => {
    try {
      const response = await axios.get(`${API}/actividades/${slug}`);
      setForm(response.data);
    } catch (error) {
      toast.error("Error al cargar la actividad");
      navigate("/admin/actividades");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        icono_url: form.icono_url,
        color: form.color,
        orden: form.orden,
        activa: form.activa,
      };

      if (isEditing) {
        await axios.put(`${API}/actividades/${slug}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Actividad actualizada");
      } else {
        await axios.post(`${API}/actividades`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Actividad creada");
      }
      navigate("/admin/actividades");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Cargando actividad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/actividades"
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                data-testid="back-to-actividades"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </Link>
              <div>
                <h1 className="font-outfit font-bold text-xl text-stone-900">
                  {isEditing ? "Editar Actividad" : "Nueva Actividad"}
                </h1>
                {isEditing && (
                  <p className="text-sm text-stone-500">{form.nombre}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              form="actividad-form"
              disabled={saving}
              data-testid="save-actividad-btn"
              className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <form
        id="actividad-form"
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-outfit font-bold text-lg text-stone-900 mb-6 flex items-center gap-2">
              <TreePine className="w-5 h-5 text-forest" />
              Información de la Actividad
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    data-testid="actividad-nombre-input"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    placeholder="Ej: Senderismo, Rappel, Kayak..."
                  />
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        orden: parseInt(e.target.value) || 0,
                      })
                    }
                    data-testid="actividad-orden-input"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  data-testid="actividad-descripcion-input"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                  placeholder="Describe brevemente esta actividad..."
                />
              </div>
            </div>
          </div>

          {/* Color & Icon */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-outfit font-bold text-lg text-stone-900 mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-forest" />
              Apariencia
            </h2>

            <div className="space-y-4">
              {/* Color Picker */}
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-3">
                  Color identificador
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setForm({ ...form, color: preset.value })}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        form.color === preset.value
                          ? "ring-2 ring-offset-2 ring-forest scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    className="w-32 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:border-forest font-mono"
                    placeholder="#1a4d2e"
                  />
                </div>
              </div>

              {/* Icon Upload */}
              <ImageUploader
                value={form.icono_url}
                onChange={(url) => setForm({ ...form, icono_url: url })}
                category="actividades"
                entitySlug={slug || "nuevo"}
                imageType="icon"
                label="Icono de la actividad"
                token={token}
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 transition-colors">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) =>
                  setForm({ ...form, activa: e.target.checked })
                }
                data-testid="actividad-activa-checkbox"
                className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
              />
              <div>
                <span className="block font-medium text-stone-800">
                  Actividad Activa
                </span>
                <span className="text-xs text-stone-500">
                  Visible en el selector de actividades y filtros públicos
                </span>
              </div>
            </label>
          </div>

          {/* Preview Card */}
          {form.nombre && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
                Vista Previa
              </h2>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-stone-200">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: form.color }}
                />
                {form.icono_url ? (
                  <img
                    src={form.icono_url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${form.color}15` }}
                  >
                    <TreePine
                      className="w-5 h-5"
                      style={{ color: form.color }}
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-outfit font-bold text-stone-900">
                    {form.nombre}
                  </h3>
                  {form.descripcion && (
                    <p className="text-sm text-stone-500 line-clamp-1">
                      {form.descripcion}
                    </p>
                  )}
                </div>
                <span
                  className={`ml-auto text-xs font-medium px-2 py-1 rounded-full ${
                    form.activa
                      ? "bg-green-100 text-green-700"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {form.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ActividadForm;
