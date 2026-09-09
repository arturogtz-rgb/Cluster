import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { CreditCard, Building, Tag, Check, ChevronRight, ArrowLeft, Copy } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PSTPago() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem("pst_token");
  const [planes, setPlanes] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [metodo, setMetodo] = useState("stripe");
  const [codigoInput, setCodigoInput] = useState("");
  const [codigoValido, setCodigoValido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transferInfo, setTransferInfo] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/pst/login"); return; }
    if (searchParams.get("cancelled")) toast.info("Pago cancelado");
    axios.get(`${API}/planes`).then(res => setPlanes(res.data || []));
  }, [token, navigate, searchParams]);

  const validateCode = async () => {
    if (!codigoInput.trim()) return;
    try {
      const { data } = await axios.post(`${API}/codigos-descuento/validar`, { codigo: codigoInput });
      setCodigoValido(data);
      toast.success(`Código válido: ${data.tipo_descuento === "porcentaje" ? `${data.valor}% de descuento` : `$${data.valor} de descuento`}`);
    } catch (err) {
      setCodigoValido(null);
      toast.error(err.response?.data?.detail || "Código inválido");
    }
  };

  const calcPrecioFinal = (plan) => {
    let precio = plan.precio;
    if (codigoValido) {
      if (codigoValido.tipo_descuento === "porcentaje") precio = precio * (1 - codigoValido.valor / 100);
      else precio = Math.max(0, precio - codigoValido.valor);
    }
    return Math.round(precio * 100) / 100;
  };

  const handlePay = async () => {
    if (!selectedPlan) { toast.error("Selecciona un plan"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/pst/checkout`, {
        plan_id: selectedPlan.id,
        metodo_pago: metodo,
        codigo_descuento: codigoValido?.codigo || null,
        origin_url: window.location.origin,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (data.status === "free") {
        toast.success(data.message);
        navigate("/pst/dashboard");
      } else if (data.status === "stripe") {
        window.location.href = data.checkout_url;
      } else if (data.status === "transfer") {
        setTransferInfo(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al procesar pago");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success("Copiado"); };

  // Transfer info view
  if (transferInfo) {
    return (
      <div className="min-h-screen bg-limestone px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <Building className="w-12 h-12 text-forest mx-auto mb-3" />
              <h2 className="font-outfit font-bold text-xl text-stone-900">Transferencia bancaria</h2>
              <p className="text-sm text-stone-500 mt-1">Realiza la transferencia con los datos siguientes</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4 space-y-3 mb-6">
              <p className="text-2xl font-bold text-forest text-center">${transferInfo.monto} MXN</p>
              {[
                { label: "Banco", value: transferInfo.banco.nombre },
                { label: "CLABE", value: transferInfo.banco.clabe },
                { label: "Titular", value: transferInfo.banco.titular },
                { label: "Referencia", value: transferInfo.banco.referencia || transferInfo.suscripcion_id?.slice(0, 8) },
              ].map(item => item.value && (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-stone-200 last:border-0">
                  <div><span className="text-xs text-stone-400">{item.label}</span><p className="text-sm font-medium text-stone-800">{item.value}</p></div>
                  <button onClick={() => copyToClipboard(item.value)} className="p-1.5 rounded-lg hover:bg-stone-200"><Copy className="w-3.5 h-3.5 text-stone-400" /></button>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-500 text-center mb-4">Una vez realizada la transferencia, el administrador verificará tu pago y aprobará tu perfil.</p>
            <button onClick={() => navigate("/pst/dashboard")} data-testid="transfer-done-btn"
              className="w-full bg-forest text-white py-3 rounded-full font-semibold text-sm hover:bg-forest-dark transition-colors">
              Listo, ya transferí
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-limestone">
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/pst/dashboard")} className="text-stone-400 hover:text-stone-600"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-outfit font-bold text-xl text-stone-900">Elige tu plan</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planes.map(plan => {
            const precioFinal = calcPrecioFinal(plan);
            const selected = selectedPlan?.id === plan.id;
            return (
              <button key={plan.id} onClick={() => setSelectedPlan(plan)} data-testid={`plan-select-${plan.id}`}
                className={`text-left p-5 rounded-2xl border-2 transition-all ${selected ? "border-forest bg-forest/5 shadow-md" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                <h3 className="font-outfit font-bold text-lg text-stone-900">{plan.nombre}</h3>
                <p className="text-sm text-stone-500 mt-1">{plan.duracion_meses} {plan.duracion_meses === 1 ? "mes" : "meses"}</p>
                <div className="mt-3">
                  {precioFinal === 0 ? (
                    <span className="text-2xl font-bold text-forest">Gratis</span>
                  ) : (
                    <><span className="text-2xl font-bold text-stone-900">${precioFinal}</span><span className="text-sm text-stone-500"> MXN</span></>
                  )}
                  {codigoValido && plan.precio > 0 && precioFinal < plan.precio && (
                    <span className="text-xs text-red-400 line-through ml-2">${plan.precio}</span>
                  )}
                </div>
                {plan.beneficios?.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {plan.beneficios.map((b, i) => (
                      <li key={i} className="text-xs text-stone-600 flex items-start gap-1"><Check className="w-3 h-3 text-forest mt-0.5 flex-shrink-0" />{b}</li>
                    ))}
                  </ul>
                )}
                {selected && <div className="mt-3 text-xs font-medium text-forest flex items-center gap-1"><Check className="w-4 h-4" /> Seleccionado</div>}
              </button>
            );
          })}
        </div>

        {/* Discount Code */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-medium text-sm text-stone-700 mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Código de descuento</h3>
          <div className="flex gap-2">
            <input type="text" value={codigoInput} onChange={(e) => setCodigoInput(e.target.value.toUpperCase())} placeholder="CODIGO"
              data-testid="discount-code-input"
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-forest font-mono uppercase text-sm" />
            <button onClick={validateCode} data-testid="validate-code-btn"
              className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors">Aplicar</button>
          </div>
          {codigoValido && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> {codigoValido.tipo_descuento === "porcentaje" ? `${codigoValido.valor}%` : `$${codigoValido.valor}`} de descuento aplicado</p>}
        </div>

        {/* Payment Method (only if price > 0) */}
        {selectedPlan && calcPrecioFinal(selectedPlan) > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-medium text-sm text-stone-700 mb-3">Método de pago</h3>
            <div className="flex gap-3">
              <button onClick={() => setMetodo("stripe")} data-testid="method-stripe"
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${metodo === "stripe" ? "border-forest bg-forest/5" : "border-stone-200"}`}>
                <CreditCard className="w-5 h-5 text-stone-600 mb-1" />
                <span className="block text-sm font-medium text-stone-800">Tarjeta</span>
                <span className="text-[10px] text-stone-500">Cargo automático</span>
              </button>
              <button onClick={() => setMetodo("transferencia")} data-testid="method-transfer"
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${metodo === "transferencia" ? "border-forest bg-forest/5" : "border-stone-200"}`}>
                <Building className="w-5 h-5 text-stone-600 mb-1" />
                <span className="block text-sm font-medium text-stone-800">Transferencia</span>
                <span className="text-[10px] text-stone-500">Verificación manual</span>
              </button>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <button onClick={handlePay} disabled={!selectedPlan || loading} data-testid="pay-btn"
          className="w-full bg-forest text-white py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-forest-dark transition-colors disabled:opacity-50 shadow-lg">
          {loading ? "Procesando..." : (
            selectedPlan && calcPrecioFinal(selectedPlan) === 0 ? "Activar plan gratuito" :
            metodo === "stripe" ? "Pagar con tarjeta" : "Ver datos de transferencia"
          )}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
