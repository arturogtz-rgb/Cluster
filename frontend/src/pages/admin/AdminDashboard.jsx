import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2,
  Newspaper,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  X,
  Save,
  Eye,
  EyeOff,
  Star,
  Menu,
  Bold,
  Italic,
  List,
  Heading2,
  Link as LinkIcon,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CLUSTER_LOGO = "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";

const CATEGORIES = [
  "Capacitación",
  "Operadora de aventura",
  "Parque acuático",
  "Hospedaje",
  "Parque de aventura",
];

// Simple Rich Text Editor component compatible with React 19
const RichTextEditor = ({ value, onChange }) => {
  const [textValue, setTextValue] = useState(value || "");

  useEffect(() => {
    setTextValue(value || "");
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    onChange(newValue);
  };

  const insertTag = useCallback((tag, closingTag = null) => {
    const textarea = document.getElementById("rich-editor");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textValue.substring(start, end);
    const closeTag = closingTag || tag;
    
    let newText;
    if (selectedText) {
      newText = textValue.substring(0, start) + `<${tag}>${selectedText}</${closeTag}>` + textValue.substring(end);
    } else {
      newText = textValue.substring(0, start) + `<${tag}></${closeTag}>` + textValue.substring(end);
    }
    
    setTextValue(newText);
    onChange(newText);
  }, [textValue, onChange]);

  const insertList = useCallback(() => {
    const textarea = document.getElementById("rich-editor");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textValue.substring(start, end);
    
    let newText;
    if (selectedText) {
      const items = selectedText.split('\n').map(item => `<li>${item.trim()}</li>`).join('\n');
      newText = textValue.substring(0, start) + `<ul>\n${items}\n</ul>` + textValue.substring(end);
    } else {
      newText = textValue.substring(0, start) + `<ul>\n<li></li>\n</ul>` + textValue.substring(end);
    }
    
    setTextValue(newText);
    onChange(newText);
  }, [textValue, onChange]);

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <div className="bg-stone-100 p-2 flex gap-1 border-b border-stone-200">
        <button
          type="button"
          onClick={() => insertTag('h2')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Encabezado"
        >
          <Heading2 className="w-4 h-4 text-stone-600" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('strong')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Negrita"
        >
          <Bold className="w-4 h-4 text-stone-600" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('em')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Cursiva"
        >
          <Italic className="w-4 h-4 text-stone-600" />
        </button>
        <button
          type="button"
          onClick={insertList}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Lista"
        >
          <List className="w-4 h-4 text-stone-600" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('a href=""', 'a')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Enlace"
        >
          <LinkIcon className="w-4 h-4 text-stone-600" />
        </button>
      </div>
      <textarea
        id="rich-editor"
        value={textValue}
        onChange={handleChange}
        rows={12}
        className="w-full p-4 text-sm font-mono resize-none focus:outline-none"
        placeholder="Escribe el contenido HTML aquí. Usa los botones de arriba para insertar formato."
      />
      <div className="bg-stone-50 px-4 py-2 text-xs text-stone-500 border-t border-stone-200">
        Tip: Puedes usar etiquetas HTML como &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("empresas");
  const [empresas, setEmpresas] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states
  const [empresaForm, setEmpresaForm] = useState({
    nombre: "",
    categoria: "Capacitación",
    descripcion: "",
    logo_url: "",
    hero_url: "",
    galeria: [],
    telefono: "",
    whatsapp: "",
    direccion: "",
    email: "",
    social_links: {
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      linkedin: "",
      website: "",
    },
    actividades: [],
    destacada: false,
    activa: true,
  });

  const [articuloForm, setArticuloForm] = useState({
    titulo: "",
    contenido: "",
    resumen: "",
    hero_url: "",
    galeria: [],
    publicado: false,
  });

  const [actividadInput, setActividadInput] = useState("");
  const [galeriaInput, setGaleriaInput] = useState("");

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empresasRes, articulosRes] = await Promise.all([
        axios.get(`${API}/empresas`),
        axios.get(`${API}/articulos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setEmpresas(empresasRes.data);
      setArticulos(articulosRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_username");
    navigate("/admin");
  };

  const openModal = (type, item = null) => {
    if (type === "empresa") {
      if (item) {
        setEmpresaForm({
          ...item,
          social_links: item.social_links || {},
          actividades: item.actividades || [],
          galeria: item.galeria || [],
        });
        setEditingItem(item);
      } else {
        setEmpresaForm({
          nombre: "",
          categoria: "Capacitación",
          descripcion: "",
          logo_url: "",
          hero_url: "",
          galeria: [],
          telefono: "",
          whatsapp: "",
          direccion: "",
          email: "",
          social_links: {
            facebook: "",
            instagram: "",
            twitter: "",
            youtube: "",
            linkedin: "",
            website: "",
          },
          actividades: [],
          destacada: false,
          activa: true,
        });
        setEditingItem(null);
      }
    } else {
      if (item) {
        setArticuloForm({
          ...item,
          galeria: item.galeria || [],
        });
        setEditingItem(item);
      } else {
        setArticuloForm({
          titulo: "",
          contenido: "",
          resumen: "",
          hero_url: "",
          galeria: [],
          publicado: false,
        });
        setEditingItem(null);
      }
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setActividadInput("");
    setGaleriaInput("");
  };

  const handleSaveEmpresa = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/empresas/${editingItem.slug}`, empresaForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Empresa actualizada");
      } else {
        await axios.post(`${API}/empresas`, empresaForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Empresa creada");
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error saving empresa:", error);
      toast.error(error.response?.data?.detail || "Error al guardar");
    }
  };

  const handleSaveArticulo = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/articulos/${editingItem.slug}`, articuloForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Artículo actualizado");
      } else {
        await axios.post(`${API}/articulos`, articuloForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Artículo creado");
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error saving articulo:", error);
      toast.error(error.response?.data?.detail || "Error al guardar");
    }
  };

  const handleDelete = async (type, slug) => {
    if (!window.confirm("¿Estás seguro de eliminar este elemento?")) return;

    try {
      await axios.delete(`${API}/${type}/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Eliminado correctamente");
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar");
    }
  };

  const addActividad = () => {
    if (actividadInput.trim()) {
      setEmpresaForm({
        ...empresaForm,
        actividades: [...empresaForm.actividades, actividadInput.trim()],
      });
      setActividadInput("");
    }
  };

  const removeActividad = (index) => {
    setEmpresaForm({
      ...empresaForm,
      actividades: empresaForm.actividades.filter((_, i) => i !== index),
    });
  };

  const addGaleriaImage = (form, setForm) => {
    if (galeriaInput.trim()) {
      setForm({
        ...form,
        galeria: [...form.galeria, galeriaInput.trim()],
      });
      setGaleriaInput("");
    }
  };

  const removeGaleriaImage = (index, form, setForm) => {
    setForm({
      ...form,
      galeria: form.galeria.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-stone-100" data-testid="admin-dashboard">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2"
          data-testid="mobile-sidebar-toggle"
        >
          <Menu className="w-6 h-6" />
        </button>
        <img src={CLUSTER_LOGO} alt="Logo" className="h-8" />
        <button onClick={handleLogout} className="p-2 text-stone-500">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="admin-sidebar"
      >
        <div className="p-6">
          <div className="bg-white rounded-xl p-3 mb-8 inline-block">
            <img
              src={CLUSTER_LOGO}
              alt="Clúster Turismo"
              className="h-12"
            />
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab("empresas");
                setSidebarOpen(false);
              }}
              data-testid="tab-empresas"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === "empresas"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              <Building2 className="w-5 h-5" />
              Empresas
            </button>

            <button
              onClick={() => {
                setActiveTab("articulos");
                setSidebarOpen(false);
              }}
              data-testid="tab-articulos"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === "articulos"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              <Newspaper className="w-5 h-5" />
              Artículos
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-outfit font-bold text-2xl text-stone-900">
              {activeTab === "empresas" ? "Gestión de Empresas" : "Gestión de Artículos"}
            </h1>
            <p className="font-inter text-stone-500 text-sm">
              {activeTab === "empresas"
                ? `${empresas.length} empresas registradas`
                : `${articulos.length} artículos`}
            </p>
          </div>

          <button
            onClick={() => openModal(activeTab === "empresas" ? "empresa" : "articulo")}
            data-testid="add-new-btn"
            className="bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition-all hover:bg-forest-dark hover:scale-105 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "empresas" ? "Nueva Empresa" : "Nuevo Artículo"}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton rounded-2xl h-48" />
            ))}
          </div>
        ) : activeTab === "empresas" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {empresas.map((empresa) => (
              <div
                key={empresa.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
                data-testid={`admin-empresa-${empresa.slug}`}
              >
                <div className="relative h-32">
                  <img
                    src={empresa.hero_url || empresa.logo_url || "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400"}
                    alt={empresa.nombre}
                    className="w-full h-full object-cover"
                  />
                  {empresa.destacada && (
                    <div className="absolute top-3 right-3 bg-agave text-white p-1.5 rounded-lg">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  )}
                  {!empresa.activa && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">Inactiva</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-outfit font-bold text-stone-900 line-clamp-1">
                      {empresa.nombre}
                    </h3>
                  </div>
                  <span className="inline-block bg-forest/10 text-forest text-xs font-medium px-2 py-1 rounded-full mb-3">
                    {empresa.categoria}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal("empresa", empresa)}
                      data-testid={`edit-empresa-${empresa.slug}`}
                      className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-stone-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete("empresas", empresa.slug)}
                      data-testid={`delete-empresa-${empresa.slug}`}
                      className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {articulos.map((articulo) => (
              <div
                key={articulo.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
                data-testid={`admin-articulo-${articulo.slug}`}
              >
                <div className="relative h-32">
                  <img
                    src={articulo.hero_url || "https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=400"}
                    alt={articulo.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    {articulo.publicado ? (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Publicado
                      </span>
                    ) : (
                      <span className="bg-stone-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Borrador
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-outfit font-bold text-stone-900 line-clamp-2 mb-3">
                    {articulo.titulo}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal("articulo", articulo)}
                      data-testid={`edit-articulo-${articulo.slug}`}
                      className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-stone-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete("articulos", articulo.slug)}
                      data-testid={`delete-articulo-${articulo.slug}`}
                      className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
          <div
            className="bg-white rounded-2xl shadow-floating w-full max-w-2xl my-8"
            data-testid="admin-modal"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-outfit font-bold text-xl text-stone-900">
                {editingItem
                  ? activeTab === "empresas"
                    ? "Editar Empresa"
                    : "Editar Artículo"
                  : activeTab === "empresas"
                  ? "Nueva Empresa"
                  : "Nuevo Artículo"}
              </h2>
              <button
                onClick={closeModal}
                data-testid="close-modal-btn"
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form
              onSubmit={
                activeTab === "empresas" ? handleSaveEmpresa : handleSaveArticulo
              }
              className="p-6 space-y-6 max-h-[70vh] overflow-y-auto"
            >
              {activeTab === "empresas" ? (
                <>
                  {/* Empresa Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={empresaForm.nombre}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, nombre: e.target.value })
                        }
                        data-testid="empresa-nombre-input"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                        Categoría *
                      </label>
                      <select
                        value={empresaForm.categoria}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, categoria: e.target.value })
                        }
                        data-testid="empresa-categoria-select"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={empresaForm.descripcion}
                      onChange={(e) =>
                        setEmpresaForm({ ...empresaForm, descripcion: e.target.value })
                      }
                      data-testid="empresa-descripcion-input"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                        URL del Logo
                      </label>
                      <input
                        type="url"
                        value={empresaForm.logo_url}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, logo_url: e.target.value })
                        }
                        data-testid="empresa-logo-input"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                        URL Imagen Hero
                      </label>
                      <input
                        type="url"
                        value={empresaForm.hero_url}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, hero_url: e.target.value })
                        }
                        data-testid="empresa-hero-input"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={empresaForm.telefono}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, telefono: e.target.value })
                        }
                        data-testid="empresa-telefono-input"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                        WhatsApp (solo números)
                      </label>
                      <input
                        type="text"
                        value={empresaForm.whatsapp}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, whatsapp: e.target.value })
                        }
                        data-testid="empresa-whatsapp-input"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                        placeholder="523331234567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={empresaForm.email}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, email: e.target.value })
                        }
                        data-testid="empresa-email-input"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={empresaForm.direccion}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, direccion: e.target.value })
                        }
                        data-testid="empresa-direccion-input"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Redes Sociales
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {["facebook", "instagram", "twitter", "youtube", "website"].map(
                        (social) => (
                          <input
                            key={social}
                            type="url"
                            value={empresaForm.social_links[social] || ""}
                            onChange={(e) =>
                              setEmpresaForm({
                                ...empresaForm,
                                social_links: {
                                  ...empresaForm.social_links,
                                  [social]: e.target.value,
                                },
                              })
                            }
                            className="px-4 py-2 rounded-lg border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                            placeholder={social.charAt(0).toUpperCase() + social.slice(1)}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* Actividades */}
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Actividades
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={actividadInput}
                        onChange={(e) => setActividadInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addActividad())}
                        data-testid="actividad-input"
                        className="flex-1 px-4 py-2 rounded-lg border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                        placeholder="Ej: Senderismo"
                      />
                      <button
                        type="button"
                        onClick={addActividad}
                        className="bg-forest text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Agregar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {empresaForm.actividades.map((act, i) => (
                        <span
                          key={i}
                          className="bg-forest/10 text-forest px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {act}
                          <button
                            type="button"
                            onClick={() => removeActividad(i)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Galería */}
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Galería (URLs de imágenes)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={galeriaInput}
                        onChange={(e) => setGaleriaInput(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => addGaleriaImage(empresaForm, setEmpresaForm)}
                        className="bg-forest text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Agregar
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {empresaForm.galeria.map((img, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={img}
                            alt=""
                            className="w-full h-16 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeGaleriaImage(i, empresaForm, setEmpresaForm)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={empresaForm.destacada}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, destacada: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                      />
                      <span className="text-sm text-stone-700">Destacada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={empresaForm.activa}
                        onChange={(e) =>
                          setEmpresaForm({ ...empresaForm, activa: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                      />
                      <span className="text-sm text-stone-700">Activa</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  {/* Artículo Form */}
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      required
                      value={articuloForm.titulo}
                      onChange={(e) =>
                        setArticuloForm({ ...articuloForm, titulo: e.target.value })
                      }
                      data-testid="articulo-titulo-input"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                    />
                  </div>

                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Resumen *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={articuloForm.resumen}
                      onChange={(e) =>
                        setArticuloForm({ ...articuloForm, resumen: e.target.value })
                      }
                      data-testid="articulo-resumen-input"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                      placeholder="Breve descripción del artículo..."
                    />
                  </div>

                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      URL Imagen Hero
                    </label>
                    <input
                      type="url"
                      value={articuloForm.hero_url}
                      onChange={(e) =>
                        setArticuloForm({ ...articuloForm, hero_url: e.target.value })
                      }
                      data-testid="articulo-hero-input"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">
                      Contenido *
                    </label>
                    <RichTextEditor
                      value={articuloForm.contenido}
                      onChange={(value) =>
                        setArticuloForm({ ...articuloForm, contenido: value })
                      }
                      data-testid="articulo-contenido-editor"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={articuloForm.publicado}
                      onChange={(e) =>
                        setArticuloForm({ ...articuloForm, publicado: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest"
                    />
                    <span className="text-sm text-stone-700">Publicar artículo</span>
                  </label>
                </>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 rounded-full border border-stone-200 text-stone-700 font-medium text-sm hover:bg-stone-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="save-btn"
                  className="bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
