import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Check } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * ImageUploader - Componente profesional para subir imágenes con optimización
 * 
 * @param {string} value - URL actual de la imagen
 * @param {function} onChange - Callback cuando cambia la URL
 * @param {string} category - system, empresas, articulos, actividades, categorias
 * @param {string} entitySlug - slug de la entidad (empresa, articulo, etc.)
 * @param {string} subfolder - logo, hero, galeria (para empresas)
 * @param {string} imageType - hero, card, logo, galeria, icon
 * @param {string} label - Etiqueta del campo
 * @param {string} placeholder - Texto placeholder
 */
const ImageUploader = ({
  value = "",
  onChange,
  category = "system",
  entitySlug = "",
  subfolder = "",
  imageType = "card",
  label = "Imagen",
  placeholder = "URL de la imagen o sube una nueva",
  token,
  showUrlInput = true,
  className = "",
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de archivo no permitido. Usa JPG, PNG, GIF, WebP o SVG.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo es muy grande. Máximo 10MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("entity_slug", entitySlug);
    formData.append("subfolder", subfolder);
    formData.append("image_type", imageType);

    try {
      const response = await axios.post(`${API}/media/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;
      const fullUrl = `${API.replace('/api', '')}${data.url}`;
      onChange(fullUrl);
      
      // Show compression info
      if (data.compression_ratio > 0) {
        setUploadProgress({
          success: true,
          message: `Optimizada: ${data.compression_ratio}% reducción`,
          originalSize: Math.round(data.original_size / 1024),
          newSize: Math.round(data.optimized_size / 1024),
        });
      } else {
        setUploadProgress({ success: true, message: "Subida exitosa" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress({
        success: false,
        message: error.response?.data?.detail || "Error al subir imagen",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const clearImage = () => {
    onChange("");
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block font-inter font-medium text-sm text-stone-700">
          {label}
        </label>
      )}

      {/* URL Input (optional) */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-sm focus:outline-none focus:border-forest transition-all"
          />
          {value && (
            <button
              type="button"
              onClick={clearImage}
              className="px-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
              title="Eliminar imagen"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragOver
            ? "border-forest bg-forest/5"
            : uploading
            ? "border-stone-300 bg-stone-50"
            : "border-stone-300 hover:border-forest hover:bg-stone-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-forest animate-spin mb-2" />
            <span className="text-stone-500 text-sm">Optimizando imagen...</span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-stone-400 mb-2" />
            <span className="text-stone-500 text-sm text-center px-4">
              {dragOver ? "Suelta la imagen aquí" : "Arrastra o haz clic para subir"}
            </span>
            <span className="text-stone-400 text-xs mt-1">
              JPG, PNG, WebP • Máx 10MB • Optimización automática
            </span>
          </>
        )}
      </div>

      {/* Upload Progress / Status */}
      {uploadProgress && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            uploadProgress.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {uploadProgress.success ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span>{uploadProgress.message}</span>
          {uploadProgress.originalSize && (
            <span className="text-xs opacity-75 ml-auto">
              {uploadProgress.originalSize}KB → {uploadProgress.newSize}KB
            </span>
          )}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative mt-2">
          <img
            src={value}
            alt="Preview"
            className="h-24 w-full object-cover rounded-xl border border-stone-200"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
