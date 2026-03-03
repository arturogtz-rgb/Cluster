import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Lock, User, ArrowRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CLUSTER_LOGO = "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, form);
      localStorage.setItem("auth_token", response.data.token);
      localStorage.setItem("auth_username", response.data.username);
      toast.success("Bienvenido al panel de administración");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.detail || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-6 py-12 bg-limestone"
      data-testid="admin-login-page"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={CLUSTER_LOGO}
            alt="Clúster Turismo Jalisco"
            className="h-20 mx-auto mb-6"
          />
          <h1 className="font-outfit font-bold text-2xl text-stone-900 mb-2">
            Panel de Administración
          </h1>
          <p className="font-inter text-stone-600 text-sm">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Login Form */}
        <form 
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-card p-8"
          data-testid="login-form"
        >
          {/* Username */}
          <div className="mb-6">
            <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-stone-400" />
              </div>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                data-testid="login-username"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 placeholder-stone-400 font-inter text-sm focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 transition-all"
                placeholder="Tu nombre de usuario"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-8">
            <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-stone-400" />
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                data-testid="login-password"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 placeholder-stone-400 font-inter text-sm focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 transition-all"
                placeholder="Tu contraseña"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit-btn"
            className="w-full bg-forest text-white py-4 rounded-full font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-forest-dark hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              "Ingresando..."
            ) : (
              <>
                Ingresar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Help Text */}
        <p className="text-center text-stone-500 text-sm mt-6">
          Credenciales por defecto: <strong>admin</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
