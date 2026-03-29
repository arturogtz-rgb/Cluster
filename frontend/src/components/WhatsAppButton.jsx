import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WhatsAppButton = () => {
  const location = useLocation();
  const [config, setConfig] = useState({ number: "", visible: false });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/settings`);
        const data = res.data || {};
        setConfig({
          number: data.whatsapp_number || "",
          visible: data.whatsapp_visible ?? false,
        });
      } catch (e) {
        // silently fail
      }
    };
    fetchSettings();
  }, []);

  // Hide on admin pages or when not visible
  const isAdminPage = location.pathname.startsWith("/admin");
  if (isAdminPage || !config.visible || !config.number) return null;

  // Clean number: remove spaces, dashes, parentheses. Keep + at start
  const cleanNumber = config.number.replace(/[\s\-()]/g, "").replace(/^\+/, "");

  const message = encodeURIComponent(
    "¡Hola! Me interesa conocer más sobre las experiencias de turismo de naturaleza y aventura en Jalisco. ¿Podrían ayudarme?"
  );

  const handleClick = () => {
    // Silent tracking - fire and forget, doesn't block WhatsApp opening
    axios.post(`${API}/analytics/whatsapp-click`).catch(() => {});
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      data-testid="whatsapp-float-btn"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-floating whatsapp-pulse transition-transform duration-300 hover:scale-110"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
    </button>
  );
};

export default WhatsAppButton;
