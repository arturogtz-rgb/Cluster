import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Eye, MapPin, Users, Shield, Award, ChevronRight, Check, Star,
} from "lucide-react";
import { PageSEO } from "../components/SEO";
import FloatingNav from "../components/FloatingNav";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BENEFITS = [
  { icon: Eye, title: "Visibilidad ante turistas", desc: "Tu empresa aparece en nuestro directorio y mapa interactivo, visible para miles de visitantes que buscan aventura en Jalisco." },
  { icon: Shield, title: "Respaldo del Clúster", desc: "Pertenecer a un clúster certificado refuerza la confianza de los turistas en tu servicio." },
  { icon: Users, title: "Leads calificados", desc: "Recibe contactos directos de turistas interesados en tus experiencias a través de nuestro sistema de leads." },
  { icon: Award, title: "Red profesional", desc: "Conecta con otros prestadores de servicios turísticos, comparte buenas prácticas y crece en comunidad." },
];

export default function Afiliate() {
  const [planes, setPlanes] = useState([]);
  const [requisitos, setRequisitos] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/planes`),
      axios.get(`${API}/requisitos`),
    ]).then(([p, r]) => {
      setPlanes(p.data || []);
      setRequisitos(r.data || []);
    }).catch(() => {});
  }, []);

  return (
    <>
      <PageSEO title="Afíliate al Clúster" description="Registra tu empresa de turismo de naturaleza y aventura en Jalisco." />
      <FloatingNav />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-forest overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest via-forest-dark to-[#0f3320] opacity-95" />
        <div className="relative z-10 text-center px-6 py-24 max-w-3xl mx-auto">
          <span className="inline-block bg-white/10 text-white/90 px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-widest mb-6 backdrop-blur-sm">
            Prestadores de Servicios Turísticos
          </span>
          <h1 className="font-outfit font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Haz crecer tu empresa con el Clúster
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-inter">
            Únete al directorio más completo de turismo de naturaleza y aventura en Jalisco. Aumenta tu visibilidad, recibe leads calificados y forma parte de una red profesional.
          </p>
          <Link to="/registro" data-testid="afiliate-hero-cta"
            className="inline-flex items-center gap-2 bg-white text-forest px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-limestone transition-all hover:scale-105 shadow-xl">
            Regístrate y crea tu perfil <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-outfit font-bold text-2xl md:text-3xl text-stone-900 text-center mb-4">
            Beneficios de afiliarte
          </h2>
          <p className="text-stone-500 text-center max-w-xl mx-auto mb-12">
            Al unirte al Clúster de Turismo de Naturaleza y Aventura Jalisco, tu empresa accede a:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex gap-5 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-forest" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-stone-900 mb-1">{b.title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements summary */}
      <section className="py-16 bg-stone-50 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-outfit font-bold text-2xl text-stone-900 text-center mb-4">
            Requisitos para afiliarte
          </h2>
          <p className="text-stone-500 text-center mb-8 text-sm">
            Estos son los requisitos que se solicitan durante el proceso de registro. Solo el RFC es obligatorio para iniciar.
          </p>
          <div className="space-y-3">
            {requisitos.map((req) => (
              <div key={req.id} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${req.bloqueante ? "bg-amber-100" : "bg-stone-100"}`}>
                  {req.bloqueante ? <Star className="w-3.5 h-3.5 text-amber-600" /> : <Check className="w-3.5 h-3.5 text-stone-400" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-stone-800">{req.nombre}</span>
                  {req.bloqueante && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Obligatorio</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-outfit font-bold text-2xl md:text-3xl text-stone-900 text-center mb-4">
            Planes de afiliación
          </h2>
          <p className="text-stone-500 text-center max-w-xl mx-auto mb-12">
            Elige el plan que mejor se adapte a tu empresa. Todos incluyen presencia en el directorio y mapa interactivo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planes.map((plan, i) => (
              <div key={plan.id} className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all ${i === 1 ? "ring-2 ring-forest md:scale-105" : ""}`} data-testid={`afiliate-plan-${plan.id}`}>
                {i === 1 && <span className="inline-block bg-forest text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-3">Popular</span>}
                <h3 className="font-outfit font-bold text-xl text-stone-900">{plan.nombre}</h3>
                <p className="text-sm text-stone-500 mt-1 mb-4">{plan.duracion_meses} {plan.duracion_meses === 1 ? "mes" : "meses"}</p>
                {plan.beneficios?.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {plan.beneficios.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-stone-600">
                        <Check className="w-4 h-4 text-forest mt-0.5 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="py-16 bg-stone-50 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-outfit font-bold text-2xl text-stone-900 mb-4">Lo que dicen nuestros afiliados</h2>
          <p className="text-stone-400 text-sm italic">Próximamente: testimonios de empresas afiliadas al Clúster.</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-forest px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-outfit font-bold text-3xl text-white mb-4">
            Lleva tu empresa al siguiente nivel
          </h2>
          <p className="text-white/70 mb-8">
            Registra tu empresa hoy y comienza a recibir turistas que buscan aventura en Jalisco.
          </p>
          <Link to="/registro" data-testid="afiliate-bottom-cta"
            className="inline-flex items-center gap-2 bg-white text-forest px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-limestone transition-all hover:scale-105 shadow-xl">
            Regístrate ahora <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
