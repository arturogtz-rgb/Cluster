from fastapi import APIRouter
from fastapi.responses import Response
from datetime import datetime, timezone
import os

from database import db

router = APIRouter()


@router.get("/sitemap.xml")
async def generate_sitemap():
    base_url = os.environ.get("SITE_URL", "https://jalisco-nature-hub.preview.emergentagent.com")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    urls = [
        {"loc": "/", "changefreq": "weekly", "priority": "1.0", "lastmod": today},
        {"loc": "/empresas", "changefreq": "daily", "priority": "0.9", "lastmod": today},
        {"loc": "/mapa", "changefreq": "weekly", "priority": "0.8", "lastmod": today},
        {"loc": "/prensa", "changefreq": "daily", "priority": "0.7", "lastmod": today},
        {"loc": "/nosotros", "changefreq": "monthly", "priority": "0.7", "lastmod": today},
    ]

    empresas = await db.empresas.find({"activa": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    for e in empresas:
        lastmod = e.get("updated_at", today)
        if isinstance(lastmod, datetime):
            lastmod = lastmod.strftime("%Y-%m-%d")
        elif isinstance(lastmod, str) and "T" in lastmod:
            lastmod = lastmod[:10]
        else:
            lastmod = today
        urls.append({"loc": f"/empresas/{e['slug']}", "changefreq": "weekly", "priority": "0.8", "lastmod": lastmod})

    articulos = await db.articulos.find({"publicado": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    for a in articulos:
        lastmod = a.get("updated_at", today)
        if isinstance(lastmod, datetime):
            lastmod = lastmod.strftime("%Y-%m-%d")
        elif isinstance(lastmod, str) and "T" in lastmod:
            lastmod = lastmod[:10]
        else:
            lastmod = today
        urls.append({"loc": f"/prensa/{a['slug']}", "changefreq": "weekly", "priority": "0.6", "lastmod": lastmod})

    xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for url in urls:
        xml_parts.append("  <url>")
        xml_parts.append(f"    <loc>{base_url}{url['loc']}</loc>")
        xml_parts.append(f"    <lastmod>{url['lastmod']}</lastmod>")
        xml_parts.append(f"    <changefreq>{url['changefreq']}</changefreq>")
        xml_parts.append(f"    <priority>{url['priority']}</priority>")
        xml_parts.append("  </url>")
    xml_parts.append("</urlset>")

    return Response(content="\n".join(xml_parts), media_type="application/xml")
