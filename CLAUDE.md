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
- Install → `npx prisma generate` → `npx prisma migrate deploy` → `npx tsc --noEmit` → `npm run build`
- Tests commentés pour plus tard (`npm test`)

### Job `frontend`
- Install → `npm run lint` (ESLint) → `npx tsc -b` (type-check) → `npm run build` (Vite)

## Déploiement

### Architecture prod
- Le backend Express sert le frontend (build Vite dans `../frontend/dist`) en production via `express.static` + fallback SPA
- pm2 gère le process Node.js via `ecosystem.config.cjs` à la racine
- Port **3002** en production (pour ne pas conflicte avec cocktail-app sur 3000)

### Scripts
- `scripts/deploy.sh` — déploiement complet : git pull, npm ci, prisma migrate, build backend + frontend, pm2 restart
- `scripts/setup-db.sh` — premier setup de la base PostgreSQL (create db + user)

### Commandes pm2
```bash
pm2 start ecosystem.config.cjs   # Premier lancement
pm2 restart lecabanon-api         # Redémarrer après deploy
pm2 logs lecabanon-api            # Voir les logs
pm2 save                          # Sauvegarder la liste de process
pm2 startup                       # Configurer le démarrage auto au boot
```

## Stack

### Backend (`/backend`)
- **Runtime** : Node.js (ESM, `"type": "module"`)
- **Framework** : Express 5
- **ORM** : Prisma 7 avec `@prisma/adapter-pg` (PostgreSQL)
- **Auth** : JWT (access + refresh tokens) via `jsonwebtoken`, bcryptjs pour le hash
- **OAuth** : Google OAuth 2.0 via Passport (`passport-google-oauth20`)
- **Validation** : Zod 4
- **Upload** : Multer 2 + Sharp pour le resize (Minio prévu mais pas encore branché)
- **TypeScript** : v6, compilé via tsx en dev
- **Base de données** : PostgreSQL (`lecabanon`)

### Frontend (`/frontend`)
- **Framework** : React 19
- **Build** : Vite 8
- **Routing** : React Router v7
- **Styling** : Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Forms** : React Hook Form + `@hookform/resolvers` + Zod
- **Icons** : Lucide React
- **TypeScript** : v6

## Architecture backend

```
backend/
├── prisma/
│   ├── schema.prisma        # Source of truth pour le modèle de données
│   ├── migrations/
│   └── seed.ts              # Catégories en dur (pas de table dédiée)
├── src/
│   ├── app.ts               # Config Express (cors, json, cookieParser, routes)
│   ├── server.ts            # Point d'entrée (listen)
│   ├── controllers/         # Logique métier par domaine
│   │   ├── auth.ts          # register, login, refreshToken, getMe
│   │   ├── google-auth.ts   # Google OAuth callback
│   │   ├── communities.ts   # CRUD communautés + join + remove member
│   │   ├── equipment.ts     # CRUD matériel (scoped à la communauté)
│   │   └── artisans.ts      # CRUD artisans + reviews
│   ├── middlewares/
│   │   ├── authenticate.ts  # Vérifie le JWT, injecte req.userId
│   │   ├── requireMember.ts # Vérifie l'appartenance à la communauté, injecte req.communityRole
│   │   └── errorHandler.ts  # Middleware d'erreur global (AppError)
│   ├── routes/              # Déclaration des routes Express
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── communities.ts
│   │   ├── equipment.ts
│   │   └── artisans.ts
│   └── utils/
│       ├── jwt.ts           # generateAccessToken, generateRefreshToken, verify*
│       └── prisma.ts        # Instance Prisma singleton
└── generated/prisma/        # Client Prisma généré (gitignored)
```

## Architecture frontend

```
frontend/
├── index.html               # Plus Jakarta Sans (Google Fonts) + script anti-flash dark mode
├── src/
│   ├── App.tsx              # Routes principales (BrowserRouter)
│   ├── main.tsx             # Point d'entrée React
│   ├── index.css            # Design system complet (CSS variables, @theme, :root/.dark)
│   ├── lib/
│   │   ├── api.ts           # Wrapper fetch avec auth auto (Bearer token, refresh auto, redirect 401)
│   │   └── socket.ts        # Client Socket.io
│   ├── hooks/
│   │   └── useTheme.ts      # Dark mode hook (system pref + toggle manuel)
│   ├── contexts/
│   │   └── AuthContext.tsx   # Provider auth global (user, login, register, logout)
│   ├── components/
│   │   ├── Layout.tsx       # Header + Outlet (nav: Communautés, Messages, Profil, Logout)
│   │   ├── MobileDrawer.tsx # Navigation mobile (burger menu)
│   │   ├── ProtectedRoute.tsx # Redirect vers /login si pas connecté
│   │   ├── StarRating.tsx   # Composant étoiles (display + input)
│   │   ├── FeedList.tsx     # Flux d'activité communauté
│   │   └── LinkPreview.tsx  # Aperçu lien URL (pour sites artisans)
│   └── pages/
│       ├── Login.tsx
│       ├── Register.tsx
│       ├── Communities.tsx   # Liste mes communautés + modals Créer/Rejoindre + AccessCodeBadge
│       ├── CommunityDetail.tsx # Hub communauté (cards matériel/artisans/membres + feed)
│       ├── CommunityAdmin.tsx  # Administration communauté (infos, code, invitations, membres, danger zone)
│       ├── Equipment.tsx     # Liste matériel + filtre catégorie + formulaire ajout
│       ├── EquipmentDetail.tsx # Fiche matériel + bouton contact
│       ├── Artisans.tsx      # Liste artisans + filtre catégorie + formulaire ajout
│       ├── ArtisanDetail.tsx # Fiche artisan + avis + claim + réponses + profil edit
│       ├── ArtisanPublicProfile.tsx # Fiche artisan publique (sans auth)
│       ├── Members.tsx       # Liste membres communauté + recherche
│       ├── Messages.tsx      # Messagerie temps réel (liste conversations + chat)
│       ├── Profile.tsx       # Mon profil (édition nom/prénom + mes communautés)
│       ├── UserProfile.tsx   # Profil public d'un membre
│       ├── InvitationLanding.tsx # Page d'invitation (lien partagé)
│       └── VerifyClaim.tsx   # Vérification claim artisan
└── public/
    ├── favicon.svg
    └── icons.svg
```

