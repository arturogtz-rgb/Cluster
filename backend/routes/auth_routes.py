from fastapi import APIRouter, Depends

from database import db
from auth import get_current_user, verify_password, create_token
from models import LoginRequest, LoginResponse

router = APIRouter()


@router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    from fastapi import HTTPException
    user = await db.usuarios.find_one({"username": request.username}, {"_id": 0})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user.get("activo", True):
        raise HTTPException(status_code=401, detail="Usuario desactivado")
    role = user.get("role", "admin")
    token = create_token(user["id"], user["username"], role)
    return LoginResponse(token=token, username=user["username"])


@router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {"username": user["username"], "user_id": user["user_id"], "role": user.get("role", "admin")}
