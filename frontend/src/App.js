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
const Afiliate = lazy(() => import("./pages/Afiliate"));

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
const AdminRequisitos = lazy(() => import("./pages/admin/AdminRequisitos"));
const AdminAfiliados = lazy(() => import("./pages/admin/AdminAfiliados"));

// PST Pages (lazy loaded)
const PSTLogin = lazy(() => import("./pages/pst/PSTLogin"));
const PSTRegister = lazy(() => import("./pages/pst/PSTRegister"));
const PSTWizard = lazy(() => import("./pages/pst/PSTWizard"));
const PSTDashboard = lazy(() => import("./pages/pst/PSTDashboard"));
const PSTPago = lazy(() => import("./pages/pst/PSTPago"));
const PSTPaymentSuccess = lazy(() => import("./pages/pst/PSTPaymentSuccess"));

// Components
import FloatingNav from "./components/FloatingNav";
import WhatsAppButton from "./components/WhatsAppButton";
import AdminLayout from "./components/AdminLayout";
import { SiteSettingsProvider } from "./components/SiteSettingsContext";
import MaintenanceGate from "./components/MaintenanceGate";

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
      <SiteSettingsProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes - wrapped in MaintenanceGate */}
          <Route
            path="/"
            element={
              <MaintenanceGate>
                <FloatingNav />
                <Home />
                <WhatsAppButton />
              </MaintenanceGate>
            }
          />
          <Route
            path="/empresas"
            element={
              <MaintenanceGate>
                <FloatingNav />
                <Empresas />
                <WhatsAppButton />
              </MaintenanceGate>
            }
          />
          <Route
            path="/empresas/:slug"
            element={
              <MaintenanceGate>
                <FloatingNav />
                <EmpresaDetalle />
                <WhatsAppButton />
              </MaintenanceGate>
            }
          />
          <Route
            path="/prensa"
            element={
              <MaintenanceGate>
                <FloatingNav />
                <Prensa />
                <WhatsAppButton />
              </MaintenanceGate>
            }
          />
          <Route
            path="/prensa/:slug"
            element={
              <MaintenanceGate>
                <FloatingNav />
                <ArticuloDetalle />
                <WhatsAppButton />
              </MaintenanceGate>
            }
          />
          <Route
            path="/mapa"
            element={
              <MaintenanceGate>
                <FloatingNav />
                <Mapa />
                <WhatsAppButton />
              </MaintenanceGate>
            }
          />
          <Route
            path="/nosotros"
            element={
              <MaintenanceGate>
                <FloatingNav />
                <Nosotros />
                <WhatsAppButton />
              </MaintenanceGate>
            }
          />
          <Route
            path="/afiliate"
            element={
              <MaintenanceGate>
                <Afiliate />
              </MaintenanceGate>
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
          <Route
            path="/admin/requisitos"
            element={
              <AdminLayout>
                <AdminRequisitos />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/afiliados"
            element={
              <AdminLayout>
                <AdminAfiliados />
              </AdminLayout>
            }
          />

          {/* PST Routes */}
          <Route path="/pst/login" element={<PSTLogin />} />
          <Route path="/registro" element={<PSTRegister />} />
          <Route path="/pst/wizard" element={<PSTWizard />} />
          <Route path="/pst/dashboard" element={<PSTDashboard />} />
          <Route path="/pst/pago" element={<PSTPago />} />
          <Route path="/pst/pago/exito" element={<PSTPaymentSuccess />} />
        </Routes>
        <Toaster position="top-right" />
        </Suspense>
      </BrowserRouter>
      </SiteSettingsProvider>
    </div>
  );
}

export default App;
