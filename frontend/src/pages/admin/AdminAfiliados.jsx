import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Users, CheckCircle2, XCircle, Clock, CreditCard, Eye, ChevronDown, Search, FileText } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "borrador", label: "Borrador" },
  { value: "pendiente_pago", label: "Pendiente pago" },
  { value: "pendiente_aprobacion", label: "Pendiente aprobación" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
];

const STATUS_BADGE = {
  borrador: "bg-stone-100 text-stone-600",
  pendiente_pago: "bg-amber-100 text-amber-700",
  pendiente_aprobacion: "bg-blue-100 text-blue-700",
  aprobado: "bg-green-100 text-green-700",
  rechazado: "bg-red-100 text-red-700",
};

export default function AdminAfiliados() {
  const navigate = useNavigate();
  const token = localStorage.getItem("auth_token");
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actionModal, setActionModal] = useState(null);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchEmpresas();
  }, [token, navigate, filter]);

  const fetchEmpresas = async () => {
    try {
      const url = filter ? `${API}/admin/empresas-afiliadas?estado=${filter}` : `${API}/admin/empresas-afiliadas`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setEmpresas(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const changeEstado = async (empresaId, nuevoEstado) => {
    try {
      const body = { estado: nuevoEstado };
      if (nuevoEstado === "rechazado") body.motivo = motivo;
      await axios.put(`${API}/admin/empresas-afiliadas/${empresaId}/estado`, body, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Estado cambiado a ${nuevoEstado}`);
      setActionModal(null);
      setMotivo("");
      fetchEmpresas();
    } catch (err) { toast.error(err.response?.data?.detail || "Error"); }
  };

  const filtered = empresas.filter(e => !search || e.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 lg:p-8" data-testid="admin-afiliados-page">
      <div className="mb-8">
        <h1 className="font-outfit font-bold text-2xl text-stone-900">Empresas Afiliadas</h1>
        <p className="text-sm text-stone-500 mt-1">Gestiona el estado de las empresas que se registraron por auto-servicio</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-forest text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-forest text-sm min-w-[200px]">
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", count: empresas.length, color: "text-stone-700" },
          { label: "Pendiente pago", count: empresas.filter(e => e.estado === "pendiente_pago").length, color: "text-amber-600" },
          { label: "En revisión", count: empresas.filter(e => e.estado === "pendiente_aprobacion").length, color: "text-blue-600" },
          { label: "Aprobados", count: empresas.filter(e => e.estado === "aprobado").length, color: "text-green-600" },
          { label: "Rechazados", count: empresas.filter(e => e.estado === "rechazado").length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className={`font-outfit font-bold text-xl ${s.color}`}>{s.count}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? <div className="skeleton rounded-2xl h-48" /> : (
        <div className="space-y-3">
          {filtered.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm p-4" data-testid={`afiliado-${emp.id}`}>
              <div className="flex items-start gap-4">
                {emp.logo_url && <img src={emp.logo_url} alt="" className="w-12 h-12 object-contain rounded-lg border flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-stone-800">{emp.nombre}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[emp.estado] || ""}`}>
                      {emp.estado?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{emp.categoria} | {emp.cuenta_info?.email || "Sin cuenta"}</p>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-1">{emp.descripcion}</p>
                  {emp.motivo_rechazo && <p className="text-xs text-red-500 mt-1">Motivo rechazo: {emp.motivo_rechazo}</p>}

                  {/* Requisitos summary */}
                  {emp.requisitos_completados?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <FileText className="w-3 h-3 text-stone-400" />
                      <span className="text-[10px] text-stone-400">{emp.requisitos_completados.length} requisitos completados</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {emp.estado === "pendiente_aprobacion" && (
                    <>
                      <button onClick={() => changeEstado(emp.id, "aprobado")} data-testid={`approve-${emp.id}`}
                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Aprobar">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setActionModal(emp)} data-testid={`reject-${emp.id}`}
                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100" title="Rechazar">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {emp.estado === "pendiente_pago" && (
                    <button onClick={() => changeEstado(emp.id, "pendiente_aprobacion")} data-testid={`mark-paid-${emp.id}`}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium px-3" title="Marcar como pagado">
                      <CreditCard className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => navigate(`/admin/empresas/editar/${emp.slug}`)}
                    className="p-2 rounded-lg bg-stone-50 text-stone-500 hover:bg-stone-100" title="Editar">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-stone-500 py-8">No hay empresas afiliadas{filter && ` con estado "${filter}"`}</p>}
        </div>
      )}

      {/* Reject Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" data-testid="reject-modal">
            <h3 className="font-outfit font-bold text-lg mb-2">Rechazar empresa</h3>
            <p className="text-sm text-stone-500 mb-4">Indica el motivo del rechazo para "{actionModal.nombre}"</p>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} data-testid="reject-motivo"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-red-400 resize-none mb-4"
              placeholder="Escribe el motivo..." />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setActionModal(null); setMotivo(""); }}
                className="px-4 py-2 rounded-full border border-stone-300 text-sm font-medium text-stone-600">Cancelar</button>
              <button onClick={() => changeEstado(actionModal.id, "rechazado")} data-testid="confirm-reject-btn"
                className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600">Rechazar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
