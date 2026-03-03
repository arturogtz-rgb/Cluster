import { useState, useEffect, useCallback, useRef } from "react";
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
  Settings,
  FolderOpen,
  Image as ImageIcon,
  Upload,
  Tag,
  Check,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CLUSTER_LOGO = "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";

const DEFAULT_CATEGORIES = [
  "Capacitación",
  "Operadora de aventura",
  "Parque acuático",
  "Hospedaje",
  "Parque de aventura",
];

// Simple Rich Text Editor component
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
        <button type="button" onClick={() => insertTag('h2')} className="p-2 hover:bg-white rounded-lg transition-colors" title="Encabezado">
          <Heading2 className="w-4 h-4 text-stone-600" />
        </button>
        <button type="button" onClick={() => insertTag('strong')} className="p-2 hover:bg-white rounded-lg transition-colors" title="Negrita">
          <Bold className="w-4 h-4 text-stone-600" />
        </button>
        <button type="button" onClick={() => insertTag('em')} className="p-2 hover:bg-white rounded-lg transition-colors" title="Cursiva">
          <Italic className="w-4 h-4 text-stone-600" />
        </button>
        <button type="button" onClick={insertList} className="p-2 hover:bg-white rounded-lg transition-colors" title="Lista">
          <List className="w-4 h-4 text-stone-600" />
        </button>
        <button type="button" onClick={() => insertTag('a href=""', 'a')} className="p-2 hover:bg-white rounded-lg transition-colors" title="Enlace">
          <LinkIcon className="w-4 h-4 text-stone-600" />
        </button>
      </div>
      <textarea
        id="rich-editor"
        value={textValue}
        onChange={handleChange}
        rows={12}
        className="w-full p-4 text-sm font-mono resize-none focus:outline-none"
        placeholder="Escribe el contenido HTML aquí."
      />
    </div>
  );
};

