import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Mountain, Users, Award, Leaf, MapPin } from "lucide-react";
import CompanyCard from "../components/CompanyCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CLUSTER_LOGO = "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=1920";

const CATEGORY_IMAGES = [
  {
    id: "Capacitación",
    label: "Capacitación",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
    description: "Formación profesional en turismo de aventura"
  },
  {
    id: "Operadora de aventura",
    label: "Operadoras de Aventura",
    image: "https://images.unsplash.com/photo-1632614567386-465d63c603bb?w=800",
    description: "Experiencias únicas en la naturaleza"
  },
  {
    id: "Parque acuático",
    label: "Parques Acuáticos",
    image: "https://images.unsplash.com/photo-1596479550496-d4eb09f60a99?w=800",
    description: "Diversión y aventura en el agua"
  },
  {
    id: "Hospedaje",
    label: "Hospedaje",
    image: "https://images.unsplash.com/photo-1727818861050-8ec7c31eee78?w=800",
    description: "Alojamiento en entornos naturales"
  },
];

const STATS = [
  { icon: Mountain, value: "50+", label: "Destinos" },
  { icon: Users, value: "10K+", label: "Visitantes" },
  { icon: Award, value: "20+", label: "Empresas" },
  { icon: Leaf, value: "100%", label: "Sustentable" },
];

