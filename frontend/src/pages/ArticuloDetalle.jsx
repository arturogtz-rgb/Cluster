import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Calendar, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ArticuloSEO } from "../components/SEO";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ArticuloDetalle = () => {
  const { slug } = useParams();
  const [articulo, setArticulo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticulo = async () => {
      try {
        const response = await axios.get(`${API}/articulos/${slug}`);
        setArticulo(response.data);
      } catch (error) {
        console.error("Error fetching articulo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticulo();
  }, [slug]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: articulo.titulo,
        text: articulo.resumen,
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
        <div className="skeleton h-[50vh] w-full" />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="skeleton h-12 w-2/3 mb-4" />
          <div className="skeleton h-6 w-1/4 mb-8" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!articulo) {
    return (
      <div className="min-h-screen pt-32 text-center px-6">
        <h1 className="font-outfit font-bold text-3xl text-stone-900 mb-4">
          Artículo no encontrado
        </h1>
        <Link to="/prensa" className="text-forest hover:underline">
          Volver a prensa
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="articulo-detalle-page">
      <ArticuloSEO articulo={articulo} />
      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
        <img
          src={articulo.hero_url || "https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=1920"}
          alt={articulo.titulo}
          className="w-full h-full object-cover"
          data-testid="articulo-hero"
        />
        <div className="hero-gradient absolute inset-0" />

        {/* Back Button */}
        <Link
          to="/prensa"
          data-testid="back-to-prensa"
          className="absolute top-24 left-6 md:left-12 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-inter text-sm">Volver</span>
        </Link>

        {/* Share Button */}
        <button
          onClick={handleShare}
          data-testid="share-articulo-btn"
          className="absolute top-24 right-6 md:right-12 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="absolute bottom-8 left-6 md:left-12 right-6 md:right-12 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(articulo.created_at)}</span>
            </div>
            <h1 
              className="font-outfit font-bold text-3xl md:text-5xl text-white"
              data-testid="articulo-titulo"
            >
              {articulo.titulo}
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Summary */}
          <p 
            className="font-inter text-xl text-stone-600 leading-relaxed mb-8 pb-8 border-b border-stone-200"
            data-testid="articulo-resumen"
          >
            {articulo.resumen}
          </p>

          {/* Article Content */}
          <div 
            className="article-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: articulo.contenido }}
            data-testid="articulo-contenido"
          />

          {/* Gallery */}
          {articulo.galeria && articulo.galeria.length > 0 && (
            <div className="mt-12">
              <h2 className="font-outfit font-bold text-2xl text-stone-900 mb-6">
                Galería
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articulo.galeria.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${articulo.titulo} - Imagen ${index + 1}`}
                    className="w-full rounded-2xl shadow-card"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ArticuloDetalle;
