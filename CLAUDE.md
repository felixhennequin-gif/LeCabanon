# CLAUDE.md — LeCabanon

## Projet

LeCabanon est une plateforme de partage entre voisins : annuaire de matériel à prêter + annuaire d'artisans recommandés, organisé par communautés (avenue, quartier, ville). Chaque communauté est protégée par un code d'accès. Un utilisateur peut rejoindre plusieurs communautés avec un même compte.

**Repo** : `felixhennequin-gif/LeCabanon`
**Structure** : monorepo avec `/backend` et `/frontend` à la racine

## Branching strategy

- **`main`** = production, jamais de push direct. Toutes les modifications passent par une PR.
- **`dev`** = branche d'intégration. Les PRs vers `main` partent de `dev`.
- **`feature/<nom>`** = créées depuis `dev`, mergées dans `dev` via PR.
- **`hotfix/<nom>`** = créées depuis `main`, mergées dans `main` ET `dev`.

### Workflow

1. Créer une branche `feature/<nom>` depuis `dev`
2. Développer, commiter, pusher
3. Ouvrir une PR vers `dev`
4. La CI doit passer (backend + frontend)
5. Merger dans `dev`
6. Quand `dev` est stable, ouvrir une PR `dev` → `main`
7. Merger = release

## CI / GitHub Actions

Le workflow `.github/workflows/ci.yml` est déclenché sur `push` et `pull_request` vers `main` et `dev`. Deux jobs tournent **en parallèle** :

### Job `backend`
- Service PostgreSQL 16 (user: test, password: test, db: lecabanon_test) avec health check
- Install → `npx prisma generate` → `npx prisma migrate deploy` → `npx tsc --noEmit`
- Tests commentés pour plus tard (`npm test`)

### Job `frontend`
- Install → `npm run lint` (ESLint) → `npx tsc -b` (type-check) → `npm run build` (Vite)

## Stack

### Backend (`/backend`)
- **Runtime** : Node.js (ESM, `"type": "module"`)
- **Framework** : Express 5.2 (`express@^5.2.1`)
- **ORM** : Prisma 7.7 (`prisma@^7.7.0`) avec `@prisma/adapter-pg` (driver PostgreSQL natif)
- **Auth** : JWT via `jsonwebtoken@^9.0.3`, hash via `bcryptjs@^3.0.3`
- **OAuth** : Google OAuth 2.0 via `passport-google-oauth20@^2.0.0`
- **Validation** : Zod 4 (`zod@^4.3.6`)
- **Upload** : `multer@^2.1.1` + `sharp@^0.34.5` (resize images — Minio prévu mais pas encore branché)
- **TypeScript** : v6 (`typescript@^6.0.2`), compilé via `tsx@^4.21.0` en dev
- **Base de données** : PostgreSQL 16 (`pg@^8.20.0`)

### Frontend (`/frontend`)
- **Framework** : React 19.2 (`react@^19.2.4`)
- **Build** : Vite 8 (`vite@^8.0.4`)
- **Routing** : React Router v7 (`react-router-dom@^7.14.0`)
- **Styling** : Tailwind CSS v4.2 via `@tailwindcss/vite@^4.2.2` (pas de `tailwind.config.js`)
- **Forms** : React Hook Form 7 (`react-hook-form@^7.72.1`) + `@hookform/resolvers@^5.2.2` + Zod
- **Icons** : Lucide React (`lucide-react@^1.8.0`)
- **Lint** : ESLint 9 (`eslint@^9.39.4`) + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- **TypeScript** : v6 (`typescript@~6.0.2`)

## Architecture backend

