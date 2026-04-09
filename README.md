# LeCabanon

[![CI](https://github.com/felixhennequin-gif/LeCabanon/actions/workflows/ci.yml/badge.svg)](https://github.com/felixhennequin-gif/LeCabanon/actions/workflows/ci.yml)

Plateforme de partage entre voisins : annuaire de matériel à prêter et d'artisans recommandés, organisé par communautés protégées par code d'accès.

## Fonctionnalités

- Inscription par email ou Google OAuth
- Communautés privées avec code d'accès (avenue, quartier, ville)
- Annuaire de matériel à prêter avec catégories (jardinage, bricolage, etc.)
- Annuaire d'artisans recommandés avec fiches détaillées
- Système d'avis avec notes (1-5 étoiles), commentaires et toggle public/privé
- Gestion des membres et rôles (admin / membre)
- Interface responsive avec filtres par catégorie

## Screenshots

<!-- TODO: ajouter screenshots -->

## Stack technique

| Backend | Frontend |
|---------|----------|
| Node.js / Express 5 | React 19 / Vite 8 |
| Prisma 7 / PostgreSQL | Tailwind CSS v4 |
| JWT + Google OAuth | React Router v7 |
| Zod (validation) | React Hook Form + Zod |

## Installation

### Prérequis

- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configurer DATABASE_URL, JWT_SECRET, etc.
npx prisma generate
npx prisma migrate dev
npm run dev            # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Déploiement

### Premier setup (serveur Debian)

```bash
# Créer la base de données PostgreSQL
./scripts/setup-db.sh

# Configurer le .env backend
cp backend/.env.example backend/.env
# Éditer backend/.env avec les vrais identifiants

# Premier déploiement
./scripts/deploy.sh

# Configurer pm2 pour démarrer au boot
pm2 save
pm2 startup
```

### Déploiements suivants

```bash
./scripts/deploy.sh
```

L'application tourne sur le port **3002** (configurable dans `ecosystem.config.cjs`). Express sert le frontend en production.

## Contribuer

1. Fork le repo
2. Créer une branche `feature/<nom>` depuis `dev`
3. Commiter et pusher
4. Ouvrir une PR vers `dev`
5. La CI doit passer

---

# LeCabanon (English)

[![CI](https://github.com/felixhennequin-gif/LeCabanon/actions/workflows/ci.yml/badge.svg)](https://github.com/felixhennequin-gif/LeCabanon/actions/workflows/ci.yml)

A neighbor sharing platform: equipment lending directory and recommended craftsmen directory, organized by access-code-protected communities.

## Features

- Email or Google OAuth sign-up
- Private communities with access codes (street, neighborhood, city)
- Equipment lending directory with categories (gardening, DIY, etc.)
- Recommended craftsmen directory with detailed profiles
- Review system with ratings (1-5 stars), comments and public/private toggle
- Member management and roles (admin / member)
- Responsive UI with category filters

## Screenshots

<!-- TODO: add screenshots -->

## Tech Stack

| Backend | Frontend |
|---------|----------|
| Node.js / Express 5 | React 19 / Vite 8 |
| Prisma 7 / PostgreSQL | Tailwind CSS v4 |
| JWT + Google OAuth | React Router v7 |
| Zod (validation) | React Hook Form + Zod |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Set DATABASE_URL, JWT_SECRET, etc.
npx prisma generate
npx prisma migrate dev
npm run dev            # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Deployment

### First setup (Debian server)

```bash
# Create the PostgreSQL database
./scripts/setup-db.sh

# Configure the backend .env
cp backend/.env.example backend/.env
# Edit backend/.env with real credentials

# First deploy
./scripts/deploy.sh

# Configure pm2 to start on boot
pm2 save
pm2 startup
```

### Subsequent deploys

```bash
./scripts/deploy.sh
```

The app runs on port **3002** (configurable in `ecosystem.config.cjs`). Express serves the frontend in production.

## Contributing

1. Fork the repo
2. Create a `feature/<name>` branch from `dev`
3. Commit and push
4. Open a PR to `dev`
5. CI must pass
