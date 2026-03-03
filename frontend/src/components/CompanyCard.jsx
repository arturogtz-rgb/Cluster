import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

const CompanyCard = ({ empresa }) => {
  return (
    <Link
      to={`/empresas/${empresa.slug}`}
      data-testid={`company-card-${empresa.slug}`}
      className="company-card group relative overflow-hidden rounded-3xl bg-white shadow-card block"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={empresa.hero_url || empresa.logo_url || "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800"}
          alt={empresa.nombre}
          className="card-image w-full h-full object-cover transition-transform duration-700"
        />
        
        {/* Overlay */}
        <div className="image-overlay absolute inset-0" />
        
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

        {/* Logo overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {empresa.logo_url && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 inline-block">
              <img
                src={empresa.logo_url}
                alt={`Logo ${empresa.nombre}`}
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-outfit font-bold text-xl text-stone-900 mb-2 group-hover:text-forest transition-colors">
          {empresa.nombre}
        </h3>
        
        {empresa.direccion && (
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>{empresa.direccion}</span>
          </div>
        )}

        <p className="text-stone-600 text-sm line-clamp-2 mb-4">
          {empresa.descripcion}
        </p>

        {/* Activities Tags */}
        {empresa.actividades && empresa.actividades.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {empresa.actividades.slice(0, 3).map((actividad, index) => (
              <span
                key={index}
                className="activity-tag text-xs px-3 py-1 rounded-full"
              >
                {actividad}
              </span>
            ))}
            {empresa.actividades.length > 3 && (
              <span className="text-stone-400 text-xs px-2 py-1">
                +{empresa.actividades.length - 3} más
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default CompanyCard;
