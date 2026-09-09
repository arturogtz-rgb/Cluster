from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from database import db
from auth import require_admin
from models import (
    Plan, PlanCreate, PlanUpdate,
    CodigoDescuento,
)

router = APIRouter()


# ==================== Plans ====================

@router.get("/planes")
async def get_planes(solo_activos: bool = True):
    """Public endpoint - returns active plans."""
    query = {"activo": True} if solo_activos else {}
    planes = await db.planes.find(query, {"_id": 0}).sort("orden", 1).to_list(20)
    return planes


@router.get("/admin/planes")
async def admin_get_planes(user=Depends(require_admin)):
    planes = await db.planes.find({}, {"_id": 0}).sort("orden", 1).to_list(20)
    return planes


@router.post("/admin/planes")
async def admin_create_plan(data: PlanCreate, user=Depends(require_admin)):
    plan = Plan(**data.model_dump())
    doc = plan.model_dump()
    await db.planes.insert_one(doc)
    return await db.planes.find_one({"id": plan.id}, {"_id": 0})


@router.put("/admin/planes/{plan_id}")
async def admin_update_plan(plan_id: str, data: PlanUpdate, user=Depends(require_admin)):
    existing = await db.planes.find_one({"id": plan_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    for bool_key in ["activo"]:
        val = getattr(data, bool_key)
        if val is not None:
            update_data[bool_key] = val
    if update_data:
        await db.planes.update_one({"id": plan_id}, {"$set": update_data})
    return await db.planes.find_one({"id": plan_id}, {"_id": 0})


@router.delete("/admin/planes/{plan_id}")
async def admin_delete_plan(plan_id: str, user=Depends(require_admin)):
    result = await db.planes.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    return {"message": "Plan eliminado"}


# ==================== Discount Codes ====================

@router.get("/admin/codigos-descuento")
async def admin_get_codigos(user=Depends(require_admin)):
    codigos = await db.codigos_descuento.find({}, {"_id": 0}).to_list(200)
    return codigos


@router.post("/admin/codigos-descuento")
async def admin_create_codigo(data: dict, user=Depends(require_admin)):
    codigo_str = data.get("codigo", "").strip().upper()
    if not codigo_str:
        raise HTTPException(status_code=400, detail="El código es obligatorio")
    existing = await db.codigos_descuento.find_one({"codigo": codigo_str})
    if existing:
        raise HTTPException(status_code=400, detail="Este código ya existe")

    codigo = CodigoDescuento(
        codigo=codigo_str,
        tipo_descuento=data.get("tipo_descuento", "porcentaje"),
        valor=float(data.get("valor", 0)),
        usos_maximos=int(data.get("usos_maximos", 0)),
        fecha_expiracion=data.get("fecha_expiracion"),
        activo=data.get("activo", True),
    )
    doc = codigo.model_dump()
    await db.codigos_descuento.insert_one(doc)
    return await db.codigos_descuento.find_one({"id": codigo.id}, {"_id": 0})


@router.put("/admin/codigos-descuento/{codigo_id}")
async def admin_update_codigo(codigo_id: str, data: dict, user=Depends(require_admin)):
    existing = await db.codigos_descuento.find_one({"id": codigo_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Código no encontrado")
    allowed = {"codigo", "tipo_descuento", "valor", "usos_maximos", "fecha_expiracion", "activo"}
    update_data = {k: v for k, v in data.items() if k in allowed}
    if "codigo" in update_data:
        update_data["codigo"] = update_data["codigo"].strip().upper()
    if update_data:
        await db.codigos_descuento.update_one({"id": codigo_id}, {"$set": update_data})
    return await db.codigos_descuento.find_one({"id": codigo_id}, {"_id": 0})


@router.delete("/admin/codigos-descuento/{codigo_id}")
async def admin_delete_codigo(codigo_id: str, user=Depends(require_admin)):
    result = await db.codigos_descuento.delete_one({"id": codigo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Código no encontrado")
    return {"message": "Código eliminado"}


# ==================== Validate Discount Code (for PST) ====================

@router.post("/codigos-descuento/validar")
async def validar_codigo(data: dict):
    """Public endpoint to validate a discount code."""
    codigo_str = data.get("codigo", "").strip().upper()
    if not codigo_str:
        raise HTTPException(status_code=400, detail="Código vacío")

    codigo = await db.codigos_descuento.find_one({"codigo": codigo_str, "activo": True}, {"_id": 0})
    if not codigo:
        raise HTTPException(status_code=404, detail="Código inválido o inactivo")

    if codigo.get("usos_maximos", 0) > 0 and codigo.get("usos_actuales", 0) >= codigo["usos_maximos"]:
        raise HTTPException(status_code=400, detail="Este código ya alcanzó su límite de usos")

    if codigo.get("fecha_expiracion"):
        try:
            exp = datetime.fromisoformat(codigo["fecha_expiracion"])
            if exp < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Este código ha expirado")
        except (ValueError, TypeError):
            pass

    return {
        "valido": True,
        "tipo_descuento": codigo.get("tipo_descuento", "porcentaje"),
        "valor": codigo.get("valor", 0),
        "codigo": codigo.get("codigo"),
    }


# ==================== Admin: Manage Affiliated Companies ====================

@router.get("/admin/empresas-afiliadas")
async def admin_get_empresas_afiliadas(estado: str = None, user=Depends(require_admin)):
    """Get all companies with affiliation status."""
    query = {"cuenta_id": {"$ne": None}}
    if estado:
        query["estado"] = estado
    empresas = await db.empresas.find(query, {"_id": 0}).sort("updated_at", -1).to_list(500)
    for emp in empresas:
        if isinstance(emp.get("created_at"), str):
            emp["created_at"] = datetime.fromisoformat(emp["created_at"])
        if isinstance(emp.get("updated_at"), str):
            emp["updated_at"] = datetime.fromisoformat(emp["updated_at"])
        # Fetch account info
        if emp.get("cuenta_id"):
            cuenta = await db.empresa_cuentas.find_one({"id": emp["cuenta_id"]}, {"_id": 0, "password_hash": 0})
            emp["cuenta_info"] = cuenta
    return empresas


@router.put("/admin/empresas-afiliadas/{empresa_id}/estado")
async def admin_update_empresa_estado(empresa_id: str, data: dict, user=Depends(require_admin)):
    """Admin changes company state (approve, reject, pause, etc.)."""
    empresa = await db.empresas.find_one({"id": empresa_id}, {"_id": 0})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    nuevo_estado = data.get("estado")
    valid_states = {"borrador", "pendiente_pago", "pendiente_aprobacion", "aprobado", "rechazado"}
    if nuevo_estado not in valid_states:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {', '.join(valid_states)}")

    update = {
        "estado": nuevo_estado,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if nuevo_estado == "aprobado":
        update["activa"] = True
    elif nuevo_estado == "rechazado":
        update["motivo_rechazo"] = data.get("motivo", "")
        update["activa"] = False

    await db.empresas.update_one({"id": empresa_id}, {"$set": update})
    return {"status": "ok", "estado": nuevo_estado}


@router.post("/admin/suscripciones/{suscripcion_id}/confirmar-transferencia")
async def admin_confirm_transfer(suscripcion_id: str, user=Depends(require_admin)):
    """Admin confirms bank transfer received."""
    sub = await db.suscripciones.find_one({"id": suscripcion_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    if sub.get("estado") != "pendiente_transferencia":
        raise HTTPException(status_code=400, detail="Esta suscripción no está pendiente de transferencia")

    await db.suscripciones.update_one(
        {"id": suscripcion_id},
        {"$set": {"estado": "activa", "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    await db.empresas.update_one(
        {"id": sub["empresa_id"]},
        {"$set": {"estado": "pendiente_aprobacion", "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"status": "ok", "message": "Transferencia confirmada"}


@router.get("/admin/suscripciones")
async def admin_get_suscripciones(user=Depends(require_admin)):
    """Get all subscriptions."""
    subs = await db.suscripciones.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return subs
