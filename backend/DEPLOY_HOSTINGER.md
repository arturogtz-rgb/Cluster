# Guia de Despliegue: Hostinger + MongoDB Atlas
## Cluster de Turismo de Naturaleza y Aventura Jalisco

---

## PASO 1: Crear Base de Datos en MongoDB Atlas (Gratis)

1. Ve a **https://cloud.mongodb.com** y crea una cuenta (o inicia sesion)
2. Crea un **Cluster gratuito** (M0 Free Tier):
   - Provider: AWS
   - Region: **us-east-1** (Virginia) o la mas cercana a tu servidor
   - Nombre: `cluster-turismo-jalisco`
3. Espera 2-3 minutos a que se aprovisione

---

## PASO 2: Crear Usuario de Base de Datos

1. En el menu lateral: **Database Access** > **Add New Database User**
2. Configura:
   - **Authentication Method**: Password
   - **Username**: `turismo_admin` (o el que prefieras)
   - **Password**: Genera una segura con el boton "Autogenerate Secure Password"
     - **COPIA ESTA PASSWORD**, la necesitaras despues
   - **Database User Privileges**: `Read and Write to Any Database`
3. Click **Add User**

---

## PASO 3: Whitelist - Permitir la IP de Hostinger

### Opcion A: IP Especifica (mas seguro)
1. Conectate a tu servidor Hostinger por SSH
2. Ejecuta este comando para ver tu IP publica:
   ```
   curl -s https://api.ipify.org && echo
   ```
3. Copia la IP que aparezca (ejemplo: `185.210.45.123`)
4. En Atlas: **Network Access** > **Add IP Address**
5. Pega la IP y dale un nombre: `Hostinger Produccion`
6. Click **Confirm**

### Opcion B: Permitir todas las IPs (rapido pero menos seguro)
1. En Atlas: **Network Access** > **Add IP Address**
2. Click **Allow Access from Anywhere**
3. Esto agrega `0.0.0.0/0`
4. Click **Confirm**

> **Nota**: La Opcion B es perfecta para empezar. Puedes restringirla despues.

---

## PASO 4: Obtener la URL de Conexion

1. En Atlas: **Database** > **Connect** (boton verde)
2. Elige **Drivers** > **Python** > Version 3.12+
3. Copia la cadena de conexion. Se vera asi:
   ```
   mongodb+srv://turismo_admin:<password>@cluster-turismo-jalisco.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=cluster-turismo-jalisco
   ```
4. **Reemplaza `<password>`** con la password que copiaste en el Paso 2

---

## PASO 5: Configurar Variables en Hostinger

En el panel de Hostinger (o en el archivo `.env` de tu servidor), configura estas **2 variables**:

```env
MONGO_URL="mongodb+srv://turismo_admin:TU_PASSWORD_AQUI@cluster-turismo-jalisco.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=cluster-turismo-jalisco"
DB_NAME="turismo_jalisco"
```

### Donde poner esto en Hostinger:
- **Si usas VPS**: Edita el archivo `/ruta/a/tu/backend/.env`
- **Si usas Node.js Hosting**: Panel > Tu sitio > Environment Variables
- **Si usas Docker**: En tu `docker-compose.yml` o archivo `.env`

### Variables adicionales opcionales (para email):
```env
ADMIN_EMAIL="tu-email@tudominio.com"
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_USER="tu-email@tudominio.com"
SMTP_PASSWORD="tu_password_de_email"
```

---

## PASO 6: Instalar Dependencia de Atlas

En tu servidor Hostinger, asegurate de tener el driver DNS de MongoDB:

```bash
pip install "pymongo[srv]"
```

Esto es necesario para las URLs `mongodb+srv://` de Atlas.

---

## PASO 7: Verificar Conexion

Sube el archivo `test_db.py` a tu servidor y ejecutalo:

```bash
cd /ruta/a/tu/backend
python3 test_db.py
```

Deberias ver:
```
[OK] CONECTADO A MONGODB ATLAS
     Version: 8.x.x
[OK] Base de datos 'turismo_jalisco' accesible
     Colecciones: (vacia - es nueva)
```

---

## PASO 8: Poblar la Base de Datos

Una vez conectado, inicia tu servidor y ejecuta el seed:

```bash
# Iniciar el backend
uvicorn server:app --host 0.0.0.0 --port 8001

# En otra terminal, ejecutar el seed
curl -X POST http://localhost:8001/api/seed
```

Esto creara:
- Usuario admin (admin / admin123)
- 10 actividades
- 2 empresas de ejemplo
- 1 articulo de bienvenida

---

## RESOLUCION DE PROBLEMAS

| Error | Causa | Solucion |
|-------|-------|----------|
| `ServerSelectionTimeoutError` | IP no en whitelist | Paso 3: agregar IP en Network Access |
| `AuthenticationFailed` | Usuario o password incorrectos | Paso 2: verificar credenciales en Database Access |
| `ConfigurationError` | URL mal formada | Paso 4: copiar URL de nuevo, reemplazar `<password>` |
| `dnspython must be installed` | Falta dependencia | `pip install "pymongo[srv]"` |
| `connection closed` | Firewall de Hostinger | Contactar soporte de Hostinger para abrir puerto 27017 |

---

## CHECKLIST FINAL

- [ ] Cluster Atlas creado (M0 Free Tier)
- [ ] Usuario con password y permisos readWrite creado
- [ ] IP de Hostinger en Network Access (o 0.0.0.0/0)
- [ ] MONGO_URL en el .env con la URL correcta
- [ ] DB_NAME en el .env como "turismo_jalisco"
- [ ] pymongo[srv] instalado
- [ ] test_db.py muestra "CONECTADO"
- [ ] Seed ejecutado (curl -X POST /api/seed)
- [ ] Login funciona en /admin con admin / admin123
