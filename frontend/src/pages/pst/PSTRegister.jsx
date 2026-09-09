import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { UserPlus, Eye, EyeOff } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PSTRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", password2: "", nombre_contacto: "", telefono_contacto: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error("Las contraseñas no coinciden"); return; }
    if (form.password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/pst/register`, {
        email: form.email,
        password: form.password,
        nombre_contacto: form.nombre_contacto,
        telefono_contacto: form.telefono_contacto,
      });
      localStorage.setItem("pst_token", data.token);
      localStorage.setItem("pst_cuenta", JSON.stringify(data.cuenta));
      toast.success("Cuenta creada exitosamente");
      navigate("/pst/wizard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-limestone flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-outfit font-bold text-3xl text-stone-900">Crea tu cuenta</h1>
          <p className="text-stone-500 mt-2">Regístrate como prestador de servicios turísticos</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Nombre de contacto *</label>
            <input type="text" value={form.nombre_contacto} onChange={set("nombre_contacto")} required data-testid="pst-reg-name"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="Tu nombre completo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={set("email")} required data-testid="pst-reg-email"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="correo@tuempresa.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Teléfono de contacto</label>
            <input type="tel" value={form.telefono_contacto} onChange={set("telefono_contacto")} data-testid="pst-reg-phone"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" placeholder="+52 33 1234 5678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Contraseña * (mín. 8 caracteres)</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} required data-testid="pst-reg-password"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest pr-12" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Confirmar contraseña *</label>
            <input type="password" value={form.password2} onChange={set("password2")} required data-testid="pst-reg-password2"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-forest" />
          </div>
          <button type="submit" disabled={loading} data-testid="pst-reg-submit"
            className="w-full bg-forest text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-forest-dark transition-colors disabled:opacity-50">
            <UserPlus className="w-4 h-4" />
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
          <p className="text-center text-sm text-stone-500">
            ¿Ya tienes cuenta?{" "}
            <Link to="/pst/login" className="text-forest font-medium hover:underline">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
