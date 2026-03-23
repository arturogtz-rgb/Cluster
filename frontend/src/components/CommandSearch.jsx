import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Building2,
  Newspaper,
  TreePine,
  Command,
  X,
  ArrowRight,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const typeConfig = {
  empresa: {
    icon: Building2,
    label: "Empresas",
    color: "text-forest",
    bg: "bg-forest/10",
    editPath: (slug) => `/admin/empresas/editar/${slug}`,
  },
  articulo: {
    icon: Newspaper,
    label: "Artículos",
    color: "text-adventure",
    bg: "bg-adventure/10",
    editPath: (slug) => `/admin/articulos/editar/${slug}`,
  },
  actividad: {
    icon: TreePine,
    label: "Actividades",
    color: "text-teal-600",
    bg: "bg-teal-100",
    editPath: (slug) => `/admin/actividades/editar/${slug}`,
  },
};

const CommandSearch = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const q = searchQuery.toLowerCase();

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [empresasRes, articulosRes, actividadesRes] = await Promise.all([
        axios.get(`${API}/empresas`),
        axios.get(`${API}/articulos`, { headers }),
        axios.get(`${API}/actividades`),
      ]);

      const matched = [];

      empresasRes.data.forEach((e) => {
        if (
          e.nombre.toLowerCase().includes(q) ||
          e.categoria?.toLowerCase().includes(q) ||
          e.direccion?.toLowerCase().includes(q)
        ) {
          matched.push({
            type: "empresa",
            name: e.nombre,
            slug: e.slug,
            subtitle: e.categoria,
          });
        }
      });

      articulosRes.data.forEach((a) => {
        if (
          a.titulo.toLowerCase().includes(q) ||
          a.resumen?.toLowerCase().includes(q)
        ) {
          matched.push({
            type: "articulo",
            name: a.titulo,
            slug: a.slug,
            subtitle: a.publicado ? "Publicado" : "Borrador",
          });
        }
      });

      actividadesRes.data.forEach((act) => {
        if (
          act.nombre.toLowerCase().includes(q) ||
          act.descripcion?.toLowerCase().includes(q)
        ) {
          matched.push({
            type: "actividad",
            name: act.nombre,
            slug: act.slug,
            subtitle: act.descripcion?.substring(0, 50) || "",
          });
        }
      });

      setResults(matched.slice(0, 12));
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(val), 250);
  };

  const handleSelect = (result) => {
    const config = typeConfig[result.type];
    navigate(config.editPath(result.slug));
    setOpen(false);
  };

  const handleKeyNavigation = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!open) return null;

  // Group results by type
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100]" data-testid="command-search">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative max-w-xl mx-auto mt-[15vh]">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
            <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyNavigation}
              placeholder="Buscar empresas, artículos, actividades..."
              data-testid="command-search-input"
              className="flex-1 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none bg-transparent"
            />
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-md text-xs text-stone-500 font-mono">
              ESC
            </kbd>
            <button
              onClick={() => setOpen(false)}
              className="sm:hidden p-1 text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {loading && (
              <div className="px-5 py-8 text-center">
                <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-stone-500">Buscando...</p>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-stone-500 text-sm">
                  No se encontraron resultados para "{query}"
                </p>
              </div>
            )}

            {!loading && !query && (
              <div className="px-5 py-8 text-center">
                <p className="text-stone-400 text-sm">
                  Escribe para buscar en empresas, artículos y actividades
                </p>
              </div>
            )}

            {!loading &&
              Object.entries(grouped).map(([type, items]) => {
                const config = typeConfig[type];
                const Icon = config.icon;

                return (
                  <div key={type}>
                    <div className="px-5 py-2 bg-stone-50">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    {items.map((result) => {
                      const currentFlatIndex = flatIndex++;
                      const isSelected = currentFlatIndex === selectedIndex;

                      return (
                        <button
                          key={`${result.type}-${result.slug}`}
                          onClick={() => handleSelect(result)}
                          data-testid={`search-result-${result.slug}`}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-forest/5"
                              : "hover:bg-stone-50"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}
                          >
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">
                              {result.name}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-stone-500 truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-stone-200 font-mono">
                  ↑↓
                </kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-stone-200 font-mono">
                  ↵
                </kbd>
                abrir
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />K para buscar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandSearch;
