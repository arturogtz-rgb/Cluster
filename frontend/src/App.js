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
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Components
import FloatingNav from "./components/FloatingNav";
import WhatsAppButton from "./components/WhatsAppButton";

function App() {
  return (
    <div className="App min-h-screen bg-limestone">
      <BrowserRouter>
        <FloatingNav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/empresas/:slug" element={<EmpresaDetalle />} />
          <Route path="/prensa" element={<Prensa />} />
          <Route path="/prensa/:slug" element={<ArticuloDetalle />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
        <WhatsAppButton />
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
