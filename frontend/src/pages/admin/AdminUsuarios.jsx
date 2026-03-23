import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  ShieldCheck,
  Pencil,
  X,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const token = localStorage.getItem("auth_token");

  const [form, setForm] = useState({
    username: "",
    password: "",
    nombre: "",
    email: "",
    role: "editor",
    activo: true,
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchUsuarios();
  }, [token, navigate]);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${API}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setForm({
        username: user.username,
        password: "",
        nombre: user.nombre || "",
        email: user.email || "",
        role: user.role || "editor",
        activo: user.activo !== false,
      });
      setEditingUser(user);
    } else {
      setForm({
        username: "",
        password: "",
        nombre: "",
        email: "",
        role: "editor",
        activo: true,
      });
      setEditingUser(null);
    }
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await axios.put(
          `${API}/usuarios/${editingUser.id}`,
          {
            nombre: form.nombre,
            email: form.email,
            role: form.role,
            activo: form.activo,
            password: form.password || undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Usuario actualizado");
      } else {
        if (!form.password) {
          toast.error("La contraseña es requerida para usuarios nuevos");
          return;
        }
        await axios.post(`${API}/usuarios`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Usuario creado");
      }
      setModalOpen(false);
      fetchUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar");
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`¿Eliminar al usuario "${username}"?`)) return;
    try {
      await axios.delete(`${API}/usuarios/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Usuario eliminado");
      fetchUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar");
    }
  };

  const roleLabel = (role) => {
    switch (role) {
      case "admin":
        return { text: "Administrador", color: "bg-forest/10 text-forest" };
      case "editor":
        return { text: "Editor", color: "bg-adventure/10 text-adventure" };
      default:
        return { text: role, color: "bg-stone-100 text-stone-600" };
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">
            Usuarios
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {usuarios.length} usuarios registrados
          </p>
        </div>
        <button
          onClick={() => openModal()}
          data-testid="new-user-btn"
          className="bg-forest text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg w-fit"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Roles Explanation */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="font-outfit font-bold text-base mb-4 text-stone-900">
          Roles del sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-forest/5 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-forest mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-stone-900">
                Administrador
              </p>
              <p className="text-xs text-stone-500">
                Control total: empresas, configuración, usuarios, media
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-adventure/5 rounded-xl">
            <Pencil className="w-5 h-5 text-adventure mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-stone-900">Editor</p>
              <p className="text-xs text-stone-500">
                Solo puede gestionar artículos y actividades
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-20" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-stone-100">
            {usuarios.map((user) => {
              const role = roleLabel(user.role);
              return (
                <div
                  key={user.id}
                  data-testid={`user-row-${user.username}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-outfit font-bold text-stone-600 uppercase">
                      {user.username.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-outfit font-bold text-stone-900 text-sm">
                      {user.nombre || user.username}
                    </p>
                    <p className="text-xs text-stone-500">
                      @{user.username}
                      {user.email && ` - ${user.email}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${role.color}`}
                  >
                    {role.text}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      user.activo !== false
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {user.activo !== false ? "Activo" : "Inactivo"}
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openModal(user)}
                      data-testid={`edit-user-${user.username}`}
                      className="bg-stone-100 text-stone-700 p-2 rounded-lg hover:bg-stone-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(user.id, user.username)
                      }
                      data-testid={`delete-user-${user.username}`}
                      className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-floating w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-outfit font-bold text-xl text-stone-900">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-stone-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Nombre de usuario *
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  disabled={!!editingUser}
                  data-testid="user-username-input"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest disabled:opacity-50"
                  placeholder="nombre_usuario"
                />
              </div>
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Contraseña {editingUser ? "(dejar vacío para no cambiar)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required={!editingUser}
                    data-testid="user-password-input"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest pr-12"
                    placeholder={
                      editingUser ? "Nueva contraseña" : "Contraseña"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                  Rol
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                  }
                  data-testid="user-role-select"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                >
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
              {editingUser && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) =>
                      setForm({ ...form, activo: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                  />
                  <span className="text-sm text-stone-700">Usuario activo</span>
                </label>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 rounded-full border border-stone-200 text-stone-700 font-medium text-sm hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark"
                >
                  <Save className="w-4 h-4" />
                  {editingUser ? "Actualizar" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuarios;
