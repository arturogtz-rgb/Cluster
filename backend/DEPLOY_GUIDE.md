# Deploy Desacoplado: Render (Backend) + Hostinger (Frontend)
## Cluster de Turismo de Naturaleza y Aventura Jalisco

---

## ARQUITECTURA FINAL

```
[Usuario] --> clusterturismojalisco.com.mx (Hostinger)
                      |
                      | llamadas API (/api/...)
                      v
              cluster-turismo-backend.onrender.com (Render)
                      |
                      v
              MongoDB Atlas (Nube)
```

---

## PARTE 1: BACKEND EN RENDER.COM

### 1.1 Crear cuenta en Render
1. Ve a https://render.com y crea cuenta (gratis con GitHub)

### 1.2 Subir codigo a GitHub
Primero, guarda el proyecto en GitHub usando el boton "Save to GitHub" de Emergent.
El repositorio tendra la carpeta `backend/` con todo lo necesario.

### 1.3 Crear servicio en Render
1. En Render: **New** > **Web Service**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name**: `cluster-turismo-backend`
   - **Region**: Oregon (US West) o la mas cercana
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements-render.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (para empezar)

### 1.4 Variables de entorno en Render
En Render: Tu servicio > **Environment** > **Add Environment Variable**

| Variable | Valor |
|----------|-------|
| `MONGO_URL` | `mongodb+srv://turismo_admin:TU_PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority` |
| `DB_NAME` | `turismo_jalisco` |
| `CORS_ORIGINS` | `https://clusterturismojalisco.com.mx,https://www.clusterturismojalisco.com.mx` |
| `ADMIN_EMAIL` | (tu email para notificaciones, opcional) |
| `SMTP_HOST` | (opcional, para envio de emails) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (opcional) |
| `SMTP_PASSWORD` | (opcional) |

### 1.5 Deploy
Click **Create Web Service**. Render instalara las dependencias y levantara el backend.
Tu URL sera algo como: `https://cluster-turismo-backend.onrender.com`

### 1.6 Verificar backend
Abre en tu navegador:
```
https://cluster-turismo-backend.onrender.com/api/
```
Debes ver: `{"message": "Cluster de Turismo de Naturaleza y Aventura Jalisco API"}`

### 1.7 Poblar la base de datos (Seed)
Ejecuta en tu navegador o terminal:
```
curl -X POST https://cluster-turismo-backend.onrender.com/api/seed
```
Esto crea: usuario admin, 10 actividades, 2 empresas de ejemplo, 1 articulo.

---

## PARTE 2: FRONTEND EN HOSTINGER

### 2.1 Construir el frontend (Build)
En Emergent o en tu maquina local:
```bash
cd frontend
```

Edita el archivo `.env` para que apunte a tu backend en Render:
```env
REACT_APP_BACKEND_URL=https://cluster-turismo-backend.onrender.com
```

Luego genera el build de produccion:
```bash
yarn build
```

Esto crea una carpeta `build/` con archivos HTML, CSS y JS estaticos.

### 2.2 Subir a Hostinger
1. Comprime la carpeta `build/` en un ZIP
2. En Hostinger: **File Manager** > `public_html`
3. Borra todo lo que haya en `public_html`
4. Sube el ZIP y extraelo ahi
5. Los archivos deben quedar DIRECTAMENTE en `public_html/`:
   ```
   public_html/
     index.html
     static/
     favicon.ico
     manifest.json
     ...
   ```

### 2.3 Configurar .htaccess para SPA (React Router)
Crea un archivo `.htaccess` en `public_html/` con este contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Esto es CRITICO para que las rutas de React funcionen (/admin, /empresas, etc.).
Sin esto, al refrescar cualquier pagina que no sea `/` veras un error 404.

---

## PARTE 3: VERIFICACION FINAL

### Test 1: Backend
```
https://cluster-turismo-backend.onrender.com/api/empresas
```
Debe devolver un JSON con las empresas.

### Test 2: Frontend
```
https://clusterturismojalisco.com.mx
```
Debe cargar el sitio con las empresas visibles.

### Test 3: Admin
```
https://clusterturismojalisco.com.mx/admin
```
Login con admin / admin123 y verificar que el dashboard carga.

---

## NOTAS IMPORTANTES

### Sobre Render Free Tier
- El servicio gratuito se "duerme" tras 15 min de inactividad
- La primera visita despues de dormir tarda ~30 segundos en cargar
- Para produccion seria, usa el plan Starter ($7/mes) que mantiene el servicio activo

### Sobre las imagenes subidas
- Las imagenes subidas via el admin se guardaran en Render
- En el Free Tier de Render, el disco es efimero (se borra en cada deploy)
- Para produccion: usar un servicio de almacenamiento como Cloudinary o AWS S3

### Sobre el dominio
- Tu dominio clusterturismojalisco.com.mx sigue apuntando a Hostinger
- Hostinger solo sirve los archivos estaticos del frontend (HTML/CSS/JS)
- El frontend hace llamadas API a Render automaticamente

---

## RESOLUCION DE PROBLEMAS

| Problema | Causa | Solucion |
|----------|-------|----------|
| CORS error en consola | Backend no acepta el dominio | Verificar CORS_ORIGINS en Render incluya tu dominio |
| 404 al refrescar /admin | Falta .htaccess | Crear .htaccess como se indica arriba |
| Sitio carga pero sin datos | Backend dormido (Free Tier) | Esperar 30s, o usar plan Starter |
| "Network Error" en frontend | URL del backend incorrecta | Verificar REACT_APP_BACKEND_URL en el build |

---

## CHECKLIST

- [ ] MongoDB Atlas configurado con usuario y whitelist
- [ ] Backend desplegado en Render con variables de entorno
- [ ] Seed ejecutado (curl -X POST .../api/seed)
- [ ] Backend responde en /api/
- [ ] Frontend compilado con REACT_APP_BACKEND_URL apuntando a Render
- [ ] Build subido a Hostinger public_html
- [ ] .htaccess creado en public_html
- [ ] Sitio carga con datos
- [ ] Login en /admin funciona
