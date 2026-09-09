from fastapi import APIRouter, HTTPException, Depends, UploadFile, File as FileParam
from datetime import datetime, timezone

from database import db
from auth import hash_password, verify_password, create_pst_token, require_pst
from models import EmpresaCuenta, PSTRegisterRequest, PSTLoginRequest

router = APIRouter()


@router.post("/pst/register")
async def pst_register(data: PSTRegisterRequest):
    email = data.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Email inválido")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    if not data.nombre_contacto.strip():
        raise HTTPException(status_code=400, detail="El nombre de contacto es obligatorio")

    existing = await db.empresa_cuentas.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con este email")

    cuenta = EmpresaCuenta(
        email=email,
        password_hash=hash_password(data.password),
        nombre_contacto=data.nombre_contacto.strip(),
        telefono_contacto=data.telefono_contacto.strip(),
    )
    doc = cuenta.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.empresa_cuentas.insert_one(doc)

    token = create_pst_token(cuenta.id, email)

    return {
        "token": token,
        "cuenta": {
            "id": cuenta.id,
            "email": email,
            "nombre_contacto": cuenta.nombre_contacto,
            "empresa_id": None,
        },
    }


@router.post("/pst/login")
async def pst_login(data: PSTLoginRequest):
    email = data.email.strip().lower()
    cuenta = await db.empresa_cuentas.find_one({"email": email}, {"_id": 0})
    if not cuenta or not verify_password(data.password, cuenta["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not cuenta.get("activa", True):
        raise HTTPException(status_code=401, detail="Cuenta desactivada")

    token = create_pst_token(cuenta["id"], email)

    return {
        "token": token,
        "cuenta": {
            "id": cuenta["id"],
            "email": cuenta["email"],
            "nombre_contacto": cuenta.get("nombre_contacto", ""),
            "empresa_id": cuenta.get("empresa_id"),
        },
    }


@router.get("/pst/me")
async def pst_me(user=Depends(require_pst)):
    cuenta = await db.empresa_cuentas.find_one({"id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    empresa = None
    if cuenta.get("empresa_id"):
        empresa = await db.empresas.find_one({"id": cuenta["empresa_id"]}, {"_id": 0})
        if empresa:
            if isinstance(empresa.get("created_at"), str):
                empresa["created_at"] = datetime.fromisoformat(empresa["created_at"])
            if isinstance(empresa.get("updated_at"), str):
                empresa["updated_at"] = datetime.fromisoformat(empresa["updated_at"])

    return {
        "cuenta": {
            "id": cuenta["id"],
            "email": cuenta["email"],
            "nombre_contacto": cuenta.get("nombre_contacto", ""),
            "telefono_contacto": cuenta.get("telefono_contacto", ""),
            "empresa_id": cuenta.get("empresa_id"),
        },
        "empresa": empresa,
    }


@router.put("/pst/perfil")
async def pst_update_perfil(data: dict, user=Depends(require_pst)):
    """Update company profile during wizard or later edits."""
    from slugify import slugify
    import uuid as uuid_mod

    cuenta = await db.empresa_cuentas.find_one({"id": user["user_id"]}, {"_id": 0})
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    empresa_id = cuenta.get("empresa_id")

    # Fields allowed for PST to edit
    allowed_fields = {
        "nombre", "categoria", "descripcion", "telefono", "whatsapp",
        "direccion", "email", "social_links", "actividades", "latitud", "longitud",
        "logo_url", "hero_url", "galeria", "requisitos_completados", "certificaciones",
    }
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not empresa_id:
        # Create new empresa profile (first wizard completion)
        nombre = update_data.get("nombre", "").strip()
        if not nombre:
            raise HTTPException(status_code=400, detail="El nombre de la empresa es obligatorio")
        categoria = update_data.get("categoria", "").strip()
        if not categoria:
            raise HTTPException(status_code=400, detail="La categoría es obligatoria")
        descripcion = update_data.get("descripcion", "").strip()
        if not descripcion:
            raise HTTPException(status_code=400, detail="La descripción es obligatoria")

        slug = slugify(nombre, lowercase=True)
        existing = await db.empresas.find_one({"slug": slug})
        if existing:
            slug = f"{slug}-{str(uuid_mod.uuid4())[:8]}"

        new_id = str(uuid_mod.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        empresa_doc = {
            "id": new_id,
            "slug": slug,
            "nombre": nombre,
            "categoria": categoria,
            "descripcion": descripcion,
            "estado": "borrador",
            "cuenta_id": user["user_id"],
            "activa": False,
            "destacada": False,
            "galeria": [],
            "actividades": [],
            "ubicaciones_actividades": [],
            "requisitos_completados": [],
            "certificaciones": [],
            "created_at": now,
            "updated_at": now,
        }
        # Merge additional fields
        for k, v in update_data.items():
            if k not in ("nombre", "categoria", "descripcion"):
                empresa_doc[k] = v

        await db.empresas.insert_one(empresa_doc)
        await db.empresa_cuentas.update_one(
            {"id": user["user_id"]},
            {"$set": {"empresa_id": new_id}},
        )
        empresa_id = new_id
    else:
        # Update existing empresa
        empresa = await db.empresas.find_one({"id": empresa_id}, {"_id": 0})
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")

        # Only allow editing in certain states
        estado = empresa.get("estado", "borrador")
        if estado == "aprobado":
            raise HTTPException(status_code=400, detail="Tu perfil ya fue aprobado. Contacta al administrador para cambios.")

        if "nombre" in update_data and update_data["nombre"]:
            new_slug = slugify(update_data["nombre"], lowercase=True)
            if new_slug != empresa.get("slug"):
                existing = await db.empresas.find_one({"slug": new_slug})
                if existing and existing.get("id") != empresa_id:
                    new_slug = f"{new_slug}-{str(uuid_mod.uuid4())[:8]}"
                update_data["slug"] = new_slug

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.empresas.update_one({"id": empresa_id}, {"$set": update_data})

    empresa = await db.empresas.find_one({"id": empresa_id}, {"_id": 0})
    if isinstance(empresa.get("created_at"), str):
        empresa["created_at"] = datetime.fromisoformat(empresa["created_at"])
    if isinstance(empresa.get("updated_at"), str):
        empresa["updated_at"] = datetime.fromisoformat(empresa["updated_at"])
    return empresa


@router.post("/pst/submit-for-payment")
async def pst_submit_for_payment(user=Depends(require_pst)):
    """Transition profile from borrador to pendiente_pago after wizard completion."""
    cuenta = await db.empresa_cuentas.find_one({"id": user["user_id"]}, {"_id": 0})
    if not cuenta or not cuenta.get("empresa_id"):
        raise HTTPException(status_code=400, detail="Primero debes completar tu perfil")

    empresa = await db.empresas.find_one({"id": cuenta["empresa_id"]}, {"_id": 0})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    if empresa.get("estado") not in ("borrador", "rechazado"):
        raise HTTPException(status_code=400, detail=f"No se puede enviar a pago desde el estado '{empresa.get('estado')}'")

    # Check blocking requirements
    requisitos = await db.requisitos.find({"activo": True, "bloqueante": True}, {"_id": 0}).to_list(50)
    completados = {r.get("requisito_id"): r for r in (empresa.get("requisitos_completados") or [])}
    for req in requisitos:
        comp = completados.get(req["id"])
        if not comp:
            raise HTTPException(
                status_code=400,
                detail=f"Requisito bloqueante no completado: {req['nombre']}",
            )
        if req.get("documento_requerido") and not comp.get("documento_url"):
            raise HTTPException(
                status_code=400,
                detail=f"Documento requerido faltante para: {req['nombre']}",
            )

    await db.empresas.update_one(
        {"id": cuenta["empresa_id"]},
        {"$set": {"estado": "pendiente_pago", "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"status": "ok", "estado": "pendiente_pago"}


@router.post("/pst/documents/upload")
async def pst_upload_doc(
    file: UploadFile = FileParam(...),
    user=Depends(require_pst),
):
    """Upload a document (PDF/image) for requirements or certifications."""
    from storage import put_object
    from pathlib import Path
    import uuid as uuid_mod

    ALLOWED_DOC_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    MAX_DOC_SIZE = 10 * 1024 * 1024

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido. Permitidos: {', '.join(ALLOWED_DOC_EXTENSIONS)}")

    content = await file.read()
    if len(content) > MAX_DOC_SIZE:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande. Máximo 10MB")

    unique_id = str(uuid_mod.uuid4())[:8]
    storage_path = f"cluster-turismo-jalisco/documents/{user['user_id']}/{unique_id}{file_ext}"
    content_type = file.content_type or "application/octet-stream"

    try:
        result = put_object(storage_path, content, content_type)
        stored_path = result.get("path", storage_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir documento: {str(e)}")

    url = f"/api/files/{stored_path}"

    doc_record = {
        "id": str(uuid_mod.uuid4()),
        "cuenta_id": user["user_id"],
        "storage_path": stored_path,
        "original_filename": file.filename,
        "url": url,
        "content_type": content_type,
        "size": len(content),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.documentos_pst.insert_one(doc_record)

    return {"url": url, "filename": file.filename, "id": doc_record["id"]}