```
backend/
├── prisma/
│   ├── schema.prisma          # Source of truth pour le modèle de données
│   ├── migrations/            # Migrations SQL auto-générées
│   └── seed.ts                # Catégories en dur (informatif, pas de table dédiée)
├── prisma.config.ts           # Config Prisma (datasource URL depuis env)
├── src/
│   ├── app.ts                 # Config Express : cors, json, cookieParser, montage des routes, errorHandler
│   ├── server.ts              # Point d'entrée : dotenv + listen sur PORT (3001)
│   ├── controllers/
│   │   ├── auth.ts            # register (Zod), login (bcrypt compare), refreshToken, getMe
│   │   ├── google-auth.ts     # googleCallback : échange code → tokens Google, find/create user
│   │   ├── communities.ts     # createCommunity (code auto), joinCommunity, getMyCommunities, getCommunity, updateCommunity (admin), removeMember (admin)
│   │   ├── equipment.ts       # createEquipment, listEquipment (?category), getEquipment, updateEquipment (owner/admin), deleteEquipment (owner/admin)
│   │   └── artisans.ts        # CRUD artisans + createReview (note 1-5, visibility), listReviews (filtré par visibility)
│   ├── middlewares/
│   │   ├── authenticate.ts    # Vérifie Bearer JWT, injecte req.userId
│   │   ├── requireMember.ts   # Vérifie l'appartenance à la communauté, injecte req.communityRole
│   │   └── errorHandler.ts    # Middleware d'erreur global (AppError avec statusCode)
│   ├── routes/
│   │   ├── auth.ts            # /api/auth — register, login, refresh, me, google
│   │   ├── users.ts           # /api/users — GET/PATCH /me
│   │   ├── communities.ts     # /api/communities — CRUD + join + remove member
│   │   ├── equipment.ts       # /api/equipment — CRUD scoped par communauté
│   │   └── artisans.ts        # /api/artisans — CRUD + reviews
│   └── utils/
│       ├── jwt.ts             # generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken
│       └── prisma.ts          # Instance Prisma singleton (pg Pool + PrismaPg adapter)
├── generated/prisma/          # Client Prisma généré (gitignored)
└── tsconfig.json
```

## Architecture frontend

```
frontend/
├── src/
│   ├── App.tsx                # Routes : BrowserRouter, routes protégées via Layout + ProtectedRoute
│   ├── main.tsx               # Point d'entrée React (StrictMode)
│   ├── index.css              # Tailwind base + thème (couleurs primary-*, warm-*)
│   ├── lib/
│   │   └── api.ts             # Wrapper fetch : Bearer auto, refresh auto sur 401, redirect /login si expiré
│   ├── contexts/
│   │   └── AuthContext.tsx    # Provider auth global : user state, login(), register(), logout()
│   ├── components/
│   │   ├── Layout.tsx         # Header sticky (logo, nav Communautés/Profil/Logout) + Outlet
│   │   ├── ProtectedRoute.tsx # Redirect /login si pas connecté, spinner pendant le loading
│   │   └── StarRating.tsx     # Composant étoiles (display + input interactif)
│   └── pages/
│       ├── Login.tsx          # Formulaire connexion email/password
│       ├── Register.tsx       # Formulaire inscription (prénom, nom, email, password)
│       ├── Communities.tsx    # Liste mes communautés + modals Créer/Rejoindre + AccessCodeBadge (copier le code)
│       ├── CommunityDetail.tsx # Hub communauté : 3 cards (matériel/artisans/membres) + liste membres + admin (retirer)
│       ├── Equipment.tsx      # Liste matériel + filtres catégorie (pills) + modal ajout
│       ├── Artisans.tsx       # Liste artisans + filtres catégorie + modal ajout
│       └── ArtisanDetail.tsx  # Fiche artisan (contact, zone) + liste avis + modal poster avis (étoiles + commentaire + toggle public/privé)
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── vite.config.ts             # Plugin React + Tailwind, proxy /api → localhost:3001
└── tsconfig.json
```

## Modèle de données

