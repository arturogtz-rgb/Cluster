import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Save, Mountain, Compass, Leaf, BarChart3, FileText } from "lucide-react";
import ImageUploader from "../../components/ImageUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminNosotros = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("auth_token");

  const [settings, setSettings] = useState({
    hero_image: "",
    mision: "",
    vision: "",
    valores: ["Sustentabilidad", "Seguridad", "Comunidad", "Pasión por la Tierra"],
    cta_titulo: "",
    cta_texto: "",
    stats: [
      { label: "Destinos Naturales", value: "50+" },
      { label: "Compromiso Sustentable", value: "100%" },
    ],
  });

  const [newValor, setNewValor] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchSettings();
  }, [token, navigate]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/nosotros-settings`);
      const data = response.data || {};
      setSettings((prev) => ({
        ...prev,
        ...data,
        valores: Array.isArray(data.valores) ? data.valores : prev.valores,
        stats: Array.isArray(data.stats) ? data.stats : prev.stats,
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
      await axios.put(`${API}/nosotros-settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Contenido de Nosotros guardado");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const addValor = () => {
    if (!newValor.trim()) return;
    setSettings({
      ...settings,
      valores: [...settings.valores, newValor.trim()],
    });
    setNewValor("");
  };

  const removeValor = (index) => {
    setSettings({
      ...settings,
      valores: settings.valores.filter((_, i) => i !== index),
    });
  };

  const updateStat = (index, field, value) => {
    const newStats = [...settings.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setSettings({ ...settings, stats: newStats });
  };

  const addStat = () => {
    setSettings({
      ...settings,
      stats: [...settings.stats, { label: "", value: "" }],
    });
  };

  const removeStat = (index) => {
    setSettings({
      ...settings,
      stats: settings.stats.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">
            Contenido de Nosotros
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Edita el contenido institucional de la página /nosotros
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="save-nosotros-btn"
          className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg disabled:opacity-50 w-fit"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="skeleton rounded-2xl h-48" />
          <div className="skeleton rounded-2xl h-48" />
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          {/* Hero Image */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <Mountain className="w-5 h-5 text-forest" />
              Hero de la Página
            </h3>
            <ImageUploader
              value={settings.hero_image}
              onChange={(url) =>
                setSettings({ ...settings, hero_image: url })
              }
              category="system"
              imageType="hero"
              label="Imagen de fondo"
              token={token}
            />
          </div>

          {/* Mission & Vision */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-forest" />
              Misión y Visión
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Misión
                </label>
                <textarea
                  rows={4}
                  value={settings.mision}
                  onChange={(e) =>
                    setSettings({ ...settings, mision: e.target.value })
                  }
                  data-testid="nosotros-mision"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                />
              </div>
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Visión
                </label>
                <textarea
                  rows={4}
                  value={settings.vision}
                  onChange={(e) =>
                    setSettings({ ...settings, vision: e.target.value })
                  }
                  data-testid="nosotros-vision"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                />
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-forest" />
              Valores ({(settings.valores || []).length})
            </h3>
            <div className="space-y-2 mb-4">
              {(settings.valores || []).map((valor, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-stone-50 px-4 py-2.5 rounded-xl"
                >
                  <span className="flex-1 text-stone-800 text-sm font-medium">
                    {valor}
                  </span>
                  <button
                    onClick={() => removeValor(i)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newValor}
                onChange={(e) => setNewValor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addValor()}
                placeholder="Agregar nuevo valor..."
                data-testid="add-valor-input"
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
              />
              <button
                onClick={addValor}
                className="bg-forest text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-dark transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Custom Stats */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-forest" />
              Estadísticas Personalizadas
            </h3>
            <p className="text-sm text-stone-500 mb-4">
              Estas se muestran junto a las estadísticas automáticas
              (empresas, actividades)
            </p>
            <div className="space-y-3 mb-4">
              {(settings.stats || []).map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-stone-50 p-3 rounded-xl"
                >
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => updateStat(i, "value", e.target.value)}
                    placeholder="50+"
                    className="w-24 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm font-bold focus:outline-none focus:border-forest"
                  />
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => updateStat(i, "label", e.target.value)}
                    placeholder="Destinos Naturales"
                    className="flex-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:border-forest"
                  />
                  <button
                    onClick={() => removeStat(i)}
                    className="text-red-400 hover:text-red-600 text-sm px-2"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addStat}
              className="text-forest text-sm font-medium hover:underline"
            >
              + Agregar estadística
            </button>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-outfit font-bold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-forest" />
              Llamada a la Acción
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Título del CTA
                </label>
                <input
                  type="text"
                  value={settings.cta_titulo}
                  onChange={(e) =>
                    setSettings({ ...settings, cta_titulo: e.target.value })
                  }
                  data-testid="nosotros-cta-titulo"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                  placeholder="¿Quieres unirte al Clúster?"
                />
              </div>
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Texto del CTA
                </label>
                <textarea
                  rows={3}
                  value={settings.cta_texto}
                  onChange={(e) =>
                    setSettings({ ...settings, cta_texto: e.target.value })
                  }
                  data-testid="nosotros-cta-texto"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNosotros;
