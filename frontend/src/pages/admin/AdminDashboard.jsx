import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  Newspaper,
  TreePine,
  Mail,
  MailOpen,
  Eye,
  TrendingUp,
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
  FolderOpen,
  Tag,
  Users,
  MessageCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHART_COLORS = [
  "#1a4d2e",
  "#d97706",
  "#0284c7",
  "#dc2626",
  "#7c3aed",
  "#059669",
  "#ca8a04",
  "#4f46e5",
  "#9a3412",
  "#2d6a4f",
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchAnalytics();
  }, [token, navigate]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API}/analytics/overview`);
      setAnalytics(res.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { title: "Empresas", icon: Building2, path: "/admin/empresas", color: "text-forest", bg: "bg-forest/10" },
    { title: "Artículos", icon: Newspaper, path: "/admin/articulos", color: "text-adventure", bg: "bg-adventure/10" },
    { title: "Actividades", icon: TreePine, path: "/admin/actividades", color: "text-teal-600", bg: "bg-teal-100" },
    { title: "Categorías", icon: Tag, path: "/admin/categorias", color: "text-agave", bg: "bg-agave/10" },
    { title: "Media", icon: FolderOpen, path: "/admin/media", color: "text-stone-600", bg: "bg-stone-200" },
    { title: "Usuarios", icon: Users, path: "/admin/usuarios", color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Configuración", icon: Settings, path: "/admin/configuracion", color: "text-stone-700", bg: "bg-stone-200" },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-8" data-testid="admin-dashboard">
        <div className="mb-8">
          <div className="skeleton h-8 w-64 mb-2 rounded-lg" />
          <div className="skeleton h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const totales = analytics?.totales || {};
  const empresasPorCategoria = analytics?.empresas_por_categoria || [];
  const topEmpresas = analytics?.top_empresas || [];
  const leadsPorMes = analytics?.leads_por_mes || [];
  const vistasPorCategoria = analytics?.vistas_por_categoria || [];

  const monthNames = {
    "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
  };

  const leadsChartData = leadsPorMes.map((l) => {
    const parts = l.mes.split("-");
    return { name: `${monthNames[parts[1]] || parts[1]} ${parts[0].slice(2)}`, leads: l.count };
  });

  return (
    <div className="p-4 lg:p-8" data-testid="admin-dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-outfit font-bold text-2xl lg:text-3xl text-stone-900 mb-1">
          Dashboard
        </h1>
        <p className="text-stone-500 font-inter text-sm">
          Panorama general del Clúster de Turismo de Naturaleza y Aventura Jalisco
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4 mb-8" data-testid="kpi-cards">
        {[
          { label: "Empresas", value: totales.empresas, icon: Building2, color: "text-forest", border: "border-forest/20" },
          { label: "Artículos", value: totales.articulos, icon: Newspaper, color: "text-adventure", border: "border-adventure/20" },
          { label: "Actividades", value: totales.actividades, icon: TreePine, color: "text-teal-600", border: "border-teal-200" },
          { label: "Mensajes", value: totales.leads, icon: Mail, color: "text-blue-600", border: "border-blue-200" },
          { label: "No leídos", value: totales.leads_no_leidos, icon: MailOpen, color: "text-red-500", border: "border-red-200" },
          { label: "WA Clicks", value: totales.whatsapp_clicks, icon: MessageCircle, color: "text-[#25D366]", border: "border-[#25D366]/20" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`bg-white rounded-2xl p-4 lg:p-5 border ${kpi.border} shadow-sm`}
              data-testid={`kpi-${kpi.label.toLowerCase().replace(' ', '-')}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
                <TrendingUp className="w-3.5 h-3.5 text-stone-300" />
              </div>
              <p className="font-outfit font-bold text-2xl lg:text-3xl text-stone-900">
                {kpi.value ?? 0}
              </p>
              <p className="text-xs text-stone-500 font-inter">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Empresas - Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5 lg:p-6 border border-stone-100" data-testid="chart-top-empresas">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-forest" />
            <h2 className="font-outfit font-bold text-stone-900">Empresas Más Visitadas</h2>
          </div>
          {topEmpresas.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topEmpresas} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#78716c" }} />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  tick={{ fontSize: 11, fill: "#44403c" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1c1917",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [`${value} visitas`, "Vistas"]}
                />
                <Bar dataKey="views" fill="#1a4d2e" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-stone-400 text-sm">
              <p>Las vistas se registrarán cuando los usuarios visiten las empresas</p>
            </div>
          )}
        </div>

        {/* Empresas por Categoría - Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5 lg:p-6 border border-stone-100" data-testid="chart-empresas-categoria">
          <div className="flex items-center gap-2 mb-5">
            <PieChartIcon className="w-5 h-5 text-adventure" />
            <h2 className="font-outfit font-bold text-stone-900">Empresas por Categoría</h2>
          </div>
          {empresasPorCategoria.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={empresasPorCategoria}
                    dataKey="count"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {empresasPorCategoria.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1c1917",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {empresasPorCategoria.map((cat, i) => (
                  <div key={cat.categoria} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-xs text-stone-600 font-inter truncate">{cat.categoria}</span>
                    <span className="text-xs font-bold text-stone-900 ml-auto">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-stone-400 text-sm">
              <p>No hay datos de categorías disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Leads por Mes - Area Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5 lg:p-6 border border-stone-100" data-testid="chart-leads-mes">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="font-outfit font-bold text-stone-900">Mensajes por Mes</h2>
          </div>
          {leadsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={leadsChartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} />
                <YAxis tick={{ fontSize: 12, fill: "#78716c" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1c1917",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [`${value} mensajes`, "Leads"]}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fill="url(#leadsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-stone-400 text-sm">
              <p>Los mensajes aparecerán aquí conforme lleguen</p>
            </div>
          )}
        </div>

        {/* Vistas por Categoría - Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5 lg:p-6 border border-stone-100" data-testid="chart-vistas-categoria">
          <div className="flex items-center gap-2 mb-5">
            <Eye className="w-5 h-5 text-violet-600" />
            <h2 className="font-outfit font-bold text-stone-900">Vistas por Categoría</h2>
          </div>
          {vistasPorCategoria.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={vistasPorCategoria} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="categoria"
                  tick={{ fontSize: 10, fill: "#78716c" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12, fill: "#78716c" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1c1917",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [`${value} vistas`, "Total"]}
                />
                <Bar dataKey="total_views" radius={[6, 6, 0, 0]} barSize={40}>
                  {vistasPorCategoria.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-stone-400 text-sm">
              <p>No hay datos de vistas por categoría</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="font-outfit font-bold text-lg text-stone-900 mb-4">Acceso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`quick-${link.title.toLowerCase()}`}
                className="group bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-all hover:-translate-y-0.5 border border-stone-100 text-center"
              >
                <div className={`w-10 h-10 ${link.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 ${link.color}`} />
                </div>
                <p className="font-outfit font-bold text-stone-900 text-xs">{link.title}</p>
                <ArrowRight className="w-3.5 h-3.5 text-stone-300 mx-auto mt-1.5 group-hover:text-forest transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
