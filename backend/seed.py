from slugify import slugify

from database import db
from auth import hash_password
from models import Usuario, Empresa, SocialLinks, Actividad, Articulo


async def run_seed():
    admin = await db.usuarios.find_one({"username": "admin"})
    if not admin:
        admin_user = Usuario(
            username="admin",
            password_hash=hash_password("admin123"),
            nombre="Administrador",
            email="",
            role="admin",
        )
        doc = admin_user.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.usuarios.insert_one(doc)
    else:
        if "role" not in admin:
            await db.usuarios.update_one({"username": "admin"}, {"$set": {"role": "admin", "activo": True}})

    actividades_seed = [
        {"nombre": "Senderismo", "descripcion": "Caminatas por senderos naturales", "color": "#2d6a4f", "orden": 1},
        {"nombre": "Rappel", "descripcion": "Descenso por cuerdas en formaciones rocosas", "color": "#1a4d2e", "orden": 2},
        {"nombre": "Kayak", "descripcion": "Navegación en kayak por ríos y lagos", "color": "#0284c7", "orden": 3},
        {"nombre": "Ciclismo de Montaña", "descripcion": "Rutas en bicicleta por terrenos montañosos", "color": "#d97706", "orden": 4},
        {"nombre": "Tirolesa", "descripcion": "Deslizamiento por cables en las alturas", "color": "#059669", "orden": 5},
        {"nombre": "Campismo", "descripcion": "Acampada en entornos naturales", "color": "#4f46e5", "orden": 6},
        {"nombre": "Escalada", "descripcion": "Escalada en roca natural", "color": "#dc2626", "orden": 7},
        {"nombre": "Observación de Aves", "descripcion": "Avistamiento de aves silvestres", "color": "#7c3aed", "orden": 8},
        {"nombre": "Tours de Tequila", "descripcion": "Visitas a destilerías y campos de agave", "color": "#ca8a04", "orden": 9},
        {"nombre": "Cabalgata", "descripcion": "Paseos a caballo", "color": "#9a3412", "orden": 10},
    ]

    for act_data in actividades_seed:
        slug = slugify(act_data["nombre"], lowercase=True)
        existing = await db.actividades.find_one({"slug": slug})
        if not existing:
            actividad = Actividad(
                nombre=act_data["nombre"],
                slug=slug,
                descripcion=act_data["descripcion"],
                color=act_data["color"],
                orden=act_data["orden"],
                activa=True,
            )
            doc = actividad.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.actividades.insert_one(doc)

    ecomuk = await db.empresas.find_one({"slug": "ecomuk-aventura-natural"})
    if not ecomuk:
        ecomuk_data = Empresa(
            nombre="Ecomuk Aventura Natural",
            slug="ecomuk-aventura-natural",
            categoria="Capacitación",
            descripcion="En Ecomuk, llevamos a cabo nuestras actividades en una selección de destinos excepcionales, todos ellos ubicados en entornos naturales de gran valor escénico y biodiversidad. Estos lugares, cuidadosamente elegidos, no solo son seguros para que disfrutes con total confianza, sino que también te permiten conectar con la belleza y la riqueza de la naturaleza en su estado más puro. Guías certificados, equipos de última generación y protocolos rigurosos garantizan experiencias inolvidables en la naturaleza.",
            logo_url="https://ecomuk.com.mx/wp-content/uploads/2025/03/1.png",
            hero_url="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920",
            galeria=[
                "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
                "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800",
                "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
            ],
            telefono="+52 333 460 1257",
            whatsapp="523334601257",
            direccion="Zapopan, Jalisco, México",
            email="contacto@ecomuk.com.mx",
            social_links=SocialLinks(
                facebook="https://www.facebook.com/ecomukaventuranatural",
                instagram="https://www.instagram.com/ecomuk/",
                twitter="https://twitter.com/ecomuk",
                youtube="https://www.youtube.com/channel/UCU8I5eNl1Hfr24XQ5uIALYg",
                website="https://ecomuk.com.mx",
            ),
            actividades=["Navegación Terrestre", "Aventura en la Barranca", "Sierra de Quila", "Capacitación", "Senderismo", "Rappel"],
            destacada=True,
            activa=True,
            latitud=20.7214,
            longitud=-103.4189,
        )
        doc = ecomuk_data.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.empresas.insert_one(doc)

    aventurate = await db.empresas.find_one({"slug": "aventurate-por-jalisco"})
    if not aventurate:
        aventurate_data = Empresa(
            nombre="Aventúrate por Jalisco DMC",
            slug="aventurate-por-jalisco",
            categoria="Operadora de aventura",
            descripcion="Aventúrate por Jalisco DMC ofrece tours, paquetes y experiencias únicas en Jalisco, México. Desde el legendario tren José Cuervo Express hasta visitas a haciendas tequileras centenarias como Casa Herradura. Descubre los mejores tours de día desde Guadalajara: Tequila, pueblos mágicos y experiencias inolvidables. Servicios de transportación privada y grupal.",
            logo_url="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=400",
            hero_url="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1920",
            galeria=[
                "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800",
                "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
                "https://images.unsplash.com/photo-1596397249129-c7a2f89dc7d2?w=800",
            ],
            telefono="+52 332 253 7893",
            whatsapp="523322537893",
            direccion="Guadalajara, Jalisco, México",
            email="info@aventurateporjalisco.com",
            social_links=SocialLinks(website="https://aventurateporjalisco.com"),
            actividades=["José Cuervo Express", "Tours de Tequila", "Haciendas", "Transportación", "Paquetes turísticos", "Lago de Chapala"],
            destacada=True,
            activa=True,
            latitud=20.6597,
            longitud=-103.3496,
        )
        doc = aventurate_data.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.empresas.insert_one(doc)

    articulo = await db.articulos.find_one({"slug": "bienvenidos-al-cluster"})
    if not articulo:
        articulo_data = Articulo(
            titulo="Bienvenidos al Clúster de Turismo de Naturaleza y Aventura Jalisco",
            slug="bienvenidos-al-cluster",
            contenido="""<h2>Un nuevo capítulo para el turismo en Jalisco</h2>
<p>El Clúster de Turismo de Naturaleza y Aventura Jalisco nace con el objetivo de promover y fortalecer el sector turístico de aventura en nuestro estado.</p>
<p>Jalisco cuenta con una riqueza natural incomparable: desde las majestuosas barrancas de Zapopan hasta los campos de agave que son Patrimonio de la Humanidad, pasando por la Sierra de Quila y los hermosos lagos y ríos que adornan nuestra geografía.</p>
<h3>Nuestros objetivos</h3>
<ul>
<li>Promover el turismo sustentable y responsable</li>
<li>Capacitar a los operadores turísticos</li>
<li>Conectar a visitantes con experiencias auténticas</li>
<li>Preservar nuestros recursos naturales</li>
</ul>
<p>Te invitamos a explorar nuestro directorio de empresas y descubrir las increíbles experiencias que Jalisco tiene para ofrecer.</p>""",
            resumen="El Clúster de Turismo de Naturaleza y Aventura Jalisco nace para promover el turismo sustentable y conectar visitantes con experiencias auténticas.",
            hero_url="https://images.unsplash.com/photo-1732043846829-dc34d9e2e989?w=1920",
            galeria=[],
            publicado=True,
        )
        doc = articulo_data.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.articulos.insert_one(doc)
