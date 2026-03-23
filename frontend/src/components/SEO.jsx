import { Helmet } from "react-helmet-async";

const SITE_NAME = "Clúster de Turismo de Naturaleza y Aventura Jalisco";
const DEFAULT_IMAGE = "https://customer-assets.emergentagent.com/job_tourism-cluster-mx/artifacts/jvvolfwz_Gemini_Generated_Image_plcp43plcp43plcp.png";
const SITE_URL = process.env.REACT_APP_BACKEND_URL || "";

const SCHEMA_TYPE_MAP = {
  "Operadora de aventura": "TravelAgency",
  "Parque de aventura": "AmusementPark",
  "Parque": "Park",
  "Hotel": "LodgingBusiness",
  "Hospedaje": "LodgingBusiness",
  "Restaurante": "FoodEstablishment",
  "Capacitación": "EducationalOrganization",
};

export const PageSEO = ({ title, description, image, url, type = "website" }) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image || DEFAULT_IMAGE;
  const desc = description || "";

  return (
    <Helmet
      title={fullTitle}
      meta={[
        { name: "description", content: desc },
        { property: "og:title", content: fullTitle },
        { property: "og:description", content: desc },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: fullUrl },
        { property: "og:type", content: type },
        { property: "og:site_name", content: SITE_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: fullTitle },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: ogImage },
      ]}
      link={[{ rel: "canonical", href: fullUrl }]}
    />
  );
};

export const EmpresaSEO = ({ empresa }) => {
  if (!empresa) return null;

  const schemaType = SCHEMA_TYPE_MAP[empresa.categoria] || "LocalBusiness";
  const fullUrl = `${SITE_URL}/empresas/${empresa.slug}`;
  const image = empresa.hero_url || empresa.logo_url || DEFAULT_IMAGE;
  const fullTitle = `${empresa.nombre} | ${SITE_NAME}`;
  const desc = (empresa.descripcion || "").substring(0, 160);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: empresa.nombre,
    description: empresa.descripcion,
    image: image,
    url: fullUrl,
  };
  if (empresa.telefono) jsonLd.telephone = empresa.telefono;
  if (empresa.email) jsonLd.email = empresa.email;
  if (empresa.direccion) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: empresa.direccion,
      addressRegion: "Jalisco",
      addressCountry: "MX",
    };
  }
  if (empresa.latitud && empresa.longitud) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: empresa.latitud,
      longitude: empresa.longitud,
    };
  }
  if (empresa.social_links) {
    const links = Object.values(empresa.social_links).filter(Boolean);
    if (links.length > 0) jsonLd.sameAs = links;
  }

  return (
    <Helmet
      title={fullTitle}
      meta={[
        { name: "description", content: desc },
        { property: "og:title", content: `${empresa.nombre} - ${empresa.categoria}` },
        { property: "og:description", content: desc },
        { property: "og:image", content: image },
        { property: "og:url", content: fullUrl },
        { property: "og:type", content: "business.business" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: empresa.nombre },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ]}
      link={[{ rel: "canonical", href: fullUrl }]}
      script={[{ type: "application/ld+json", innerHTML: JSON.stringify(jsonLd) }]}
    />
  );
};

export const ArticuloSEO = ({ articulo }) => {
  if (!articulo) return null;

  const fullUrl = `${SITE_URL}/prensa/${articulo.slug}`;
  const image = articulo.hero_url || DEFAULT_IMAGE;
  const fullTitle = `${articulo.titulo} | Prensa | ${SITE_NAME}`;
  const desc = (articulo.resumen || "").substring(0, 160);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articulo.titulo,
    description: articulo.resumen,
    image: image,
    url: fullUrl,
    datePublished: articulo.created_at,
    dateModified: articulo.updated_at || articulo.created_at,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: DEFAULT_IMAGE },
    },
  };

  return (
    <Helmet
      title={fullTitle}
      meta={[
        { name: "description", content: desc },
        { property: "og:title", content: articulo.titulo },
        { property: "og:description", content: desc },
        { property: "og:image", content: image },
        { property: "og:url", content: fullUrl },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: articulo.titulo },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ]}
      link={[{ rel: "canonical", href: fullUrl }]}
      script={[{ type: "application/ld+json", innerHTML: JSON.stringify(jsonLd) }]}
    />
  );
};

export const OrganizationSEO = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    description: "Impulsar el desarrollo sustentable y la profesionalización del turismo de naturaleza en Jalisco.",
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    address: {
      "@type": "PostalAddress",
      addressRegion: "Jalisco",
      addressCountry: "MX",
    },
  };

  return (
    <Helmet
      script={[{ type: "application/ld+json", innerHTML: JSON.stringify(jsonLd) }]}
    />
  );
};
