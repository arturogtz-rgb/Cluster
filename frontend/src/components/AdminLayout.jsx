import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Newspaper,
  Tag,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  TreePine,
  Search,
  Command,
  Mail,
  Users,
  FileText,
} from "lucide-react";
import CommandSearch from "./CommandSearch";

const CLUSTER_LOGO =
  "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";

const allNavItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "editor"] },
  { path: "/admin/empresas", label: "Empresas", icon: Building2, roles: ["admin"] },
  { path: "/admin/articulos", label: "Artículos", icon: Newspaper, roles: ["admin", "editor"] },
  { path: "/admin/actividades", label: "Actividades", icon: TreePine, roles: ["admin", "editor"] },
  { path: "/admin/categorias", label: "Categorías", icon: Tag, roles: ["admin"] },
  { path: "/admin/media", label: "Media", icon: FolderOpen, roles: ["admin"] },
  { path: "/admin/leads", label: "Mensajes", icon: Mail, roles: ["admin"] },
  { path: "/admin/nosotros-editor", label: "Nosotros", icon: FileText, roles: ["admin"] },
  { path: "/admin/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
  { path: "/admin/configuracion", label: "Configuración", icon: Settings, roles: ["admin"] },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState("admin");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role || "admin");
      } catch (e) {
        // fallback to admin
      }
    }
  }, []);

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_username");
    navigate("/admin");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-stone-100" data-testid="admin-layout">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
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

      {/* Sidebar Overlay (mobile) - must be before sidebar in DOM */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="admin-sidebar"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="bg-white rounded-xl p-3 inline-block">
              <img
                src={CLUSTER_LOGO}
                alt="Clúster Turismo"
                className="h-12"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Search trigger */}
          <button
            onClick={() => {
              // Trigger the Cmd+K handler in CommandSearch
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
            data-testid="sidebar-search-btn"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all mb-4"
          >
            <Search className="w-5 h-5" />
            <span className="flex-1 text-left text-sm">Buscar...</span>
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono text-white/50">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    active
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
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

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">{children}</main>

      {/* Command Search - always mounted, manages own visibility */}
      <CommandSearch />
    </div>
  );
};

export default AdminLayout;
