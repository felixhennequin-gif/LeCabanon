#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$APP_DIR/logs/deploy.log"

# Créer le dossier logs s'il n'existe pas
mkdir -p "$APP_DIR/logs"

log() {
  echo "$1" | tee -a "$LOG_FILE"
}

log "=== Déploiement LeCabanon $(date) ==="

cd "$APP_DIR"

# Vérifier la connectivité réseau vers GitHub
if ! git ls-remote --exit-code origin &>/dev/null; then
  log "❌ Impossible de contacter GitHub (problème réseau/proxy ?)"
  exit 1
fi

# Vérifier que PostgreSQL est accessible
if ! pg_isready -q 2>/dev/null; then
  log "❌ PostgreSQL n'est pas accessible. Lancez : sudo systemctl start postgresql"
  exit 1
fi

# Pull les dernières modifications
log "→ Git : fetch + reset sur origin/dev"
git fetch origin dev >> "$LOG_FILE" 2>&1
git reset --hard origin/dev >> "$LOG_FILE" 2>&1

# Vérifier que le .env backend existe
if [ ! -f "$APP_DIR/backend/.env" ]; then
  log "❌ backend/.env manquant. Copiez .env.example et configurez les valeurs."
  exit 1
fi

# ---- Backend ----
log "→ Backend : install + migrate + build"
cd "$APP_DIR/backend"
npm ci >> "$LOG_FILE" 2>&1
npx prisma generate >> "$LOG_FILE" 2>&1
npx prisma migrate deploy >> "$LOG_FILE" 2>&1
npm run build >> "$LOG_FILE" 2>&1

# ---- Frontend ----
log "→ Frontend : install + build"
cd "$APP_DIR/frontend"
npm ci >> "$LOG_FILE" 2>&1
npm run build >> "$LOG_FILE" 2>&1

# ---- Restart ----
cd "$APP_DIR"
pm2 restart lecabanon-api >> "$LOG_FILE" 2>&1 || pm2 start ecosystem.config.cjs >> "$LOG_FILE" 2>&1

log "=== Déploiement terminé $(date) ==="
log "✅ Deploy OK"
