import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Building2, Clock, CheckCircle2, XCircle, CreditCard, Edit, LogOut, AlertCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  borrador: { label: "Borrador", color: "bg-stone-100 text-stone-600", icon: Edit },
  pendiente_pago: { label: "Pendiente de pago", color: "bg-amber-100 text-amber-700", icon: CreditCard },
  pendiente_aprobacion: { label: "En revisión", color: "bg-blue-100 text-blue-700", icon: Clock },
  aprobado: { label: "Aprobado y publicado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function PSTDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("pst_token");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/pst/login"); return; }
    axios.get(`${API}/pst/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(() => { localStorage.removeItem("pst_token"); navigate("/pst/login"); })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const logout = () => { localStorage.removeItem("pst_token"); localStorage.removeItem("pst_cuenta"); navigate("/pst/login"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-limestone"><div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin" /></div>;

  const empresa = data?.empresa;
  const cuenta = data?.cuenta;
  const status = STATUS_CONFIG[empresa?.estado] || STATUS_CONFIG.borrador;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-limestone">
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-outfit font-bold text-xl text-stone-900">Mi Empresa</h1>
          <button onClick={logout} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Status Banner */}
        <div className={`rounded-2xl p-5 flex items-start gap-3 ${status.color}`} data-testid="pst-status-banner">
          <StatusIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">{status.label}</p>
            {empresa?.estado === "rechazado" && empresa?.motivo_rechazo && (
              <p className="text-xs mt-1 opacity-80">Motivo: {empresa.motivo_rechazo}</p>
            )}
            {empresa?.estado === "borrador" && <p className="text-xs mt-1 opacity-80">Completa tu perfil para continuar con la afiliación.</p>}
            {empresa?.estado === "pendiente_pago" && <p className="text-xs mt-1 opacity-80">Tu perfil está listo. Procede al pago para que sea revisado.</p>}
          </div>
        </div>

        {/* Company Info */}
        {empresa ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden" data-testid="pst-empresa-card">
            {empresa.hero_url && <img src={empresa.hero_url} alt="" className="w-full h-40 object-cover" />}
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                {empresa.logo_url && <img src={empresa.logo_url} alt="" className="w-14 h-14 object-contain rounded-xl border" />}
                <div>
                  <h2 className="font-outfit font-bold text-xl text-stone-900">{empresa.nombre}</h2>
                  <span className="inline-block bg-forest/10 text-forest text-xs font-medium px-2 py-0.5 rounded-full mt-1">{empresa.categoria}</span>
                </div>
              </div>
              <p className="text-stone-600 text-sm line-clamp-3">{empresa.descripcion}</p>
              <div className="mt-4 flex gap-3">
                {(empresa.estado === "borrador" || empresa.estado === "rechazado") && (
                  <Link to="/pst/wizard" data-testid="pst-edit-profile-btn"
                    className="bg-forest text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-forest-dark transition-colors">
                    <Edit className="w-4 h-4" /> Editar perfil
                  </Link>
                )}
                {empresa.estado === "pendiente_pago" && (
                  <Link to="/pst/pago" data-testid="pst-pay-btn"
                    className="bg-forest text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-forest-dark transition-colors">
                    <CreditCard className="w-4 h-4" /> Proceder al pago
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center" data-testid="pst-no-empresa">
            <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h2 className="font-outfit font-bold text-lg text-stone-800 mb-2">Crea tu perfil de empresa</h2>
            <p className="text-stone-500 text-sm mb-6">Completa el wizard para crear tu perfil y afiliarte al Clúster.</p>
            <Link to="/pst/wizard" data-testid="pst-start-wizard-btn"
              className="inline-flex items-center gap-2 bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-forest-dark transition-colors">
              <Edit className="w-4 h-4" /> Comenzar wizard
            </Link>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-outfit font-bold text-sm text-stone-700 mb-3">Datos de la cuenta</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-stone-400">Email:</span> <span className="text-stone-700">{cuenta?.email}</span></div>
            <div><span className="text-stone-400">Contacto:</span> <span className="text-stone-700">{cuenta?.nombre_contacto}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
