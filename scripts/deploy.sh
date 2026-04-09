#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$APP_DIR/logs/deploy.log"

# Créer le dossier logs s'il n'existe pas
mkdir -p "$APP_DIR/logs"

echo "=== Déploiement LeCabanon $(date) ===" >> "$LOG_FILE"

cd "$APP_DIR"

# Pull les dernières modifications
git pull origin main >> "$LOG_FILE" 2>&1

# ---- Backend ----
echo "→ Backend : install + migrate + build" >> "$LOG_FILE"
cd "$APP_DIR/backend"
npm ci >> "$LOG_FILE" 2>&1
npx prisma generate >> "$LOG_FILE" 2>&1
npx prisma migrate deploy >> "$LOG_FILE" 2>&1
npm run build >> "$LOG_FILE" 2>&1

# ---- Frontend ----
echo "→ Frontend : install + build" >> "$LOG_FILE"
cd "$APP_DIR/frontend"
npm ci >> "$LOG_FILE" 2>&1
npm run build >> "$LOG_FILE" 2>&1

# ---- Restart ----
cd "$APP_DIR"
pm2 restart lecabanon-api >> "$LOG_FILE" 2>&1 || pm2 start ecosystem.config.cjs >> "$LOG_FILE" 2>&1

echo "=== Déploiement terminé $(date) ===" >> "$LOG_FILE"
echo "✅ Deploy OK — $(date)"
