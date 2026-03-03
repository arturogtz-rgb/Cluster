import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const location = useLocation();
  
  // Hide on admin pages
  const isAdminPage = location.pathname.startsWith("/admin");
  if (isAdminPage) return null;

  const whatsappNumber = "523334601257"; // Default cluster number
  const message = encodeURIComponent(
    "¡Hola! Me interesa conocer más sobre las experiencias de turismo de naturaleza y aventura en Jalisco. ¿Podrían ayudarme?"
  );

  const handleClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
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