## Modèle de données

### Entités principales
- **User** : email, password (nullable si Google), firstName, lastName, photo, googleId
- **Community** : name, description, accessCode (unique), createdById
- **CommunityMember** : userId + communityId (clé composite), role (ADMIN | MEMBER)
- **Equipment** : name, description, category (string libre), photos (String[]), ownerId, communityId
- **Artisan** : name, company, category, zone, phone, email, createdById, communityId
- **Review** : rating (1-5), comment, visibility (PUBLIC | COMMUNITY), artisanId, authorId
- **ReviewMedia** : url, type (IMAGE | VIDEO), reviewId
- **ArtisanReply** : réponse artisan à un avis (si fiche claimed)
- **ArtisanCommunity** : table de jonction artisan↔communauté (multi-communauté)
- **Activity** : flux d'activité par communauté
- **Invitation** : liens d'invitation avec expiration et max uses
- **Conversation / Message** : messagerie temps réel entre membres

### Relations clés
- Un User peut être membre de plusieurs Communities (many-to-many via CommunityMember)
- Equipment est scopé à une Community, Artisan peut être partagé entre communautés (via ArtisanCommunity)
- Reviews sont liées à un Artisan et un auteur User
- Le créateur d'une Community est automatiquement ADMIN
- Les artisans peuvent revendiquer leur fiche (claimed) pour enrichir leur profil et répondre aux avis

## Routes API

### Auth (`/api/auth`)
- `POST /register` — inscription email
- `POST /login` — connexion email → { user, accessToken, refreshToken }
- `POST /refresh` — renouveler l'access token
- `GET /me` — profil connecté (protégé)
- `POST /google` — callback Google OAuth

### Communities (`/api/communities`) — toutes protégées
- `POST /` — créer une communauté (code auto-généré)
- `POST /join` — rejoindre avec un code d'accès
- `GET /` — mes communautés
- `GET /:id` — détail (avec membres, counts)
- `PATCH /:id` — modifier (admin only)
- `DELETE /:id/members/:userId` — retirer un membre (admin only)

### Equipment (`/api/equipment`) — toutes protégées
- `POST /community/:communityId` — ajouter (requireMember)
- `GET /community/:communityId` — lister (filtrable par `?category=`)
- `GET /:id` — détail
- `PATCH /:id` — modifier (proprio ou admin)
- `DELETE /:id` — supprimer (proprio ou admin)

### Artisans (`/api/artisans`) — toutes protégées
- `POST /community/:communityId` — ajouter (requireMember)
- `GET /community/:communityId` — lister (filtrable par `?category=`)
- `GET /:id` — détail (avec reviews)
- `GET /:id/public` — fiche publique (sans auth)
- `PATCH /:id` — modifier
- `DELETE /:id` — supprimer (créateur ou admin)
- `POST /:id/reviews` — poster un avis
- `GET /:id/reviews` — lister les avis
- `POST /:id/claim` — revendiquer une fiche artisan
- `POST /:id/verify-claim` — vérifier le claim (token email)
- `POST /:id/reviews/:reviewId/reply` — répondre à un avis (artisan claimed)

### Conversations (`/api/conversations`) — toutes protégées
- `POST /` — créer une conversation
- `GET /` — lister mes conversations
- `GET /:id/messages` — lister les messages (cursor-based)
- `POST /:id/messages` — envoyer un message (fallback REST)

### Invitations (`/api/invite`)
- `GET /:token` — info invitation (public)
- `POST /:token/join` — rejoindre via invitation (protégé)

### Users (`/api/users`) — toutes protégées
- `PATCH /me` — modifier mon profil
- `GET /:id/profile` — profil public d'un membre

## Catégories (hardcoded)

### Matériel
Jardinage, Bricolage, Nettoyage, Électroportatif, Échelles & échafaudages, Automobile, Déménagement, Cuisine / Réception