### Entités principales
- **User** : `id` (cuid), `email` (unique), `password` (nullable si Google), `firstName`, `lastName`, `photo`, `googleId` (unique, nullable), `createdAt`, `updatedAt`
- **Community** : `id`, `name`, `description`, `accessCode` (unique, 8 chars hex), `createdById` → User, `createdAt`, `updatedAt`
- **CommunityMember** : `userId` + `communityId` (clé composite), `role` (enum ADMIN | MEMBER), `joinedAt`
- **Equipment** : `id`, `name`, `description`, `category` (string libre), `photos` (String[]), `ownerId` → User, `communityId` → Community, `createdAt`, `updatedAt`
- **Artisan** : `id`, `name`, `company`, `category`, `zone`, `phone`, `email`, `createdById` → User, `communityId` → Community, `createdAt`, `updatedAt`
- **Review** : `id`, `rating` (Int 1-5), `comment`, `visibility` (enum PUBLIC | PRIVATE), `artisanId` → Artisan, `authorId` → User, `createdAt`, `updatedAt`
- **ReviewMedia** : `id`, `url`, `type` (enum IMAGE | VIDEO), `reviewId` → Review

### Relations clés
- Un User peut être membre de plusieurs Communities (many-to-many via CommunityMember)
- Equipment et Artisan sont scopés à une Community
- Reviews sont liées à un Artisan et un auteur User
- Le créateur d'une Community est automatiquement ADMIN
- Toutes les relations utilisent `onDelete: Cascade`

## Routes API

### Auth (`/api/auth`)
- `POST /register` — inscription email (Zod: email, password min 6, firstName, lastName) → { user, accessToken, refreshToken }
- `POST /login` — connexion email → { user, accessToken, refreshToken }
- `POST /refresh` — body: { refreshToken } → { accessToken, refreshToken }
- `GET /me` — profil connecté (protégé) → { id, email, firstName, lastName, photo, createdAt }
- `POST /google` — body: { code } → échange OAuth code, find/create user → { user, accessToken, refreshToken }

### Users (`/api/users`) — toutes protégées
- `GET /me` — mon profil
- `PATCH /me` — modifier (firstName, lastName)

### Communities (`/api/communities`) — toutes protégées
- `POST /` — créer une communauté (code auto-généré 8 chars, créateur = ADMIN)
- `POST /join` — rejoindre avec un code d'accès
- `GET /` — mes communautés (avec role et memberCount)
- `GET /:id` — détail (avec membres, counts equipment/artisans)
- `PATCH /:id` — modifier nom, description, regenerateCode (admin only)
- `DELETE /:id/members/:userId` — retirer un membre (admin only, pas soi-même)

### Equipment (`/api/equipment`) — toutes protégées
- `POST /community/:communityId` — ajouter (requireMember, Zod: name, category, description)
- `GET /community/:communityId` — lister (filtrable par `?category=`)
- `GET /:id` — détail
- `PATCH /:id` — modifier (propriétaire ou admin)
- `DELETE /:id` — supprimer (propriétaire ou admin)

