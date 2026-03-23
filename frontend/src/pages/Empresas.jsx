import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import CompanyCard from "../components/CompanyCard";
import CategoryFilter from "../components/CategoryFilter";
import SearchBar from "../components/SearchBar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageSEO } from "../components/SEO";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PER_PAGE = 12;

const Empresas = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("categoria") || null
  );

  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoading(true);
      try {
        let url = `${API}/empresas?activa=true`;
        if (selectedCategory) {
          url += `&categoria=${encodeURIComponent(selectedCategory)}`;
        }
        if (searchTerm) {
          url += `&busqueda=${encodeURIComponent(searchTerm)}`;
        }
        const response = await axios.get(url);
        setEmpresas(response.data);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching empresas:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchEmpresas, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchTerm]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category) {
      setSearchParams({ categoria: category });
    } else {
      setSearchParams({});
    }
  };

  // Pagination
  const totalPages = Math.ceil(empresas.length / PER_PAGE);
  const paginatedEmpresas = empresas.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  return (
    <div
      className="min-h-screen pt-24 md:pt-32 pb-16"
      data-testid="empresas-page"
    >
      <PageSEO
        title="Directorio de Empresas"
        description="Explora el directorio completo de empresas de turismo de naturaleza y aventura en Jalisco. Operadoras, parques, capacitación y más."
        url="/empresas"
      />
      {/* Hero Header */}
      <div className="px-6 md:px-12 mb-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1
            className="font-outfit font-bold text-3xl sm:text-4xl md:text-5xl text-stone-900 mb-4"
            data-testid="empresas-title"
          >
            Directorio de Empresas
          </h1>
          <p className="font-inter text-stone-600 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Descubre las mejores empresas de turismo de naturaleza y aventura en
            Jalisco
          </p>

          <div className="mb-8">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre, actividad o ubicación..."
            />
          </div>

          <CategoryFilter
            selected={selectedCategory}
            onChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Results */}
      <div className="px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div
            className="mb-6 text-stone-500 text-sm"
            data-testid="results-count"
          >
            {loading
              ? "Cargando..."
              : `${empresas.length} empresa${empresas.length !== 1 ? "s" : ""} encontrada${empresas.length !== 1 ? "s" : ""}`}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton rounded-3xl h-[400px]" />
              ))}
            </div>
          ) : paginatedEmpresas.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedEmpresas.map((empresa) => (
                  <CompanyCard key={empresa.id} empresa={empresa} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-center gap-2 mt-12"
                  data-testid="pagination"
                >
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                    data-testid="pagination-prev"
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        data-testid={`pagination-page-${page}`}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-outfit font-bold text-sm transition-all ${
                          page === currentPage
                            ? "bg-forest text-white shadow-lg"
                            : "bg-white text-stone-600 shadow-sm border border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    data-testid="pagination-next"
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16" data-testid="no-results">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="font-outfit font-bold text-xl text-stone-800 mb-2">
                No se encontraron empresas
              </h3>
              <p className="font-inter text-stone-500">
                Intenta con otros términos de búsqueda o categoría
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Empresas;
