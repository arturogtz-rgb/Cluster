import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")
SITE_NAME = "Clúster de Turismo de Jalisco"
SITE_URL = os.environ.get("SITE_URL", "https://clusterturismojalisco.com.mx")


def _send_email(to_email: str, subject: str, html_body: str):
    if not SMTP_HOST or not SMTP_USER:
        logger.warning("SMTP not configured — email not sent: %s to %s", subject, to_email)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{SITE_NAME} <{SMTP_USER}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email sent: '%s' to %s", subject, to_email)
        return True
    except Exception as e:
        logger.error("Failed to send email '%s' to %s: %s", subject, to_email, e)
        return False


def _wrap_html(content: str) -> str:
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Inter,Arial,sans-serif;background:#fafaf9;padding:32px 16px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.08);">
<div style="background:#1a4d2e;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:18px;">{SITE_NAME}</h1></div>
<div style="padding:32px;">{content}</div>
<div style="padding:16px 32px;background:#f5f5f4;font-size:12px;color:#78716c;text-align:center;">
<a href="{SITE_URL}" style="color:#1a4d2e;text-decoration:none;">{SITE_URL}</a>
</div></div></body></html>"""


def send_registration_email(email: str, nombre: str):
    html = _wrap_html(f"""
    <h2 style="color:#1c1917;margin-top:0;">Bienvenido, {nombre}</h2>
    <p style="color:#57534e;">Tu cuenta ha sido creada exitosamente en el {SITE_NAME}.</p>
    <p style="color:#57534e;">El siguiente paso es completar tu perfil de empresa a través del wizard de registro.</p>
    <a href="{SITE_URL}/pst/wizard" style="display:inline-block;background:#1a4d2e;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Completar mi perfil</a>
    """)
    _send_email(email, f"Bienvenido al {SITE_NAME}", html)


def send_payment_confirmed_email(email: str, nombre: str, plan_nombre: str):
    html = _wrap_html(f"""
    <h2 style="color:#1c1917;margin-top:0;">Pago confirmado</h2>
    <p style="color:#57534e;">Hola {nombre}, tu pago para el plan <strong>{plan_nombre}</strong> ha sido confirmado.</p>
    <p style="color:#57534e;">Tu perfil está ahora en revisión por el equipo del Clúster. Te notificaremos cuando sea aprobado.</p>
    """)
    _send_email(email, "Pago confirmado - Tu perfil está en revisión", html)


def send_profile_approved_email(email: str, nombre: str, empresa_nombre: str):
    html = _wrap_html(f"""
    <h2 style="color:#1c1917;margin-top:0;">Tu perfil ha sido aprobado</h2>
    <p style="color:#57534e;">Hola {nombre}, tu empresa <strong>{empresa_nombre}</strong> ha sido aprobada y publicada en el directorio del Clúster.</p>
    <p style="color:#57534e;">Los turistas ya pueden encontrarte en nuestro directorio y mapa interactivo.</p>
    <a href="{SITE_URL}/empresas" style="display:inline-block;background:#1a4d2e;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Ver directorio</a>
    """)
    _send_email(email, f"{empresa_nombre} aprobada en el directorio", html)


def send_profile_rejected_email(email: str, nombre: str, empresa_nombre: str, motivo: str):
    html = _wrap_html(f"""
    <h2 style="color:#1c1917;margin-top:0;">Tu perfil necesita ajustes</h2>
    <p style="color:#57534e;">Hola {nombre}, tu empresa <strong>{empresa_nombre}</strong> no ha sido aprobada por el momento.</p>
    <p style="color:#57534e;"><strong>Motivo:</strong> {motivo or 'No especificado'}</p>
    <p style="color:#57534e;">Puedes corregir tu perfil y enviarlo de nuevo para revisión.</p>
    <a href="{SITE_URL}/pst/wizard" style="display:inline-block;background:#1a4d2e;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Editar mi perfil</a>
    """)
    _send_email(email, f"Ajustes requeridos para {empresa_nombre}", html)


def send_expiration_reminder_email(email: str, nombre: str, empresa_nombre: str, dias_restantes: int):
    html = _wrap_html(f"""
    <h2 style="color:#1c1917;margin-top:0;">Tu suscripción vence pronto</h2>
    <p style="color:#57534e;">Hola {nombre}, la suscripción de <strong>{empresa_nombre}</strong> vence en <strong>{dias_restantes} días</strong>.</p>
    <p style="color:#57534e;">Renueva tu plan para seguir apareciendo en el directorio del Clúster.</p>
    <a href="{SITE_URL}/pst/dashboard" style="display:inline-block;background:#1a4d2e;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Renovar suscripción</a>
    """)
    _send_email(email, f"Tu suscripción vence en {dias_restantes} días", html)


def send_admin_notification(subject: str, message: str):
    if not ADMIN_EMAIL:
        return
    html = _wrap_html(f"""
    <h2 style="color:#1c1917;margin-top:0;">{subject}</h2>
    <p style="color:#57534e;">{message}</p>
    <a href="{SITE_URL}/admin/afiliados" style="display:inline-block;background:#1a4d2e;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Ver panel de afiliados</a>
    """)
    _send_email(ADMIN_EMAIL, f"[Admin] {subject}", html)


def send_payment_failed_email(email: str, nombre: str):
    html = _wrap_html(f"""
    <h2 style="color:#1c1917;margin-top:0;">Problema con tu pago</h2>
    <p style="color:#57534e;">Hola {nombre}, hubo un problema al procesar tu pago.</p>
    <p style="color:#57534e;">Por favor, intenta de nuevo o contacta al equipo del Clúster para asistencia.</p>
    <a href="{SITE_URL}/pst/pago" style="display:inline-block;background:#1a4d2e;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Reintentar pago</a>
    """)
    _send_email(email, "Problema con tu pago", html)


def send_renewal_success_email(email: str, nombre: str, plan_nombre: str):
    html = _wrap_html(f"""
    <h2 style="color:#1c1917;margin-top:0;">Renovación exitosa</h2>
    <p style="color:#57534e;">Hola {nombre}, tu plan <strong>{plan_nombre}</strong> ha sido renovado exitosamente.</p>
    <p style="color:#57534e;">Tu empresa sigue visible en el directorio del Clúster.</p>
    """)
    _send_email(email, "Renovación de suscripción exitosa", html)