// Media Picker Component
const MediaPicker = ({ isOpen, onClose, onSelect, mediaFiles }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-floating w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h3 className="font-outfit font-bold text-lg">Seleccionar imagen</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {mediaFiles.length === 0 ? (
            <p className="text-center text-stone-500 py-8">No hay imágenes. Sube algunas en el Media Manager.</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {mediaFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelect(`${API.replace('/api', '')}${file.url}`)}
                  className="cursor-pointer rounded-xl overflow-hidden border-2 border-transparent hover:border-forest transition-all aspect-square"
                >
                  <img src={`${API.replace('/api', '')}${file.url}`} alt={file.original_name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("empresas");
  const [empresas, setEmpresas] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [settings, setSettings] = useState({
    hero_image: "",
    hero_title: "Descubre la Aventura",
    hero_subtitle: ""
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form states
  const [empresaForm, setEmpresaForm] = useState({
    nombre: "", categoria: "Capacitación", descripcion: "", logo_url: "", hero_url: "",
    galeria: [], telefono: "", whatsapp: "", direccion: "", email: "",
    social_links: { facebook: "", instagram: "", twitter: "", youtube: "", linkedin: "", website: "" },
    actividades: [], destacada: false, activa: true, latitud: null, longitud: null,
  });

  const [articuloForm, setArticuloForm] = useState({
    titulo: "", contenido: "", resumen: "", hero_url: "", galeria: [], publicado: false,
  });

  const [categoriaForm, setCategoriaForm] = useState({
    nombre: "", descripcion: "", imagen_url: "", orden: 0, activa: true,
  });

  const [actividadInput, setActividadInput] = useState("");
  const [galeriaInput, setGaleriaInput] = useState("");

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empresasRes, articulosRes, settingsRes, categoriasRes, mediaRes] = await Promise.all([
        axios.get(`${API}/empresas`),
        axios.get(`${API}/articulos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/settings`),
        axios.get(`${API}/categorias`),
        axios.get(`${API}/media`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      ]);
      setEmpresas(empresasRes.data);
      setArticulos(articulosRes.data);
      setSettings(settingsRes.data);
      setCategorias(categoriasRes.data?.categorias || []);
      setMediaFiles(mediaRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) handleLogout();
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
        setEmpresaForm({ ...item, social_links: item.social_links || {}, actividades: item.actividades || [], galeria: item.galeria || [] });
        setEditingItem(item);
      } else {
        setEmpresaForm({
          nombre: "", categoria: "Capacitación", descripcion: "", logo_url: "", hero_url: "",
          galeria: [], telefono: "", whatsapp: "", direccion: "", email: "",
          social_links: { facebook: "", instagram: "", twitter: "", youtube: "", linkedin: "", website: "" },
          actividades: [], destacada: false, activa: true, latitud: null, longitud: null,
        });
        setEditingItem(null);
      }
    } else if (type === "articulo") {
      if (item) {
        setArticuloForm({ ...item, galeria: item.galeria || [] });
        setEditingItem(item);
      } else {
        setArticuloForm({ titulo: "", contenido: "", resumen: "", hero_url: "", galeria: [], publicado: false });
        setEditingItem(null);
      }
    } else if (type === "categoria") {
      if (item) {
        setCategoriaForm(item);
        setEditingItem(item);
      } else {
        setCategoriaForm({ nombre: "", descripcion: "", imagen_url: "", orden: 0, activa: true });
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
        await axios.put(`${API}/empresas/${editingItem.slug}`, empresaForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Empresa actualizada");
      } else {
        await axios.post(`${API}/empresas`, empresaForm, { headers: { Authorization: `Bearer ${token}` } });
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
        await axios.put(`${API}/articulos/${editingItem.slug}`, articuloForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Artículo actualizado");
      } else {
        await axios.post(`${API}/articulos`, articuloForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Artículo creado");
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error saving articulo:", error);
      toast.error(error.response?.data?.detail || "Error al guardar");
    }
  };

  const handleSaveCategoria = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/categorias/${editingItem.slug}`, categoriaForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Categoría actualizada");
      } else {
        await axios.post(`${API}/categorias`, categoriaForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Categoría creada");
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error saving categoria:", error);
      toast.error(error.response?.data?.detail || "Error al guardar");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API}/settings`, settings, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Configuración guardada");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar configuración");
    }
  };

  const handleDelete = async (type, slug) => {
    if (!window.confirm("¿Estás seguro de eliminar este elemento?")) return;
    try {
      await axios.delete(`${API}/${type}/${slug}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Eliminado correctamente");
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar");
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await axios.post(`${API}/media/upload`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });
        return true;
      } catch (error) {
        toast.error(`Error subiendo ${file.name}`);
        return false;
      }
    });

    await Promise.all(uploadPromises);
    toast.success("Archivos subidos");
    setUploading(false);
    fetchData();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteMedia = async (fileId) => {
    if (!window.confirm("¿Eliminar esta imagen?")) return;
    try {
      await axios.delete(`${API}/media/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Imagen eliminada");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const openMediaPicker = (target) => {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
  };

  const handleMediaSelect = (url) => {
    if (mediaPickerTarget === "settings_hero") {
      setSettings({ ...settings, hero_image: url });
    } else if (mediaPickerTarget === "empresa_logo") {
      setEmpresaForm({ ...empresaForm, logo_url: url });
    } else if (mediaPickerTarget === "empresa_hero") {
      setEmpresaForm({ ...empresaForm, hero_url: url });
    } else if (mediaPickerTarget === "articulo_hero") {
      setArticuloForm({ ...articuloForm, hero_url: url });
    } else if (mediaPickerTarget === "categoria_imagen") {
      setCategoriaForm({ ...categoriaForm, imagen_url: url });
    }
    setMediaPickerOpen(false);
  };

  const addActividad = () => {
    if (actividadInput.trim()) {
      setEmpresaForm({ ...empresaForm, actividades: [...empresaForm.actividades, actividadInput.trim()] });
      setActividadInput("");
    }
  };

  const removeActividad = (index) => {
    setEmpresaForm({ ...empresaForm, actividades: empresaForm.actividades.filter((_, i) => i !== index) });
  };

  const addGaleriaImage = (form, setForm) => {
    if (galeriaInput.trim()) {
      setForm({ ...form, galeria: [...form.galeria, galeriaInput.trim()] });
      setGaleriaInput("");
    }
  };

  const removeGaleriaImage = (index, form, setForm) => {
    setForm({ ...form, galeria: form.galeria.filter((_, i) => i !== index) });
  };

  const tabs = [
    { id: "empresas", label: "Empresas", icon: Building2 },
    { id: "articulos", label: "Artículos", icon: Newspaper },
    { id: "categorias", label: "Categorías", icon: Tag },
    { id: "media", label: "Media", icon: FolderOpen },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-100" data-testid="admin-dashboard">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2" data-testid="mobile-sidebar-toggle">
          <Menu className="w-6 h-6" />
        </button>
        <img src={CLUSTER_LOGO} alt="Logo" className="h-8" />
        <button onClick={handleLogout} className="p-2 text-stone-500">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`} data-testid="admin-sidebar">
        <div className="p-6">
          <div className="bg-white rounded-xl p-3 mb-8 inline-block">
            <img src={CLUSTER_LOGO} alt="Clúster Turismo" className="h-12" />
          </div>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  data-testid={`tab-${tab.id}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id ? "bg-white/20 text-white font-semibold" : "text-white/70 hover:bg-white/10"}`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button onClick={handleLogout} data-testid="logout-btn" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 transition-all">
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-outfit font-bold text-2xl text-stone-900">
              {tabs.find(t => t.id === activeTab)?.label || "Panel"}
            </h1>
          </div>
          {(activeTab === "empresas" || activeTab === "articulos" || activeTab === "categorias") && (
            <button
              onClick={() => openModal(activeTab === "empresas" ? "empresa" : activeTab === "articulos" ? "articulo" : "categoria")}
              data-testid="add-new-btn"
              className="bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition-all hover:bg-forest-dark hover:scale-105 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          )}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl h-48" />)}
          </div>
        ) : (
          <>
            {/* EMPRESAS */}
            {activeTab === "empresas" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {empresas.map((empresa) => (
                  <div key={empresa.id} className="bg-white rounded-2xl shadow-sm overflow-hidden" data-testid={`admin-empresa-${empresa.slug}`}>
                    <div className="relative h-32">
                      <img src={empresa.hero_url || empresa.logo_url || "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400"} alt={empresa.nombre} className="w-full h-full object-cover" />
                      {empresa.destacada && <div className="absolute top-3 right-3 bg-agave text-white p-1.5 rounded-lg"><Star className="w-4 h-4 fill-current" /></div>}
                      {!empresa.activa && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-semibold text-sm">Inactiva</span></div>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-outfit font-bold text-stone-900 line-clamp-1 mb-2">{empresa.nombre}</h3>
                      <span className="inline-block bg-forest/10 text-forest text-xs font-medium px-2 py-1 rounded-full mb-3">{empresa.categoria}</span>
                      <div className="flex gap-2">
                        <button onClick={() => openModal("empresa", empresa)} data-testid={`edit-empresa-${empresa.slug}`} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-stone-200">
                          <Edit2 className="w-4 h-4" /> Editar
                        </button>
                        <button onClick={() => handleDelete("empresas", empresa.slug)} data-testid={`delete-empresa-${empresa.slug}`} className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ARTICULOS */}
            {activeTab === "articulos" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {articulos.map((articulo) => (
                  <div key={articulo.id} className="bg-white rounded-2xl shadow-sm overflow-hidden" data-testid={`admin-articulo-${articulo.slug}`}>
                    <div className="relative h-32">
                      <img src={articulo.hero_url || "https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=400"} alt={articulo.titulo} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3">
                        {articulo.publicado ? (
                          <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"><Eye className="w-3 h-3" />Publicado</span>
                        ) : (
                          <span className="bg-stone-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"><EyeOff className="w-3 h-3" />Borrador</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-outfit font-bold text-stone-900 line-clamp-2 mb-3">{articulo.titulo}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => openModal("articulo", articulo)} data-testid={`edit-articulo-${articulo.slug}`} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-stone-200">
                          <Edit2 className="w-4 h-4" /> Editar
                        </button>
                        <button onClick={() => handleDelete("articulos", articulo.slug)} data-testid={`delete-articulo-${articulo.slug}`} className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CATEGORIAS */}
            {activeTab === "categorias" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {categorias.map((cat, index) => (
                  <div key={cat.slug || index} className="bg-white rounded-2xl shadow-sm overflow-hidden" data-testid={`admin-categoria-${cat.slug}`}>
                    <div className="relative h-32 bg-forest/10">
                      {cat.imagen_url ? (
                        <img src={cat.imagen_url} alt={cat.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag className="w-12 h-12 text-forest/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-outfit font-bold text-stone-900 mb-1">{cat.nombre}</h3>
                      <p className="text-stone-500 text-sm line-clamp-2 mb-3">{cat.descripcion || "Sin descripción"}</p>
                      <div className="flex gap-2">
                        <button onClick={() => openModal("categoria", cat)} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 hover:bg-stone-200">
                          <Edit2 className="w-4 h-4" /> Editar
                        </button>
                        {cat.slug && (
                          <button onClick={() => handleDelete("categorias", cat.slug)} className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MEDIA MANAGER */}
            {activeTab === "media" && (
              <div>
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                  <h3 className="font-outfit font-bold text-lg mb-4">Subir imágenes</h3>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-forest transition-colors ${uploading ? "opacity-50" : ""}`}
                  >
                    <Upload className="w-8 h-8 text-stone-400 mb-2" />
                    <span className="text-stone-500 text-sm">{uploading ? "Subiendo..." : "Haz clic para subir imágenes"}</span>
                  </label>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-outfit font-bold text-lg mb-4">Biblioteca ({mediaFiles.length} archivos)</h3>
                  {mediaFiles.length === 0 ? (
                    <p className="text-center text-stone-500 py-8">No hay imágenes subidas</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {mediaFiles.map((file) => (
                        <div key={file.id} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden">
                            <img src={`${API.replace('/api', '')}${file.url}`} alt={file.original_name} className="w-full h-full object-cover" />
                          </div>
                          <button
                            onClick={() => handleDeleteMedia(file.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-stone-500 truncate mt-1">{file.original_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <div className="max-w-2xl">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-outfit font-bold text-lg mb-6">Configuración del Hero</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Imagen de fondo</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.hero_image}
                          onChange={(e) => setSettings({ ...settings, hero_image: e.target.value })}
                          className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                          placeholder="URL de la imagen"
                        />
                        <button
                          type="button"
                          onClick={() => openMediaPicker("settings_hero")}
                          className="px-4 py-3 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
                        >
                          <ImageIcon className="w-5 h-5 text-stone-600" />
                        </button>
                      </div>
                      {settings.hero_image && (
                        <img src={settings.hero_image} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-xl" />
                      )}
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Título principal</label>
                      <input
                        type="text"
                        value={settings.hero_title}
                        onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest"
                      />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Subtítulo</label>
                      <textarea
                        value={settings.hero_subtitle}
                        onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      className="bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Guardar configuración
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-floating w-full max-w-2xl my-8" data-testid="admin-modal">
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="font-outfit font-bold text-xl text-stone-900">
                {editingItem ? "Editar" : "Nuevo"} {activeTab === "empresas" ? "Empresa" : activeTab === "articulos" ? "Artículo" : "Categoría"}
              </h2>
              <button onClick={closeModal} data-testid="close-modal-btn" className="p-2 hover:bg-stone-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={activeTab === "empresas" ? handleSaveEmpresa : activeTab === "articulos" ? handleSaveArticulo : handleSaveCategoria} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {activeTab === "empresas" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Nombre *</label>
                      <input type="text" required value={empresaForm.nombre} onChange={(e) => setEmpresaForm({ ...empresaForm, nombre: e.target.value })} data-testid="empresa-nombre-input" className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Categoría *</label>
                      <select value={empresaForm.categoria} onChange={(e) => setEmpresaForm({ ...empresaForm, categoria: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest">
                        {DEFAULT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Descripción *</label>
                    <textarea required rows={4} value={empresaForm.descripcion} onChange={(e) => setEmpresaForm({ ...empresaForm, descripcion: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">URL del Logo</label>
                      <div className="flex gap-2">
                        <input type="url" value={empresaForm.logo_url} onChange={(e) => setEmpresaForm({ ...empresaForm, logo_url: e.target.value })} className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" placeholder="https://..." />
                        <button type="button" onClick={() => openMediaPicker("empresa_logo")} className="px-3 bg-stone-100 rounded-xl hover:bg-stone-200"><ImageIcon className="w-5 h-5 text-stone-600" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">URL Imagen Hero</label>
                      <div className="flex gap-2">
                        <input type="url" value={empresaForm.hero_url} onChange={(e) => setEmpresaForm({ ...empresaForm, hero_url: e.target.value })} className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" placeholder="https://..." />
                        <button type="button" onClick={() => openMediaPicker("empresa_hero")} className="px-3 bg-stone-100 rounded-xl hover:bg-stone-200"><ImageIcon className="w-5 h-5 text-stone-600" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Teléfono</label>
                      <input type="tel" value={empresaForm.telefono} onChange={(e) => setEmpresaForm({ ...empresaForm, telefono: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">WhatsApp</label>
                      <input type="text" value={empresaForm.whatsapp} onChange={(e) => setEmpresaForm({ ...empresaForm, whatsapp: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" placeholder="523331234567" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Email</label>
                      <input type="email" value={empresaForm.email} onChange={(e) => setEmpresaForm({ ...empresaForm, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Dirección</label>
                      <input type="text" value={empresaForm.direccion} onChange={(e) => setEmpresaForm({ ...empresaForm, direccion: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Latitud</label>
                      <input type="number" step="any" value={empresaForm.latitud || ""} onChange={(e) => setEmpresaForm({ ...empresaForm, latitud: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" placeholder="20.6597" />
                    </div>
                    <div>
                      <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Longitud</label>
                      <input type="number" step="any" value={empresaForm.longitud || ""} onChange={(e) => setEmpresaForm({ ...empresaForm, longitud: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" placeholder="-103.3496" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Actividades</label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={actividadInput} onChange={(e) => setActividadInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addActividad())} className="flex-1 px-4 py-2 rounded-lg border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest text-sm" placeholder="Ej: Senderismo" />
                      <button type="button" onClick={addActividad} className="bg-forest text-white px-4 py-2 rounded-lg text-sm font-medium">Agregar</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {empresaForm.actividades.map((act, i) => (
                        <span key={i} className="bg-forest/10 text-forest px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          {act}
                          <button type="button" onClick={() => removeActividad(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={empresaForm.destacada} onChange={(e) => setEmpresaForm({ ...empresaForm, destacada: e.target.checked })} className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest" />
                      <span className="text-sm text-stone-700">Destacada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={empresaForm.activa} onChange={(e) => setEmpresaForm({ ...empresaForm, activa: e.target.checked })} className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest" />
                      <span className="text-sm text-stone-700">Activa</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === "articulos" && (
                <>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Título *</label>
                    <input type="text" required value={articuloForm.titulo} onChange={(e) => setArticuloForm({ ...articuloForm, titulo: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Resumen *</label>
                    <textarea required rows={3} value={articuloForm.resumen} onChange={(e) => setArticuloForm({ ...articuloForm, resumen: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none" />
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">URL Imagen Hero</label>
                    <div className="flex gap-2">
                      <input type="url" value={articuloForm.hero_url} onChange={(e) => setArticuloForm({ ...articuloForm, hero_url: e.target.value })} className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                      <button type="button" onClick={() => openMediaPicker("articulo_hero")} className="px-3 bg-stone-100 rounded-xl hover:bg-stone-200"><ImageIcon className="w-5 h-5 text-stone-600" /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Contenido *</label>
                    <RichTextEditor value={articuloForm.contenido} onChange={(value) => setArticuloForm({ ...articuloForm, contenido: value })} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={articuloForm.publicado} onChange={(e) => setArticuloForm({ ...articuloForm, publicado: e.target.checked })} className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest" />
                    <span className="text-sm text-stone-700">Publicar artículo</span>
                  </label>
                </>
              )}

              {activeTab === "categorias" && (
                <>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Nombre *</label>
                    <input type="text" required value={categoriaForm.nombre} onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Descripción</label>
                    <textarea rows={3} value={categoriaForm.descripcion} onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none" />
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Imagen</label>
                    <div className="flex gap-2">
                      <input type="url" value={categoriaForm.imagen_url} onChange={(e) => setCategoriaForm({ ...categoriaForm, imagen_url: e.target.value })} className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                      <button type="button" onClick={() => openMediaPicker("categoria_imagen")} className="px-3 bg-stone-100 rounded-xl hover:bg-stone-200"><ImageIcon className="w-5 h-5 text-stone-600" /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-inter font-medium text-sm text-stone-700 mb-2">Orden</label>
                    <input type="number" value={categoriaForm.orden} onChange={(e) => setCategoriaForm({ ...categoriaForm, orden: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={categoriaForm.activa} onChange={(e) => setCategoriaForm({ ...categoriaForm, activa: e.target.checked })} className="w-5 h-5 rounded border-stone-300 text-forest focus:ring-forest" />
                    <span className="text-sm text-stone-700">Activa</span>
                  </label>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button type="button" onClick={closeModal} className="px-6 py-3 rounded-full border border-stone-200 text-stone-700 font-medium text-sm hover:bg-stone-50">Cancelar</button>
                <button type="submit" data-testid="save-btn" className="bg-forest text-white px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark">
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker */}
      <MediaPicker
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        mediaFiles={mediaFiles}
      />
    </div>
  );
};

export default AdminDashboard;
