import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  FileText,
} from "lucide-react";
import ImageUploader from "../../components/ImageUploader";
import TiptapEditor from "../../components/TiptapEditor";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ArticuloForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEditing = !!slug;
  const token = localStorage.getItem("auth_token");

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    contenido: "",
    resumen: "",
    hero_url: "",
    galeria: [],
    publicado: false,
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    if (isEditing) {
      fetchArticulo();
    }
  }, [token, slug, navigate, isEditing]);

  const fetchArticulo = async () => {
    try {
      const response = await axios.get(`${API}/articulos/${slug}`);
      setForm({
        ...response.data,
        galeria: response.data.galeria || [],
      });
    } catch (error) {
      toast.error("Error al cargar el artículo");
      navigate("/admin/articulos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        await axios.put(`${API}/articulos/${slug}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Artículo actualizado");
      } else {
        await axios.post(`${API}/articulos`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Artículo creado");
      }
      navigate("/admin/articulos");
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
          <p className="text-stone-500">Cargando artículo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/articulos"
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                data-testid="back-to-articulos"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </Link>
              <div>
                <h1 className="font-outfit font-bold text-xl text-stone-900">
                  {isEditing ? "Editar Artículo" : "Nuevo Artículo"}
                </h1>
                {isEditing && (
                  <p className="text-sm text-stone-500">{form.titulo}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              form="articulo-form"
              disabled={saving}
              data-testid="save-articulo-btn"
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
        id="articulo-form"
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-forest" />
                Información del Artículo
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.titulo}
                    onChange={(e) =>
                      setForm({ ...form, titulo: e.target.value })
                    }
                    data-testid="articulo-titulo-input"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    placeholder="Título del artículo"
                  />
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Resumen *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.resumen}
                    onChange={(e) =>
                      setForm({ ...form, resumen: e.target.value })
                    }
                    data-testid="articulo-resumen-input"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                    placeholder="Breve resumen del artículo para listados y SEO..."
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-6">
                Contenido *
              </h2>
              <TiptapEditor
                value={form.contenido}
                onChange={(value) => setForm({ ...form, contenido: value })}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
                Estado
              </h2>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={(e) =>
                    setForm({ ...form, publicado: e.target.checked })
                  }
                  data-testid="articulo-publicado-checkbox"
                  className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                />
                <div>
                  <span className="block font-medium text-stone-800">
                    Publicar Artículo
                  </span>
                  <span className="text-xs text-stone-500">
                    Visible en la sección de prensa
                  </span>
                </div>
              </label>
            </div>

            {/* Hero Image */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
                Imagen Principal
              </h2>
              <ImageUploader
                value={form.hero_url}
                onChange={(url) => setForm({ ...form, hero_url: url })}
                category="articulos"
                entitySlug={slug || "nuevo"}
                imageType="hero"
                label=""
                token={token}
              />
            </div>

            {/* Gallery */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
                Galería de Imágenes
              </h2>
              <div className="mb-3">
                <ImageUploader
                  value=""
                  onChange={(url) => {
                    if (url) {
                      setForm(prev => ({ ...prev, galeria: [...(prev.galeria || []), url] }));
                    }
                  }}
                  category="articulos"
                  imageType="galeria"
                  label="Subir imagen a la galería"
                  token={token}
                />
              </div>
              {form.galeria && form.galeria.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {form.galeria.map((img, i) => (
                    <div key={i} className="relative group aspect-video">
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          galeria: prev.galeria.filter((_, idx) => idx !== i)
                        }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {form.titulo && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
                  Vista Previa
                </h2>
                <div className="rounded-xl overflow-hidden border border-stone-200">
                  <div className="h-28 bg-stone-200 relative">
                    {form.hero_url && (
                      <img
                        src={form.hero_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          form.publicado
                            ? "bg-green-500 text-white"
                            : "bg-stone-500 text-white"
                        }`}
                      >
                        {form.publicado ? "Publicado" : "Borrador"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-outfit font-bold text-sm text-stone-900 line-clamp-2">
                      {form.titulo}
                    </h3>
                    {form.resumen && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                        {form.resumen}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ArticuloForm;
