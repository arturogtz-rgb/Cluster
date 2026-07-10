# Deploy en VPS con Docker
## Cluster de Turismo de Naturaleza y Aventura Jalisco

---

## ARQUITECTURA

```
Tu VPS (IP publica)
  |
  |-- [Nginx container :80/:443] --> clusterturismojalisco.com.mx
  |     |
  |     |-- /api/* --> [Backend container :8001]
  |     |                  |
  |     |                  +--> [MongoDB container :27017]
  |     |
  |     |-- /* --> archivos estaticos React
```

Todo corre dentro del VPS. Sin servicios externos. Sin costos adicionales.

---

## REQUISITOS DEL VPS

- Ubuntu 22.04+ (o similar)
- 1 GB RAM minimo (2 GB recomendado)
- Docker y Docker Compose instalados

### Instalar Docker (si no lo tienes):
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Cierra y abre la terminal para que tome efecto
```

---

## PASO 1: SUBIR CODIGO AL VPS

### Opcion A: Desde GitHub
```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
```

### Opcion B: Con SCP desde tu maquina
```bash
scp -r ./proyecto usuario@IP_DEL_VPS:/home/usuario/turismo
```

---

## PASO 2: CONFIGURAR VARIABLES

Edita el archivo de configuracion de produccion (**OBLIGATORIO**):
```bash
nano backend/.env.production
```

```env
# OBLIGATORIO - Secreto para firmar tokens JWT (genera uno nuevo y unico)
JWT_SECRET=<genera-con: python3 -c "import secrets; print(secrets.token_hex(32))">

# OPCIONAL - Si se omite, se genera una contrasena aleatoria en el primer arranque (ver logs)
ADMIN_INITIAL_PASSWORD=<tu-contrasena-segura>

# OPCIONAL - Configuracion de email
ADMIN_EMAIL=tu-email@tudominio.com
SMTP_HOST=smtp.tudominio.com
SMTP_PORT=587
SMTP_USER=tu-email@tudominio.com
SMTP_PASSWORD=tu_password
```

**IMPORTANTE:** `JWT_SECRET` es obligatorio. Si no se configura, el backend NO arrancara.
Si no configuras `ADMIN_INITIAL_PASSWORD`, se generara una contrasena aleatoria que aparecera en los logs del backend UNA sola vez durante el primer arranque.

---

## PASO 3: LEVANTAR TODO

Un solo comando:
```bash
docker compose up -d --build
```

Esto hace todo automaticamente:
1. Levanta MongoDB (contenedor `turismo-db`)
2. Construye e inicia el Backend (contenedor `turismo-backend`)
3. El backend ejecuta el auto-seed al iniciar (crea admin + datos base)
4. Construye el Frontend con React (contenedor `turismo-frontend`)
5. Nginx sirve el frontend y redirige /api al backend

Tarda ~3-5 minutos la primera vez.

**Nota de seguridad:** Los puertos de MongoDB (27017) y del backend (8001) NO estan expuestos al exterior. Solo son accesibles dentro de la red interna de Docker. Todo el trafico externo pasa por Nginx (puertos 80/443).

---

## PASO 4: VERIFICAR

```bash
# Ver que los 3 contenedores esten corriendo
docker compose ps

# Ver logs del backend
docker compose logs backend

# Test de la API
curl http://localhost/api/
# Debe responder: {"message": "Cluster de Turismo..."}

# Verificar que el seed corrio
curl http://localhost/api/empresas
# Debe mostrar las empresas

# Si necesitas ejecutar el seed manualmente:
docker compose exec backend python seed.py
```

---

## PASO 5: APUNTAR TU DOMINIO

En tu proveedor de DNS (Hostinger, Cloudflare, etc.):

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | clusterturismojalisco.com.mx | IP_DE_TU_VPS |
| A | www.clusterturismojalisco.com.mx | IP_DE_TU_VPS |

Espera 5-30 min para la propagacion DNS.

---

## PASO 6: SSL (HTTPS) con Let's Encrypt (metodo webroot)

El sitio ya esta configurado para SSL con Nginx y certificados de Let's Encrypt.
El metodo **webroot** permite renovar certificados sin detener ningun contenedor.

### Requisitos previos
- DNS del dominio apuntando a la IP del VPS (paso 5)
- Contenedores corriendo (`docker compose up -d`)
- Carpeta `webroot/` en la raiz del proyecto (se crea automaticamente si usas los volumenes de docker-compose.yml)

### Obtener certificado por primera vez

```bash
# Crear carpeta webroot si no existe
mkdir -p /home/Cluster/webroot

# Crear carpeta ssl para los certificados
mkdir -p /home/Cluster/ssl

