from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth import require_admin, hash_password
from models import Usuario

router = APIRouter()


@router.get("/usuarios")
async def get_usuarios(user=Depends(require_admin)):
    usuarios = await db.usuarios.find({}, {"_id": 0, "password_hash": 0}).to_list(50)
    return usuarios


@router.post("/usuarios")
async def create_usuario(data: dict, user=Depends(require_admin)):
    existing = await db.usuarios.find_one({"username": data["username"]})
    if existing:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    new_user = Usuario(
        username=data["username"],
        password_hash=hash_password(data["password"]),
        nombre=data.get("nombre", ""),
        email=data.get("email", ""),
        role=data.get("role", "editor"),
    )
    doc = new_user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.usuarios.insert_one(doc)
    return {"status": "ok", "id": doc["id"]}


@router.put("/usuarios/{user_id}")
async def update_usuario(user_id: str, data: dict, user=Depends(require_admin)):
    update_data = {}
    if "nombre" in data:
        update_data["nombre"] = data["nombre"]
    if "email" in data:
        update_data["email"] = data["email"]
    if "role" in data:
        update_data["role"] = data["role"]
    if "activo" in data:
        update_data["activo"] = data["activo"]
    if "password" in data and data["password"]:
        update_data["password_hash"] = hash_password(data["password"])
    await db.usuarios.update_one({"id": user_id}, {"$set": update_data})
    return {"status": "ok"}


@router.delete("/usuarios/{user_id}")
async def delete_usuario(user_id: str, user=Depends(require_admin)):
    if user_id == user.get("user_id"):
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
    await db.usuarios.delete_one({"id": user_id})
    return {"status": "ok"}
