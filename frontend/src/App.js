import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

// Pages
import Home from "./pages/Home";
import Empresas from "./pages/Empresas";
import EmpresaDetalle from "./pages/EmpresaDetalle";
import Prensa from "./pages/Prensa";
import ArticuloDetalle from "./pages/ArticuloDetalle";
import Mapa from "./pages/Mapa";
import Nosotros from "./pages/Nosotros";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmpresas from "./pages/admin/AdminEmpresas";
import EmpresaForm from "./pages/admin/EmpresaForm";
import AdminArticulos from "./pages/admin/AdminArticulos";
import ArticuloForm from "./pages/admin/ArticuloForm";
import AdminActividades from "./pages/admin/AdminActividades";
import ActividadForm from "./pages/admin/ActividadForm";
import AdminCategorias from "./pages/admin/AdminCategorias";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNosotros from "./pages/admin/AdminNosotros";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminUsuarios from "./pages/admin/AdminUsuarios";

// Components
import FloatingNav from "./components/FloatingNav";
import WhatsAppButton from "./components/WhatsAppButton";
import AdminLayout from "./components/AdminLayout";

function App() {
  return (
    <div className="App min-h-screen bg-limestone">
      <BrowserRouter>
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
      </BrowserRouter>
    </div>
  );
}

export default App;