# Solicitar certificado con metodo webroot
sudo certbot certonly --webroot \
  -w /home/Cluster/webroot \
  -d clusterturismojalisco.com.mx \
  -d www.clusterturismojalisco.com.mx \
  --cert-name clusterturismojalisco.com.mx

# Copiar certificados a la carpeta del proyecto
sudo cp /etc/letsencrypt/live/clusterturismojalisco.com.mx/fullchain.pem /home/Cluster/ssl/fullchain.pem
sudo cp /etc/letsencrypt/live/clusterturismojalisco.com.mx/privkey.pem /home/Cluster/ssl/privkey.pem

# Reiniciar frontend para tomar los certificados
docker compose restart frontend
```

### Renovacion automatica (deploy-hook)

El script `scripts/renew-cluster-cert.sh` se ejecuta automaticamente despues de cada renovacion exitosa de certbot.

```bash
# Copiar el deploy-hook al directorio de certbot
sudo cp scripts/renew-cluster-cert.sh /etc/letsencrypt/renewal-hooks/deploy/
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/renew-cluster-cert.sh

# Verificar que la renovacion funciona (dry-run)
sudo certbot renew --dry-run
```

El timer de systemd (`certbot.timer`) corre 2 veces al dia y renueva automaticamente cuando faltan menos de 30 dias. El deploy-hook copia los certificados renovados a `ssl/` y reinicia Nginx.

### Como funciona
1. Nginx (puerto 80) sirve la carpeta `/var/www/certbot` en `/.well-known/acme-challenge/` para la validacion ACME
2. Todo el resto del trafico HTTP se redirige a HTTPS
3. Los certificados se montan como volumenes read-only en el contenedor frontend
4. El deploy-hook se encarga de copiar los certificados renovados y reiniciar Nginx

---

## COMANDOS UTILES

```bash
# Ver estado de contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar todo
docker compose restart

# Reconstruir despues de cambios en el codigo
docker compose up -d --build

# Parar todo
docker compose down

# Parar todo Y borrar la base de datos (cuidado!)
docker compose down -v

# Entrar al contenedor del backend
docker compose exec backend bash

# Entrar a MongoDB directamente
docker compose exec database mongosh turismo_jalisco

# Backup de la base de datos (manual)
docker compose exec database mongodump --db turismo_jalisco --out /data/backup
docker cp turismo-db:/data/backup ./backup_$(date +%Y%m%d)

# Backup automatizado (ver seccion Backups abajo)
./scripts/backup-mongodb.sh
```

---

## BACKUPS AUTOMATICOS DE MONGODB

El script `scripts/backup-mongodb.sh` realiza backups comprimidos con rotacion automatica.

### Configurar backup diario
```bash
# Dar permisos de ejecucion
chmod +x scripts/backup-mongodb.sh

# Agregar cron job (ejecuta a las 3 AM diario)
sudo crontab -e
# Agregar esta linea:
0 3 * * * /home/Cluster/scripts/backup-mongodb.sh >> /var/log/mongo-backup.log 2>&1
```

### Configuracion por defecto
- **Directorio de backups:** `/home/Cluster/backups/`
- **Retencion:** 14 dias (backups mas antiguos se eliminan automaticamente)
- **Formato:** Archive comprimido con gzip

### Restaurar un backup
```bash
# Copiar el backup al contenedor
docker cp backups/backup_turismo_jalisco_FECHA.archive turismo-db:/data/restore.archive

# Restaurar
docker compose exec database mongorestore --gzip --archive=/data/restore.archive --drop
```

---

## RESOLUCION DE PROBLEMAS

| Problema | Comando de diagnostico | Solucion |
|----------|----------------------|----------|
| Contenedor no arranca | `docker compose logs backend` | Revisar errores en el log |
| Puerto 80 ocupado | `sudo lsof -i :80` | Detener Apache/Nginx del VPS |
| No conecta a Mongo | `docker compose logs database` | Verificar que el volumen tenga espacio |
| Frontend en blanco | `docker compose logs frontend` | Verificar REACT_APP_BACKEND_URL |
| Seed no corre | `docker compose logs backend` | Ejecutar: `docker compose exec backend python seed.py` |

---

## CHECKLIST

- [ ] Docker y Docker Compose instalados en el VPS
- [ ] Codigo subido al VPS
- [ ] `docker compose up -d --build` ejecutado
- [ ] 3 contenedores corriendo (`docker compose ps`)
- [ ] `curl localhost/api/` responde OK
- [ ] `curl localhost/api/empresas` muestra datos
- [ ] DNS del dominio apuntando a la IP del VPS
- [ ] Sitio accesible desde https://clusterturismojalisco.com.mx
- [ ] Login en /admin funciona con admin / admin123
