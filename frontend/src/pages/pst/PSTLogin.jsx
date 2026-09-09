import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PSTLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/pst/login`, { email, password });
      localStorage.setItem("pst_token", data.token);
      localStorage.setItem("pst_cuenta", JSON.stringify(data.cuenta));
      toast.success("Bienvenido");
      navigate(data.cuenta.empresa_id ? "/pst/dashboard" : "/pst/wizard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-limestone flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-outfit font-bold text-3xl text-stone-900">Portal Empresas</h1>
          <p className="text-stone-500 mt-2">Ingresa a tu cuenta de prestador de servicios</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="pst-login-email"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest"
              placeholder="correo@tuempresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="pst-login-password"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest pr-12"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            data-testid="pst-login-submit"
            className="w-full bg-forest text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-forest-dark transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <p className="text-center text-sm text-stone-500">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="text-forest font-medium hover:underline">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
