#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🎬 LeCabanon — Préparation démo"
echo "================================"
echo ""

# Vérifier que PostgreSQL est accessible
if ! pg_isready -q 2>/dev/null; then
  echo "❌ PostgreSQL n'est pas accessible. Lancez : sudo systemctl start postgresql"
  exit 1
fi

# Vérifier que le .env backend existe
if [ ! -f "$APP_DIR/backend/.env" ]; then
  echo "❌ backend/.env manquant. Copiez .env.example et configurez les valeurs."
  exit 1
fi

# ── Backend install + migrate + generate ──
echo "→ Backend : install"
cd "$APP_DIR/backend"
npm ci --silent

echo "→ Prisma : generate + migrate"
npx prisma generate --no-hints 2>/dev/null
npx prisma migrate deploy 2>/dev/null

echo "→ Backend : build"
npm run build --silent

# ── Frontend install + build ──
echo "→ Frontend : install + build"
cd "$APP_DIR/frontend"
npm ci --silent
npm run build --silent

# ── Seed (wipes DB + inserts demo data) ──
echo ""
echo "→ Seed de la base de données..."
cd "$APP_DIR/backend"
npx tsx prisma/seed.ts

# ── Start / Restart ──
echo ""
cd "$APP_DIR"
if command -v pm2 &>/dev/null; then
  pm2 restart lecabanon-api 2>/dev/null || pm2 start ecosystem.config.cjs 2>/dev/null
  echo ""
  echo "🚀 LeCabanon démarré via pm2"
  echo "   → pm2 logs lecabanon-api"
else
  echo "⚠️  pm2 non installé — lancement en mode dev"
  echo "   Ouvre 2 terminaux :"
  echo "   1) cd backend && npm run dev"
  echo "   2) cd frontend && npm run dev"
fi

echo ""
echo "================================"
echo "✅ Démo prête !"
echo ""
echo "📋 Comptes de test (mot de passe : Test1234!)"
echo "   → felix@lecabanon.fr     (admin Avenue Guillon)"
echo "   → sophie.bertrand@email.fr (admin Quartier Bellevue)"
echo "   → karim@kb-elec.fr       (artisan, fiche revendiquée)"
echo "   → jp.dumont@email.fr     (membre)"
echo ""
echo "🔑 Codes d'accès communautés :"
echo "   → Avenue Guillon   : GUILLON24"
echo "   → Quartier Bellevue: BELLVUE24"
echo "   → Résidence Tilleuls: TILLEUL24"
echo ""
