from PIL import Image
import io
import os
import logging

WEBP_QUALITY = 85

IMAGE_SIZES = {
    "hero": 1920,
    "card": 800,
    "logo": 400,
    "galeria": 1200,
    "icon": 200,
}


def optimize_image(image_data: bytes, max_width: int = 1920, quality: int = WEBP_QUALITY) -> tuple[bytes, str]:
    try:
        img = Image.open(io.BytesIO(image_data))
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format='WEBP', quality=quality, method=6)
        return output.getvalue(), '.webp'
    except Exception as e:
        logging.error(f"Image optimization failed: {e}")
        return image_data, None


async def send_contact_email(lead_data: dict):
    admin_email = os.environ.get("ADMIN_EMAIL", "")
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")

    if not all([admin_email, smtp_host, smtp_user, smtp_password]):
        logging.info("SMTP not configured - skipping email notification")
        return False

    try:
        from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

        conf = ConnectionConfig(
            MAIL_USERNAME=smtp_user,
            MAIL_PASSWORD=smtp_password,
            MAIL_FROM=smtp_user,
            MAIL_PORT=int(os.environ.get("SMTP_PORT", 587)),
            MAIL_SERVER=smtp_host,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
        )

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a4d2e; color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0;">Nuevo mensaje de contacto</h2>
                <p style="margin: 5px 0 0; opacity: 0.8;">Clúster de Turismo de Naturaleza y Aventura Jalisco</p>
            </div>
            <div style="padding: 24px; background: #f5f5f4; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #44403c;">Nombre:</td><td style="padding: 8px 0; color: #1c1917;">{lead_data.get('nombre', '')}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #44403c;">Email:</td><td style="padding: 8px 0; color: #1c1917;">{lead_data.get('email', '')}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #44403c;">Empresa:</td><td style="padding: 8px 0; color: #1c1917;">{lead_data.get('empresa', 'No especificada')}</td></tr>
                </table>
                <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #1a4d2e;">
                    <p style="margin: 0; font-weight: bold; color: #44403c;">Mensaje:</p>
                    <p style="margin: 8px 0 0; color: #1c1917;">{lead_data.get('mensaje', '')}</p>
                </div>
            </div>
        </div>
        """

        message = MessageSchema(
            subject=f"Nuevo contacto: {lead_data.get('nombre', 'Sin nombre')}",
            recipients=[admin_email],
            body=html_body,
            subtype="html",
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        logging.info(f"Email sent to {admin_email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send email: {e}")
        return False