### Artisans
Plomberie, Électricité, Maçonnerie, Peinture, Menuiserie, Paysagisme, Couverture / Toiture, Serrurerie, Chauffage / Climatisation, Nettoyage

## Patterns & conventions

- **Tokens** : stockés en localStorage (accessToken + refreshToken). Le wrapper `api()` gère le refresh auto sur 401.
- **Erreurs backend** : classe `AppError` avec statusCode, attrapée par `errorHandler`. Les erreurs Zod renvoient 400 avec le premier message.
- **Membership check** : le middleware `requireMember()` vérifie l'appartenance ET injecte `req.communityRole` pour les checks admin downstream.
- **Prisma output** : le client est généré dans `backend/generated/prisma/` (pas dans node_modules).
- **CSS / Design system** : Tailwind v4 via le plugin Vite. Toutes les couleurs sont définies comme CSS variables dans `index.css` (`:root` pour light, `.dark` pour dark). Les composants utilisent `bg-[var(--color-card)]`, `text-[var(--color-text-primary)]`, etc. — **jamais** de classes `dark:*` dans les `.tsx`. Les couleurs `primary-*`, `accent-*`, `warm-*` sont déclarées dans `@theme` pour générer les utility classes Tailwind, et overridées dans `.dark`. Typographie : Plus Jakarta Sans via Google Fonts.
- **Modals** : pattern overlay `fixed inset-0 bg-[var(--color-overlay)]` + `stopPropagation` sur le form intérieur.
- **Pas de table catégories** : les catégories sont des strings libres côté DB, définies en dur côté frontend. Le seed est informatif uniquement.
- **Icons** : Lucide React, toujours avec `strokeWidth={1.5}`.

## Ce qui reste à faire (V1)

### Phase 5 — Feed & Profil (partiellement complétée)
- [x] Route GET `/api/communities/:id/feed` (cursor-based)
- [x] Page feed = page d'accueil communauté
- [x] Page profil public (UserProfile)
- [ ] Page profil éditable (photo upload reste à faire)

### Phase 6 — Upload médias & Polish
- [ ] Brancher Minio (ou stockage local en dev) pour l'upload de photos
- [ ] Upload photos matériel (formulaire + backend multipart)
- [ ] Upload photos/vidéos avis artisans
- [ ] Upload photo de profil
- [ ] Resize avec Sharp avant stockage
- [ ] PWA : manifest + service worker
- [ ] Responsive polish (vérification mobile complète)
- [ ] Page 404

### V1.1 — Backlog
- Recherche full-text (matériel + artisans)
- Multi-communautés UX (switcher rapide)
- Abonnements (limites par nombre de membres)
- Modération (signalement faux avis)
- Notifications push

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

# Deploy (serveur de prod)
./scripts/setup-db.sh              # Premier setup DB uniquement
./scripts/deploy.sh                # Déploiement complet
pm2 logs lecabanon-api             # Voir les logs

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
- Le client Prisma est dans `../generated/prisma` (pas le default)
- Les catégories ne sont PAS en base, c'est du string libre — toute modification de catégorie doit être faite en dur dans le frontend ET dans le seed
- Express 5 est utilisé (pas Express 4) — les handlers async propagent automatiquement les erreurs au error handler
- Tailwind v4 avec le plugin Vite, pas de fichier `tailwind.config.js`. Les couleurs sont dans `@theme` (index.css), pas dans un config
- **Ne jamais utiliser de classes `dark:*` dans les `.tsx`** — le dark mode fonctionne via CSS variables overridées dans `.dark` (index.css)
- **Ne jamais utiliser `#fff`, `#000`, `bg-white`, `text-white`, `bg-black`, `text-black`** — utiliser `var(--color-page)`, `var(--color-card)`, etc.
- **Ne jamais utiliser `slate-*`, `gray-*`** dans les composants — utiliser les CSS variables `var(--color-text-*)`, `var(--color-border-*)`, etc.
- Pour les éléments sur fond `bg-primary-600`, utiliser `text-[var(--color-page)]` au lieu de `text-white`
- Les border-radius utilisent des tokens : `rounded-[var(--radius-card)]` (14px), `rounded-[var(--radius-button)]` (10px), `rounded-[var(--radius-pill)]` (24px), `rounded-[var(--radius-input)]` (8px)
- React Router v7 (pas v6) — les APIs peuvent différer
- Le toggle de visibilité des avis (PUBLIC/PRIVATE) concerne l'avis, pas l'artisan
- L'avis "privé" est visible uniquement par les membres de la communauté (pas uniquement l'auteur malgré ce que dit le label actuel côté front — à corriger)
- Zod v4 utilise `.issues` (pas `.errors`) pour accéder aux erreurs de validation
- Toujours brancher depuis `dev`, jamais directement depuis `main`
- Les PRs vers `main` doivent passer la CI (jobs backend + frontend)
- Ne jamais push directement sur `main`
- En production, le frontend est servi par Express (pas de serveur Vite séparé). Le port est 3002.
- Les logs pm2 sont dans `logs/` (gitignored)
