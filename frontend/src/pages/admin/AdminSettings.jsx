import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Save, Settings, Plus, Trash2, MessageCircle, Image as ImageIcon } from "lucide-react";
import ImageUploader from "../../components/ImageUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMPTY_SLIDE = { image: "", title: "", subtitle: "" };

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("auth_token");

  const [settings, setSettings] = useState({
    hero_image: "",
    hero_title: "Descubre la Aventura",
    hero_subtitle: "",
    hero_slides: [],
    whatsapp_number: "",
    whatsapp_visible: false,
  });

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchSettings();
  }, [token, navigate]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const data = response.data || {};
      setSettings(prev => ({
        ...prev,
        ...data,
        hero_slides: Array.isArray(data.hero_slides) && data.hero_slides.length > 0
          ? data.hero_slides
          : [{ image: data.hero_image || prev.hero_image, title: data.hero_title || prev.hero_title, subtitle: data.hero_subtitle || prev.hero_subtitle }],
        whatsapp_number: data.whatsapp_number || "",
        whatsapp_visible: data.whatsapp_visible ?? false,
      }));
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slides = settings.hero_slides.filter(s => s.image);
      const payload = {
        ...settings,
        hero_slides: slides,
        hero_image: slides[0]?.image || settings.hero_image,
        hero_title: slides[0]?.title || settings.hero_title,
        hero_subtitle: slides[0]?.subtitle || settings.hero_subtitle,
      };
      await axios.put(`${API}/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Configuración guardada");
    } catch (error) {
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = (index, field, value) => {
    const newSlides = [...settings.hero_slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSettings({ ...settings, hero_slides: newSlides });
  };

  const addSlide = () => {
    if (settings.hero_slides.length >= 3) return;
    setSettings({ ...settings, hero_slides: [...settings.hero_slides, { ...EMPTY_SLIDE }] });
  };

  const removeSlide = (index) => {
    if (settings.hero_slides.length <= 1) return;
    setSettings({ ...settings, hero_slides: settings.hero_slides.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-4 lg:p-8" data-testid="admin-settings-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">Configuración</h1>
          <p className="text-sm text-stone-500 mt-1">Ajustes generales del sitio</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="save-settings-btn"
          className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg disabled:opacity-50 w-fit"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {loading ? (
        <div className="skeleton rounded-2xl h-64" />
      ) : (
        <div className="max-w-3xl space-y-6">
          {/* Hero Carousel */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-outfit font-bold text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-forest" />
                Carrusel del Hero ({settings.hero_slides.length}/3)
              </h3>
              {settings.hero_slides.length < 3 && (
                <button
                  onClick={addSlide}
                  data-testid="add-slide-btn"
                  className="text-forest text-sm font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-4 h-4" /> Agregar Slide
                </button>
              )}
            </div>
            <p className="text-sm text-stone-500 mb-4">
              Si una imagen no tiene texto, se heredará el texto de la primera imagen.
            </p>

            <div className="space-y-6">
              {settings.hero_slides.map((slide, index) => (
                <div key={index} className="border border-stone-200 rounded-xl p-4 space-y-4" data-testid={`slide-${index}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-outfit font-bold text-sm text-stone-700">
                      Slide {index + 1} {index === 0 && "(Principal)"}
                    </span>
                    {index > 0 && (
                      <button
                        onClick={() => removeSlide(index)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <ImageUploader
                    value={slide.image}
                    onChange={(url) => updateSlide(index, "image", url)}
                    category="system"
                    imageType="hero"
                    label="Imagen de fondo"
                    token={token}
                  />

                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Título {index > 0 && "(vacío = hereda del Slide 1)"}
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => updateSlide(index, "title", e.target.value)}
                      placeholder={index > 0 ? settings.hero_slides[0]?.title || "Título heredado" : "Título del Hero"}
                      data-testid={`slide-title-${index}`}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    />
                  </div>

                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Subtítulo {index > 0 && "(vacío = hereda del Slide 1)"}
                    </label>
                    <textarea
                      value={slide.subtitle}
                      onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                      placeholder={index > 0 ? settings.hero_slides[0]?.subtitle || "Subtítulo heredado" : "Subtítulo del Hero"}
                      data-testid={`slide-subtitle-${index}`}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Configuration */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-outfit font-bold text-lg mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              WhatsApp Global
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Número de WhatsApp (formato internacional)
                </label>
                <input
                  type="text"
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  data-testid="whatsapp-number-input"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                  placeholder="+523331234567"
                />
                <p className="text-xs text-stone-400 mt-1">
                  Incluye el código de país. Ejemplo: +52 para México, seguido del número a 10 dígitos sin espacios.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 transition-colors border border-stone-200">
                <input
                  type="checkbox"
                  checked={settings.whatsapp_visible}
                  onChange={(e) => setSettings({ ...settings, whatsapp_visible: e.target.checked })}
                  data-testid="whatsapp-visible-toggle"
                  className="w-5 h-5 rounded border-stone-300 text-[#25D366] focus:ring-[#25D366]"
                />
                <div>
                  <span className="block font-medium text-stone-800">Burbuja visible</span>
                  <span className="text-xs text-stone-500">
                    Muestra el botón flotante de WhatsApp en todas las páginas del sitio
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
