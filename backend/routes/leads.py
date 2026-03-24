from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid
import logging

from database import db
from auth import require_admin
from utils import send_contact_email

router = APIRouter()


@router.post("/contacto")
async def submit_contacto(data: dict):
    doc = {
        "id": str(uuid.uuid4()),
        "nombre": data.get("nombre", ""),
        "email": data.get("email", ""),
        "empresa": data.get("empresa", ""),
        "mensaje": data.get("mensaje", ""),
        "leido": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contactos.insert_one(doc)
    try:
        await send_contact_email(doc)
    except Exception as e:
        logging.error(f"Email notification error: {e}")
    return {"status": "ok", "message": "Mensaje enviado correctamente"}


@router.get("/leads")
async def get_leads(user=Depends(require_admin)):
    leads = await db.contactos.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return leads


@router.put("/leads/{lead_id}/read")
async def mark_lead_read(lead_id: str, user=Depends(require_admin)):
    await db.contactos.update_one({"id": lead_id}, {"$set": {"leido": True}})
    return {"status": "ok"}


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user=Depends(require_admin)):
    await db.contactos.delete_one({"id": lead_id})
    return {"status": "ok"}
