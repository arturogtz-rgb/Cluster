import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Calendar, ArrowRight } from "lucide-react";
import { PageSEO } from "../components/SEO";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Prensa = () => {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticulos = async () => {
      try {
        const response = await axios.get(`${API}/articulos?publicado=true`);
        const data = response.data;
        setArticulos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching articulos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticulos();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-16" data-testid="prensa-page">
      <PageSEO
        title="Prensa y Noticias"
        description="Últimas novedades del turismo de naturaleza y aventura en Jalisco. Artículos, eventos y comunicados del Clúster."
        url="/prensa"
      />
      {/* Header */}
      <div className="px-6 md:px-12 mb-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 
            className="font-outfit font-bold text-3xl sm:text-4xl md:text-5xl text-stone-900 mb-4"
            data-testid="prensa-title"
          >
            Prensa y Noticias
          </h1>
          <p className="font-inter text-stone-600 text-base md:text-lg max-w-2xl mx-auto">
            Mantente informado sobre las últimas novedades del turismo de naturaleza y aventura en Jalisco
          </p>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton rounded-3xl h-[400px]" />
              ))}
            </div>
          ) : articulos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articulos.map((articulo) => (
                <Link
                  key={articulo.id}
                  to={`/prensa/${articulo.slug}`}
                  data-testid={`articulo-card-${articulo.slug}`}
                  className="group bg-white rounded-3xl shadow-card overflow-hidden transition-all duration-500 hover:shadow-floating hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={articulo.hero_url || "https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=800"}
                      alt={articulo.titulo}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-stone-500 text-sm mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(articulo.created_at)}</span>
                    </div>

                    <h2 className="font-outfit font-bold text-xl text-stone-900 mb-3 group-hover:text-forest transition-colors line-clamp-2">
                      {articulo.titulo}
                    </h2>

                    <p className="font-inter text-stone-600 text-sm line-clamp-3 mb-4">
                      {articulo.resumen}
                    </p>

                    <div className="flex items-center gap-2 text-forest font-semibold text-sm group-hover:gap-3 transition-all">
                      Leer más
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" data-testid="no-articulos">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="font-outfit font-bold text-xl text-stone-800 mb-2">
                No hay artículos publicados
              </h3>
              <p className="font-inter text-stone-500">
                Pronto compartiremos noticias y novedades del clúster
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prensa;
