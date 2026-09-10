import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FALLBACK_LOGO = "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";

const SiteSettingsContext = createContext({
  logo: FALLBACK_LOGO,
  maintenance: false,
  loaded: false,
});

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({ logo: FALLBACK_LOGO, maintenance: false, loaded: false });

  useEffect(() => {
    axios.get(`${API}/settings`).then(res => {
      const d = res.data || {};
      setSettings({
        logo: d.site_logo_url || FALLBACK_LOGO,
        maintenance: !!d.maintenance_mode,
        loaded: true,
      });
    }).catch(() => setSettings(prev => ({ ...prev, loaded: true })));
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export { FALLBACK_LOGO };
