import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const CLUSTER_LOGO = "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";

const FloatingNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNavLogo, setShowNavLogo] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Hide nav on admin pages
  const isAdminPage = location.pathname.startsWith("/admin");
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
      // Show nav logo when scrolled past hero logo (approx 300px on home)
      setShowNavLogo(isHomePage ? scrollY > 300 : true);
    };
    
    // Initial check
    handleScroll();
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (isAdminPage) return null;

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/empresas", label: "Empresas" },
    { href: "/mapa", label: "Mapa" },
    { href: "/prensa", label: "Prensa" },
    { href: "/nosotros", label: "Nosotros" },
  ];

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <nav
        data-testid="floating-nav"
        className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          isScrolled
            ? "nav-glass shadow-floating rounded-full px-4 md:px-6 py-2 md:py-3"
            : "bg-transparent px-4 md:px-6 py-2 md:py-3"
        }`}
      >
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo - aparece con scroll en homepage, siempre en otras páginas */}
          <Link 
            to="/" 
            className={`flex items-center gap-2 transition-all duration-500 ${
              showNavLogo ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            }`} 
            data-testid="nav-logo"
          >
            <div className={`${isScrolled ? "" : "bg-white/90 backdrop-blur-sm rounded-xl p-1.5"}`}>
              <img
                src={CLUSTER_LOGO}
                alt="Clúster Turismo Jalisco"
                className="h-7 md:h-9 w-auto"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
                className={`font-inter text-sm font-medium transition-all duration-300 hover:text-adventure-light ${
                  isActive(link.href)
                    ? isScrolled ? "text-forest font-semibold" : "text-white font-semibold"
                    : isScrolled
                    ? "text-stone-700"
                    : "text-white/90"
                }`}
                style={!isScrolled ? { textShadow: "0 1px 4px rgba(0,0,0,0.6)" } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button - Desktop */}
          <Link
            to="/empresas"
            data-testid="nav-cta-btn"
            className="hidden md:block bg-forest text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:bg-forest-dark hover:scale-105 shadow-lg"
          >
            Explorar
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            data-testid="mobile-menu-btn"
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? "text-stone-800" : "text-white"}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? "text-stone-800" : "text-white"}`} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          data-testid="mobile-menu"
          className="fixed inset-0 z-40 bg-white pt-24 px-6 animate-fade-in"
        >
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
                className={`font-outfit text-2xl font-bold transition-colors ${
                  isActive(link.href) ? "text-forest" : "text-stone-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/empresas"
              data-testid="mobile-cta-btn"
              className="mt-4 bg-forest text-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest text-center transition-all hover:bg-forest-dark"
            >
              Explorar Empresas
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingNav;
