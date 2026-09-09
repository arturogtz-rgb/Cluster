import stripe
import os
import logging
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional

from database import db
from auth import require_pst

logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
if not stripe.api_key:
    logger.warning("STRIPE_SECRET_KEY not set — Stripe payments will not work")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

router = APIRouter()

PLAN_LOOKUP_KEYS = {
    1: "plan_mensual",
    6: "plan_semestral",
    12: "plan_anual",
}


class PaymentRequest(BaseModel):
    plan_id: str
    metodo_pago: str = "stripe"  # stripe | transferencia
    codigo_descuento: Optional[str] = None
    origin_url: str


@router.post("/pst/checkout")
async def create_checkout(req: PaymentRequest, user=Depends(require_pst)):
    """Create a Stripe checkout session or handle free/transfer payments."""
    cuenta = await db.empresa_cuentas.find_one({"id": user["user_id"]}, {"_id": 0})
    if not cuenta or not cuenta.get("empresa_id"):
        raise HTTPException(status_code=400, detail="Completa tu perfil primero")

    empresa = await db.empresas.find_one({"id": cuenta["empresa_id"]}, {"_id": 0})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if empresa.get("estado") not in ("pendiente_pago",):
        raise HTTPException(status_code=400, detail=f"Tu empresa no está en estado de pago (estado actual: {empresa.get('estado')})")

    plan = await db.planes.find_one({"id": req.plan_id, "activo": True}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    precio_final = plan.get("precio", 0)

    # Apply discount code
    codigo_doc = None
    if req.codigo_descuento:
        codigo_str = req.codigo_descuento.strip().upper()
        codigo_doc = await db.codigos_descuento.find_one({"codigo": codigo_str, "activo": True}, {"_id": 0})
        if not codigo_doc:
            raise HTTPException(status_code=400, detail="Código de descuento inválido")
        if codigo_doc.get("usos_maximos", 0) > 0 and codigo_doc.get("usos_actuales", 0) >= codigo_doc["usos_maximos"]:
            raise HTTPException(status_code=400, detail="Código de descuento agotado")

        if codigo_doc.get("tipo_descuento") == "porcentaje":
            precio_final = precio_final * (1 - codigo_doc["valor"] / 100)
        else:
            precio_final = max(0, precio_final - codigo_doc["valor"])

    precio_final = round(precio_final, 2)
    now = datetime.now(timezone.utc)
    fecha_fin = now + relativedelta(months=plan.get("duracion_meses", 1))

    # If price is 0 (free plan or 100% discount), skip payment
    if precio_final <= 0:
        suscripcion_doc = {
            "id": str(__import__("uuid").uuid4()),
            "empresa_id": cuenta["empresa_id"],
            "cuenta_id": user["user_id"],
            "plan_id": plan["id"],
            "plan_nombre": plan["nombre"],
            "estado": "activa",
            "metodo_pago": "gratuito",
            "fecha_inicio": now.isoformat(),
            "fecha_fin": fecha_fin.isoformat(),
            "codigo_descuento_id": codigo_doc["id"] if codigo_doc else None,
            "monto_pagado": 0,
            "created_at": now.isoformat(),
        }
        await db.suscripciones.insert_one(suscripcion_doc)

        if codigo_doc:
            await db.codigos_descuento.update_one({"id": codigo_doc["id"]}, {"$inc": {"usos_actuales": 1}})

        await db.empresas.update_one(
            {"id": cuenta["empresa_id"]},
            {"$set": {"estado": "pendiente_aprobacion", "updated_at": now.isoformat()}},
        )

        return {"status": "free", "message": "Plan activado sin costo. Tu perfil está en revisión."}

    # Bank transfer
    if req.metodo_pago == "transferencia":
        suscripcion_doc = {
            "id": str(__import__("uuid").uuid4()),
            "empresa_id": cuenta["empresa_id"],
            "cuenta_id": user["user_id"],
            "plan_id": plan["id"],
            "plan_nombre": plan["nombre"],
            "estado": "pendiente_transferencia",
            "metodo_pago": "transferencia",
            "fecha_inicio": now.isoformat(),
            "fecha_fin": fecha_fin.isoformat(),
            "codigo_descuento_id": codigo_doc["id"] if codigo_doc else None,
            "monto_pagado": precio_final,
            "created_at": now.isoformat(),
        }
        await db.suscripciones.insert_one(suscripcion_doc)

        if codigo_doc:
            await db.codigos_descuento.update_one({"id": codigo_doc["id"]}, {"$inc": {"usos_actuales": 1}})

        # Get bank details from settings
        settings = await db.settings.find_one({"id": "site_settings"}, {"_id": 0}) or {}

        return {
            "status": "transfer",
            "suscripcion_id": suscripcion_doc["id"],
            "monto": precio_final,
            "banco": {
                "nombre": settings.get("banco_nombre", ""),
                "clabe": settings.get("banco_clabe", ""),
                "titular": settings.get("banco_titular", ""),
                "referencia": settings.get("banco_referencia", ""),
            },
        }

    # Stripe checkout
    lookup_key = PLAN_LOOKUP_KEYS.get(plan.get("duracion_meses", 1))
    if not lookup_key:
        raise HTTPException(status_code=400, detail="Plan no tiene configuración de Stripe")

    prices = stripe.Price.list(lookup_keys=[lookup_key], active=True, limit=1).data
    if not prices:
        raise HTTPException(status_code=500, detail="Precio de Stripe no encontrado. Configura los precios en Stripe.")

    price = prices[0]

    # If price in Stripe is 0, handle as free
    if price.unit_amount == 0:
        suscripcion_doc = {
            "id": str(__import__("uuid").uuid4()),
            "empresa_id": cuenta["empresa_id"],
            "cuenta_id": user["user_id"],
            "plan_id": plan["id"],
            "plan_nombre": plan["nombre"],
            "estado": "activa",
            "metodo_pago": "gratuito",
            "fecha_inicio": now.isoformat(),
            "fecha_fin": fecha_fin.isoformat(),
            "monto_pagado": 0,
            "created_at": now.isoformat(),
        }
        await db.suscripciones.insert_one(suscripcion_doc)
        await db.empresas.update_one(
            {"id": cuenta["empresa_id"]},
            {"$set": {"estado": "pendiente_aprobacion", "updated_at": now.isoformat()}},
        )
        return {"status": "free", "message": "Plan activado sin costo. Tu perfil está en revisión."}

    try:
        session = stripe.checkout.Session.create(
            line_items=[{"price": price.id, "quantity": 1}],
            mode="subscription",
            success_url=f"{req.origin_url}/pst/pago/exito?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{req.origin_url}/pst/pago?cancelled=true",
            metadata={
                "empresa_id": cuenta["empresa_id"],
                "cuenta_id": user["user_id"],
                "plan_id": plan["id"],
            },
            automatic_tax={"enabled": True},
            billing_address_collection="required",
        )
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Error al crear sesión de pago")

    # Record transaction
    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "empresa_id": cuenta["empresa_id"],
        "cuenta_id": user["user_id"],
        "plan_id": plan["id"],
        "lookup_key": lookup_key,
        "amount": price.unit_amount,
        "currency": price.currency,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": now,
        "updated_at": now,
    })

    return {"status": "stripe", "checkout_url": session.url, "session_id": session.id}


