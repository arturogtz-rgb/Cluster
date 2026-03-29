import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Mail,
  Eye,
  Trash2,
  Building2,
  Clock,
  CheckCircle,
  Circle,
  Download,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchLeads();
  }, [token, navigate]);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API}/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (leadId) => {
    try {
      await axios.put(
        `${API}/leads/${leadId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, leido: true } : l))
      );
    } catch (error) {
      toast.error("Error al marcar como leído");
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm("¿Eliminar este mensaje?")) return;
    try {
      await axios.delete(`${API}/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Mensaje eliminado");
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const unreadCount = leads.filter((l) => !l.leido).length;

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/leads/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "leads_cluster_turismo.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exportado correctamente");
    } catch (error) {
      toast.error("Error al exportar CSV");
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">
            Mensajes de Contacto
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {leads.length} mensajes
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount} sin leer
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          data-testid="export-csv-btn"
          className="bg-forest text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-forest-dark transition-colors shadow-lg w-fit"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-24" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="font-outfit font-bold text-lg text-stone-800 mb-2">
            No hay mensajes
          </h3>
          <p className="text-stone-500">
            Los mensajes del formulario de /nosotros aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  if (!lead.leido) markAsRead(lead.id);
                }}
                data-testid={`lead-${lead.id}`}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedLead?.id === lead.id
                    ? "bg-forest/10 border-2 border-forest"
                    : "bg-white border-2 border-transparent hover:bg-stone-50"
                } ${!lead.leido ? "shadow-sm" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {lead.leido ? (
                      <CheckCircle className="w-4 h-4 text-stone-300" />
                    ) : (
                      <Circle className="w-4 h-4 text-forest fill-forest" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        !lead.leido
                          ? "font-bold text-stone-900"
                          : "font-medium text-stone-700"
                      }`}
                    >
                      {lead.nombre}
                    </p>
                    {lead.empresa && (
                      <p className="text-xs text-stone-500 flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        {lead.empresa}
                      </p>
                    )}
                    <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                      {lead.mensaje}
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-400 flex-shrink-0">
                    {formatDate(lead.created_at).split(",")[0]}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {selectedLead ? (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-outfit font-bold text-xl text-stone-900">
                      {selectedLead.nombre}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {selectedLead.email}
                    </p>
                    {selectedLead.empresa && (
                      <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                        <Building2 className="w-4 h-4" />
                        {selectedLead.empresa}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      handleDelete(selectedLead.id)
                    }
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-stone-50 rounded-xl p-5 mb-4">
                  <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {selectedLead.mensaje}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-stone-400">
                  <Clock className="w-4 h-4" />
                  {formatDate(selectedLead.created_at)}
                </div>

                <div className="mt-6 flex gap-3">
                  <a
                    href={`mailto:${selectedLead.email}?subject=Re: Contacto Clúster de Turismo&body=Hola ${selectedLead.nombre},%0A%0AGracias por tu interés en el Clúster de Turismo de Naturaleza y Aventura Jalisco.%0A%0A`}
                    className="bg-forest text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-forest-dark transition-colors"
                    data-testid="reply-email-btn"
                  >
                    <Mail className="w-4 h-4" />
                    Responder por email
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <Mail className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">
                  Selecciona un mensaje para ver los detalles
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeads;
