import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2, MapPin, Camera, ClipboardCheck, Award, Eye,
  ChevronRight, ChevronLeft, Upload, FileText, Check, AlertCircle,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEPS = [
  { id: "datos", label: "Datos generales", icon: Building2 },
  { id: "ubicacion", label: "Ubicación", icon: MapPin },
  { id: "fotos", label: "Fotos", icon: Camera },
  { id: "requisitos", label: "Requisitos", icon: ClipboardCheck },
  { id: "certificaciones", label: "Certificaciones", icon: Award },
  { id: "preview", label: "Vista previa", icon: Eye },
];

export default function PSTWizard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pst_token");
  const [step, setStep] = useState(0);
  const [empresa, setEmpresa] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [requisitos, setRequisitos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "", categoria: "", descripcion: "", telefono: "", whatsapp: "",
    direccion: "", email: "", latitud: null, longitud: null,
    logo_url: "", hero_url: "", galeria: [],
    social_links: { facebook: "", instagram: "", website: "" },
    requisitos_completados: [], certificaciones: [],
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate("/pst/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [meRes, catRes, reqRes] = await Promise.all([
        axios.get(`${API}/pst/me`, { headers }),
        axios.get(`${API}/categorias`),
        axios.get(`${API}/requisitos`),
      ]);
      setCategorias(catRes.data.categorias || []);
      setRequisitos(reqRes.data || []);
      if (meRes.data.empresa) {
        const emp = meRes.data.empresa;
        if (emp.estado === "aprobado" || emp.estado === "pendiente_aprobacion") {
          toast.info("Tu perfil ya fue enviado. No puedes editarlo desde aquí.");
          navigate("/pst/dashboard");
          return;
        }
        setEmpresa(emp);
        setForm(prev => ({
          ...prev,
          nombre: emp.nombre || "", categoria: emp.categoria || "",
          descripcion: emp.descripcion || "", telefono: emp.telefono || "",
          whatsapp: emp.whatsapp || "", direccion: emp.direccion || "",
          email: emp.email || "", latitud: emp.latitud, longitud: emp.longitud,
          logo_url: emp.logo_url || "", hero_url: emp.hero_url || "",
          galeria: emp.galeria || [],
          social_links: emp.social_links || { facebook: "", instagram: "", website: "" },
          requisitos_completados: emp.requisitos_completados || [],
          certificaciones: emp.certificaciones || [],
        }));
      }
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem("pst_token"); navigate("/pst/login"); }
    }
  };

  const saveStep = useCallback(async () => {
    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/pst/perfil`, form, { headers });
      setEmpresa(data);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al guardar");
      return false;
    } finally {
      setSaving(false);
    }
  }, [form, headers]);

  const nextStep = async () => {
    if (step === 0 && (!form.nombre.trim() || !form.categoria || !form.descripcion.trim())) {
      toast.error("Completa nombre, categoría y descripción"); return;
    }
    const ok = await saveStep();
    if (ok && step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => { if (step > 0) setStep(step - 1); };

  const submitForPayment = async () => {
    const ok = await saveStep();
    if (!ok) return;
    try {
      await axios.post(`${API}/pst/submit-for-payment`, {}, { headers });
      toast.success("Perfil enviado. Procede al pago.");
      navigate("/pst/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al enviar");
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleDocUpload = async (file, requisitoId) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await axios.post(`${API}/pst/documents/upload`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      const updated = [...form.requisitos_completados];
      const idx = updated.findIndex(r => r.requisito_id === requisitoId);
      if (idx >= 0) updated[idx].documento_url = data.url;
      else updated.push({ requisito_id: requisitoId, valor: "Completado", documento_url: data.url });
      setForm({ ...form, requisitos_completados: updated });
      toast.success("Documento subido");
    } catch (err) {
      toast.error("Error al subir documento");
    }
  };

  const handleImageUpload = async (file, field) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", "empresas");
    fd.append("image_type", field === "logo_url" ? "logo" : "hero");
    try {
      const { data } = await axios.post(`${API}/media/upload`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      if (field === "galeria") {
        setForm(prev => ({ ...prev, galeria: [...prev.galeria, data.url] }));
      } else {
        setForm(prev => ({ ...prev, [field]: data.url }));
      }
      toast.success("Imagen subida");
    } catch (err) {
      toast.error("Error al subir imagen");
    }
  };

  const updateRequisito = (requisitoId, valor) => {
    const updated = [...form.requisitos_completados];
    const idx = updated.findIndex(r => r.requisito_id === requisitoId);
    if (idx >= 0) updated[idx].valor = valor;
    else updated.push({ requisito_id: requisitoId, valor, documento_url: "" });
    setForm({ ...form, requisitos_completados: updated });
  };

  const getRequisitoVal = (reqId) => form.requisitos_completados.find(r => r.requisito_id === reqId);

  return (
    <div className="min-h-screen bg-limestone">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-outfit font-bold text-xl text-stone-900">Completa tu perfil</h1>
          <button onClick={() => navigate("/pst/dashboard")} className="text-sm text-stone-500 hover:text-stone-700">Guardar y salir</button>
        </div>
      </div>

      {/* Step indicators */}
      <div className="bg-white border-b border-stone-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <button key={s.id} onClick={() => i <= step && setStep(i)} data-testid={`wizard-step-${s.id}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-forest text-white" : done ? "bg-forest/10 text-forest" : "text-stone-400"
                }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">

          {/* Step 0: Datos generales */}
          {step === 0 && (
            <div className="space-y-5" data-testid="wizard-step-datos-content">
              <h2 className="font-outfit font-bold text-lg">Datos generales de tu empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nombre de la empresa *</label>
                  <input type="text" value={form.nombre} onChange={set("nombre")} data-testid="wizard-nombre"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Categoría *</label>
                  <select value={form.categoria} onChange={set("categoria")} data-testid="wizard-categoria"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest bg-white">
                    <option value="">Selecciona...</option>
                    {categorias.map(c => <option key={c.slug || c.nombre} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Email de contacto</label>
                  <input type="email" value={form.email} onChange={set("email")} data-testid="wizard-email"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Teléfono</label>
                  <input type="tel" value={form.telefono} onChange={set("telefono")} data-testid="wizard-telefono"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">WhatsApp</label>
                  <input type="tel" value={form.whatsapp} onChange={set("whatsapp")} data-testid="wizard-whatsapp"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-1">Descripción *</label>
                  <textarea value={form.descripcion} onChange={set("descripcion")} rows={4} data-testid="wizard-descripcion"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Sitio web</label>
                  <input type="url" value={form.social_links.website}
                    onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, website: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="https://" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Instagram</label>
                  <input type="url" value={form.social_links.instagram}
                    onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, instagram: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="https://instagram.com/..." />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Ubicación */}
          {step === 1 && (
            <div className="space-y-5" data-testid="wizard-step-ubicacion-content">
              <h2 className="font-outfit font-bold text-lg">Ubicación</h2>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Dirección</label>
                <input type="text" value={form.direccion} onChange={set("direccion")} data-testid="wizard-direccion"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest"
                  placeholder="Calle, colonia, ciudad, estado" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Latitud</label>
                  <input type="number" step="any" value={form.latitud || ""} data-testid="wizard-latitud"
                    onChange={(e) => setForm({ ...form, latitud: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="20.6597" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Longitud</label>
                  <input type="number" step="any" value={form.longitud || ""} data-testid="wizard-longitud"
                    onChange={(e) => setForm({ ...form, longitud: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="-103.3496" />
                </div>
              </div>
              <p className="text-xs text-stone-400">Puedes encontrar las coordenadas en Google Maps haciendo clic derecho sobre tu ubicación.</p>
            </div>
          )}

          {/* Step 2: Fotos */}
          {step === 2 && (
            <div className="space-y-5" data-testid="wizard-step-fotos-content">
              <h2 className="font-outfit font-bold text-lg">Fotos de tu empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Logo</label>
                  {form.logo_url && <img src={form.logo_url.startsWith("/api") ? `${process.env.REACT_APP_BACKEND_URL}${form.logo_url}` : form.logo_url} alt="Logo" className="w-24 h-24 object-contain rounded-xl border mb-2" />}
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-300 cursor-pointer hover:bg-stone-50 text-sm text-stone-600">
                    <Upload className="w-4 h-4" /> Subir logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], "logo_url")} />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Imagen principal (hero)</label>
                  {form.hero_url && <img src={form.hero_url.startsWith("/api") ? `${process.env.REACT_APP_BACKEND_URL}${form.hero_url}` : form.hero_url} alt="Hero" className="w-full h-32 object-cover rounded-xl border mb-2" />}
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-300 cursor-pointer hover:bg-stone-50 text-sm text-stone-600">
                    <Upload className="w-4 h-4" /> Subir imagen
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], "hero_url")} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Galería ({form.galeria.length} fotos)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.galeria.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url.startsWith("/api") ? `${process.env.REACT_APP_BACKEND_URL}${url}` : url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      <button onClick={() => setForm(prev => ({ ...prev, galeria: prev.galeria.filter((_, j) => j !== i) }))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-300 cursor-pointer hover:bg-stone-50 text-sm text-stone-600 w-fit">
                  <Upload className="w-4 h-4" /> Agregar foto
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], "galeria")} />
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Requisitos */}
          {step === 3 && (
            <div className="space-y-5" data-testid="wizard-step-requisitos-content">
              <h2 className="font-outfit font-bold text-lg">Requisitos de afiliación</h2>
              <p className="text-sm text-stone-500">Completa los requisitos para afiliarte al Clúster. Los marcados con * son obligatorios.</p>
              <div className="space-y-4">
                {requisitos.map((req) => {
                  const comp = getRequisitoVal(req.id);
                  return (
                    <div key={req.id} className={`border rounded-xl p-4 ${req.bloqueante ? "border-amber-300 bg-amber-50/30" : "border-stone-200"}`}
                      data-testid={`requisito-${req.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-stone-800">{req.nombre}</span>
                            {req.bloqueante && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Obligatorio</span>}
                          </div>
                          <p className="text-xs text-stone-500 mb-3">{req.descripcion}</p>

                          {req.tipo_captura === "checkbox" && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={!!comp?.valor} onChange={(e) => updateRequisito(req.id, e.target.checked ? "Sí" : "")}
                                className="w-4 h-4 rounded border-stone-300 text-forest focus:ring-forest" />
                              <span className="text-sm text-stone-700">Cuento con este requisito</span>
                            </label>
                          )}

                          {req.tipo_captura === "selector" && (
                            <select value={comp?.valor || ""} onChange={(e) => updateRequisito(req.id, e.target.value)}
                              className="px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white">
                              <option value="">Selecciona...</option>
                              {(req.opciones_selector || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}

                          {req.tipo_captura === "campo_texto" && (
                            <input type="text" value={comp?.valor || ""} onChange={(e) => updateRequisito(req.id, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" placeholder="Escribe aquí..." />
                          )}

                          {req.tipo_captura === "campo_numerico" && (
                            <input type="number" value={comp?.valor || ""} onChange={(e) => updateRequisito(req.id, e.target.value)}
                              className="w-32 px-3 py-2 rounded-lg border border-stone-200 text-sm" placeholder="0" />
                          )}

                          {(req.tipo_captura === "documento" || req.documento_requerido) && (
                            <div className="mt-2">
                              {comp?.documento_url ? (
                                <div className="flex items-center gap-2 text-sm text-forest">
                                  <FileText className="w-4 h-4" /> Documento subido
                                </div>
                              ) : (
                                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-stone-300 cursor-pointer hover:bg-stone-50 text-sm text-stone-600 w-fit">
                                  <Upload className="w-4 h-4" /> Subir documento (PDF/imagen)
                                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                                    onChange={(e) => e.target.files[0] && handleDocUpload(e.target.files[0], req.id)} />
                                </label>
                              )}
                            </div>
                          )}

                          {req.texto_informativo && comp?.valor === "No" && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                              {req.texto_informativo}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Certificaciones */}
          {step === 4 && (
            <div className="space-y-5" data-testid="wizard-step-certificaciones-content">
              <h2 className="font-outfit font-bold text-lg">Certificaciones</h2>
              <p className="text-sm text-stone-500">Agrega las certificaciones de tu empresa (opcionales). Se mostrarán en tu perfil público como elemento de confianza.</p>
              {form.certificaciones.map((cert, i) => (
                <div key={i} className="border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">Certificación {i + 1}</span>
                    <button onClick={() => setForm(prev => ({ ...prev, certificaciones: prev.certificaciones.filter((_, j) => j !== i) }))}
                      className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                  </div>
                  <input type="text" placeholder="Institución" value={cert.institucion || ""}
                    onChange={(e) => { const c = [...form.certificaciones]; c[i] = { ...c[i], institucion: e.target.value }; setForm({ ...form, certificaciones: c }); }}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
                  <input type="text" placeholder="Nombre de la certificación" value={cert.nombre || ""}
                    onChange={(e) => { const c = [...form.certificaciones]; c[i] = { ...c[i], nombre: e.target.value }; setForm({ ...form, certificaciones: c }); }}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
                </div>
              ))}
              <button onClick={() => setForm(prev => ({ ...prev, certificaciones: [...prev.certificaciones, { institucion: "", nombre: "", documento_url: "" }] }))}
                className="text-forest text-sm font-medium hover:underline">+ Agregar certificación</button>
            </div>
          )}

          {/* Step 5: Preview */}
          {step === 5 && (
            <div className="space-y-6" data-testid="wizard-step-preview-content">
              <h2 className="font-outfit font-bold text-lg">Vista previa de tu perfil</h2>
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                {form.hero_url && (
                  <img src={form.hero_url.startsWith("/api") ? `${process.env.REACT_APP_BACKEND_URL}${form.hero_url}` : form.hero_url}
                    alt="" className="w-full h-48 object-cover" />
                )}
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {form.logo_url && (
                      <img src={form.logo_url.startsWith("/api") ? `${process.env.REACT_APP_BACKEND_URL}${form.logo_url}` : form.logo_url}
                        alt="" className="w-16 h-16 object-contain rounded-xl border" />
                    )}
                    <div>
                      <h3 className="font-outfit font-bold text-xl text-stone-900">{form.nombre || "Nombre de tu empresa"}</h3>
                      <span className="inline-block bg-forest/10 text-forest text-xs font-medium px-2 py-0.5 rounded-full mt-1">{form.categoria || "Categoría"}</span>
                    </div>
                  </div>
                  <p className="text-stone-600 text-sm mb-4">{form.descripcion || "Descripción de tu empresa..."}</p>
                  {form.direccion && <p className="text-stone-500 text-sm flex items-center gap-1"><MapPin className="w-4 h-4" /> {form.direccion}</p>}
                  {form.certificaciones.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <h4 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-1"><Award className="w-4 h-4" /> Certificaciones</h4>
                      {form.certificaciones.map((c, i) => (
                        <p key={i} className="text-xs text-stone-500">{c.institucion} — {c.nombre}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                <Check className="w-4 h-4 inline mr-1" />
                Así se verá tu perfil en el directorio. Al continuar, tu perfil será enviado para pago y revisión.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={prevStep} disabled={step === 0} data-testid="wizard-prev"
            className="flex items-center gap-1 px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 text-sm font-medium disabled:opacity-30 hover:bg-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={nextStep} disabled={saving} data-testid="wizard-next"
              className="flex items-center gap-1 px-5 py-2.5 rounded-full bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : "Siguiente"} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submitForPayment} disabled={saving} data-testid="wizard-submit"
              className="flex items-center gap-1 px-6 py-2.5 rounded-full bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition-colors disabled:opacity-50">
              {saving ? "Enviando..." : "Enviar y proceder al pago"} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
