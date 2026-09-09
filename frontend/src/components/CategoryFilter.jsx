import { useState, useEffect } from "react";
import { Mountain, ChevronDown } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CategoryFilter = ({ selected, onChange }) => {
  const [categorias, setCategorias] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    axios.get(`${API}/categorias`).then(res => {
      const cats = res.data?.categorias;
      if (Array.isArray(cats)) setCategorias(cats.filter(c => c.activa !== false));
    }).catch(() => {});
  }, []);

  // Responsive limits
  const getVisibleCount = () => {
    if (typeof window === "undefined") return 6;
    if (window.innerWidth >= 1024) return 10;
    if (window.innerWidth >= 768) return 8;
    return 6;
  };

  const [visibleCount, setVisibleCount] = useState(getVisibleCount);

  useEffect(() => {
    const onResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const allCats = [{ nombre: "Todas", slug: "all" }, ...categorias];
  const visible = showAll ? allCats : allCats.slice(0, visibleCount + 1);
  const hasMore = allCats.length > visibleCount + 1;

  return (
    <div className="flex flex-wrap gap-2 justify-center" data-testid="category-filter">
      {visible.map((cat) => {
        const isAll = cat.slug === "all";
        const isActive = isAll ? !selected : selected === cat.nombre;
        return (
          <button
            key={cat.slug || cat.nombre}
            onClick={() => onChange(isAll ? null : cat.nombre)}
            data-testid={`filter-${cat.slug || cat.nombre}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-forest text-white shadow-lg"
                : "bg-white text-stone-600 hover:bg-stone-50 hover:text-forest shadow-sm"
            }`}
          >
            {cat.nombre}
          </button>
        );
      })}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          data-testid="filter-show-more"
          className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
        >
          Ver más <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default CategoryFilter;
