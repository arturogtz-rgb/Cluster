import { useSiteSettings } from "./SiteSettingsContext";
import { Construction } from "lucide-react";

export default function MaintenanceGate({ children }) {
  const { maintenance, loaded, logo } = useSiteSettings();

  if (!loaded) return null;

  if (maintenance) {
    return (
      <div className="min-h-screen bg-limestone flex items-center justify-center px-6" data-testid="maintenance-page">
        <div className="text-center max-w-md">
          <img src={logo} alt="Logo" className="h-16 mx-auto mb-8" />
          <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Construction className="w-8 h-8 text-forest" />
          </div>
          <h1 className="font-outfit font-bold text-2xl text-stone-900 mb-3">Sitio en mantenimiento</h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Estamos realizando mejoras en el sitio. Volveremos pronto. Disculpa las molestias.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
