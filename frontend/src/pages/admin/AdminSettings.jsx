import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";
import ImageUploader from "../../components/ImageUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("auth_token");

  const [settings, setSettings] = useState({
    hero_image: "",
    hero_title: "Descubre la Aventura",
    hero_subtitle: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchSettings();
  }, [token, navigate]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Configuración guardada");
    } catch (error) {
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">
            Configuración
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Ajustes generales del sitio
          </p>
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
        <div className="max-w-2xl space-y-6">
          {/* Hero Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-outfit font-bold text-lg mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-forest" />
              Configuración del Hero
            </h3>
            <div className="space-y-6">
              <ImageUploader
                value={settings.hero_image}
                onChange={(url) =>
                  setSettings({ ...settings, hero_image: url })
                }
                category="system"
                imageType="hero"
                label="Imagen de fondo del Hero"
                token={token}
              />
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Título principal
                </label>
                <input
                  type="text"
                  value={settings.hero_title}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_title: e.target.value })
                  }
                  data-testid="hero-title-input"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                />
              </div>
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Subtítulo
                </label>
                <textarea
                  value={settings.hero_subtitle}
                  onChange={(e) =>
                    setSettings({ ...settings, hero_subtitle: e.target.value })
                  }
                  data-testid="hero-subtitle-input"
                  rows={3}
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

export default AdminSettings;
