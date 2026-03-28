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
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { EmpresaSEO } from "../components/SEO";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmpresaDetalle = () => {
  const { slug } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [actividadesMap, setActividadesMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empresaRes, actividadesRes] = await Promise.allSettled([
          axios.get(`${API}/empresas/${slug}`),
          axios.get(`${API}/actividades`),
        ]);
        if (empresaRes.status === "fulfilled") {
          setEmpresa(empresaRes.value.data);
        }
        if (actividadesRes.status === "fulfilled") {
          const acts = actividadesRes.value.data;
          if (Array.isArray(acts)) {
            const map = {};
            acts.forEach(a => { map[a.id] = a.nombre; map[a.slug] = a.nombre; map[a.nombre] = a.nombre; });
            setActividadesMap(map);
          }
        }
      } catch (error) {
        console.error("Error fetching empresa:", error);
        toast.error("No se pudo cargar la información de la empresa");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleWhatsAppClick = () => {
    if (empresa?.whatsapp) {
      const message = encodeURIComponent(
        `¡Hola! Me interesa conocer más sobre los servicios de ${empresa.nombre}. ¿Podrían ayudarme?`
      );
      window.open(
        `https://wa.me/${empresa.whatsapp}?text=${message}`,
        "_blank"
      );
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

  // Build image carousel from hero + gallery
  const allImages = empresa
    ? [
        empresa.hero_url,
        ...(empresa.galeria || []),
      ].filter(Boolean)
    : [];

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % allImages.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + allImages.length) % allImages.length
    );

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <div className="skeleton h-[50vh] md:h-[60vh] w-full" />
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
      <EmpresaSEO empresa={empresa} />
      {/* Hero Carousel */}
      <section className="relative h-[50vh] md:h-[65vh] w-full overflow-hidden">
        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[currentSlide]}
              alt={empresa.nombre}
              className="w-full h-full object-cover transition-opacity duration-500"
              data-testid="empresa-hero-image"
            />
            {/* Carousel Controls */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  data-testid="carousel-prev"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  data-testid="carousel-next"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentSlide
                          ? "bg-white w-6"
                          : "bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-forest/20 flex items-center justify-center">
            <span className="text-stone-400 text-lg">Sin imagen</span>
          </div>
        )}

        <div className="hero-gradient absolute inset-0" />

        {/* Navigation */}
        <Link
          to="/empresas"
          data-testid="back-to-empresas"
          className="absolute top-24 left-4 md:left-8 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm rounded-full px-4 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-inter text-sm">Directorio</span>
        </Link>

        <button
          onClick={handleShare}
          data-testid="share-btn"
          className="absolute top-24 right-4 md:right-8 z-10 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-4">
              {empresa.logo_url && (
                <div className="hidden md:block bg-white rounded-2xl p-3 shadow-floating">
                  <img
                    src={empresa.logo_url}
                    alt={`Logo ${empresa.nombre}`}
                    className="h-16 w-auto object-contain"
                    data-testid="empresa-logo"
                  />
                </div>
              )}
              <div>
                <span className="category-badge text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline-block mb-3">
                  {empresa.categoria}
                </span>
                <h1
                  className="font-outfit font-bold text-2xl sm:text-3xl md:text-5xl text-white"
                  data-testid="empresa-nombre"
                >
                  {empresa.nombre}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Quick Actions Bar */}
      <div className="md:hidden sticky top-16 z-30 bg-white border-b border-stone-100 px-4 py-3 flex gap-2">
        {empresa.whatsapp && (
          <button
            onClick={handleWhatsAppClick}
            data-testid="mobile-whatsapp-btn"
            className="flex-1 bg-[#25D366] text-white py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            WhatsApp
          </button>
        )}
        {empresa.telefono && (
          <a
            href={`tel:${empresa.telefono}`}
            className="flex-1 bg-forest text-white py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Llamar
          </a>
        )}
      </div>

      {/* Content */}
      <section className="py-8 md:py-16 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8 md:space-y-12">
              {/* Mobile Logo */}
              {empresa.logo_url && (
                <div className="md:hidden flex items-center gap-4">
                  <div className="bg-white rounded-xl p-2 shadow-sm border border-stone-100">
                    <img
                      src={empresa.logo_url}
                      alt={`Logo ${empresa.nombre}`}
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="font-outfit font-bold text-lg text-stone-900">
                      {empresa.nombre}
                    </h2>
                    {empresa.direccion && (
                      <p className="text-stone-500 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {empresa.direccion}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h2 className="font-outfit font-bold text-xl md:text-2xl text-stone-900 mb-4">
                  Sobre nosotros
                </h2>
                <p
                  className="font-inter text-stone-600 leading-relaxed text-sm md:text-base"
                  data-testid="empresa-descripcion"
                >
                  {empresa.descripcion}
                </p>
              </div>

              {/* Activities */}
              {empresa.actividades && empresa.actividades.length > 0 && (
                <div>
                  <h2 className="font-outfit font-bold text-xl md:text-2xl text-stone-900 mb-4">
                    Actividades
                  </h2>
                  <div
                    className="flex flex-wrap gap-2 md:gap-3"
                    data-testid="actividades-list"
                  >
                    {(empresa.actividades || []).map((actividad, index) => (
                      <span
                        key={index}
                        className="activity-tag text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full"
                      >
                        {actividadesMap[actividad] || actividad}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {empresa.galeria && empresa.galeria.length > 0 && (
                <div>
                  <h2 className="font-outfit font-bold text-xl md:text-2xl text-stone-900 mb-4">
                    Galería
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(empresa.galeria || []).map((img, index) => (
                      <div
                        key={index}
                        className="cursor-pointer aspect-square rounded-2xl overflow-hidden"
                        onClick={() => setSelectedImage(img)}
                      >
                        <img
                          src={img}
                          alt={`${empresa.nombre} - ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              {empresa.latitud && empresa.longitud && (
                <div>
                  <h2 className="font-outfit font-bold text-xl md:text-2xl text-stone-900 mb-4">
                    Ubicación
                  </h2>
                  <div className="rounded-2xl overflow-hidden h-64 md:h-80 shadow-card">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${empresa.longitud - 0.01},${empresa.latitud - 0.01},${empresa.longitud + 0.01},${empresa.latitud + 0.01}&layer=mapnik&marker=${empresa.latitud},${empresa.longitud}`}
                      className="w-full h-full border-0"
                      title="Ubicación"
                      loading="lazy"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${empresa.latitud},${empresa.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-forest font-inter text-sm font-medium hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir en Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar - Contact Info (hidden on mobile, shown as sticky) */}
            <div className="lg:col-span-1 hidden md:block">
              <div className="sticky top-28 bg-white rounded-3xl shadow-card p-8">
                <h3 className="font-outfit font-bold text-xl text-stone-900 mb-6">
                  Contacto
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
                      <span className="font-inter text-sm">
                        {empresa.telefono}
                      </span>
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
                      <span className="font-inter text-sm">
                        {empresa.email}
                      </span>
                    </a>
                  )}

                  {empresa.direccion && (
                    <div className="flex items-start gap-4 text-stone-600">
                      <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-forest" />
                      </div>
                      <span className="font-inter text-sm">
                        {empresa.direccion}
                      </span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {empresa.social_links &&
                  Object.values(empresa.social_links).some((v) => v) && (
                    <div className="mt-8 pt-6 border-t border-stone-100">
                      <h4 className="font-inter font-semibold text-sm text-stone-900 mb-4">
                        Redes Sociales
                      </h4>
                      <div
                        className="flex flex-wrap gap-3"
                        data-testid="social-links"
                      >
                        {Object.entries(empresa.social_links || {}).map(
                          ([key, value]) => {
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
                          }
                        )}
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

      {/* Image Modal / Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="image-modal"
        >
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative inline-block">
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            {/* Logo overlay */}
            {empresa.logo_url && (
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                <img
                  src={empresa.logo_url}
                  alt={empresa.nombre}
                  className="h-10 w-auto max-w-[120px] object-contain"
                  data-testid="lightbox-logo"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpresaDetalle;
