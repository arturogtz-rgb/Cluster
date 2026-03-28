import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import ImageUploader from "../../components/ImageUploader";
import MapPicker from "../../components/MapPicker";
import MultiSelectActividades from "../../components/MultiSelectActividades";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_CATEGORIES = [
  "Capacitación",
  "Operadora de aventura",
  "Parque acuático",
  "Hospedaje",
  "Parque de aventura",
];

const EmpresaForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEditing = !!slug;
  const token = localStorage.getItem("auth_token");

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [galeriaInput, setGaleriaInput] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    categoria: "Capacitación",
    descripcion: "",
    logo_url: "",
    hero_url: "",
    galeria: [],
    telefono: "",
    whatsapp: "",
    direccion: "",
    email: "",
    social_links: {
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      linkedin: "",
      website: "",
    },
    actividades: [],
    destacada: false,
    activa: true,
    latitud: null,
    longitud: null,
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }

    if (isEditing) {
      fetchEmpresa();
    }
  }, [token, slug, navigate, isEditing]);

  const fetchEmpresa = async () => {
    try {
      const response = await axios.get(`${API}/empresas/${slug}`);
      setForm({
        ...response.data,
        social_links: response.data.social_links || {},
        actividades: response.data.actividades || [],
        galeria: response.data.galeria || [],
      });
    } catch (error) {
      toast.error("Error al cargar la empresa");
      navigate("/admin/empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        await axios.put(`${API}/empresas/${slug}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Empresa actualizada");
      } else {
        await axios.post(`${API}/empresas`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Empresa creada");
      }
      navigate("/admin/empresas");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(error.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const addGaleriaImage = () => {
    if (galeriaInput.trim()) {
      setForm({ ...form, galeria: [...form.galeria, galeriaInput.trim()] });
      setGaleriaInput("");
    }
  };

  const removeGaleriaImage = (index) => {
    setForm({ ...form, galeria: form.galeria.filter((_, i) => i !== index) });
  };

  const handleLocationChange = (lat, lng) => {
    setForm({ ...form, latitud: lat, longitud: lng });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Cargando empresa...</p>
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
                to="/admin/empresas"
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </Link>
              <div>
                <h1 className="font-outfit font-bold text-xl text-stone-900">
                  {isEditing ? "Editar Empresa" : "Nueva Empresa"}
                </h1>
                {isEditing && (
                  <p className="text-sm text-stone-500">{form.nombre}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              form="empresa-form"
              disabled={saving}
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
        id="empresa-form"
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-forest" />
                Información Básica
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nombre}
                      onChange={(e) =>
                        setForm({ ...form, nombre: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      value={form.categoria}
                      onChange={(e) =>
                        setForm({ ...form, categoria: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.descripcion}
                    onChange={(e) =>
                      setForm({ ...form, descripcion: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                    placeholder="Describe la empresa, sus servicios y lo que la hace especial..."
                  />
                </div>
              </div>
            </div>

            {/* Images Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-6">
                Imágenes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploader
                  value={form.logo_url}
                  onChange={(url) => setForm({ ...form, logo_url: url })}
                  category="empresas"
                  entitySlug={slug || "nuevo"}
                  subfolder="logo"
                  imageType="logo"
                  label="Logo"
                  token={token}
                />
                <ImageUploader
                  value={form.hero_url}
                  onChange={(url) => setForm({ ...form, hero_url: url })}
                  category="empresas"
                  entitySlug={slug || "nuevo"}
                  subfolder="hero"
                  imageType="hero"
                  label="Imagen Principal (Hero)"
                  token={token}
                />
              </div>

              {/* Gallery */}
              <div className="mt-6">
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Galería de Imágenes
                </label>

                {/* Upload button */}
                <div className="mb-3">
                  <ImageUploader
                    value=""
                    onChange={(url) => {
                      if (url) {
                        setForm(prev => ({ ...prev, galeria: [...(prev.galeria || []), url] }));
                      }
                    }}
                    category="empresas"
                    imageType="galeria"
                    label="Subir imagen a la galería"
                    token={token}
                  />
                </div>

                {/* URL input (alternative) */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={galeriaInput}
                    onChange={(e) => setGaleriaInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addGaleriaImage())
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                    placeholder="O pega una URL de imagen"
                    data-testid="gallery-url-input"
                  />
                  <button
                    type="button"
                    onClick={addGaleriaImage}
                    data-testid="gallery-add-url-btn"
                    className="bg-forest text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {form.galeria.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {form.galeria.map((img, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeGaleriaImage(i)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-6 flex items-center gap-2">
                <Phone className="w-5 h-5 text-forest" />
                Contacto
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) =>
                        setForm({ ...form, telefono: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      placeholder="+52 333 123 4567"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    WhatsApp (solo números)
                  </label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    placeholder="523331234567"
                  />
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      value={form.direccion}
                      onChange={(e) =>
                        setForm({ ...form, direccion: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      placeholder="Ciudad, Estado, México"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-6">
                <label className="block font-inter font-medium text-sm text-stone-700 mb-3">
                  Redes Sociales
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="url"
                      value={form.social_links.website || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: {
                            ...form.social_links,
                            website: e.target.value,
                          },
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                      placeholder="Sitio Web"
                    />
                  </div>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="url"
                      value={form.social_links.facebook || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: {
                            ...form.social_links,
                            facebook: e.target.value,
                          },
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                      placeholder="Facebook"
                    />
                  </div>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="url"
                      value={form.social_links.instagram || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: {
                            ...form.social_links,
                            instagram: e.target.value,
                          },
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                      placeholder="Instagram"
                    />
                  </div>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="url"
                      value={form.social_links.twitter || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: {
                            ...form.social_links,
                            twitter: e.target.value,
                          },
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                      placeholder="Twitter/X"
                    />
                  </div>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="url"
                      value={form.social_links.youtube || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          social_links: {
                            ...form.social_links,
                            youtube: e.target.value,
                          },
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                      placeholder="YouTube"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-forest" />
                Ubicación en el Mapa
              </h2>

              <MapPicker
                latitude={form.latitud}
                longitude={form.longitud}
                onLocationChange={handleLocationChange}
                label="Haz clic en el mapa para ubicar la empresa"
                height="350px"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
                Estado
              </h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.activa}
                    onChange={(e) =>
                      setForm({ ...form, activa: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                  />
                  <div>
                    <span className="block font-medium text-stone-800">
                      Empresa Activa
                    </span>
                    <span className="text-xs text-stone-500">
                      Visible en el catálogo público
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.destacada}
                    onChange={(e) =>
                      setForm({ ...form, destacada: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-stone-300 text-agave focus:ring-agave"
                  />
                  <div>
                    <span className="block font-medium text-stone-800">
                      Empresa Destacada
                    </span>
                    <span className="text-xs text-stone-500">
                      Aparece en la portada del sitio
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actividades Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
                Actividades
              </h2>

              <MultiSelectActividades
                value={form.actividades}
                onChange={(actividades) => setForm({ ...form, actividades })}
                label=""
              />
            </div>

            {/* Preview Card */}
            {form.nombre && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
                  Vista Previa
                </h2>

                <div className="rounded-xl overflow-hidden border border-stone-200">
                  <div className="h-24 bg-stone-200 relative">
                    {form.hero_url && (
                      <img
                        src={form.hero_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    {form.logo_url && (
                      <div className="absolute bottom-2 left-2 bg-white rounded-lg p-1 shadow-md">
                        <img
                          src={form.logo_url}
                          alt=""
                          className="h-6 w-auto"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-outfit font-bold text-sm text-stone-900 truncate">
                      {form.nombre}
                    </h3>
                    <span className="text-xs text-forest">{form.categoria}</span>
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

export default EmpresaForm;
