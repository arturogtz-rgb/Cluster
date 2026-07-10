#!/bin/bash
# backup-mongodb.sh
# Backup automatizado de MongoDB con rotacion.
#
# Uso recomendado: Agregar como cron job diario en el VPS:
#   sudo crontab -e
#   0 3 * * * /home/Cluster/scripts/backup-mongodb.sh >> /var/log/mongo-backup.log 2>&1
#
# Configuracion
BACKUP_DIR="/home/Cluster/backups"
DB_NAME="turismo_jalisco"
CONTAINER_NAME="turismo-db"
RETENTION_DAYS=14
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${DB_NAME}_${DATE}"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup de MongoDB..."

# Ejecutar mongodump dentro del contenedor
docker compose -f /home/Cluster/docker-compose.yml exec -T database mongodump \
  --db "$DB_NAME" \
  --archive="/data/${BACKUP_NAME}.archive" \
  --gzip

# Copiar el archivo de backup fuera del contenedor
docker cp "${CONTAINER_NAME}:/data/${BACKUP_NAME}.archive" "${BACKUP_DIR}/${BACKUP_NAME}.archive"

# Limpiar archivo temporal dentro del contenedor
docker compose -f /home/Cluster/docker-compose.yml exec -T database rm -f "/data/${BACKUP_NAME}.archive"

# Verificar que el backup se creo correctamente
if [ -f "${BACKUP_DIR}/${BACKUP_NAME}.archive" ]; then
  SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}.archive" | cut -f1)
  echo "[$(date)] Backup creado exitosamente: ${BACKUP_NAME}.archive (${SIZE})"
else
  echo "[$(date)] ERROR: No se pudo crear el backup"
  exit 1
fi

# Rotacion: eliminar backups con mas de RETENTION_DAYS dias
DELETED=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.archive" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo "[$(date)] Backups antiguos eliminados: ${DELETED} (retencion: ${RETENTION_DAYS} dias)"

echo "[$(date)] Backup completado."
