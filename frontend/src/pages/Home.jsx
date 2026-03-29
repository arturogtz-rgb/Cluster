import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Mountain, Users, Award, Leaf, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import CompanyCard from "../components/CompanyCard";
import { PageSEO, OrganizationSEO } from "../components/SEO";

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

const DEFAULT_STATS = [
  { icon: Mountain, value: "50+", label: "Destinos" },
  { icon: Users, value: "10K+", label: "Visitantes" },
  { icon: Award, value: "20+", label: "Empresas" },
  { icon: Leaf, value: "100%", label: "Sustentable" },
];

const STAT_ICONS = [Mountain, Users, Award, Leaf, MapPin];

const Home = () => {
  const [empresasDestacadas, setEmpresasDestacadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroLogoHidden, setHeroLogoHidden] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [numeralia, setNumeralia] = useState(DEFAULT_STATS);
  const [settings, setSettings] = useState({
    hero_image: DEFAULT_HERO_IMAGE,
    hero_title: "Descubre la Aventura",
    hero_subtitle: "Explora las experiencias más emocionantes de turismo de naturaleza y aventura en Jalisco, México"
  });
  const [categorias, setCategorias] = useState(CATEGORY_IMAGES);

  // Scroll listener for hero logo fade
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setHeroLogoHidden(scrollY > 150);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, catRes, empresasRes, nosotrosRes] = await Promise.allSettled([
          axios.get(`${API}/settings`),
          axios.get(`${API}/categorias`),
          axios.get(`${API}/empresas-destacadas`),
          axios.get(`${API}/nosotros-settings`),
        ]);

        if (settingsRes.status === "fulfilled" && settingsRes.value?.data) {
          const sData = settingsRes.value.data;
          setSettings(prev => ({ ...prev, ...sData }));
          // Build carousel slides
          const slides = Array.isArray(sData.hero_slides) && sData.hero_slides.length > 0
            ? sData.hero_slides.filter(s => s.image)
            : [{ image: sData.hero_image || DEFAULT_HERO_IMAGE, title: sData.hero_title || "Descubre la Aventura", subtitle: sData.hero_subtitle || "" }];
          // Inherit text from first slide for slides without text
          const firstSlide = slides[0] || {};
          const resolvedSlides = slides.map(s => ({
            image: s.image,
            title: s.title || firstSlide.title || "",
            subtitle: s.subtitle || firstSlide.subtitle || "",
          }));
          setHeroSlides(resolvedSlides);
        }

        // Build numeralia from nosotros settings
        if (nosotrosRes.status === "fulfilled" && nosotrosRes.value?.data) {
          const nData = nosotrosRes.value.data;
          if (Array.isArray(nData.stats) && nData.stats.length > 0) {
            setNumeralia(nData.stats.map((s, i) => ({
              icon: STAT_ICONS[i % STAT_ICONS.length],
              value: s.value,
              label: s.short_label || s.label || "",
            })));
          }
        }

        if (catRes.status === "fulfilled") {
          const cats = catRes.value?.data?.categorias;
          if (Array.isArray(cats) && cats.length > 0) {
            const mergedCats = cats.map(cat => {
              const defaultCat = CATEGORY_IMAGES.find(c => c.id === cat.nombre);
              return {
                id: cat.nombre,
                label: cat.nombre,
                image: cat.imagen_url || defaultCat?.image || CATEGORY_IMAGES[0].image,
                description: cat.descripcion || defaultCat?.description || ""
              };
            });
            setCategorias(mergedCats.slice(0, 8));
          }
        }

        if (empresasRes.status === "fulfilled") {
          const data = empresasRes.value?.data;
          setEmpresasDestacadas(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeSlide = heroSlides[currentSlide] || { image: settings.hero_image, title: settings.hero_title, subtitle: settings.hero_subtitle };

  return (
    <div className="min-h-screen" data-testid="home-page">
      <PageSEO
        title="Inicio"
        description="Descubre las mejores experiencias de turismo de naturaleza y aventura en Jalisco. Senderismo, rappel, kayak y más."
        url="/"
      />
      <OrganizationSEO />
      {/* Hero Section - Carousel */}
      <section className="relative min-h-[60vh] w-full overflow-hidden" data-testid="hero-section">
        {/* Background Images */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: index === currentSlide ? 1 : 0 }}
          >
            <img
              src={slide.image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 z-10"
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

        {/* Carousel Controls */}
        {heroSlides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              data-testid="hero-carousel-prev"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % heroSlides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              data-testid="hero-carousel-next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === currentSlide ? "bg-white w-8" : "bg-white/50 w-3 hover:bg-white/70"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Hero Content */}
        <div className="absolute bottom-8 left-6 md:bottom-12 md:left-12 z-20 max-w-4xl">
          <div 
            className={`mb-3 md:mb-4 opacity-0 animate-fade-in-up hero-logo-large ${heroLogoHidden ? 'scrolled' : ''}`}
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-2.5 md:p-3 inline-block shadow-floating">
              <img
                src={CLUSTER_LOGO}
                alt="Clúster de Turismo"
                className="h-14 sm:h-16 md:h-20 w-auto"
                data-testid="hero-logo"
              />
            </div>
          </div>
          
          <h1 
            className="font-outfit font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight mb-3 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
            data-testid="hero-title"
          >
            {activeSlide.title.split(" ").slice(0, -1).join(" ")}<br />
            <span className="text-adventure-light">{activeSlide.title.split(" ").slice(-1)}</span>
          </h1>
          
          <p 
            className="font-inter text-white/90 text-sm md:text-base max-w-xl mb-5 opacity-0 animate-fade-in-up drop-shadow-lg"
            style={{ animationDelay: "600ms", animationFillMode: "forwards" }}
            data-testid="hero-subtitle"
          >
            {activeSlide.subtitle}
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-3 opacity-0 animate-fade-in-up"
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
      </section>

      {/* Stats Section - Dynamic Numeralia */}
      <section className="py-16 md:py-24 bg-white" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {numeralia.map((stat, index) => {
              const Icon = stat.icon || STAT_ICONS[index % STAT_ICONS.length];
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 justify-items-center max-w-5xl mx-auto">
            {(Array.isArray(categorias) ? categorias : []).map((cat, index) => (
              <Link
                key={cat.id}
                to={`/empresas?categoria=${encodeURIComponent(cat.id)}`}
                data-testid={`category-card-${index}`}
                className="group relative overflow-hidden rounded-2xl md:rounded-3xl aspect-[3/4] shadow-card transition-all duration-500 hover:shadow-floating hover:-translate-y-1 w-full"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 text-white">
                  <h3 className="font-outfit font-bold text-sm md:text-xl mb-0.5 md:mb-1 group-hover:text-adventure-light transition-colors">
                    {cat.label}
                  </h3>
                  <p className="font-inter text-xs md:text-sm text-white/70 hidden sm:block">
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
                Empresas más consultadas
              </h2>
              <p className="font-inter text-stone-600 text-base md:text-lg max-w-xl">
                Las empresas de turismo de naturaleza y aventura más visitadas por nuestros usuarios
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
              {(Array.isArray(empresasDestacadas) ? empresasDestacadas : []).map((empresa) => (
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
            ¿Eres una empresa de turismo de naturaleza en Jalisco?
          </h2>
          <p className="font-inter text-stone-600 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Únete al Clúster de Turismo de Naturaleza y Aventura y conecta con miles de visitantes buscando experiencias únicas.
          </p>
          <Link
            to="/nosotros"
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
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm space-y-1">
            <p>© {new Date().getFullYear()} Clúster de Turismo de Naturaleza y Aventura Jalisco. Todos los derechos reservados.</p>
            <p>Sitio desarrollado por Aventúrate Por Jalisco</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
