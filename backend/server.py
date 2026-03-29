from fastapi import FastAPI, APIRouter, Depends
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
from datetime import datetime, timezone
import os
import logging

from database import db, client
from auth import require_admin

# Route modules
from routes.auth_routes import router as auth_router
from routes.empresas import router as empresas_router
from routes.articulos import router as articulos_router
from routes.categorias import router as categorias_router
from routes.actividades import router as actividades_router
from routes.media_settings import router as media_settings_router
from routes.leads import router as leads_router
from routes.usuarios import router as usuarios_router
from routes.seo import router as seo_router

from seed import run_seed

ROOT_DIR = Path(__file__).parent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(empresas_router)
api_router.include_router(articulos_router)
api_router.include_router(categorias_router)
api_router.include_router(actividades_router)
api_router.include_router(media_settings_router)
api_router.include_router(leads_router)
api_router.include_router(usuarios_router)
api_router.include_router(seo_router)


@api_router.get("/")
async def root():
    return {"message": "Clúster de Turismo de Naturaleza y Aventura Jalisco API"}


@api_router.post("/seed")
async def seed_data():
    await run_seed()
    return {"message": "Datos sembrados exitosamente", "admin_credentials": {"username": "admin", "password": "admin123"}}


# Analytics endpoints for dashboard
@api_router.get("/analytics/overview")
async def get_analytics_overview():
    from auth import get_current_user
    empresas_count = await db.empresas.count_documents({"activa": True})
    articulos_count = await db.articulos.count_documents({})
    actividades_count = await db.actividades.count_documents({"activa": True})
    leads_count = await db.contactos.count_documents({})
    leads_no_leidos = await db.contactos.count_documents({"leido": False})

    # WhatsApp clicks
    wa_doc = await db.analytics.find_one({"id": "whatsapp_clicks"}, {"_id": 0})
    whatsapp_clicks = wa_doc.get("count", 0) if wa_doc else 0

    pipeline = [
        {"$match": {"activa": True}},
        {"$group": {"_id": "$categoria", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    empresas_por_categoria = await db.empresas.aggregate(pipeline).to_list(20)

    top_empresas = await db.empresas.find(
        {"activa": True, "views": {"$gt": 0}},
        {"_id": 0, "nombre": 1, "slug": 1, "views": 1, "categoria": 1, "logo_url": 1},
    ).sort("views", -1).limit(10).to_list(10)

    pipeline_mensual = [
        {"$addFields": {
            "fecha_parsed": {
                "$cond": {
                    "if": {"$eq": [{"$type": "$created_at"}, "string"]},
                    "then": {"$dateFromString": {"dateString": "$created_at", "onError": None}},
                    "else": "$created_at",
                }
            }
        }},
        {"$match": {"fecha_parsed": {"$ne": None}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": "$fecha_parsed"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 12},
    ]
    leads_por_mes = await db.contactos.aggregate(pipeline_mensual).to_list(12)

    pipeline_vistas = [
        {"$match": {"activa": True}},
        {"$group": {"_id": "$categoria", "total_views": {"$sum": {"$ifNull": ["$views", 0]}}}},
        {"$sort": {"total_views": -1}},
    ]
    vistas_por_categoria = await db.empresas.aggregate(pipeline_vistas).to_list(20)

    return {
        "totales": {
            "empresas": empresas_count,
            "articulos": articulos_count,
            "actividades": actividades_count,
            "leads": leads_count,
            "leads_no_leidos": leads_no_leidos,
            "whatsapp_clicks": whatsapp_clicks,
        },
        "empresas_por_categoria": [{"categoria": e["_id"], "count": e["count"]} for e in empresas_por_categoria],
        "top_empresas": top_empresas,
        "leads_por_mes": [{"mes": l["_id"], "count": l["count"]} for l in leads_por_mes],
        "vistas_por_categoria": [{"categoria": v["_id"], "total_views": v["total_views"]} for v in vistas_por_categoria],
    }


@api_router.get("/mapa/pines")
async def get_mapa_pines(actividad: str = None):
    """Get all activity pins across all empresas for the general map."""
    query = {"activa": True}
    empresas = await db.empresas.find(query, {
        "_id": 0, "id": 1, "nombre": 1, "slug": 1, "categoria": 1,
        "logo_url": 1, "hero_url": 1, "telefono": 1, "descripcion": 1,
        "latitud": 1, "longitud": 1, "actividades": 1,
        "ubicaciones_actividades": 1,
    }).to_list(1000)

    # Resolve activity names
    all_actividades = await db.actividades.find({}, {"_id": 0, "id": 1, "nombre": 1, "color": 1}).to_list(200)
    act_map = {a["id"]: a for a in all_actividades}
    act_name_map = {a["nombre"]: a for a in all_actividades}

    pines = []
    for emp in empresas:
        ubicaciones = emp.get("ubicaciones_actividades") or []
        for ub in ubicaciones:
            act_id = ub.get("actividad_id", "")
            act_info = act_map.get(act_id) or act_name_map.get(ub.get("actividad_nombre", ""))
            act_nombre = ub.get("actividad_nombre") or (act_info["nombre"] if act_info else "")
            if actividad and act_id != actividad and act_nombre != actividad:
                continue
            if ub.get("latitud") and ub.get("longitud"):
                pines.append({
                    "empresa_id": emp.get("id"),
                    "empresa_nombre": emp.get("nombre"),
                    "empresa_slug": emp.get("slug"),
                    "empresa_logo": emp.get("logo_url") or emp.get("hero_url"),
                    "empresa_categoria": emp.get("categoria"),
                    "empresa_telefono": emp.get("telefono"),
                    "actividad_id": act_id,
                    "actividad_nombre": act_nombre,
                    "actividad_color": act_info.get("color", "#1a4d2e") if act_info else "#1a4d2e",
                    "latitud": ub["latitud"],
                    "longitud": ub["longitud"],
                    "nota": ub.get("nota", ""),
                })
        # Also include HQ pin if empresa has lat/lng and no ubicaciones yet
        if emp.get("latitud") and emp.get("longitud") and not ubicaciones:
            if not actividad or (actividad and actividad in (emp.get("actividades") or [])):
                pines.append({
                    "empresa_id": emp.get("id"),
                    "empresa_nombre": emp.get("nombre"),
                    "empresa_slug": emp.get("slug"),
                    "empresa_logo": emp.get("logo_url") or emp.get("hero_url"),
                    "empresa_categoria": emp.get("categoria"),
                    "empresa_telefono": emp.get("telefono"),
                    "actividad_id": "",
                    "actividad_nombre": "Sede",
                    "actividad_color": "#1a4d2e",
                    "latitud": emp["latitud"],
                    "longitud": emp["longitud"],
                    "nota": "Sede principal",
                })
    return pines


@api_router.post("/analytics/whatsapp-click")
async def track_whatsapp_click():
    """Track a WhatsApp button click - silent, fire-and-forget."""
    await db.analytics.update_one(
        {"id": "whatsapp_clicks"},
        {"$inc": {"count": 1}, "$set": {"last_click": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"status": "ok"}


@api_router.get("/leads/export-csv")
async def export_leads_csv(user=Depends(require_admin)):
    """Export all leads as UTF-8 CSV with BOM for Excel compatibility."""
    from fastapi.responses import StreamingResponse
    import csv
    import io

    leads = await db.contactos.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)

    output = io.StringIO()
    output.write('\ufeff')  # UTF-8 BOM for Excel
    writer = csv.writer(output)
    writer.writerow(["Nombre", "Email", "Empresa", "Mensaje", "Leído", "Fecha"])
    for lead in leads:
        writer.writerow([
            lead.get("nombre", ""),
            lead.get("email", ""),
            lead.get("empresa", ""),
            lead.get("mensaje", ""),
            "Sí" if lead.get("leido") else "No",
            lead.get("created_at", ""),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=leads_cluster_turismo.csv"},
    )


# Include main router
app.include_router(api_router)

# Mount uploads
app.mount("/api/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

# CORS - Production domains
default_origins = "https://clusterturismojalisco.com.mx,https://www.clusterturismojalisco.com.mx"
cors_origins = os.environ.get("CORS_ORIGINS", default_origins).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in cors_origins] + ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Running auto-seed on startup...")
    try:
        await run_seed()
        logger.info("Auto-seed completed successfully")
    except Exception as e:
        logger.error(f"Auto-seed failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
