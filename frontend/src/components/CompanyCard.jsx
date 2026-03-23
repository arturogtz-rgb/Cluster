import { Link } from "react-router-dom";
import { MapPin, TreePine } from "lucide-react";

const CompanyCard = ({ empresa }) => {
  return (
    <Link
      to={`/empresas/${empresa.slug}`}
      data-testid={`company-card-${empresa.slug}`}
      className="company-card group relative overflow-hidden rounded-3xl bg-white shadow-card block transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={empresa.hero_url || empresa.logo_url || "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800"}
          alt={empresa.nombre}
          className="card-image w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="category-badge text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
            {empresa.categoria}
          </span>
        </div>

        {/* Featured Badge */}
        {empresa.destacada && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-agave text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Destacada
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Logo + Name row */}
        <div className="flex items-center gap-3 mb-3">
          {empresa.logo_url ? (
            <div className="w-11 h-11 rounded-xl bg-white border border-stone-100 shadow-sm flex-shrink-0 overflow-hidden p-1">
              <img
                src={empresa.logo_url}
                alt={`Logo ${empresa.nombre}`}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-forest/10 flex items-center justify-center flex-shrink-0">
              <TreePine className="w-5 h-5 text-forest" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-outfit font-bold text-base text-stone-900 group-hover:text-forest transition-colors truncate">
              {empresa.nombre}
            </h3>
            {empresa.direccion && (
              <div className="flex items-center gap-1 text-stone-400 text-xs">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{empresa.direccion}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-stone-600 text-sm line-clamp-2 mb-3">
          {empresa.descripcion}
        </p>

        {/* Activities Tags */}
        {empresa.actividades && empresa.actividades.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {empresa.actividades.slice(0, 3).map((actividad, index) => (
              <span
                key={index}
                className="activity-tag text-xs px-2.5 py-0.5 rounded-full"
              >
                {actividad}
              </span>
            ))}
            {empresa.actividades.length > 3 && (
              <span className="text-stone-400 text-xs px-2 py-0.5">
                +{empresa.actividades.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default CompanyCard;
