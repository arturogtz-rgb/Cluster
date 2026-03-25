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

Edita el archivo de email (opcional):
```bash
nano backend/.env.production
```

```env
ADMIN_EMAIL=tu-email@tudominio.com
SMTP_HOST=smtp.tudominio.com
SMTP_PORT=587
SMTP_USER=tu-email@tudominio.com
SMTP_PASSWORD=tu_password
```

Si no usas email por ahora, dejalo vacio. El sistema funciona sin SMTP.

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
curl -X POST http://localhost/api/seed
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

## PASO 6: SSL (HTTPS) - Opcional pero recomendado

### Con Certbot (Let's Encrypt gratuito):

```bash
# Instalar certbot
sudo apt install certbot

# Generar certificado
sudo certbot certonly --standalone -d clusterturismojalisco.com.mx -d www.clusterturismojalisco.com.mx

# Los certificados quedan en:
# /etc/letsencrypt/live/clusterturismojalisco.com.mx/fullchain.pem
# /etc/letsencrypt/live/clusterturismojalisco.com.mx/privkey.pem
```

Para usar SSL con Docker, agrega en docker-compose.yml bajo el servicio frontend:
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

Y actualiza nginx.conf para escuchar en 443 con los certificados.

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

# Backup de la base de datos
docker compose exec database mongodump --db turismo_jalisco --out /data/backup
docker cp turismo-db:/data/backup ./backup_$(date +%Y%m%d)
```

---

## RESOLUCION DE PROBLEMAS

| Problema | Comando de diagnostico | Solucion |
|----------|----------------------|----------|
| Contenedor no arranca | `docker compose logs backend` | Revisar errores en el log |
| Puerto 80 ocupado | `sudo lsof -i :80` | Detener Apache/Nginx del VPS |
| No conecta a Mongo | `docker compose logs database` | Verificar que el volumen tenga espacio |
| Frontend en blanco | `docker compose logs frontend` | Verificar REACT_APP_BACKEND_URL |
| Seed no corre | `curl -X POST localhost:8001/api/seed` | Ejecutar manualmente |

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
