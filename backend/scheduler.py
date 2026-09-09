import logging
from datetime import datetime, timezone, timedelta

from database import db
from notifications import send_expiration_reminder_email

logger = logging.getLogger(__name__)

REMINDER_DAYS = [15, 7]


async def check_expiration_reminders():
    """Run once per day. Finds active subscriptions expiring in exactly 15 or 7 days
    and sends a single reminder for each threshold, recorded so it never repeats."""
    today = datetime.now(timezone.utc).date()
    sent_count = 0

    for days in REMINDER_DAYS:
        target_date = today + timedelta(days=days)
        # ISO prefix match: "2026-09-24" matches fecha_fin starting with that date
        target_prefix = target_date.isoformat()

        subs = await db.suscripciones.find(
            {"estado": "activa"},
            {"_id": 0},
        ).to_list(5000)

        for sub in subs:
            fecha_fin_str = sub.get("fecha_fin", "")
            if not fecha_fin_str.startswith(target_prefix):
                continue

            sub_id = sub.get("id", "")
            reminder_key = f"{sub_id}_{days}d"

            # Check if already sent
            already = await db.reminder_log.find_one({"reminder_key": reminder_key})
            if already:
                continue

            # Fetch account and empresa info
            cuenta = await db.empresa_cuentas.find_one(
                {"id": sub.get("cuenta_id")}, {"_id": 0, "password_hash": 0}
            )
            empresa = await db.empresas.find_one(
                {"id": sub.get("empresa_id")}, {"_id": 0, "nombre": 1}
            )

            if not cuenta or not cuenta.get("email"):
                continue

            send_expiration_reminder_email(
                cuenta["email"],
                cuenta.get("nombre_contacto", ""),
                empresa.get("nombre", "") if empresa else "",
                days,
            )

            # Record that this specific reminder was sent
            await db.reminder_log.insert_one({
                "reminder_key": reminder_key,
                "suscripcion_id": sub_id,
                "cuenta_id": sub.get("cuenta_id"),
                "dias_restantes": days,
                "sent_at": datetime.now(timezone.utc).isoformat(),
            })
            sent_count += 1

    if sent_count:
        logger.info("Expiration reminders sent: %d", sent_count)
    else:
        logger.debug("Expiration reminder check: nothing to send")
