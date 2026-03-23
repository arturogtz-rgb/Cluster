import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  Newspaper,
  TreePine,
  Tag,
  FolderOpen,
  Settings,
  ArrowRight,
  TrendingUp,
  Eye,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    empresas: 0,
    articulos: 0,
    actividades: 0,
    categorias: 0,
    media: 0,
  });
  const [topViewed, setTopViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchStats();
  }, [token, navigate]);

  const fetchStats = async () => {
    try {
      const [empresasRes, articulosRes, actividadesRes, categoriasRes, mediaRes, topViewedRes] =
        await Promise.all([
          axios.get(`${API}/empresas`),
          axios.get(`${API}/articulos`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/actividades`),
          axios.get(`${API}/categorias`),
          axios.get(`${API}/media`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API}/empresas-top-views`).catch(() => ({ data: [] })),
        ]);
      setStats({
        empresas: empresasRes.data.length,
        articulos: articulosRes.data.length,
        actividades: actividadesRes.data.length,
        categorias: categoriasRes.data?.categorias?.length || 0,
        media: mediaRes.data?.length || 0,
      });
      setTopViewed(topViewedRes.data || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      title: "Empresas",
      description: "Gestiona el directorio de empresas turísticas",
      icon: Building2,
      count: stats.empresas,
      path: "/admin/empresas",
      color: "bg-forest",
      lightColor: "bg-forest/10 text-forest",
    },
    {
      title: "Artículos",
      description: "Administra los artículos de prensa y blog",
      icon: Newspaper,
      count: stats.articulos,
      path: "/admin/articulos",
      color: "bg-adventure",
      lightColor: "bg-adventure/10 text-adventure",
    },
    {
      title: "Actividades",
      description: "Configura las actividades de naturaleza y aventura",
      icon: TreePine,
      count: stats.actividades,
      path: "/admin/actividades",
      color: "bg-teal-600",
      lightColor: "bg-teal-100 text-teal-700",
    },
    {
      title: "Categorías",
      description: "Organiza las categorías de empresas",
      icon: Tag,
      count: stats.categorias,
      path: "/admin/categorias",
      color: "bg-agave",
      lightColor: "bg-agave/10 text-agave",
    },
    {
      title: "Media",
      description: "Biblioteca de imágenes y archivos",
      icon: FolderOpen,
      count: stats.media,
      path: "/admin/media",
      color: "bg-stone-600",
      lightColor: "bg-stone-200 text-stone-700",
    },
    {
      title: "Configuración",
      description: "Ajustes del sitio: hero, título, subtítulo",
      icon: Settings,
      count: null,
      path: "/admin/configuracion",
      color: "bg-stone-800",
      lightColor: "bg-stone-200 text-stone-700",
    },
  ];

  return (
    <div className="p-4 lg:p-8" data-testid="admin-dashboard">
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="font-outfit font-bold text-2xl lg:text-3xl text-stone-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-stone-500">
          Bienvenido al gestor del Clúster de Turismo de Naturaleza y Aventura
          Jalisco
        </p>
      </div>

      {/* Stats Overview */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Empresas", value: stats.empresas, icon: Building2, color: "text-forest" },
            { label: "Artículos", value: stats.articulos, icon: Newspaper, color: "text-adventure" },
            { label: "Actividades", value: stats.actividades, icon: TreePine, color: "text-teal-600" },
            { label: "Archivos", value: stats.media, icon: FolderOpen, color: "text-stone-600" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                  <TrendingUp className="w-4 h-4 text-stone-300" />
                </div>
                <p className="font-outfit font-bold text-2xl text-stone-900">
                  {stat.value}
                </p>
                <p className="text-sm text-stone-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Module Cards */}
      <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">
        Módulos
      </h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                data-testid={`module-${mod.title.toLowerCase()}`}
                className="group bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${mod.lightColor}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  {mod.count !== null && (
                    <span className="text-2xl font-outfit font-bold text-stone-900">
                      {mod.count}
                    </span>
                  )}
                </div>
                <h3 className="font-outfit font-bold text-stone-900 mb-1">
                  {mod.title}
                </h3>
                <p className="text-sm text-stone-500 mb-3">
                  {mod.description}
                </p>
                <span className="text-sm font-medium text-forest flex items-center gap-1 group-hover:gap-2 transition-all">
                  Gestionar
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Top Viewed Empresas */}
      {!loading && topViewed.length > 0 && (
        <div className="mt-10">
          <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-forest" />
            Empresas Más Visitadas
          </h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {topViewed.map((empresa, i) => (
                <Link
                  key={empresa.slug}
                  to={`/admin/empresas/editar/${empresa.slug}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                  data-testid={`top-viewed-${empresa.slug}`}
                >
                  <span className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center font-outfit font-bold text-forest text-sm">
                    {i + 1}
                  </span>
                  {empresa.logo_url ? (
                    <img
                      src={empresa.logo_url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-contain bg-stone-50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-forest/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-forest" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-outfit font-bold text-stone-900 text-sm truncate">
                      {empresa.nombre}
                    </p>
                    <p className="text-xs text-stone-500">{empresa.categoria}</p>
                  </div>
                  <div className="flex items-center gap-1 text-stone-500">
                    <Eye className="w-4 h-4" />
                    <span className="font-outfit font-bold text-sm">
                      {empresa.views || 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
