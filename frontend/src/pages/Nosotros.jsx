import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Mountain,
  Users,
  TreePine,
  Leaf,
  ArrowRight,
  Send,
  Shield,
  Heart,
  Compass,
  ChevronDown,
  Award,
} from "lucide-react";
import { PageSEO } from "../components/SEO";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CLUSTER_LOGO =
  "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";

const VALUES_ICONS = {
  Sustentabilidad: Leaf,
  Seguridad: Shield,
  Comunidad: Heart,
  "Pasión por la Tierra": Compass,
};

const DEFAULT_NOSOTROS_HERO = "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920";

const Nosotros = () => {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ empresas: 0, actividades: 0 });
  const [customStats, setCustomStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSending, setFormSending] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    empresa: "",
    mensaje: "",
  });
  const formRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, empresasRes, actividadesRes] = await Promise.all([
          axios.get(`${API}/nosotros-settings`),
          axios.get(`${API}/empresas?activa=true`),
          axios.get(`${API}/actividades`),
        ]);
        setSettings(settingsRes.data);
        if (Array.isArray(settingsRes.data.stats)) {
          setCustomStats(settingsRes.data.stats);
        }
        setStats({
          empresas: empresasRes.data.length,
          actividades: actividadesRes.data.length,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSending(true);
    try {
      await axios.post(`${API}/contacto`, form);
      toast.success("Mensaje enviado correctamente");
      setForm({ nombre: "", email: "", empresa: "", mensaje: "" });
    } catch (error) {
      toast.error("Error al enviar mensaje");
    } finally {
      setFormSending(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24">
        <div className="skeleton h-[50vh] w-full" />
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="skeleton h-8 w-2/3 mb-4" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    );
  }

  const valores = settings?.valores || [
    "Sustentabilidad",
    "Seguridad",
    "Comunidad",
    "Pasión por la Tierra",
  ];

  return (
    <div className="min-h-screen" data-testid="nosotros-page">
      <PageSEO
        title="Nosotros"
        description="Conoce al Clúster de Turismo de Naturaleza y Aventura Jalisco. Nuestra misión, visión, valores y cómo unirte."
        url="/nosotros"
      />
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        {(settings?.hero_image || DEFAULT_NOSOTROS_HERO) ? (
          <div className="absolute inset-0">
            <img
              src={settings?.hero_image || DEFAULT_NOSOTROS_HERO}
              alt="Nosotros Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-forest/75" />
            {/* Top gradient for menu readability */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%)" }} />
          </div>
        ) : (
          <div className="absolute inset-0 bg-forest">
            <div
              className="w-full h-full opacity-10"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            />
          </div>
        )}
        <div className="relative z-10 text-center px-6 py-24 max-w-4xl mx-auto">
          <img
            src={CLUSTER_LOGO}
            alt="Clúster de Turismo"
            className="h-24 mx-auto mb-8 drop-shadow-lg"
          />
          <h1 className="font-outfit font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            Turismo de Naturaleza
            <br />
            <span className="text-agave">y Aventura Jalisco</span>
          </h1>
          <p className="font-inter text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-10">
            {settings?.mision}
          </p>
          <button
            onClick={scrollToForm}
            data-testid="cta-unirte"
            className="inline-flex items-center gap-2 bg-agave text-white px-8 py-4 rounded-full font-outfit font-bold text-sm uppercase tracking-wider hover:bg-agave/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Únete al Clúster
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {(customStats.length > 0
              ? customStats.map((s, i) => ({
                  icon: [Mountain, Users, TreePine, Leaf, Award][i % 5],
                  value: s.value,
                  label: s.label || s.short_label || "",
                }))
              : [
                  { icon: Mountain, value: "50+", label: "Destinos Naturales" },
                  { icon: Users, value: `${stats.empresas}+`, label: "Empresas Asociadas" },
                  { icon: TreePine, value: `${stats.actividades}`, label: "Actividades" },
                  { icon: Leaf, value: "100%", label: "Compromiso Sustentable" },
                ]
            ).map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i}>
                  <Icon className="w-6 h-6 text-forest mx-auto mb-2" />
                  <p className="font-outfit font-bold text-2xl sm:text-3xl text-stone-900">
                    {stat.value}
                  </p>
                  <p className="font-inter text-sm text-stone-500">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-white rounded-3xl shadow-card p-8 md:p-10">
              <div className="w-14 h-14 bg-forest/10 rounded-2xl flex items-center justify-center mb-6">
                <Compass className="w-7 h-7 text-forest" />
              </div>
              <h2 className="font-outfit font-bold text-2xl text-stone-900 mb-4">
                Nuestra Misión
              </h2>
              <p className="font-inter text-stone-600 leading-relaxed">
                {settings?.mision}
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-3xl shadow-card p-8 md:p-10">
              <div className="w-14 h-14 bg-adventure/10 rounded-2xl flex items-center justify-center mb-6">
                <Mountain className="w-7 h-7 text-adventure" />
              </div>
              <h2 className="font-outfit font-bold text-2xl text-stone-900 mb-4">
                Nuestra Visión
              </h2>
              <p className="font-inter text-stone-600 leading-relaxed">
                {settings?.vision}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-stone-900 mb-3">
              Nuestros Valores
            </h2>
            <p className="font-inter text-stone-500 max-w-lg mx-auto">
              Los principios que guían nuestra misión de impulsar el turismo
              responsable
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {valores.map((valor, i) => {
              const Icon = VALUES_ICONS[valor] || Leaf;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`valor-${i}`}
                >
                  <div className="w-14 h-14 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-forest" />
                  </div>
                  <h3 className="font-outfit font-bold text-stone-900">
                    {valor}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA + Contact Form */}
      <section
        ref={formRef}
        className="py-16 md:py-24 px-6"
        data-testid="contacto-section"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* CTA */}
            <div>
              <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-stone-900 mb-6 leading-tight">
                {settings?.cta_titulo || "¿Quieres unirte al Clúster?"}
              </h2>
              <p className="font-inter text-stone-600 leading-relaxed mb-8">
                {settings?.cta_texto ||
                  "Si tu empresa ofrece servicios de turismo de naturaleza y aventura en Jalisco, te invitamos a formar parte de nuestra red."}
              </p>
              <div className="space-y-4 text-stone-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-forest" />
                  </div>
                  <p className="font-inter text-sm">
                    Visibilidad en el directorio digital del Clúster
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-forest" />
                  </div>
                  <p className="font-inter text-sm">
                    Participación en eventos y capacitaciones
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-forest" />
                  </div>
                  <p className="font-inter text-sm">
                    Red de contactos con otros operadores turísticos
                  </p>
                </div>
              </div>

              <div className="mt-10">
                <Link
                  to="/empresas"
                  className="inline-flex items-center gap-2 text-forest font-outfit font-bold text-sm hover:gap-3 transition-all"
                >
                  Ver empresas asociadas
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl shadow-card p-8"
              data-testid="contacto-form"
            >
              <h3 className="font-outfit font-bold text-xl text-stone-900 mb-6">
                Envíanos un mensaje
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-1.5">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    data-testid="contacto-nombre"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    data-testid="contacto-email"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest transition-colors"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-1.5">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) =>
                      setForm({ ...form, empresa: e.target.value })
                    }
                    data-testid="contacto-empresa"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest transition-colors"
                    placeholder="Nombre de tu empresa"
                  />
                </div>
                <div>
                  <label className="block font-inter font-medium text-sm text-stone-700 mb-1.5">
                    Mensaje *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.mensaje}
                    onChange={(e) =>
                      setForm({ ...form, mensaje: e.target.value })
                    }
                    data-testid="contacto-mensaje"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:border-forest resize-none transition-colors"
                    placeholder="Cuéntanos sobre tu empresa y servicios..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={formSending}
                  data-testid="contacto-submit"
                  className="w-full bg-forest text-white py-3.5 rounded-full font-outfit font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-forest-dark transition-colors shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {formSending ? "Enviando..." : "Enviar mensaje"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Nosotros;