const Home = () => {
  const [empresasDestacadas, setEmpresasDestacadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    hero_image: DEFAULT_HERO_IMAGE,
    hero_title: "Descubre la Aventura",
    hero_subtitle: "Explora las experiencias más emocionantes de turismo de naturaleza y aventura en Jalisco, México"
  });
  const [categorias, setCategorias] = useState(CATEGORY_IMAGES);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Seed data first
        await axios.post(`${API}/seed`);
        
        // Fetch settings
        const settingsRes = await axios.get(`${API}/settings`);
        if (settingsRes.data) {
          setSettings(prev => ({ ...prev, ...settingsRes.data }));
        }

        // Fetch categories
        const catRes = await axios.get(`${API}/categorias`);
        if (catRes.data?.categorias && Array.isArray(catRes.data.categorias)) {
          // Merge with default images if category has imagen_url
          const mergedCats = catRes.data.categorias.map(cat => {
            const defaultCat = CATEGORY_IMAGES.find(c => c.id === cat.nombre);
            return {
              id: cat.nombre,
              label: cat.nombre,
              image: cat.imagen_url || defaultCat?.image || CATEGORY_IMAGES[0].image,
              description: cat.descripcion || defaultCat?.description || ""
            };
          });
          if (mergedCats.length > 0) {
            setCategorias(mergedCats.slice(0, 4));
          }
        }
        
        // Fetch featured companies
        const response = await axios.get(`${API}/empresas?destacada=true`);
        setEmpresasDestacadas(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden" data-testid="hero-section">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={settings.hero_image}
            alt="Paisaje de Jalisco"
            className="w-full h-full object-cover"
          />
          {/* Improved gradient overlay for better text readability */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to top,
                rgba(0, 0, 0, 0.85) 0%,
                rgba(0, 0, 0, 0.6) 25%,
                rgba(0, 0, 0, 0.3) 50%,
                rgba(0, 0, 0, 0.1) 75%,
                transparent 100%
              )`
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-16 left-6 md:left-12 z-20 max-w-4xl">
          {/* Large Logo - visible initially, fades on scroll */}
          <div 
            className="mb-6 opacity-0 animate-fade-in-up hero-logo-large" 
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 inline-block shadow-floating">
              <img
                src={CLUSTER_LOGO}
                alt="Clúster de Turismo"
                className="h-16 md:h-24 w-auto"
                data-testid="hero-logo"
              />
            </div>
          </div>
          
          <h1 
            className="font-outfit font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-tight tracking-tight mb-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
            data-testid="hero-title"
          >
            {settings.hero_title.split(" ").slice(0, -1).join(" ")}<br />
            <span className="text-adventure-light">{settings.hero_title.split(" ").slice(-1)}</span>
          </h1>
          
          <p 
            className="font-inter text-white/90 text-base md:text-lg max-w-xl mb-8 opacity-0 animate-fade-in-up drop-shadow-lg"
            style={{ animationDelay: "600ms", animationFillMode: "forwards" }}
            data-testid="hero-subtitle"
          >
            {settings.hero_subtitle}
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
          >
            <Link
              to="/empresas"
              data-testid="hero-cta-primary"
              className="bg-forest text-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-forest-dark hover:scale-105 shadow-lg inline-flex items-center justify-center gap-2"
            >
              Explorar Empresas
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/mapa"
              data-testid="hero-cta-map"
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-white/20 border border-white/20 inline-flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Ver Mapa
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/80 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-white" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {STATS.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="text-center"
                  data-testid={`stat-${index}`}
                >
                  <div className="w-14 h-14 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-forest" />
                  </div>
                  <div className="font-outfit font-black text-4xl md:text-5xl text-forest mb-1">
                    {stat.value}
                  </div>
                  <div className="font-inter text-stone-500 text-sm">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 px-6 md:px-12" data-testid="categories-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-outfit font-bold text-3xl md:text-4xl text-stone-900 mb-4">
              Categorías
            </h2>
            <p className="font-inter text-stone-600 text-base md:text-lg max-w-2xl mx-auto">
              Encuentra la experiencia perfecta según tu tipo de aventura
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categorias.map((cat, index) => (
              <Link
                key={cat.id}
                to={`/empresas?categoria=${encodeURIComponent(cat.id)}`}
                data-testid={`category-card-${index}`}
                className="group relative overflow-hidden rounded-3xl aspect-[3/4] shadow-card transition-all duration-500 hover:shadow-floating hover:-translate-y-1"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h3 className="font-outfit font-bold text-xl mb-1 group-hover:text-adventure-light transition-colors">
                    {cat.label}
                  </h3>
                  <p className="font-inter text-sm text-white/70">
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-white" data-testid="featured-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-16">
            <div>
              <h2 className="font-outfit font-bold text-3xl md:text-4xl text-stone-900 mb-4">
                Empresas Destacadas
              </h2>
              <p className="font-inter text-stone-600 text-base md:text-lg max-w-xl">
                Conoce a nuestros socios líderes en turismo de naturaleza y aventura
              </p>
            </div>
            <Link
              to="/empresas"
              data-testid="view-all-empresas"
              className="mt-6 md:mt-0 inline-flex items-center gap-2 text-forest font-semibold hover:text-forest-dark transition-colors"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton rounded-3xl h-[480px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {empresasDestacadas.map((empresa) => (
                <CompanyCard key={empresa.id} empresa={empresa} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6 md:px-12" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-outfit font-bold text-3xl md:text-4xl text-stone-900 mb-6">
            ¿Eres una empresa de turismo en Jalisco?
          </h2>
          <p className="font-inter text-stone-600 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Únete al Clúster de Turismo de Naturaleza y Aventura y conecta con miles de visitantes buscando experiencias únicas.
          </p>
          <Link
            to="/admin"
            data-testid="cta-join-btn"
            className="bg-adventure text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-adventure-dark hover:scale-105 shadow-lg inline-flex items-center gap-2"
          >
            Registra tu empresa
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest py-12 px-6 md:px-12" data-testid="footer">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-xl p-2">
                <img
                  src={CLUSTER_LOGO}
                  alt="Clúster Turismo Jalisco"
                  className="h-12 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center gap-8 text-white/70 text-sm">
              <Link to="/empresas" className="hover:text-white transition-colors">
                Empresas
              </Link>
              <Link to="/mapa" className="hover:text-white transition-colors">
                Mapa
              </Link>
              <Link to="/prensa" className="hover:text-white transition-colors">
                Prensa
              </Link>
              <Link to="/admin" className="hover:text-white transition-colors">
                Admin
              </Link>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
            © 2024 Clúster de Turismo de Naturaleza y Aventura Jalisco. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