### Artisans (`/api/artisans`) — toutes protégées
- `POST /community/:communityId` — ajouter (requireMember)
- `GET /community/:communityId` — lister (filtrable par `?category=`, avec avgRating et reviewCount)
- `GET /:id` — détail (avec reviews filtrées par visibility, avgRating)
- `PATCH /:id` — modifier (créateur ou admin)
- `DELETE /:id` — supprimer (créateur ou admin)
- `POST /:id/reviews` — poster un avis (Zod: rating 1-5, comment, visibility PUBLIC|PRIVATE)
- `GET /:id/reviews` — lister les avis (filtrés : PUBLIC + les propres avis privés de l'auteur)

## Catégories (hardcoded)

### Matériel
Jardinage, Bricolage, Nettoyage, Électroportatif, Échelles & échafaudages, Automobile, Déménagement, Cuisine / Réception

### Artisans
Plomberie, Électricité, Maçonnerie, Peinture, Menuiserie, Paysagisme, Couverture / Toiture, Serrurerie, Chauffage / Climatisation, Nettoyage

## Patterns & conventions

- **Tokens** : stockés en localStorage (`accessToken` + `refreshToken`). Le wrapper `api()` dans `frontend/src/lib/api.ts` gère le refresh auto sur 401.
- **Erreurs backend** : classe `AppError(statusCode, message)` attrapée par `errorHandler`. Les erreurs Zod renvoient 400 avec `err.issues[0].message`.
- **Membership check** : le middleware `requireMember()` vérifie l'appartenance ET injecte `req.communityRole` pour les checks admin downstream.
- **Express 5 params** : `req.params` retourne `string | string[]` — utiliser `as string` pour les casts.
- **Prisma output** : le client est généré dans `backend/generated/prisma/` (pas dans `node_modules`). Import via `../../generated/prisma/client.js`.
- **Prisma adapter** : PrismaPg avec un `pg.Pool` — pas de `datasourceUrl` direct dans le constructeur.
- **CSS** : Tailwind v4 via le plugin Vite, classes utilitaires directement dans le JSX. Couleurs custom : `primary-*` (vert), `warm-*` (jaune/étoiles).
- **Modals** : pattern overlay `fixed inset-0 bg-black/50` + `stopPropagation()` sur le form intérieur.
- **Pas de table catégories** : les catégories sont des strings libres côté DB, définies en dur côté frontend (`EQUIPMENT_CATEGORIES`, `ARTISAN_CATEGORIES`). Le seed est informatif uniquement.
- **ESM** : le backend utilise `"type": "module"` — tous les imports locaux doivent avoir l'extension `.js`.

## Ce qui reste à faire (V1)

### Phase 5 — Feed & Profil
- [ ] Route GET `/api/communities/:id/feed` (agrège matos + artisans + avis, trié par date, cursor-based)
- [ ] Page feed = page d'accueil communauté
- [ ] Page profil éditable (nom, prénom, photo)
- [ ] Page profil public (voir le matos de quelqu'un)

### Phase 6 — Upload médias & Polish
- [ ] Brancher Minio (ou stockage local en dev) pour l'upload de photos
- [ ] Upload photos matériel (formulaire + backend multipart)
- [ ] Upload photos/vidéos avis artisans
- [ ] Upload photo de profil
- [ ] Resize avec Sharp avant stockage
- [ ] PWA : manifest + service worker
- [ ] Responsive polish (mobile first)
- [ ] Page 404
- [ ] README.md complet

### V1.1 — Backlog
- Messagerie interne (Socket.io, statuts envoyé/lu)
- Partage fiche artisan via lien public
- Multi-communautés UX
- Abonnements (limites par nombre de membres)
- Recherche full-text
- Modération (signalement faux avis)

## Commandes

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Configurer DATABASE_URL, JWT_SECRET, etc.
npx prisma generate
npx prisma migrate dev
npm run dev            # tsx watch src/server.ts → port 3001

# Frontend
cd frontend
npm install
npm run dev            # Vite → port 5173

# Database
npx prisma studio     # GUI de la DB
npx prisma migrate dev --name <nom>  # Nouvelle migration

# Git workflow
git checkout dev
git checkout -b feature/<nom>
# ... développer ...
git push origin feature/<nom>
# Ouvrir PR → dev
# Quand dev stable : PR dev → main
```

## Notes pour Claude Code

- Toujours utiliser les imports avec `.js` extension dans le backend (ESM)
- Le client Prisma est dans `../../generated/prisma/client.js` (pas le default `@prisma/client`)
- Les catégories ne sont PAS en base, c'est du string libre — toute modification de catégorie doit être faite en dur dans le frontend ET dans le seed
- Express 5 est utilisé (pas Express 4) — les handlers async propagent automatiquement les erreurs au error handler. `req.params` retourne `string | string[]`, utiliser `as string`.
- Tailwind v4 avec le plugin Vite, pas de fichier `tailwind.config.js`
- React Router v7 (pas v6) — les APIs peuvent différer
- Le toggle de visibilité des avis (PUBLIC/PRIVATE) concerne l'avis, pas l'artisan
- L'avis "privé" est visible uniquement par les membres de la communauté (pas uniquement l'auteur malgré ce que dit le label actuel côté front — à corriger)
- Zod v4 utilise `.issues` (pas `.errors`) pour accéder aux erreurs de validation
- Toujours brancher depuis `dev`, jamais directement depuis `main`
- Les PRs vers `main` doivent passer la CI (jobs backend + frontend)
- Ne jamais push directement sur `main`