@router.get("/pst/payment-status/{session_id}")
async def get_payment_status(session_id: str, user=Depends(require_pst)):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    if record.get("cuenta_id") != user.get("user_id"):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta transacción")

    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "stripe_subscription_id": s.subscription,
                        "updated_at": datetime.now(timezone.utc),
                    }},
                )
                # Activate subscription and advance empresa state
                await _activate_subscription_from_stripe(record, s)
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass

    return {
        "session_id": str(record.get("session_id", "")),
        "status": record.get("status", "unknown"),
        "payment_status": record.get("payment_status", "unknown"),
    }


async def _activate_subscription_from_stripe(record, session):
    """Create subscription record and advance empresa to pendiente_aprobacion."""
    empresa_id = record.get("empresa_id")
    if not empresa_id:
        return

    existing_sub = await db.suscripciones.find_one({"empresa_id": empresa_id, "metodo_pago": "stripe", "stripe_subscription_id": session.subscription})
    if existing_sub:
        return

    plan = await db.planes.find_one({"id": record.get("plan_id")}, {"_id": 0})
    now = datetime.now(timezone.utc)
    duracion = plan.get("duracion_meses", 1) if plan else 1
    fecha_fin = now + relativedelta(months=duracion)

    await db.suscripciones.insert_one({
        "id": str(__import__("uuid").uuid4()),
        "empresa_id": empresa_id,
        "cuenta_id": record.get("cuenta_id"),
        "plan_id": record.get("plan_id"),
        "plan_nombre": plan.get("nombre", "") if plan else "",
        "estado": "activa",
        "metodo_pago": "stripe",
        "stripe_subscription_id": session.subscription,
        "stripe_customer_id": session.customer,
        "fecha_inicio": now.isoformat(),
        "fecha_fin": fecha_fin.isoformat(),
        "monto_pagado": (record.get("amount", 0) or 0) / 100,
        "created_at": now.isoformat(),
    })

    await db.empresas.update_one(
        {"id": empresa_id},
        {"$set": {"estado": "pendiente_aprobacion", "updated_at": now.isoformat()}},
    )


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    obj = event["data"]["object"]
    event_type = event["type"]

    if event_type == "checkout.session.completed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {
                "status": "completed",
                "payment_status": obj.get("payment_status", "paid"),
                "stripe_subscription_id": obj.get("subscription"),
                "stripe_payment_intent_id": obj.get("payment_intent"),
                "updated_at": datetime.now(timezone.utc),
            }},
        )
        record = await db.payment_transactions.find_one({"session_id": obj["id"]})
        if record:
            await _activate_subscription_from_stripe(record, type("S", (), {"subscription": obj.get("subscription"), "customer": obj.get("customer")})())

    elif event_type in ("checkout.session.async_payment_failed", "checkout.session.expired"):
        status = "failed" if "failed" in event_type else "expired"
        await db.payment_transactions.update_one(
            {"session_id": obj["id"]},
            {"$set": {"status": status, "payment_status": status, "updated_at": datetime.now(timezone.utc)}},
        )

    return {"status": "ok"}
