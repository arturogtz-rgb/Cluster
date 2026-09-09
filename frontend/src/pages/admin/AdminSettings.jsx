import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Save, Plus, Trash2, MessageCircle, Image as ImageIcon, CreditCard, Building, BarChart3, Tag, Upload,
} from "lucide-react";
import ImageUploader from "../../components/ImageUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMPTY_SLIDE = { image: "", title: "", subtitle: "" };

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const token = localStorage.getItem("auth_token");

  const [settings, setSettings] = useState({
    hero_image: "", hero_title: "Descubre la Aventura", hero_subtitle: "",
    hero_slides: [], whatsapp_number: "", whatsapp_visible: false,
    // Extended settings
    stripe_publishable_key: "", stripe_secret_key: "",
    banco_nombre: "", banco_clabe: "", banco_titular: "", banco_referencia: "",
    google_analytics_id: "", google_tag_manager_id: "",
    site_logo_url: "",
  });

  const [planes, setPlanes] = useState([]);
  const [codigos, setCodigos] = useState([]);
  const [editPlan, setEditPlan] = useState(null);
  const [editCodigo, setEditCodigo] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchAll();
  }, [token, navigate]);

  const fetchAll = async () => {
    try {
      const [settingsRes, planesRes, codigosRes] = await Promise.all([
        axios.get(`${API}/settings`),
        axios.get(`${API}/admin/planes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/codigos-descuento`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const d = settingsRes.data || {};
      setSettings(prev => ({
        ...prev, ...d,
        hero_slides: Array.isArray(d.hero_slides) && d.hero_slides.length > 0
          ? d.hero_slides
          : [{ image: d.hero_image || prev.hero_image, title: d.hero_title || prev.hero_title, subtitle: d.hero_subtitle || prev.hero_subtitle }],
        whatsapp_number: d.whatsapp_number || "", whatsapp_visible: d.whatsapp_visible ?? false,
      }));
      setPlanes(planesRes.data || []);
      setCodigos(codigosRes.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
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
      await axios.put(`${API}/settings`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Configuración guardada");
    } catch (error) { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const updateSlide = (index, field, value) => {
    const ns = [...settings.hero_slides];
    ns[index] = { ...ns[index], [field]: value };
    setSettings({ ...settings, hero_slides: ns });
  };

  const addSlide = () => { if (settings.hero_slides.length < 3) setSettings({ ...settings, hero_slides: [...settings.hero_slides, { ...EMPTY_SLIDE }] }); };
  const removeSlide = (i) => { if (settings.hero_slides.length > 1) setSettings({ ...settings, hero_slides: settings.hero_slides.filter((_, j) => j !== i) }); };

  const savePlan = async (plan) => {
    try {
      if (plan.id) {
        await axios.put(`${API}/admin/planes/${plan.id}`, plan, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/admin/planes`, plan, { headers: { Authorization: `Bearer ${token}` } });
      }
      toast.success("Plan guardado");
      setEditPlan(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || "Error"); }
  };

  const deletePlan = async (id) => {
    if (!window.confirm("¿Eliminar plan?")) return;
    await axios.delete(`${API}/admin/planes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    toast.success("Plan eliminado");
    fetchAll();
  };

  const saveCodigo = async (cod) => {
    try {
      if (cod.id) {
        await axios.put(`${API}/admin/codigos-descuento/${cod.id}`, cod, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/admin/codigos-descuento`, cod, { headers: { Authorization: `Bearer ${token}` } });
      }
      toast.success("Código guardado");
      setEditCodigo(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || "Error"); }
  };

  const TABS = [
    { id: "hero", label: "Hero", icon: ImageIcon },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "planes", label: "Planes", icon: CreditCard },
    { id: "codigos", label: "Códigos", icon: Tag },
    { id: "banco", label: "Banco", icon: Building },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="p-4 lg:p-8" data-testid="admin-settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">Configuración</h1>
          <p className="text-sm text-stone-500 mt-1">Ajustes generales del sitio</p>
        </div>
        <button onClick={handleSave} disabled={saving} data-testid="save-settings-btn"
          className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg disabled:opacity-50 w-fit">
          <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} data-testid={`tab-${t.id}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? "bg-forest text-white" : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? <div className="skeleton rounded-2xl h-64" /> : (
        <div className="max-w-3xl">

          {/* Hero Tab */}
          {activeTab === "hero" && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-outfit font-bold text-lg">Carrusel del Hero ({settings.hero_slides.length}/3)</h3>
                {settings.hero_slides.length < 3 && (
                  <button onClick={addSlide} data-testid="add-slide-btn" className="text-forest text-sm font-medium flex items-center gap-1 hover:underline">
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                )}
              </div>
              {settings.hero_slides.map((slide, i) => (
                <div key={i} className="border border-stone-200 rounded-xl p-4 space-y-3" data-testid={`slide-${i}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-outfit font-bold text-sm text-stone-700">Slide {i + 1}</span>
                    {i > 0 && <button onClick={() => removeSlide(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <ImageUploader value={slide.image} onChange={(url) => updateSlide(i, "image", url)} category="system" imageType="hero" label="Imagen" token={token} />
                  <input type="text" value={slide.title} onChange={(e) => updateSlide(i, "title", e.target.value)} placeholder="Título"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
                  <textarea value={slide.subtitle} onChange={(e) => updateSlide(i, "subtitle", e.target.value)} placeholder="Subtítulo" rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest resize-none" />
                </div>
              ))}
            </div>
          )}

          {/* WhatsApp Tab */}
          {activeTab === "whatsapp" && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="font-outfit font-bold text-lg flex items-center gap-2"><MessageCircle className="w-5 h-5 text-[#25D366]" /> WhatsApp Global</h3>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Número (formato internacional)</label>
                <input type="text" value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="+523331234567" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 border border-stone-200">
                <input type="checkbox" checked={settings.whatsapp_visible} onChange={(e) => setSettings({ ...settings, whatsapp_visible: e.target.checked })}
                  className="w-5 h-5 rounded border-stone-300 text-[#25D366] focus:ring-[#25D366]" />
                <div><span className="block font-medium text-stone-800">Burbuja visible</span></div>
              </label>
            </div>
          )}

          {/* Planes Tab */}
          {activeTab === "planes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-outfit font-bold text-lg">Planes de suscripción</h3>
                <button onClick={() => setEditPlan({ nombre: "", duracion_meses: 1, precio: 0, descripcion: "", beneficios: [], activo: true, orden: planes.length + 1 })}
                  className="text-forest text-sm font-medium flex items-center gap-1 hover:underline"><Plus className="w-4 h-4" /> Nuevo plan</button>
              </div>
              {editPlan && (
                <div className="bg-white rounded-2xl shadow-sm p-5 border-2 border-forest/20 space-y-3" data-testid="plan-form">
                  <input type="text" value={editPlan.nombre} onChange={(e) => setEditPlan({ ...editPlan, nombre: e.target.value })} placeholder="Nombre del plan"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Duración (meses)</label>
                      <input type="number" value={editPlan.duracion_meses} onChange={(e) => setEditPlan({ ...editPlan, duracion_meses: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Precio (MXN)</label>
                      <input type="number" step="0.01" value={editPlan.precio} onChange={(e) => setEditPlan({ ...editPlan, precio: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Orden</label>
                      <input type="number" value={editPlan.orden} onChange={(e) => setEditPlan({ ...editPlan, orden: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
                    </div>
                  </div>
                  <textarea value={editPlan.descripcion} onChange={(e) => setEditPlan({ ...editPlan, descripcion: e.target.value })} placeholder="Descripción" rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest resize-none" />
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">Beneficios (uno por línea)</label>
                    <textarea value={(editPlan.beneficios || []).join("\n")} rows={3}
                      onChange={(e) => setEditPlan({ ...editPlan, beneficios: e.target.value.split("\n").filter(Boolean) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => savePlan(editPlan)} className="bg-forest text-white px-4 py-2 rounded-full text-sm font-medium"><Save className="w-3.5 h-3.5 inline mr-1" />Guardar</button>
                    <button onClick={() => setEditPlan(null)} className="px-4 py-2 rounded-full text-sm border border-stone-300 text-stone-600">Cancelar</button>
                  </div>
                </div>
              )}
              {planes.map(p => (
                <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between" data-testid={`plan-${p.id}`}>
                  <div>
                    <span className="font-medium text-stone-800">{p.nombre}</span>
                    <span className="text-xs text-stone-500 ml-2">{p.duracion_meses} mes(es) — ${p.precio} MXN</span>
                    {!p.activo && <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded ml-2">Inactivo</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditPlan({ ...p })} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 text-xs">Editar</button>
                    <button onClick={() => deletePlan(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Códigos Tab */}
          {activeTab === "codigos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-outfit font-bold text-lg">Códigos de descuento</h3>
                <button onClick={() => setEditCodigo({ codigo: "", tipo_descuento: "porcentaje", valor: 0, usos_maximos: 0, activo: true })}
                  className="text-forest text-sm font-medium flex items-center gap-1 hover:underline"><Plus className="w-4 h-4" /> Nuevo código</button>
              </div>
              {editCodigo && (
                <div className="bg-white rounded-2xl shadow-sm p-5 border-2 border-forest/20 space-y-3" data-testid="codigo-form">
                  <input type="text" value={editCodigo.codigo} onChange={(e) => setEditCodigo({ ...editCodigo, codigo: e.target.value.toUpperCase() })} placeholder="CODIGO"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest font-mono uppercase" />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Tipo</label>
                      <select value={editCodigo.tipo_descuento} onChange={(e) => setEditCodigo({ ...editCodigo, tipo_descuento: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white">
                        <option value="porcentaje">Porcentaje (%)</option>
                        <option value="monto_fijo">Monto fijo ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Valor</label>
                      <input type="number" value={editCodigo.valor} onChange={(e) => setEditCodigo({ ...editCodigo, valor: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">Usos máx (0=ilimitado)</label>
                      <input type="number" value={editCodigo.usos_maximos} onChange={(e) => setEditCodigo({ ...editCodigo, usos_maximos: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveCodigo(editCodigo)} className="bg-forest text-white px-4 py-2 rounded-full text-sm font-medium"><Save className="w-3.5 h-3.5 inline mr-1" />Guardar</button>
                    <button onClick={() => setEditCodigo(null)} className="px-4 py-2 rounded-full text-sm border border-stone-300 text-stone-600">Cancelar</button>
                  </div>
                </div>
              )}
              {codigos.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between" data-testid={`codigo-${c.id}`}>
                  <div>
                    <span className="font-mono font-medium text-stone-800">{c.codigo}</span>
                    <span className="text-xs text-stone-500 ml-2">{c.tipo_descuento === "porcentaje" ? `${c.valor}%` : `$${c.valor}`} — {c.usos_actuales}/{c.usos_maximos || "∞"} usos</span>
                    {!c.activo && <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded ml-2">Inactivo</span>}
                  </div>
                  <button onClick={() => setEditCodigo({ ...c })} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 text-xs">Editar</button>
                </div>
              ))}
            </div>
          )}

          {/* Banco Tab */}
          {activeTab === "banco" && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="font-outfit font-bold text-lg flex items-center gap-2"><Building className="w-5 h-5 text-forest" /> Datos bancarios para transferencia</h3>
              <p className="text-sm text-stone-500">Estos datos se mostrarán a las empresas que elijan pagar por transferencia bancaria.</p>
              {["banco_nombre", "banco_clabe", "banco_titular", "banco_referencia"].map(k => (
                <div key={k}>
                  <label className="block text-sm font-medium text-stone-700 mb-1">{k.replace("banco_", "").replace(/^\w/, c => c.toUpperCase())}</label>
                  <input type="text" value={settings[k] || ""} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
                </div>
              ))}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-forest" /> Google Analytics & Tag Manager</h3>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Google Analytics ID</label>
                  <input type="text" value={settings.google_analytics_id || ""} onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="G-XXXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Google Tag Manager ID</label>
                  <input type="text" value={settings.google_tag_manager_id || ""} onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="GTM-XXXXXXX" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="font-outfit font-bold text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-forest" /> Stripe (Pagos)</h3>
                <p className="text-xs text-stone-500">Las claves de Stripe se configuran aquí. El modo test sirve para pruebas, el modo live para cobros reales.</p>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Publishable Key</label>
                  <input type="text" value={settings.stripe_publishable_key || ""} onChange={(e) => setSettings({ ...settings, stripe_publishable_key: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest font-mono text-xs" placeholder="pk_test_..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Secret Key</label>
                  <input type="password" value={settings.stripe_secret_key || ""} onChange={(e) => setSettings({ ...settings, stripe_secret_key: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest font-mono text-xs" placeholder="sk_test_..." />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
