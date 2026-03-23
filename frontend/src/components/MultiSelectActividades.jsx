import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * MultiSelectActividades - Selector múltiple de actividades
 * 
 * @param {array} value - Array de IDs de actividades seleccionadas
 * @param {function} onChange - Callback cuando cambia la selección
 * @param {string} label - Etiqueta del campo
 */
const MultiSelectActividades = ({
  value = [],
  onChange,
  label = "Actividades",
}) => {
  const [actividades, setActividades] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const response = await axios.get(`${API}/actividades?activa=true`);
        setActividades(response.data);
      } catch (error) {
        console.error("Error fetching actividades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActividades();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleActividad = (actividadId) => {
    if (value.includes(actividadId)) {
      onChange(value.filter((id) => id !== actividadId));
    } else {
      onChange([...value, actividadId]);
    }
  };

  const removeActividad = (actividadId, e) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== actividadId));
  };

  const getActividadById = (id) => {
    return actividades.find((a) => a.id === id || a.slug === id);
  };

  const selectedActividades = value
    .map((id) => getActividadById(id))
    .filter(Boolean);

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block font-inter font-medium text-sm text-stone-700">
        {label}
      </label>

      {/* Selection Display / Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full min-h-[48px] px-4 py-2 rounded-xl border bg-stone-50/50 cursor-pointer transition-all ${
          isOpen
            ? "border-forest ring-2 ring-forest/10"
            : "border-stone-200 hover:border-stone-300"
        }`}
      >
        <div className="flex flex-wrap gap-2 pr-8">
          {selectedActividades.length === 0 ? (
            <span className="text-stone-400 text-sm py-1">
              Selecciona actividades...
            </span>
          ) : (
            selectedActividades.map((act) => (
              <span
                key={act.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${act.color}15`,
                  color: act.color,
                }}
              >
                {act.nombre}
                <button
                  type="button"
                  onClick={(e) => removeActividad(act.id, e)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-stone-200 shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-stone-500 text-sm">
              Cargando actividades...
            </div>
          ) : actividades.length === 0 ? (
            <div className="p-4 text-center text-stone-500 text-sm">
              No hay actividades disponibles
            </div>
          ) : (
            <div className="py-2">
              {actividades.map((actividad) => {
                const isSelected = value.includes(actividad.id) || value.includes(actividad.slug);
                return (
                  <button
                    key={actividad.id}
                    type="button"
                    onClick={() => toggleActividad(actividad.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors ${
                      isSelected ? "bg-forest/5" : ""
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-forest border-forest"
                          : "border-stone-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: actividad.color }}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-stone-800">
                        {actividad.nombre}
                      </span>
                      {actividad.descripcion && (
                        <p className="text-xs text-stone-500 truncate">
                          {actividad.descripcion}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Count */}
      {selectedActividades.length > 0 && (
        <p className="text-xs text-stone-500">
          {selectedActividades.length} actividad{selectedActividades.length !== 1 ? "es" : ""} seleccionada{selectedActividades.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

export default MultiSelectActividades;
