import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin,
  MessageCircle,
  ArrowLeft,
  Share2,
  X
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmpresaDetalle = () => {
  const { slug } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const response = await axios.get(`${API}/empresas/${slug}`);
        setEmpresa(response.data);
      } catch (error) {
        console.error("Error fetching empresa:", error);
        toast.error("No se pudo cargar la información de la empresa");
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresa();
  }, [slug]);

  const handleWhatsAppClick = () => {
    if (empresa?.whatsapp) {
      const message = encodeURIComponent(
        `¡Hola! Me interesa conocer más sobre los servicios de ${empresa.nombre}. ¿Podrían ayudarme?`
      );
      window.open(`https://wa.me/${empresa.whatsapp}?text=${message}`, "_blank");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: empresa.nombre,
        text: empresa.descripcion,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <div className="skeleton h-[60vh] w-full" />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="skeleton h-12 w-2/3 mb-4" />
          <div className="skeleton h-6 w-1/3 mb-8" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen pt-32 text-center px-6">
        <h1 className="font-outfit font-bold text-3xl text-stone-900 mb-4">
          Empresa no encontrada
        </h1>
        <Link to="/empresas" className="text-forest hover:underline">
          Volver al directorio
        </Link>
      </div>
    );
  }

  const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
    website: Globe,
  };

  return (
    <div className="min-h-screen" data-testid="empresa-detalle-page">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <img
          src={empresa.hero_url || empresa.logo_url || "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920"}
          alt={empresa.nombre}
          className="w-full h-full object-cover"
          data-testid="empresa-hero-image"
        />
        <div className="hero-gradient absolute inset-0" />
        
        {/* Back Button */}
        <Link
          to="/empresas"
          data-testid="back-to-empresas"
          className="absolute top-24 left-6 md:left-12 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-inter text-sm">Volver</span>
        </Link>

        {/* Share Button */}
        <button
          onClick={handleShare}
          data-testid="share-btn"
          className="absolute top-24 right-6 md:right-12 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Hero Content */}
        <div className="absolute bottom-8 left-6 md:left-12 right-6 md:right-12 z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex items-end gap-6">
              {/* Logo */}
              {empresa.logo_url && (
                <div className="hidden md:block bg-white rounded-2xl p-4 shadow-floating">
                  <img
                    src={empresa.logo_url}
                    alt={`Logo ${empresa.nombre}`}
                    className="h-20 w-auto object-contain"
                    data-testid="empresa-logo"
                  />
                </div>
              )}
              
              <div>
                <span className="category-badge text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline-block mb-4">
                  {empresa.categoria}
                </span>
                <h1 
                  className="font-outfit font-bold text-3xl md:text-5xl text-white"
                  data-testid="empresa-nombre"
                >
                  {empresa.nombre}
                </h1>
                {empresa.direccion && (
                  <div className="flex items-center gap-2 text-white/80 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-inter text-sm">{empresa.direccion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp CTA */}
            {empresa.whatsapp && (
              <button
                onClick={handleWhatsAppClick}
                data-testid="whatsapp-cta-btn"
                className="bg-[#25D366] text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-floating transition-all hover:scale-105 whatsapp-pulse"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                Contactar por WhatsApp
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="mb-12">
                <h2 className="font-outfit font-bold text-2xl text-stone-900 mb-4">
                  Sobre nosotros
                </h2>
                <p 
                  className="font-inter text-stone-600 leading-relaxed"
                  data-testid="empresa-descripcion"
                >
                  {empresa.descripcion}
                </p>
              </div>

              {/* Activities */}
              {empresa.actividades && empresa.actividades.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-outfit font-bold text-2xl text-stone-900 mb-4">
                    Actividades
                  </h2>
                  <div className="flex flex-wrap gap-3" data-testid="actividades-list">
                    {empresa.actividades.map((actividad, index) => (
                      <span
                        key={index}
                        className="activity-tag text-sm px-4 py-2 rounded-full"
                      >
                        {actividad}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {empresa.galeria && empresa.galeria.length > 0 && (
                <div>
                  <h2 className="font-outfit font-bold text-2xl text-stone-900 mb-4">
                    Galería
                  </h2>
                  <div className="masonry-grid" data-testid="galeria">
                    {empresa.galeria.map((img, index) => (
                      <div 
                        key={index} 
                        className="masonry-item cursor-pointer"
                        onClick={() => setSelectedImage(img)}
                      >
                        <img
                          src={img}
                          alt={`${empresa.nombre} - Imagen ${index + 1}`}
                          className="gallery-image w-full rounded-2xl shadow-card"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Contact Info */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 bg-white rounded-3xl shadow-card p-8">
                <h3 className="font-outfit font-bold text-xl text-stone-900 mb-6">
                  Información de Contacto
                </h3>

                <div className="space-y-5">
                  {empresa.telefono && (
                    <a
                      href={`tel:${empresa.telefono}`}
                      data-testid="contact-phone"
                      className="flex items-center gap-4 text-stone-600 hover:text-forest transition-colors"
                    >
                      <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-forest" />
                      </div>
                      <span className="font-inter text-sm">{empresa.telefono}</span>
                    </a>
                  )}

                  {empresa.email && (
                    <a
                      href={`mailto:${empresa.email}`}
                      data-testid="contact-email"
                      className="flex items-center gap-4 text-stone-600 hover:text-forest transition-colors"
                    >
                      <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-forest" />
                      </div>
                      <span className="font-inter text-sm">{empresa.email}</span>
                    </a>
                  )}

                  {empresa.direccion && (
                    <div className="flex items-start gap-4 text-stone-600">
                      <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-forest" />
                      </div>
                      <span className="font-inter text-sm">{empresa.direccion}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {empresa.social_links && Object.values(empresa.social_links).some(v => v) && (
                  <div className="mt-8 pt-6 border-t border-stone-100">
                    <h4 className="font-inter font-semibold text-sm text-stone-900 mb-4">
                      Redes Sociales
                    </h4>
                    <div className="flex flex-wrap gap-3" data-testid="social-links">
                      {Object.entries(empresa.social_links).map(([key, value]) => {
                        if (!value) return null;
                        const Icon = socialIcons[key] || Globe;
                        return (
                          <a
                            key={key}
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`social-${key}`}
                            className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500 hover:bg-forest hover:text-white transition-all"
                          >
                            <Icon className="w-5 h-5" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* WhatsApp Button */}
                {empresa.whatsapp && (
                  <button
                    onClick={handleWhatsAppClick}
                    data-testid="sidebar-whatsapp-btn"
                    className="w-full mt-8 bg-[#25D366] text-white py-4 rounded-full font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5 fill-white" />
                    WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="image-modal"
        >
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Imagen ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default EmpresaDetalle;
