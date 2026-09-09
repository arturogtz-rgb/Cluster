import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ClipboardCheck, Plus, Edit2, Trash2, Save, X, GripVertical } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIPOS_CAPTURA = [
  { value: "documento", label: "Documento (PDF/imagen)" },
  { value: "checkbox", label: "Casilla de verificación" },
  { value: "selector", label: "Selector de opciones" },
  { value: "campo_texto", label: "Campo de texto" },
  { value: "campo_numerico", label: "Campo numérico" },
];

export default function AdminRequisitos() {
  const navigate = useNavigate();
  const token = localStorage.getItem("auth_token");
  const [requisitos, setRequisitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchRequisitos();
  }, [token, navigate]);

  const fetchRequisitos = async () => {
    try {
      const { data } = await axios.get(`${API}/admin/requisitos`, { headers: { Authorization: `Bearer ${token}` } });
      setRequisitos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const startNew = () => {
    setEditing("new");
    setForm({ nombre: "", descripcion: "", eje: "", bloqueante: false, tipo_captura: "checkbox", opciones_selector: [], documento_requerido: false, texto_informativo: "", orden: requisitos.length + 1, activo: true });
  };

  const startEdit = (req) => { setEditing(req.id); setForm({ ...req }); };
  const cancelEdit = () => { setEditing(null); setForm(null); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      if (editing === "new") {
        await axios.post(`${API}/admin/requisitos`, form, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Requisito creado");
      } else {
        await axios.put(`${API}/admin/requisitos/${editing}`, form, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Requisito actualizado");
      }
      cancelEdit();
      fetchRequisitos();
    } catch (err) { toast.error(err.response?.data?.detail || "Error al guardar"); }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el requisito "${nombre}"?`)) return;
    try {
      await axios.delete(`${API}/admin/requisitos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Requisito eliminado");
      fetchRequisitos();
    } catch (err) { toast.error("Error al eliminar"); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === "boolean" ? e : e.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e });

  return (
    <div className="p-4 lg:p-8" data-testid="admin-requisitos-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">Requisitos de Afiliación</h1>
          <p className="text-sm text-stone-500 mt-1">Configura los requisitos que deben cumplir las empresas para afiliarse</p>
        </div>
        <button onClick={startNew} data-testid="new-requisito-btn"
          className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg w-fit">
          <Plus className="w-4 h-4" /> Nuevo Requisito
        </button>
      </div>

      {/* Edit Form */}
      {form && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-forest/20" data-testid="requisito-form">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-outfit font-bold text-lg">{editing === "new" ? "Nuevo Requisito" : "Editar Requisito"}</h3>
            <button onClick={cancelEdit} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={set("nombre")} data-testid="requisito-nombre"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={set("descripcion")} rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Eje/Categoría</label>
              <input type="text" value={form.eje} onChange={set("eje")} placeholder="Ej: Fiscal, Regulatorio..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Tipo de captura</label>
              <select value={form.tipo_captura} onChange={set("tipo_captura")}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest bg-white">
                {TIPOS_CAPTURA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {form.tipo_captura === "selector" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-1">Opciones (separadas por coma)</label>
                <input type="text" value={(form.opciones_selector || []).join(", ")}
                  onChange={(e) => setForm({ ...form, opciones_selector: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="Sí, En trámite, No" />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Texto informativo (se muestra como ayuda)</label>
              <textarea value={form.texto_informativo} onChange={set("texto_informativo")} rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Orden</label>
              <input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) || 0 })}
                className="w-24 px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
            </div>
            <div className="flex items-center gap-6 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.bloqueante} onChange={set("bloqueante")}
                  className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500" />
                <span className="text-sm font-medium text-stone-700">Bloqueante</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.documento_requerido} onChange={set("documento_requerido")}
                  className="w-4 h-4 rounded border-stone-300 text-forest focus:ring-forest" />
                <span className="text-sm font-medium text-stone-700">Pide documento</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={set("activo")}
                  className="w-4 h-4 rounded border-stone-300 text-forest focus:ring-forest" />
                <span className="text-sm font-medium text-stone-700">Activo</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} data-testid="save-requisito-btn"
              className="bg-forest text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-forest-dark transition-colors">
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button onClick={cancelEdit} className="px-5 py-2 rounded-full text-sm font-medium border border-stone-300 text-stone-600 hover:bg-stone-50">Cancelar</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <div className="skeleton rounded-2xl h-48" /> : (
        <div className="space-y-3">
          {requisitos.map((req) => (
            <div key={req.id} className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 ${!req.activo ? "opacity-50" : ""}`} data-testid={`requisito-item-${req.id}`}>
              <GripVertical className="w-4 h-4 text-stone-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-stone-800">{req.nombre}</span>
                  {req.bloqueante && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Bloqueante</span>}
                  {req.documento_requerido && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Documento</span>}
                  {!req.activo && <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-medium">Inactivo</span>}
                  <span className="text-[10px] text-stone-400">{req.eje}</span>
                </div>
                <p className="text-xs text-stone-500 truncate">{req.descripcion}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(req)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(req.id, req.nombre)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {requisitos.length === 0 && <p className="text-center text-stone-500 py-8">No hay requisitos configurados</p>}
        </div>
      )}
    </div>
  );
}
