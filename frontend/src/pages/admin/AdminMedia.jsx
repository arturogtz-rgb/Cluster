import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Upload, Trash2, FolderOpen, Loader2, Copy, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminMedia = () => {
  const navigate = useNavigate();
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchMedia();
  }, [token, navigate]);

  const fetchMedia = async () => {
    try {
      const response = await axios.get(`${API}/media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setMediaFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
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
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
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
    fetchMedia();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("¿Eliminar esta imagen?")) return;
    try {
      await axios.delete(`${API}/media/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Imagen eliminada");
      fetchMedia();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const copyUrl = (url) => {
    const fullUrl = `${API.replace("/api", "")}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(url);
    toast.success("URL copiada");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900">
            Media Manager
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {mediaFiles.length} archivos
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          multiple
          className="hidden"
          id="media-file-upload"
        />
        <label
          htmlFor="media-file-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-forest transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-forest animate-spin mb-2" />
          ) : (
            <Upload className="w-8 h-8 text-stone-400 mb-2" />
          )}
          <span className="text-stone-500 text-sm">
            {uploading
              ? "Subiendo y optimizando..."
              : "Haz clic o arrastra imágenes para subir"}
          </span>
          <span className="text-stone-400 text-xs mt-1">
            JPG, PNG, WebP, GIF, SVG - Máx 10MB
          </span>
        </label>
      </div>

      {/* Files Grid */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-outfit font-bold text-lg mb-4">
          Biblioteca ({mediaFiles.length} archivos)
        </h3>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton aspect-square rounded-xl" />
            ))}
          </div>
        ) : mediaFiles.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No hay imágenes subidas</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaFiles.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden border border-stone-200">
                  <img
                    src={`${API.replace("/api", "")}${file.url}`}
                    alt={file.original_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => copyUrl(file.url)}
                    className="bg-white text-stone-700 p-2 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Copiar URL"
                  >
                    {copiedId === file.url ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-stone-500 truncate mt-1">
                  {file.original_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMedia;
