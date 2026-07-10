#!/bin/bash
# renew-cluster-cert.sh
# Deploy-hook de certbot para copiar certificados renovados y reiniciar Nginx.
#
# Uso: Copiar este archivo a /etc/letsencrypt/renewal-hooks/deploy/ en el VPS:
#   sudo cp scripts/renew-cluster-cert.sh /etc/letsencrypt/renewal-hooks/deploy/
#   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/renew-cluster-cert.sh
#
# Se ejecuta automaticamente despues de cada renovacion exitosa de certbot.

cp /etc/letsencrypt/live/clusterturismojalisco.com.mx/fullchain.pem /home/Cluster/ssl/fullchain.pem
cp /etc/letsencrypt/live/clusterturismojalisco.com.mx/privkey.pem /home/Cluster/ssl/privkey.pem
cd /home/Cluster && docker compose restart frontend
