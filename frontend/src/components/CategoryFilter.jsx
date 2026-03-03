import { Mountain, Waves, Home, GraduationCap, TreePine } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "Todas", icon: Mountain },
  { id: "Capacitación", label: "Capacitación", icon: GraduationCap },
  { id: "Operadora de aventura", label: "Operadora de aventura", icon: TreePine },
  { id: "Parque acuático", label: "Parque acuático", icon: Waves },
  { id: "Hospedaje", label: "Hospedaje", icon: Home },
  { id: "Parque de aventura", label: "Parque de aventura", icon: Mountain },
];

const CategoryFilter = ({ selected, onChange }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center" data-testid="category-filter">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.id || (cat.id === "all" && !selected);
        
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id === "all" ? null : cat.id)}
            data-testid={`filter-${cat.id}`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-forest text-white shadow-lg scale-105"
                : "bg-white text-stone-600 hover:bg-stone-50 hover:text-forest shadow-sm"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
