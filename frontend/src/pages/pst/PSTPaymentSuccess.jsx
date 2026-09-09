import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PSTPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    const check = async () => {
      try {
        const { data } = await axios.get(`${API}/pst/payment-status/${sessionId}`);
        if (data.payment_status === "paid") setStatus("paid");
        else if (data.status === "failed") setStatus("failed");
        else setTimeout(check, 2000);
      } catch { setStatus("error"); }
    };
    check();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-limestone flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === "checking" && (
          <>
            <Loader2 className="w-12 h-12 text-forest animate-spin mx-auto mb-4" />
            <h2 className="font-outfit font-bold text-xl text-stone-900">Verificando pago...</h2>
            <p className="text-sm text-stone-500 mt-2">Estamos confirmando tu pago con Stripe.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="font-outfit font-bold text-xl text-stone-900">Pago confirmado</h2>
            <p className="text-sm text-stone-500 mt-2 mb-6">Tu perfil ha sido enviado para revisión. Te notificaremos cuando sea aprobado.</p>
            <Link to="/pst/dashboard" data-testid="go-to-dashboard"
              className="inline-block bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-forest-dark transition-colors">
              Ir a mi panel
            </Link>
          </>
        )}
        {(status === "failed" || status === "error") && (
          <>
            <h2 className="font-outfit font-bold text-xl text-stone-900">Error en el pago</h2>
            <p className="text-sm text-stone-500 mt-2 mb-6">Hubo un problema con tu pago. Intenta nuevamente.</p>
            <Link to="/pst/pago" className="inline-block bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm">Reintentar</Link>
          </>
        )}
      </div>
    </div>
  );
}
