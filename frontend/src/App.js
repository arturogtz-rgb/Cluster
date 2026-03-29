import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { lazy, Suspense, useEffect } from "react";

// Pages (eagerly loaded - critical path)
import Home from "./pages/Home";
import Empresas from "./pages/Empresas";
import EmpresaDetalle from "./pages/EmpresaDetalle";

// Pages (lazy loaded - less critical)
const Prensa = lazy(() => import("./pages/Prensa"));
const ArticuloDetalle = lazy(() => import("./pages/ArticuloDetalle"));
const Mapa = lazy(() => import("./pages/Mapa"));
const Nosotros = lazy(() => import("./pages/Nosotros"));

// Admin Pages (all lazy loaded)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEmpresas = lazy(() => import("./pages/admin/AdminEmpresas"));
const EmpresaForm = lazy(() => import("./pages/admin/EmpresaForm"));
const AdminArticulos = lazy(() => import("./pages/admin/AdminArticulos"));
const ArticuloForm = lazy(() => import("./pages/admin/ArticuloForm"));
const AdminActividades = lazy(() => import("./pages/admin/AdminActividades"));
const ActividadForm = lazy(() => import("./pages/admin/ActividadForm"));
const AdminCategorias = lazy(() => import("./pages/admin/AdminCategorias"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminNosotros = lazy(() => import("./pages/admin/AdminNosotros"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios"));

// Components
import FloatingNav from "./components/FloatingNav";
import WhatsAppButton from "./components/WhatsAppButton";
import AdminLayout from "./components/AdminLayout";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-limestone">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-stone-500 font-inter text-sm">Cargando...</p>
    </div>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <div className="App min-h-screen bg-limestone">
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <>
                <FloatingNav />
                <Home />
                <WhatsAppButton />
              </>
            }
          />
          <Route
            path="/empresas"
            element={
              <>
                <FloatingNav />
                <Empresas />
                <WhatsAppButton />
              </>
            }
          />
          <Route
            path="/empresas/:slug"
            element={
              <>
                <FloatingNav />
                <EmpresaDetalle />
                <WhatsAppButton />
              </>
            }
          />
          <Route
            path="/prensa"
            element={
              <>
                <FloatingNav />
                <Prensa />
                <WhatsAppButton />
              </>
            }
          />
          <Route
            path="/prensa/:slug"
            element={
              <>
                <FloatingNav />
                <ArticuloDetalle />
                <WhatsAppButton />
              </>
            }
          />
          <Route
            path="/mapa"
            element={
              <>
                <FloatingNav />
                <Mapa />
                <WhatsAppButton />
              </>
            }
          />
          <Route
            path="/nosotros"
            element={
              <>
                <FloatingNav />
                <Nosotros />
                <WhatsAppButton />
              </>
            }
          />

          {/* Admin Login (no layout) */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* Admin Routes (with persistent sidebar layout) */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/empresas"
            element={
              <AdminLayout>
                <AdminEmpresas />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/empresas/nueva"
            element={
              <AdminLayout>
                <EmpresaForm />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/empresas/editar/:slug"
            element={
              <AdminLayout>
                <EmpresaForm />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/articulos"
            element={
              <AdminLayout>
                <AdminArticulos />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/articulos/nuevo"
            element={
              <AdminLayout>
                <ArticuloForm />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/articulos/editar/:slug"
            element={
              <AdminLayout>
                <ArticuloForm />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/actividades"
            element={
              <AdminLayout>
                <AdminActividades />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/actividades/nueva"
            element={
              <AdminLayout>
                <ActividadForm />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/actividades/editar/:slug"
            element={
              <AdminLayout>
                <ActividadForm />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <AdminLayout>
                <AdminCategorias />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/media"
            element={
              <AdminLayout>
                <AdminMedia />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/configuracion"
            element={
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/nosotros-editor"
            element={
              <AdminLayout>
                <AdminNosotros />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <AdminLayout>
                <AdminLeads />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <AdminLayout>
                <AdminUsuarios />
              </AdminLayout>
            }
          />
        </Routes>
        <Toaster position="top-right" />
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
